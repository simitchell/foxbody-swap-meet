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
venv/bin/python manage.py test                 # profile address / seller_state tests; use the local DB overrides below
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
`backend/.env` points `DB_*` at the **production** Railway Postgres, and also holds
the prod AWS keys. `settings.py` loads it into the environment, so a bare
`runserver` would use the prod DB (unless `DATABASE_URL` is set), write uploads to the
**prod S3 bucket**, and call real Rekognition. Override all of it for local work:
```bash
# Postgres via Postgres.app; default superuser is the macOS username, no password
export DATABASE_URL="postgres://$(whoami)@localhost:5432/foxbody_local"
export DEBUG=true                 # lets Django serve /media/ uploads (DEBUG is False otherwise)
export AWS_ACCESS_KEY_ID=         # blank -> uploads go to local mediafiles/, not prod S3
export SKIP_IMAGE_MODERATION=true # no AWS creds locally, so skip the Rekognition call
venv/bin/python manage.py migrate
venv/bin/python manage.py runserver 8000
```
`npm run dev` reads `.env.development`, which points `VITE_API_BASE_URL` at
`http://127.0.0.1:8000`, so the local UI talks to the local backend automatically.
Don't `git stash` while `runserver` is up: the auto-reloader can restart on the stashed
(settings-less) files and leave the server in a broken state.

## Architecture

### Backend
- Single Django app: `backend_app`. All URLs are defined in
  `backend_project/urls.py` (no per-app `urls.py`).
- Models (`models.py`): `Listing`, `Cart`, `Profile`. Uses Django's built-in
  `User` for auth. A `post_save` signal auto-creates a `Profile` for every new
  `User`. Note the `Cart` FK field is named `user_id` (it holds a User instance,
  not an int) — a migration-history artifact; preserve the name.
- API surface: DRF `DefaultRouter` registers `cart/`, `listing/`, `profile/`
  ViewSets. Standalone paths: `register/`, `token/`, `token/refresh/`, `logout/`,
  `cart/item/<pk>/` (delete). `profile/` and `cart/` use `user_id` as the lookup
  field and `get_queryset` filters to the requesting user.
- Auth: SimpleJWT. `CustomTokenObtainPairSerializer` adds `userId`, `username`,
  and `name` to the token response. Logout blacklists the refresh token. Access
  token lives 2 days, refresh 10, with rotation + blacklist-after-rotation.
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
- Auth state lives in `localStorage` (`access_token`, `refresh_token`, `username`,
  `userId`), set on login in `LoginForm.jsx`. `src/AuthContext.jsx` exists but is
  currently unused (commented out in `main.jsx`) — auth is read directly from
  `localStorage` in components. Authenticated requests send
  `Authorization: Bearer <access_token>`.
- User feedback: use the shared `components/Toast.jsx` (MUI Snackbar) and
  `utils/apiErrorMessage.js`. After a redirect, pass the message via
  `navigate(path, { state: { toast } })`; `ListingDetail` and the profile page show it.
  The detail route renders only `ListingDetail`, which owns the listing and an
  `isEditing` flag and swaps its right column for the prop-driven `EditListing` form
  (`listing`/`onSaved`/`onCancel`). Saves PATCH only the changed fields and update
  the listing from the response, with no refetch.
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
  `backend/.env` holds the prod key, so never key off the API key alone.
  `django-anymail` is pinned to 14.0 (15.x requires a newer Django than 4.2).
  Sending itself (welcome email in `RegisterView`) is not built yet.
