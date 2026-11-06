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
    Listing,
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
        if options["flush"] or options["flush_only"]:
            raise CommandError("--flush isn't built yet.")
        if options["users"] < 1:
            raise CommandError("--users must be at least 1.")

        photos = self.find_photos(options["images_dir"])
        use_images = self.images_allowed()

        # Our own Random, so the same --seed always picks the same data.
        rng = random.Random(options["seed"])
        now = timezone.now()
        self.saved_files = []
        try:
            # All or nothing: a failure partway through leaves no half-built data.
            with transaction.atomic():
                users, tiers = self.seed_users(
                    rng, options["users"], now, options["unstamped"]
                )
                listing_count = self.seed_listings(rng, users, photos, use_images)
        except Exception:
            # A rollback only undoes the database, not files already on disk.
            for name in self.saved_files:
                default_storage.delete(name)
            raise

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {options['users']} users and profiles "
                f"({tiers['full']} full, {tiers['partial']} partial, "
                f"{tiers['empty']} empty) and {listing_count} listings "
                f"({len(self.saved_files)} images)."
            )
        )
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

    def seed_users(self, rng, count, now, unstamped):
        full = round(count * seed_data.FULL_PROFILE_SHARE)
        partial = round(count * seed_data.PARTIAL_PROFILE_SHARE)
        tiers = ["full"] * full + ["partial"] * partial
        tiers += ["empty"] * (count - len(tiers))
        rng.shuffle(tiers)

        usernames = rng.sample(seed_data.USERNAMES, min(count, len(seed_data.USERNAMES)))
        # Past the hand-written list, reuse names with a number on the end.
        for i in range(len(usernames), count):
            base = seed_data.USERNAMES[i % len(seed_data.USERNAMES)]
            usernames.append(f"{base}_{i}")

        # Hashing is slow on purpose, so do it once and share the result.
        password = make_password(seed_data.SEED_PASSWORD)
        longest_bio_used = False
        users = []
        for username, tier in zip(usernames, tiers):
            names, profile_fields = self.build_details(rng, tier)
            if tier == "full" and not longest_bio_used:
                profile_fields["bio"] = seed_data.LONGEST_BIO
                longest_bio_used = True

            # The post_save signal on User creates the Profile, so fill that
            # one in rather than creating a second.
            user = User.objects.create(
                username=username,
                email=f"{username}@{seed_data.SEED_EMAIL_DOMAIN}",
                password=password,
                date_joined=now - timedelta(days=rng.uniform(0, SIGNUP_WINDOW_DAYS)),
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

    def seed_listings(self, rng, users, photos, use_images):
        owners = self.pick_listing_owners(rng, users)
        # Shuffled so one seller's listings aren't all next to each other.
        rng.shuffle(owners)

        catalog = []
        passes = 0
        for owner in owners:
            if not catalog:
                catalog = rng.sample(seed_data.LISTINGS, len(seed_data.LISTINGS))
                passes += 1
            category, label, title, price, description = catalog.pop()
            if passes > 1:
                # Same part from another seller, at that seller's own price.
                price = 5 * round(price * rng.uniform(0.85, 1.15) / 5)
                price = min(max(price, 5), seed_data.MAX_LISTING_PRICE)
            # Created directly, not through the API, so this skips the
            # Rekognition check that real uploads get.
            listing = Listing.objects.create(
                user=owner,
                username=owner.username,  # copied, as the real create flow does
                title=title,
                price=price,
                description=description,
                condition=rng.choice(CONDITION_CHOICES)[0],
            )
            if use_images:
                self.attach_image(rng, listing, category, label, photos)
        return len(owners)

    def pick_listing_owners(self, rng, users):
        """Returns one entry per listing to create, repeating busy sellers."""
        shuffled = rng.sample(users, len(users))
        # The power seller gets a full profile, so that page shows everything.
        shuffled.sort(key=lambda pair: pair[1] != "full")
        zero = round(len(users) * seed_data.ZERO_LISTINGS_SHARE)
        many = round(len(users) * seed_data.MANY_LISTINGS_SHARE)

        owners = []
        for position, (user, _tier) in enumerate(shuffled):
            if position == 0:
                listing_count = seed_data.POWER_SELLER_LISTINGS
            elif position <= many:
                listing_count = rng.randint(*seed_data.MANY_LISTINGS_RANGE)
            elif position < len(users) - zero:
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
