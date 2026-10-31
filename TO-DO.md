# TO-DO

> Status: this project is currently a proof of concept. The core marketplace
> (auth, listings, search, cart, image uploads, admin) works. The items below
> are not built yet.

## Transactional email (Resend)

> `RESEND_API_KEY` already lives in `backend/.env`. These hook into
> `RegisterView` in `backend/backend_app/views.py`.

- [x] Welcome email: on registration, send from `noreply@foxbodyswapmeet.com`
      (or similar) to the new user's email address.
- [ ] Admin notification email: on registration, send to
      `sam@foxbodyswapmeet.com` announcing the new account (username + email).
- [x] Verify `foxbodyswapmeet.com` as a sending domain in Resend (SPF/DKIM)
      so mail doesn't land in spam.
- [ ] Move slow external calls off the request path: send email asynchronously,
      and do the same for the synchronous AWS Rekognition moderation call in
      `check_image_moderation` (views.py) so a slow/failing third party can't
      break registration or listing uploads. Handle send/mod failures gracefully.
      (Welcome email currently sends synchronously after commit with a 5s/15s
      timeout; failures are logged and never break signup. Still to do: async.)

## Make it demoable

- [ ] `.env.example` documenting every required env var (no real secrets).
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
- [ ] Admin alert on new signup (salvage the idea from
      feature/profile-email-notifications; build after welcome email)

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
- [ ] Add to Cart shows "Added to your cart!" before the request finishes,
      even if it fails; move it to the shared Toast after a successful response
