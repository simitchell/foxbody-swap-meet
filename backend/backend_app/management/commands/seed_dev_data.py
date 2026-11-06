import random
import textwrap
from datetime import date, timedelta
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from backend_app import seed_data
from backend_app.models import (
    CONDITION_CHOICES,
    FOX_BODY_FIRST_YEAR,
    Brand,
    Cart,
    Listing,
    Profile,
    current_year,
)

LOCAL_DB_NAME = "foxbody_local"
LOCAL_DB_HOSTS = ("", "localhost", "127.0.0.1")
SIGNUP_WINDOW_DAYS = 548  # about 18 months
IMAGE_SIZE = (800, 600)  # 4:3
PHOTO_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


class Command(BaseCommand):
    help = "Fill the local database with believable seed data. Local dev only."

    def add_arguments(self, parser):
        parser.add_argument(
            "--users", type=int, default=25, help="Seeded users to create."
        )
        parser.add_argument(
            "--seed", type=int, default=42, help="Random seed; same seed, same data."
        )
        parser.add_argument(
            "--unstamped",
            action="store_true",
            help="Leave signup_digest_sent_at null, to test the digest.",
        )
        parser.add_argument(
            "--images-dir",
            help="Use photos from this folder instead of generated placeholders.",
        )
        flush = parser.add_mutually_exclusive_group()
        flush.add_argument(
            "--flush", action="store_true", help="Delete seeded data, then re-seed."
        )
        flush.add_argument(
            "--flush-only", action="store_true", help="Delete seeded data and stop."
        )

    def handle(self, *args, **options):
        self.check_local_only()
        if options["users"] < 1:
            raise CommandError("--users must be at least 1.")

        if options["flush_only"]:
            with transaction.atomic():
                old_files = self.flush()
            self.delete_files(old_files)
            return

        photos = self.find_photos(options["images_dir"])
        use_images = self.images_allowed()

        # Our own Random, so the same --seed always picks the same data.
        rng = random.Random(options["seed"])
        now = timezone.now()
        self.saved_files = []
        old_files = []
        try:
            # All or nothing: a failure partway through leaves no half-built
            # data, and a failed --flush re-seed leaves the old data in place.
            with transaction.atomic():
                if options["flush"]:
                    old_files = self.flush()
                elif self.seeded_users().exists():
                    raise CommandError(
                        "Seed data already exists. Run with --flush to replace it."
                    )
                users, tiers = self.seed_users(
                    rng, options["users"], now, options["unstamped"]
                )
                listings = self.seed_listings(rng, users, photos, use_images, now)
                cart_count = self.seed_carts(rng, users, listings)
        except Exception:
            # A rollback only undoes the database, not files already on disk.
            self.delete_files(self.saved_files)
            raise
        # Only now, since the rows pointing at these files are really gone.
        self.delete_files(old_files)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {options['users']} users and profiles "
                f"({tiers['full']} full, {tiers['partial']} partial, "
                f"{tiers['empty']} empty), {len(listings)} listings "
                f"({len(self.saved_files)} images), and {cart_count} cart items."
            )
        )
        self.stdout.write(f"Demo login: {seed_data.DEMO_USERNAME}")
        self.stdout.write(f"Password for every seeded user: {seed_data.SEED_PASSWORD}")

    def check_local_only(self):
        # Reads settings only, so a refusal happens before any database
        # connection is opened. Deliberately has no --force: an override is
        # one shell-history search away from being run against production.
        name = connection.settings_dict["NAME"]
        host = connection.settings_dict["HOST"]
        self.stdout.write(f"Database: {name} on host: {host or '(local socket)'}")

        if name != LOCAL_DB_NAME or host not in LOCAL_DB_HOSTS:
            raise CommandError(
                f"Refusing to seed database '{name}' on host '{host}'. Use the "
                'local database: DATABASE_URL="postgres://$(whoami)'
                f'@localhost:5432/{LOCAL_DB_NAME}" (see backend/.env.example).'
            )
        if not settings.DEBUG:
            raise CommandError(
                "Refusing to seed with DEBUG off, which isn't a local setup. "
                "Set DEBUG=true (see backend/.env.example)."
            )

    def seeded_users(self):
        return User.objects.filter(email__endswith=f"@{seed_data.SEED_EMAIL_DOMAIN}")

    def flush(self):
        """Deletes seeded users and returns their image files to delete later."""
        users = self.seeded_users()
        listings = Listing.objects.filter(user__in=users)
        self.stdout.write(
            f"Flushing {users.count()} users, "
            f"{Profile.objects.filter(user__in=users).count()} profiles, "
            f"{listings.count()} listings, and "
            f"{Cart.objects.filter(user_id__in=users).count()} cart items."
        )
        files = [listing.image_url.name for listing in listings if listing.image_url]
        # Found before the users go, since deleting a user clears created_by.
        pending_brand_ids = list(
            Brand.objects.filter(
                name__in=seed_data.PENDING_BRANDS, created_by__in=users
            ).values_list("pk", flat=True)
        )
        # Profiles, listings, and cart items all cascade from User. Files don't:
        # deleting a row leaves its image on disk, so the caller removes them.
        users.delete()
        # listings=None skips any a real listing has since started using.
        Brand.objects.filter(pk__in=pending_brand_ids, listings=None).delete()
        return files

    def delete_files(self, names):
        for name in names:
            default_storage.delete(name)

    def seed_users(self, rng, count, now, unstamped):
        full = round(count * seed_data.FULL_PROFILE_SHARE)
        partial = round(count * seed_data.PARTIAL_PROFILE_SHARE)
        tiers = ["full"] * full + ["partial"] * partial
        tiers += ["empty"] * (count - len(tiers))
        rng.shuffle(tiers)
        # The demo user comes first and always has a full profile.
        tiers.remove("full")
        tiers.insert(0, "full")

        others = count - 1
        usernames = [seed_data.DEMO_USERNAME]
        usernames += rng.sample(seed_data.USERNAMES, min(others, len(seed_data.USERNAMES)))
        # Past the hand-written list, reuse names with a number on the end.
        for i in range(len(usernames) - 1, others):
            base = seed_data.USERNAMES[i % len(seed_data.USERNAMES)]
            usernames.append(f"{base}_{i}")

        taken = User.objects.filter(username__in=usernames)
        if taken.exists():
            names = ", ".join(taken.values_list("username", flat=True))
            raise CommandError(f"These usernames are already taken: {names}")

        # Hashing is slow on purpose, so do it once and share the result.
        password = make_password(seed_data.SEED_PASSWORD)
        longest_bio_used = False
        users = []
        for username, tier in zip(usernames, tiers):
            names, profile_fields = self.build_details(rng, tier)
            if tier == "full" and not longest_bio_used:
                profile_fields["bio"] = seed_data.LONGEST_BIO
                longest_bio_used = True

            days_since_joining = rng.uniform(0, SIGNUP_WINDOW_DAYS)
            if username == seed_data.DEMO_USERNAME:
                # Older than all of DEMO_LISTING_AGES, so no listing predates it.
                days_since_joining = SIGNUP_WINDOW_DAYS

            # The post_save signal on User creates the Profile, so fill that
            # one in rather than creating a second.
            user = User.objects.create(
                username=username,
                email=f"{username}@{seed_data.SEED_EMAIL_DOMAIN}",
                password=password,
                date_joined=now - timedelta(days=days_since_joining),
                **names,
            )
            profile = user.profile
            for field, value in profile_fields.items():
                setattr(profile, field, value)
            profile.signup_digest_sent_at = None if unstamped else now
            # Catches seed data the model wouldn't accept (lengths, ZIP format).
            profile.full_clean()
            profile.save()
            users.append((user, tier))

        return users, {"full": full, "partial": partial, "empty": count - full - partial}

    def build_details(self, rng, tier):
        """Returns (User name fields, Profile fields) for one completeness tier."""
        if tier == "empty":
            return {}, {}

        city, state, zip_code = rng.choice(seed_data.PLACES)
        names = {
            "first_name": rng.choice(seed_data.FIRST_NAMES),
            "last_name": rng.choice(seed_data.LAST_NAMES),
        }
        profile_fields = {
            "street": rng.choice(seed_data.STREETS),
            "city": city,
            "state": state,
            "zip_code": zip_code,
            "birthdate": date(rng.randint(1955, 2003), rng.randint(1, 12), rng.randint(1, 28)),
            "bio": rng.choice(seed_data.BIOS),
            "enthusiast_since": rng.randint(FOX_BODY_FIRST_YEAR, current_year()),
        }
        if tier == "partial":
            # Blank some of the fields so the UI's "—" fallbacks show.
            kept = set(rng.sample(sorted(profile_fields), rng.randint(1, 4)))
            profile_fields = {f: v for f, v in profile_fields.items() if f in kept}
            if rng.random() < 0.5:
                names = {}
        return names, profile_fields

    def find_photos(self, images_dir):
        if not images_dir:
            return []
        folder = Path(images_dir)
        if not folder.is_dir():
            raise CommandError(f"--images-dir is not a folder: {images_dir}")
        photos = sorted(
            p for p in folder.iterdir() if p.suffix.lower() in PHOTO_EXTENSIONS
        )
        if not photos:
            raise CommandError(f"--images-dir has no photos: {images_dir}")
        return photos

    def images_allowed(self):
        # An exported AWS key switches storage to S3, which is the production
        # bucket. Listings are still created, just without images.
        if hasattr(settings, "AWS_STORAGE_BUCKET_NAME"):
            self.stdout.write(
                self.style.WARNING("Storage is S3, so skipping listing images.")
            )
            return False
        return True

    def seed_listings(self, rng, users, photos, use_images, now):
        owners = self.pick_listing_owners(rng, users)
        # Shuffled so one seller's listings aren't all next to each other.
        rng.shuffle(owners)
        demo_ages = list(seed_data.DEMO_LISTING_AGES)
        brands = {
            brand.name: brand
            for brand in Brand.objects.filter(
                name__in=set(seed_data.LISTING_BRANDS.values())
            )
        }

        listings = []
        catalog = []
        passes = 0
        for owner in owners:
            if not catalog:
                catalog = rng.sample(seed_data.LISTINGS, len(seed_data.LISTINGS))
                passes += 1
            category, label, title, price, description = catalog.pop()
            if passes > 1:
                # Same part from another seller, at that seller's own price.
                catalog_price = price
                price = 5 * round(price * rng.uniform(0.85, 1.15) / 5)
                # The cap stops ordinary parts drifting up. A part that's
                # already above it just can't go any higher.
                price = min(
                    max(price, 5), max(seed_data.MAX_LISTING_PRICE, catalog_price)
                )
            created_at, bumped_at = self.listing_dates(rng, owner, now, demo_ages)
            # Listings with no date are left Not set on the demo user, so that
            # login always has one of each. Others are Not set at random.
            if owner.username == seed_data.DEMO_USERNAME:
                not_set = created_at is None
            else:
                not_set = rng.random() < seed_data.NOT_SET_SHARE
            listing_category, fits = (
                ("", "") if not_set else seed_data.LISTING_DETAILS[label]
            )
            brand = None
            if not not_set and rng.random() >= seed_data.UNBRANDED_SHARE:
                # .get: a brand merged away locally just leaves the part unbranded.
                brand = brands.get(seed_data.LISTING_BRANDS.get(label))
            condition = rng.choice(CONDITION_CHOICES)[0]
            if price >= seed_data.LONG_PRICE_FROM:
                condition = seed_data.LONG_PRICE_CONDITION
            # Created directly, not through the API, so this skips the
            # Rekognition check that real uploads get.
            listing = Listing.objects.create(
                user=owner,
                username=owner.username,  # copied, as the real create flow does
                title=title,
                price=price,
                description=description,
                condition=condition,
                brand=brand,
                category=listing_category,
                fits=fits,
                created_at=created_at,
                bumped_at=bumped_at,
            )
            if use_images:
                self.attach_image(rng, listing, category, label, photos)
            listings.append(listing)
        self.bump_some_listings(rng, listings, now)
        self.seed_pending_brands(rng, listings)
        return listings

    def seed_pending_brands(self, rng, listings):
        """Gives one demo listing and one other seller's a pending brand."""
        demo = [
            listing
            for listing in listings
            if listing.username == seed_data.DEMO_USERNAME and listing.category
        ]
        others = [
            listing
            for listing in listings
            if listing.username != seed_data.DEMO_USERNAME and listing.category
        ]
        chosen = rng.sample(demo, min(1, len(demo)))
        chosen += rng.sample(others, min(1, len(others)))
        for name, listing in zip(seed_data.PENDING_BRANDS, chosen):
            brand, _created = Brand.objects.get_or_create(
                name=name,
                defaults={"is_approved": False, "created_by": listing.user},
            )
            listing.brand = brand
            listing.save(update_fields=["brand"])

    def listing_dates(self, rng, owner, now, demo_ages):
        """Returns (created_at, bumped_at), which start out equal when known."""
        if owner.username == seed_data.DEMO_USERNAME:
            days_ago = demo_ages.pop(0)
            if days_ago is None:
                bumped_at = now - timedelta(days=seed_data.DEMO_NO_DATE_BUMP_AGE_DAYS)
                return None, bumped_at
            listed_at = now - timedelta(days=days_ago)
            return listed_at, listed_at

        # Never before the seller joined.
        listed_at = owner.date_joined + (now - owner.date_joined) * rng.random()
        if rng.random() < seed_data.NO_DATE_SHARE:
            return None, listed_at
        return listed_at, listed_at

    def bump_some_listings(self, rng, listings, now):
        """Moves a few older listings to the top, as a paid bump would."""
        old_enough = now - timedelta(days=seed_data.BUMPED_MIN_AGE_DAYS)
        eligible = [
            listing
            for listing in listings
            if listing.created_at and listing.created_at < old_enough
            and listing.username != seed_data.DEMO_USERNAME
        ]
        count = min(seed_data.BUMPED_LISTINGS, len(eligible))
        for listing in rng.sample(eligible, count):
            listing.bumped_at = now - timedelta(
                days=rng.uniform(0, seed_data.BUMPED_WITHIN_DAYS)
            )
            listing.save(update_fields=["bumped_at"])

    def seed_carts(self, rng, users, listings):
        demo = users[0][0]
        others = [user for user, _tier in users[1:]]
        buyers = [demo] + rng.sample(others, min(seed_data.CART_USERS - 1, len(others)))

        cart_count = 0
        for buyer in buyers:
            # Never their own listing: the real page hides Add to Cart for owners.
            available = [l for l in listings if l.user_id != buyer.id]
            low, high = seed_data.CART_ITEMS_RANGE
            for listing in rng.sample(available, min(rng.randint(low, high), len(available))):
                # Cart rows hold a copy of the listing, not a link to it. The
                # real flow copies the API's full image URL, and the cart page
                # uses it directly as <img src>, so it can't be relative here.
                image_url = None
                if listing.image_url:
                    image_url = f"{settings.BACKEND_URL}{listing.image_url.url}"
                Cart.objects.create(
                    user_id=buyer,
                    cart_item=listing.title,
                    image_url=image_url,
                    price=listing.price,
                    condition=listing.condition,
                )
                cart_count += 1
        return cart_count

    def pick_listing_owners(self, rng, users):
        """Returns one entry per listing to create, repeating busy sellers."""
        demo = users[0][0]
        others = users[1:]
        shuffled = rng.sample(others, len(others))
        # The power seller gets a full profile, so that page shows everything.
        shuffled.sort(key=lambda pair: pair[1] != "full")
        zero = round(len(users) * seed_data.ZERO_LISTINGS_SHARE)
        many = round(len(users) * seed_data.MANY_LISTINGS_SHARE)

        owners = [demo] * seed_data.DEMO_LISTINGS
        for position, (user, _tier) in enumerate(shuffled):
            if position == 0:
                listing_count = seed_data.POWER_SELLER_LISTINGS
            elif position <= many:
                listing_count = rng.randint(*seed_data.MANY_LISTINGS_RANGE)
            elif position < len(others) - zero:
                listing_count = rng.randint(*seed_data.FEW_LISTINGS_RANGE)
            else:
                listing_count = 0
            owners.extend([user] * listing_count)
        return owners

    def attach_image(self, rng, listing, category, label, photos):
        if photos:
            photo = rng.choice(photos)
            content, extension = photo.read_bytes(), photo.suffix
        else:
            content, extension = self.placeholder_image(category, label), ".jpg"
        # The field's upload_to gives each file its own unique name.
        listing.image_url.save(f"seed{extension}", ContentFile(content))
        self.saved_files.append(listing.image_url.name)

    def placeholder_image(self, category, label):
        image = Image.new("RGB", IMAGE_SIZE, seed_data.CATEGORY_COLORS[category])
        draw = ImageDraw.Draw(image)
        center = IMAGE_SIZE[0] / 2
        draw.text(
            (center, 90),
            category.upper(),
            font=ImageFont.load_default(size=44),
            fill=(225, 225, 225),
            anchor="mm",
        )
        draw.multiline_text(
            (center, 330),
            textwrap.fill(label, width=14),
            font=ImageFont.load_default(size=92),
            fill=(255, 255, 255),
            anchor="mm",
            align="center",
        )
        output = BytesIO()
        image.save(output, "JPEG", quality=80)
        return output.getvalue()
