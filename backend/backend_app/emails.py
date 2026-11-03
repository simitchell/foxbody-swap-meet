import logging
from zoneinfo import ZoneInfo

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import reverse

from .models import Listing

logger = logging.getLogger(__name__)

EASTERN = ZoneInfo("America/New_York")

# Optional profile details a new user can fill in after signing up, as
# (label, test) pairs. State is left out: the digest shows it on its own line.
PROFILE_FIELDS = [
    ("name", lambda p: p.user.first_name or p.user.last_name),
    ("street", lambda p: p.street),
    ("city", lambda p: p.city),
    ("ZIP", lambda p: p.zip_code),
    ("birthdate", lambda p: p.birthdate),
    ("bio", lambda p: p.bio),
    ("enthusiast since", lambda p: p.enthusiast_since),
]


def send_welcome_email(user):
    """Send the welcome email to a newly registered user.

    Never raises: a mail failure must not break registration, so errors are
    logged and False is returned. Returns True if the message was handed off.
    """
    if not user.email:
        return False

    context = {
        "username": user.username,
        "login_url": f"{settings.SITE_URL}/login",
        "site_url": settings.SITE_URL,
    }
    try:
        message = EmailMultiAlternatives(
            subject="Welcome to Fox Body Swap Meet",
            body=render_to_string("emails/welcome.txt", context),
            to=[user.email],
        )
        message.attach_alternative(
            render_to_string("emails/welcome.html", context), "text/html"
        )
        message.send()
    except Exception:
        logger.exception("Failed to send welcome email to user id=%s", user.pk)
        return False
    return True


def _eastern_time(dt):
    """Format a datetime like "Tue Nov 4, 3:12 PM ET"."""
    dt = dt.astimezone(EASTERN)
    hour = dt.strftime("%I").lstrip("0")
    return f"{dt:%a %b} {dt.day}, {hour}:{dt:%M %p} ET"


def _profile_summary(profile):
    filled = [label for label, test in PROFILE_FIELDS if test(profile)]
    if not filled:
        return "not filled in yet"
    return f"{len(filled)} of {len(PROFILE_FIELDS)} filled ({', '.join(filled)})"


def send_signup_digest(profiles, now):
    """Email the admin a summary of the given new profiles.

    Unlike send_welcome_email this raises on failure, so the command can skip
    stamping and the failed run shows up in Railway.
    """
    message = build_signup_digest(profiles, now)
    message.send()
    return message


def build_signup_digest(profiles, now):
    """Render the digest without sending it (used directly by --dry-run).

    `profiles` should have `user` selected and a `listing_count` annotation
    (the send_signup_digest command builds that queryset).
    """
    signups = [
        {
            "username": p.user.username,
            "email": p.user.email or "—",
            "state": p.state or "—",
            "joined": _eastern_time(p.user.date_joined),
            "profile": _profile_summary(p),
            "listing_count": p.listing_count,
            "admin_url": settings.BACKEND_URL
            + reverse("admin:auth_user_change", args=[p.user_id]),
        }
        for p in profiles
    ]

    count = len(signups)
    if count == 0:
        subject = "Fox Body Swap Meet: No new signups this week"
    else:
        noun = "signup" if count == 1 else "signups"
        subject = f"Fox Body Swap Meet: {count} new {noun} this week"

    local_now = now.astimezone(EASTERN)
    context = {
        "subject": subject,
        "date": f"{local_now:%A, %B} {local_now.day}, {local_now.year}",
        "signups": signups,
        "total_users": User.objects.count(),
        "total_listings": Listing.objects.count(),
        "site_url": settings.SITE_URL,
    }
    message = EmailMultiAlternatives(
        subject=subject,
        body=render_to_string("emails/signup_digest.txt", context),
        to=[settings.SIGNUP_DIGEST_TO],
    )
    message.attach_alternative(
        render_to_string("emails/signup_digest.html", context), "text/html"
    )
    return message
