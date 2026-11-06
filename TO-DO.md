# TO-DO

> Status: this project is currently a proof of concept. The core marketplace
> (auth, listings, search, cart, image uploads, admin) works. The items below
> are not built yet.

## Transactional email (Resend)

> `RESEND_API_KEY` already lives in `backend/.env`. These hook into
> `RegisterView` in `backend/backend_app/views.py`.

- [x] Welcome email: on registration, send from `noreply@foxbodyswapmeet.com`
      (or similar) to the new user's email address.
- [x] Admin notification email: on registration, send to
      `sam@foxbodyswapmeet.com` announcing the new account (username + email).
      (Done as a weekly digest instead of one email per signup; see
      feature/weekly-signup-digest below.)
- [x] Verify `foxbodyswapmeet.com` as a sending domain in Resend (SPF/DKIM)
      so mail doesn't land in spam.
- [ ] Move slow external calls off the request path: send email asynchronously,
      and do the same for the synchronous AWS Rekognition moderation call in
      `check_image_moderation` (views.py) so a slow/failing third party can't
      break registration or listing uploads. Handle send/mod failures gracefully.
      (Welcome email currently sends synchronously after commit with a 5s/15s
      timeout; failures are logged and never break signup. Still to do: async.)

## Make it demoable

- [x] `.env.example` documenting every required env var (no real secrets).
      (backend/.env.example, chore/local-env; frontend/.env.example already existed)
- [ ] README quickstart that actually works from a clean clone.
- [ ] Seed-data script so the site has listings to browse on first run.
- [ ] Basic smoke tests (registration, create listing, add to cart) —
      `tests.py` is currently empty.

## Hardening & correctness (near-term)

> Concrete issues in the current code, not future features.

- [x] Registration bypasses password validation: `RegisterView` calls
      `make_password()` directly without running `AUTH_PASSWORD_VALIDATORS`, so
      weak passwords are accepted. Run `validate_password` in `UserSerializer`.
- [ ] Make `SECRET_KEY` and `DEBUG` env-driven and fail loudly in production.
      `SECRET_KEY` currently falls back to the literal `"your secret key"` and
      there is no explicit `DEBUG` setting in `settings.py`.
- [x] Add DRF throttling on `register/` — `ScopedRateThrottle` (5/hour per IP,
      `NUM_PROXIES=1` for Railway's proxy). Scoped to this view only, so the
      rest of the API (including `token/`) is unaffected.
- [ ] `token/` (login) is still brute-forceable — no throttling on it yet.
- [x] Honeypot field on registration — hidden form field real users never
      fill in; rejects with a generic error if it's non-empty.
- [x] Cloudflare Turnstile on registration — frontend widget + backend
      `siteverify` check (stdlib `urllib`, fails closed). PR #28.
- [ ] Email verification before account activation: gate login (not just
      listing creation) on a confirmed email, to make bot/junk signups
      harmless rather than just harder. Recommended approach: a signed,
      expiring token (Django's `signing.TimestampSigner`) rather than a new
      DB model/migration, riding in the same Resend email as the welcome
      message. Explicitly out of scope for PR #28 (registration bot
      protection) — revisit separately.
- [ ] Refresh token is stored in `localStorage` (set in `LoginForm.jsx`), which
      is XSS-exposed. Consider httpOnly cookies, or document as a known risk.
- [ ] Add pagination to `listing/` (no `DEFAULT_PAGINATION_CLASS` today) — the
      home page fetches every listing in one request.
- [ ] Extend search beyond title: `search_fields = ["title"]` only, so the
      "search by keywords" goal is half-built. Include description/keywords.

## Data model

> Schema changes that will get harder to make once there's real data.

- [ ] Prices are `IntegerField` on both `Listing` and `Cart` — no cents
      (`$19.99` is not representable). Move to `DecimalField(decimal_places=2)`
      or commit to storing integer cents everywhere.
- [ ] Cart items are denormalized copies (`cart_item`/`image_url`/`price` as
      plain fields) instead of an FK to `Listing` + a quantity. Carts go stale
      when a listing changes or is deleted, and there's no quantity or real
      order/transaction record. Model the cart as `FK(Listing)` + quantity.
- [ ] `Listing` is missing fields the product vision calls for: `keywords` and
      a category. (README lists these; condition has been added.)

## UI / Design

- [x] Listing detail page redesign: two-column card layout, prominent price
      badge, condition dot indicator (blue=New, green=Good/Great, amber=Fair),
      structured seller/condition info card, matching edit form card.
- [ ] Update responsive design for ListingDetail.jsx
- [x] Homepage listing cards: carry over price badge (green background) and
      condition dot indicator from the listing detail redesign for visual
      consistency across the browsing experience.

## Ops

- [ ] Health-check endpoint for Railway.
- [ ] Error monitoring (e.g. Sentry) — there's no `LOGGING` config today and no
      visibility into production failures.

## Back burner

- [ ] Stripe payment integration / real checkout flow

## Not started

- [ ] Dispute / ticket system
- [ ] Seller ratings & feedback
- [ ] Transaction & shipping tracking
- [ ] Add field for email address on profiles
- [ ] Fix EditListing.jsx useEffect loop (dependency array should be [] not [listingDetail])

## Styling consistency (from Claude Code audit, Aug 4)

- [ ] Uncomment + populate GlobalStyles/Colors.jsx — root cause;
      hex values currently hand-duplicated across StyleCard,
      StyleCart, StyleListingDetail
- [ ] Create/Edit listing form parity — EditListing has a card
      wrapper, ListingForm (StyleCreateListing) has none
- [ ] Decide: fully off MUI, or keep it? ListingForm, ListingDetail,
      CartDetail still on MUI buttons; EditListing already migrated
      to styled-components (this is the destination, not the drift)
- [ ] EditListing button hexes #1976d2 / #c62828 are MUI defaults,
      not FBSM branding — resolves once Colors.jsx lands
- [ ] EditListing image preview — DEFER into multi-image work

## Email

- [x] Welcome email at account creation (done —
      feature/welcome-email branch, Resend + django-anymail)
- [x] Admin alert on new signup (done as the weekly signup digest,
      feature/weekly-signup-digest)

## Multi-image listings

- [ ] ListingImage model (FK to Listing, order field), data-migrate
      existing Listing.image rows, then drop the field
- [ ] Rekognition loop + max image count (~6-8)
- [ ] Thumbnail strip first, lightbox (native <dialog>) second
- [ ] Create flow first, edit flow as separate PR

## Profile page

- [ ] Iconography pass: decide whether to install @mui/icons-material (or use inline SVGs) and add icons to Seller Tools buttons + elsewhere
- [x] Profile page redesign (feature/profile-redesign): welcome panel,
      equal-height Current Information + Seller Tools panels, view/edit
      modes with Cancel/Save, active listing count, phone-width layout
- [x] Shared Toast no longer hidden under the site header
- [ ] Format birthdate for display (currently raw 1990-05-17)
- [ ] Decide whether "Save changes" with no edits should just close edit
      mode instead of showing the "No changes to save." error toast

## Listing detail

- [x] Edit listing in place (feature/listing-detail-edit-in-place): owner
      Edit/Delete buttons, prefilled form in the right column, Replace photo
      under the image, changed-fields-only PATCH
- [x] Delete confirmation Dialog (replaces window.confirm), with a
      "was deleted" toast on /profile
- [x] Detail card stacks on phones; removed the unlinked /editlisting/:id/ route
- [ ] Preview the replacement photo before saving
- [x] Add to Cart shows "Added to your cart!" before the request finishes,
      even if it fails; move it to the shared Toast after a successful response

## Session expiry & auth (fix/session-expiry)

- [x] utils/apiFetch.js: Bearer header, silent refresh on 401 with a single
      shared in-flight refresh, saves rotated refresh token, retries once
- [x] utils/jwt.js isTokenExpired (decode only, no library)
- [x] Expired session: clear auth, redirect to /login?next=…, "Your session
      expired" Toast, return to the original page (relative paths only)
- [x] AuthContext is the source of truth (navbar, home, logout); checks
      tokens on load and signs out quietly if the refresh token is dead
- [x] All authenticated calls use apiFetch; Add to Cart and cart removal
      show success/error Toasts (resolves the "Added to your cart!" item
      under Listing detail); login alert() replaced with the error Toast
- [x] Access token lifetime 2 days -> 30 minutes (refresh stays 10 days)
- [ ] Consider httpOnly-cookie JWT storage instead of localStorage (XSS
      hardening) — larger backend/CORS change, separate PR
- [ ] Logout with an expired access token can't blacklist the refresh token
      (/logout/ requires auth); refresh first, or let /logout/ accept just
      the refresh token
- [ ] Route guards: signed-out visitors on /profile, /cart, /createlisting
      see empty states instead of being sent to /login?next=…
- [ ] A network error during refresh logs the user out; consider keeping
      the session and showing a "Couldn't reach the server" Toast instead

## Homepage on phones (feature/home-mobile-signed-out)

- [x] Fix home row alignment: transient $justify prop (was rendering
      [object Object]) and a 24px gap between welcome text and login form
- [x] Compact signed-out welcome card on phones (<=640px): headline,
      one-line tagline, Log In / Register buttons, How it Works / About Us
      links; long welcome text + login form hidden there via media queries
- [x] "Current Listings" heading row with a listing count on phones
- [x] Homepage welcome paragraph moved into the About Us intro
- [x] Compact 2-column listing grid on phones (shared Card component) — separate PR
- [ ] Shrink the logo banner on phones (about 180px above the welcome card)
- [ ] Signed-in phone homepage still shows the long welcome text; first
      listing starts around 790px. Consider a short signed-in header instead

## Listing grid on phones (feature/listing-grid-2col)

- [x] Shared ListingCard component for home, search, and Your Listings
      (Your Listings now gets the hover shadow too)
- [x] 2-column listing grid at <=640px on all three pages
- [x] Compact phone cards: square photos, titles up to 2 lines, price
      stacked above condition, tighter spacing
- [ ] Search page crashes if the search request fails: listingSearch stays
      undefined and the "No data found" check reads listingSearch.length

## Landscape phones and tablet widths (fix/landscape-phone-layout)

- [x] Listing grid at 641–1023px: minmax(220px, 1fr) instead of
      minmax(280px, 400px), so tablets and landscape phones get 3 columns
      instead of one 400px column (home, search, Your Listings)
- [x] Shared breakpoints (GlobalStyles/breakpoints.js): phone, compactHome
      (portrait phones OR short landscape screens), navMenu
- [x] Compact signed-out welcome card on landscape phones too (centered,
      max 560px); heading row with listing count on landscape phones
- [x] Homepage welcome text + login side by side down to ~860px, then
      stacked with the login card centered (was stuck on the left when the
      row wrapped, up to ~1100px wide)
- [x] Shrink the logo banner on phones, portrait and landscape
      (137/187px -> 86px)
- [x] Nav collapses to the hamburger menu up to 1023px (was 768); the
      signed-in links ran off the screen at 844
- [ ] Long usernames can still overflow the desktop nav at ~1024–1070px;
      cap the username link's width with an ellipsis
- [ ] Desktop nav is 57px tall but the page reserves 50px for it (7px
      overlap, hidden by the banner padding)
- [ ] npm run lint fails on routes/home.jsx:52 (unescaped ' in '79-'93),
      already on main
- [ ] Check landscape on a real iPhone (notch safe areas narrow the
      usable width)

## Local backend/.env holds prod secrets (next, after the signup digest)

- [x] backend/.env has the prod DB password, prod AWS keys, and the prod
      Resend key, and settings.py loads it, so any bare manage.py command
      (runserver, migrate, shell, send_signup_digest) hits production unless
      the dev.sh / CLAUDE.md overrides are exported. .env is gitignored, so
      Railway never reads it; prod gets its values from Railway Variables.
- [x] Before changing anything: confirm every value is set in Railway
      Variables, and save a copy of the prod secrets in a password manager
- [x] Rewrite backend/.env with local values: local DATABASE_URL, blank AWS
      keys, a throwaway dev SECRET_KEY, no RESEND_API_KEY
- [x] Use `railway run <command>` for deliberate one-off prod commands
      (documented in CLAUDE.md)
- [x] Update CLAUDE.md's "DO NOT hit the prod database" section and dev.sh
      comments to match (overrides become a backstop, not the only guard)
- [ ] Remove the unused PROFILE_NOTIFICATION_EMAIL variable from Railway
      (leftover from feature/profile-email-notifications; no code reads it)
- [ ] RENDER_EXTERNAL_HOSTNAME block in settings.py (duplicated, from the old
      Render hosting) can be deleted

## Weekly signup digest (feature/weekly-signup-digest)

- [x] Profile.signup_digest_sent_at (null = not reported yet); migration 0034
      backfills existing profiles so the first digest lists only new signups
- [x] send_signup_digest email + templates: new accounts oldest first, with
      state, signup time (ET), profile fields filled, listing count, admin
      link; site totals; still sends on zero-signup weeks
- [x] `manage.py send_signup_digest` command: stamps only the profiles it
      emailed, after a successful send; a failed send stamps nothing and
      exits non-zero; --dry-run prints and stamps nothing
- [x] SignupDigestTests (stamping, zero-signup week, activity counts, send
      failure, dry run, HTML escaping)
- [x] Railway signup-digest cron service: `0 13 * * 5` (Fridays 13:00 UTC),
      start command `python manage.py send_signup_digest`, variables
      DATABASE_URL, SECRET_KEY, RESEND_API_KEY, SEND_REAL_EMAIL
- [x] After merge + web deploy: `railway cron run`, confirm the run completes
      and the email arrives
- [x] Sign up a test account, trigger a run (it's listed), trigger again
      ("No new signups this week")
- [ ] First scheduled Friday: email arrives and reads well on a phone
- [ ] welcome.txt autoescapes like HTML, so a username with & or < shows as
      &amp; / &lt; in the plain-text welcome email (wrap it in
      {% autoescape off %} like signup_digest.txt)

## Register button stuck disabled (fix/turnstile-explicit-render, #42)

- [x] Turnstile implicit mode scanned the page once, before React mounted the
      register form, so the widget never rendered and nobody could sign up.
      Now loaded with render=explicit and rendered from RegisterForm
- [x] Re-disable the button on expired/error; reset the widget after a failed
      submit (tokens are single-use)
- [ ] Find out how long signups were blocked (compare recent date_joined
      values with when Turnstile was added)

## Log in automatically after registering (feature/register-auto-login)

- [x] /register/ returns the same tokens as /token/ (built only after
      validation, Turnstile, and save succeed), with tests
- [x] startSession() in utils/session.js, shared by LoginForm and RegisterForm
- [x] RegisterForm: save the session, load /profile/; falls back to /login if
      the response has no tokens; no more alert()
- [x] Profile page: new users land in the edit form with a welcome toast and
      "Welcome, <name>!"
- [ ] The welcome toast closes after 4s like every toast; it's long enough
      that a slower reader may miss it (consider a longer duration for it)

## Logo banner and nav shift between pages (fix/layout-auto-margins)

- [x] Logo banner and Main use margin: 0 auto, so flex auto margins no longer
      split a short page's leftover height and move the logo
- [x] Main uses flex: 1 0 auto instead of min-height: calc(100vh - 500px), so
      the footer sits at the bottom of short pages without a magic number
- [x] scrollbar-gutter: stable on html, so classic scrollbars no longer shift
      the nav and centered content sideways between pages
- [ ] Known tradeoff: with classic scrollbars, short pages show a 15px pale
      strip beside the nav and footer (accepted; revisit if it bothers anyone)

## Dev seed data (chore/dev-seed-data)

- [x] `manage.py seed_dev_data`: 25 users, about 120 listings with placeholder
      images, cart items, and a `seed_demo` login, reproducible from --seed
- [x] Refuses to run unless on foxbody_local on a local host with DEBUG on;
      no --force
- [x] --flush / --flush-only remove only @seed.example.com users and their
      image files; re-running without --flush is blocked
- [x] --images-dir for real photos; images skipped if storage is S3
- [x] SeedDevDataTests, CLAUDE.md and README docs

## Found while testing with seed data

- [ ] BUG: /cart at phone width pushes Remove off-screen, and body's
      overflow-x: hidden means you can't scroll to it. At <=768px
      CartOuterContainer is a column with align-items: flex-start, so the
      main column grows to fit nowrap titles (520px on a 375px screen).
      align-items: stretch at that breakpoint fixed it when tried live
- [ ] A listing with no image renders a broken <img> with no source; needs a
      fallback (only "Bob spoof attempt" locally, but the API allows it)
- [ ] "Your Listings" empty state just says "No data found"; a friendlier
      message with a link to create a listing would help new sellers
- [ ] Listing has no created date or default sort order, so the homepage order
      is whatever Postgres returns; needed before sorting or pagination
- [ ] Listing display ideas from browsing with fuller data (to be added)
