# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketplace for buying/selling parts for 1979–1993 ("Fox body") Mustangs —
"for enthusiasts, by enthusiasts." Proof-of-concept stage: auth, listings,
search, cart, image uploads, and Django admin work; payments, disputes, ratings,
and shipping are not built yet (see `TO-DO.md`).

Two deployable pieces in one repo:
- `backend/` — Django 4.2 + Django REST Framework API (Python 3.12)
- `frontend/` — React 18 SPA built with Vite, MUI, and styled-components

Production: frontend on Netlify (`foxbodyswapmeet.com`), backend on Railway
(`finalproject-production-bb8b.up.railway.app`), media on S3.

## Commands

### Backend (run from `backend/`)
The venv lives at `backend/venv` (gitignored). Use `venv/bin/python`.
```bash
venv/bin/python manage.py runserver 8000
venv/bin/python manage.py migrate
venv/bin/python manage.py makemigrations
venv/bin/python manage.py test                 # uses backend/.env's local DB (see below)
venv/bin/python manage.py createsuperuser
```

### Frontend (run from `frontend/`)
```bash
npm install
npm run dev        # Vite dev server on :5173, auto-loads .env.development
npm run build
npm run lint       # eslint, --max-warnings 0
```

### Local full-stack testing — DO NOT hit the prod database
`settings.py` loads `backend/.env`, which holds **local-only** values (as of Nov
2026): the local `foxbody_local` Postgres, blank AWS keys (uploads go to local
`mediafiles/`), `SKIP_IMAGE_MODERATION`, Cloudflare's always-pass Turnstile test
secret, and no Resend key (emails print to the console). So a bare `manage.py`
command is safe. Production values live only in Railway Variables, never in a
local file; use `railway run <command>` for a deliberate one-off prod command.
New machine: `cp backend/.env.example backend/.env` and fill in the two `<...>`
placeholders. **Never put prod secrets back into `.env`**: a prod `DATABASE_URL`
or `DB_*` there would point every local command (`migrate`, `shell`,
`send_signup_digest`) at the production database.
```bash
venv/bin/python manage.py migrate
venv/bin/python manage.py runserver 8000
```
`dev.sh` also exports the local overrides (`DATABASE_URL`, `DEBUG`, blank
`AWS_ACCESS_KEY_ID`, `SKIP_IMAGE_MODERATION`) as a backstop; shell exports beat
`.env` (django-environ only fills unset variables).
`npm run dev` reads `.env.development`, which points `VITE_API_BASE_URL` at
`http://127.0.0.1:8000`, so the local UI talks to the local backend automatically.
Don't `git stash` while `runserver` is up: the auto-reloader can restart on the stashed
(settings-less) files and leave the server in a broken state.

### Seeding local data
`manage.py seed_dev_data` fills the local DB with believable users, profiles,
listings with placeholder images, and cart items. Run from `backend/`:
```bash
venv/bin/python manage.py seed_dev_data                     # 25 users, about 120 listings
venv/bin/python manage.py seed_dev_data --flush             # delete seeded data, then re-seed
venv/bin/python manage.py seed_dev_data --flush-only        # delete seeded data and stop
venv/bin/python manage.py seed_dev_data --users 40 --seed 7
venv/bin/python manage.py seed_dev_data --images-dir PATH   # use real photos as listing images
venv/bin/python manage.py seed_dev_data --unstamped         # leave them unreported, to test the digest
```
- Every seeded user has the password `foxbody-dev-123`; `seed_demo` is the known login.
- **It refuses to run** unless the database is `foxbody_local` on a local host with
  `DEBUG` on, and it deliberately has no `--force`. Never run it against production.
- Seeded users are found by email domain (`@seed.example.com`), so `--flush` can't
  touch other accounts, including plain `@example.com` ones like `alice` and `bob`.
- Profiles, listings, and cart items cascade from the user. `--flush` also deletes the
  seeded listings' image files. One leftover: a cart item on a *non-seeded* account
  copied from a seeded listing stays behind with a broken image.
- It writes directly through the ORM, so it skips the welcome email and Rekognition.
  If storage is S3 (an exported `AWS_ACCESS_KEY_ID`), it skips images entirely.
- Data lives in `backend_app/seed_data.py`; the same `--seed` picks the same data.

## Architecture

### Backend
- Single Django app: `backend_app`. All URLs are defined in
  `backend_project/urls.py` (no per-app `urls.py`).
- Models (`models.py`): `Listing`, `Cart`, `Profile`. Uses Django's built-in
  `User` for auth. A `post_save` signal auto-creates a `Profile` for every new
  `User`. Note the `Cart` FK field is named `user_id` (it holds a User instance,
  not an int) — a migration-history artifact; preserve the name.
- Listing `category` and `fits` are `TextChoices`, stored as short slugs. Blank
  means "Not set": older listings stay visible, and the serializer requires both
  to save, on create and on any edit (it checks the value the listing would end
  up with, so a PATCH of only the price on a Not-set listing gets a 400). The
  response also has read-only `category_label` and `fits_label`.
- Listing dates, on purpose two fields: `created_at` is when it was first posted
  and never changes (null for listings from before Nov 2026, never an invented
  date). `bumped_at` is what "Newest" sorts by; a future paid bump will set it to
  now, so a bump can't rewrite a listing's real age. Both are read-only in the API
  and `ListingSerializer.to_representation` only returns them to the listing's
  owner. The create view sets both from one timestamp so they start out equal.
- API surface: DRF `DefaultRouter` registers `cart/`, `listing/`, `profile/`
  ViewSets. Standalone paths: `register/`, `token/`, `token/refresh/`, `logout/`,
  `cart/item/<pk>/` (delete). `profile/` and `cart/` use `user_id` as the lookup
  field and `get_queryset` filters to the requesting user.
- Auth: SimpleJWT. `CustomTokenObtainPairSerializer` adds `userId`, `username`,
  and `name` to the token response. Logout blacklists the refresh token. Access
  token lives 30 minutes, refresh 10 days, with rotation + blacklist-after-rotation
  (each refresh issues a new 10-day refresh token, so it's an idle timeout). The
  short access lifetime relies on the frontend's automatic refresh (`apiFetch`).
  `RegisterView` logs the new user in: its 201 response adds the same `access`,
  `refresh`, `userId`, and `username` as `/token/`, built with
  `CustomTokenObtainPairSerializer.get_token` (only after validation, Turnstile,
  and save succeed).
- Permissions: per-view. `ListingViewSet` uses `IsAuthenticatedOrReadOnly` +
  custom `IsOwnerOrReadOnly` (owner-only writes, public reads). There is **no**
  global `DEFAULT_PERMISSION_CLASSES` — every view sets its own, so check
  permissions explicitly when adding views.
- Media: `image_url` on `Listing` is an `ImageField`. Storage is environment-
  switched in `settings.py` — S3 (`django-storages`) when `AWS_ACCESS_KEY_ID` is
  set, local `mediafiles/` otherwise. On listing create/update, uploaded images
  run through `check_image_moderation` (AWS Rekognition); flagged images raise a
  `ValidationError`.
- Admin user impersonation: `django-hijack` is installed (`hijack` +
  `hijack.contrib.admin` apps, mounted at `hijack/` in `urls.py`). Lets staff
  "log in as" another user from the Django admin to reproduce their view.
  `HIJACK_ALLOW_GET_REQUESTS = True` is set, which relaxes the default
  POST-only/CSRF protection — convenient but a known weakening; keep this admin-
  only.
- Static files: `WhiteNoise` serves Django's own static assets (admin CSS/JS,
  DRF browsable API) in production, since Railway has no separate static server.
  It's the `whitenoise.middleware.WhiteNoiseMiddleware` (placed right after
  `SecurityMiddleware`) plus `STATICFILES_STORAGE =
  CompressedManifestStaticFilesStorage`, which serves compressed, hashed files
  from `STATIC_ROOT` (`staticfiles/`). The Procfile runs `collectstatic` on
  deploy to populate it. WhiteNoise only handles `static/`; user-uploaded media
  still goes to S3.

### Frontend
- `src/main.jsx` defines all routes via `createBrowserRouter`; `routes/` files are
  thin wrappers that render the real UI in `components/`.
- **All API calls must import `API_BASE_URL` from `src/config.js`** — never
  hardcode the backend URL. `config.js` reads `VITE_API_BASE_URL` and falls back
  to the prod Railway URL.
- Auth tokens are stored in `localStorage` (`access_token`, `refresh_token`,
  `username`, `userId`), saved only by `utils/session.js#startSession`, which
  both `LoginForm` and `RegisterForm` call before a full page load. After a
  successful signup `RegisterForm` sets a one-shot `just_registered`
  `sessionStorage` flag and loads `/profile/`, which reads and clears it to open
  the edit form with a welcome toast. **`AuthContext` is the
  source of truth for UI auth state**: read `isAuth` / `username` / `logout` from
  `useAuth()` (the provider wraps everything in `routes/root.jsx`), never check
  `localStorage` for a token to decide if someone is signed in. On mount it
  decodes the tokens (`utils/jwt.js`, decode only, not verify): if the refresh token is
  missing or expired, the visitor is signed out quietly. If only the access token
  expired, it refreshes in the background.
- **Authenticated requests go through `utils/apiFetch.js`**: `apiFetch(path,
  options)` adds `API_BASE_URL` and the Bearer header, sets JSON Content-Type
  for string bodies (never for FormData), and returns the `Response`. On a 401
  it calls `/token/refresh/` once (a single shared in-flight refresh, because
  rotation + blacklist makes parallel refreshes with the same token fail),
  stores the new access **and** refresh tokens, and retries once. If refresh
  fails, `utils/session.js#handleSessionExpired` clears auth and does a full
  redirect to `/login?next=…`, where `LoginForm` shows "Your session expired"
  and returns the user to `next` (relative paths only, to block open redirects).
  Public GETs (listings, search) stay on plain `fetch` with no token: SimpleJWT
  401s a bad token even on public endpoints, which would bounce browsing users
  to login. `/token/`, `/token/refresh/`, `/register/`, and the logout call
  don't use `apiFetch`.
- User feedback: use the shared `components/Toast.jsx` (MUI Snackbar) and
  `utils/apiErrorMessage.js`. After a redirect, pass the message via
  `navigate(path, { state: { toast } })`; `ListingDetail` and the profile page show it.
  The detail route renders only `ListingDetail`, which owns the listing and an
  `isEditing` flag and swaps its right column for the prop-driven `EditListing` form
  (`listing`/`onSaved`/`onCancel`). Saves PATCH only the changed fields and update
  the listing from the response, with no refetch.
- Listing cards (`ListingCard`) show the category and a `FitTag` (colors and
  labels in `utils/fitment.js`), not the seller; the seller and state only appear
  on listing detail. Not-set listings show neither on cards, but the row keeps its
  height so grids line up. Prices go through `utils/formatPrice.js`.
- Both listing forms share `CategoryField` and `FitsField`, with options and the
  inline checks in `utils/listingChoices.js`. Those values must match `Category`
  and `Fits` in `models.py`; there's no endpoint for them.
- Owner-only listing age: because the API only sends dates to the owner, owner
  views must fetch with a token. `DisplayUserListings` uses `apiFetch`, and
  `ListingDetail` does its public `fetch` and then a second `apiFetch` only if the
  viewer is the owner. `undefined` means no dates were sent; `null` means the
  listing is from before Nov 2026. Wording and the 60-day stale rule are in
  `utils/listingAge.js`. Only `/profile` passes `showListingAge`.
- Styling: per-feature styled-components modules under
  `components/GlobalStyles/` (`Style*.jsx`), mixed with MUI components.

## Conventions & gotchas
- Migrations 0014–0024 are a long rename war on the Cart user field; don't try to
  "clean them up." Just add new migrations going forward.
- `settings.py` has a duplicated `RENDER_EXTERNAL_HOSTNAME` block (harmless).
- When adding a hostname, update `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and
  `CORS_ALLOWED_ORIGINS` together.
- Email: `settings.py` uses django-anymail's Resend backend only when
  `SEND_REAL_EMAIL=true` and `RESEND_API_KEY` are set, else the console backend.
  Never key off the API key alone, so a stray key can't send real mail.
  `django-anymail` is pinned to 14.0 (15.x requires a newer Django than 4.2).
  Emails live in `emails.py` with templates under `templates/emails/`.
  `send_welcome_email` runs from `RegisterView` and swallows errors so signup
  never breaks.
- Weekly signup digest: `manage.py send_signup_digest` emails
  `SIGNUP_DIGEST_TO` a summary of profiles whose `signup_digest_sent_at` is
  null, then stamps exactly those profiles. Unlike the welcome email it fails
  loudly: a send error stamps nothing and raises `CommandError`, so the people
  roll into the next digest. `--dry-run` prints and stamps nothing. It runs on
  a separate Railway cron service, `signup-digest` (`0 13 * * 5`, Fridays
  13:00 UTC; start command is the digest command, not the Procfile; variables
  `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`, `SEND_REAL_EMAIL`). Never run
  it locally against the prod DB: it would stamp real users while the email
  only prints to your console. Set
  `BACKEND_URL=http://127.0.0.1:8000` locally if you want working admin links.
- Plain-text email templates (`.txt`) are still auto-escaped by Django; wrap
  them in `{% autoescape off %}` (HTML templates keep escaping on, never `|safe`).
