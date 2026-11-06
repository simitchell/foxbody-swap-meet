import random
from datetime import date, timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone

from backend_app import seed_data
from backend_app.models import FOX_BODY_FIRST_YEAR, current_year

LOCAL_DB_NAME = "foxbody_local"
LOCAL_DB_HOSTS = ("", "localhost", "127.0.0.1")
SIGNUP_WINDOW_DAYS = 548  # about 18 months


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

        # Our own Random, so the same --seed always picks the same data.
        rng = random.Random(options["seed"])
        now = timezone.now()
        # All or nothing: a failure partway through leaves no half-built data.
        with transaction.atomic():
            tiers = self.seed_users(rng, options["users"], now, options["unstamped"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {options['users']} users and profiles "
                f"({tiers['full']} full, {tiers['partial']} partial, "
                f"{tiers['empty']} empty)."
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

        return {"full": full, "partial": partial, "empty": count - full - partial}

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
