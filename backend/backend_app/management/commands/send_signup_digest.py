from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count
from django.utils import timezone

from backend_app.emails import build_signup_digest, send_signup_digest
from backend_app.models import Profile


class Command(BaseCommand):
    help = (
        "Email the admin a digest of accounts created since the last digest. "
        "Runs weekly on a Railway cron service."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print the email and the profiles that would be stamped; "
            "send nothing and stamp nothing.",
        )

    def handle(self, *args, **options):
        # No explicit connection cleanup: the process exits when handle()
        # returns or raises, which closes the DB connection and ends the
        # Railway cron run.
        dry_run = options["dry_run"]
        now = timezone.now()
        # list() runs the query once, so the email and the stamp below cover
        # exactly the same people even if someone signs up mid-send.
        profiles = list(
            Profile.objects.filter(signup_digest_sent_at__isnull=True)
            .select_related("user")
            .annotate(listing_count=Count("user__listing"))
            .order_by("user__date_joined")
        )
        ids = [p.id for p in profiles]

        if dry_run:
            message = build_signup_digest(profiles, now)
            self.stdout.write(f"Subject: {message.subject}\nTo: {', '.join(message.to)}\n")
            self.stdout.write(message.body)
            self.stdout.write(f"Dry run: would stamp profile ids {ids}; nothing sent.")
            return

        try:
            send_signup_digest(profiles, now)
        except Exception as exc:
            # Nothing is stamped, so these people roll into the next digest.
            raise CommandError(f"Signup digest failed to send: {exc}") from exc

        Profile.objects.filter(id__in=ids).update(signup_digest_sent_at=now)
        noun = "signup" if len(ids) == 1 else "signups"
        self.stdout.write(self.style.SUCCESS(f"Sent digest with {len(ids)} {noun}"))
