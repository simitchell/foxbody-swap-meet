from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

LOCAL_DB_NAME = "foxbody_local"
LOCAL_DB_HOSTS = ("", "localhost", "127.0.0.1")


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
        self.stdout.write("Guard passed. Seeding isn't built yet; nothing changed.")

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
