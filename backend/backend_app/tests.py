import random
import tempfile
from datetime import date, timedelta
from io import StringIO
from pathlib import Path
from unittest import mock

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from . import seed_data
from .management.commands.seed_dev_data import Command as SeedCommand
from .models import Cart, Listing, Profile

PASSWORD = "S3cure-testpass!"


def make_user(username, state="", **profile_fields):
    user = User.objects.create_user(username, f"{username}@example.com", PASSWORD)
    user.profile.state = state
    for field, value in profile_fields.items():
        setattr(user.profile, field, value)
    user.profile.save()
    return user


class RegistrationStateTests(APITestCase):
    url = "/register/"

    def setUp(self):
        # Registration is throttled per IP ("registration" scope, 5/hour).
        # The throttle's counters live in Django's cache, which persists for
        # the whole test run (not reset between tests by the test runner),
        # so without clearing it here, later test classes would start
        # failing once enough /register/ calls had accumulated across the
        # whole suite — not because of anything those tests do wrong.
        cache.clear()
        # These tests predate Turnstile and aren't about it; treat every
        # token as verified so they keep exercising state-handling only.
        patcher = mock.patch(
            "backend_app.views.verify_turnstile_token",
            return_value=True,
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def register(self, **extra):
        data = {"username": "newbie", "email": "n@example.com", "password": PASSWORD}
        data.update(extra)
        return self.client.post(self.url, data)

    def test_state_is_saved_to_profile(self):
        response = self.register(state="TX")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get(username="newbie").profile.state, "TX")

    def test_state_is_optional(self):
        for extra in ({}, {"state": ""}):
            with self.subTest(extra=extra):
                User.objects.filter(username="newbie").delete()
                response = self.register(**extra)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(User.objects.get(username="newbie").profile.state, "")

    def test_invalid_state_is_rejected(self):
        response = self.register(state="ZZ")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("state", response.data)
        self.assertFalse(User.objects.filter(username="newbie").exists())

    def test_state_is_not_echoed_in_response(self):
        self.assertNotIn("state", self.register(state="TX").data)


class ProfileAddressTests(APITestCase):
    def setUp(self):
        self.user = make_user("alice")
        self.client.force_authenticate(self.user)
        self.url = f"/profile/{self.user.id}/"

    def test_update_all_address_fields(self):
        response = self.client.put(
            self.url,
            {
                "street": "1 Main St",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.city, "Austin")
        self.assertEqual(self.user.profile.zip_code, "78701")

    def test_zip_accepts_zip_plus_four_and_keeps_leading_zero(self):
        for zip_code in ("02134", "02134-1234"):
            with self.subTest(zip_code=zip_code):
                response = self.client.put(self.url, {"zip_code": zip_code})
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["zip_code"], zip_code)

    def test_invalid_zip_is_rejected(self):
        for zip_code in ("1234", "abcde", "123456", "12345-12"):
            with self.subTest(zip_code=zip_code):
                response = self.client.put(self.url, {"zip_code": zip_code})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("zip_code", response.data)

    def test_invalid_state_is_rejected(self):
        response = self.client.put(self.url, {"state": "Texas"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("state", response.data)

    def test_patch_changes_only_the_fields_sent(self):
        profile = self.user.profile
        profile.bio = "Fox body nut"
        profile.birthdate = "1990-05-17"
        profile.state = "TX"
        profile.save()

        response = self.client.patch(self.url, {"zip_code": "78701"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.zip_code, "78701")
        self.assertEqual(profile.bio, "Fox body nut")
        self.assertEqual(str(profile.birthdate), "1990-05-17")
        self.assertEqual(profile.state, "TX")

    def test_patch_can_clear_a_field_explicitly(self):
        self.user.profile.bio = "Fox body nut"
        self.user.profile.save()
        self.client.patch(self.url, {"bio": ""})
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, "")

    def test_blank_fields_are_allowed(self):
        response = self.client.put(
            self.url, {"street": "", "city": "", "state": "", "zip_code": ""}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ProfileNameAndYearTests(APITestCase):
    def setUp(self):
        self.user = make_user("alice")
        self.client.force_authenticate(self.user)
        self.url = f"/profile/{self.user.id}/"

    def test_names_are_saved_on_the_user(self):
        response = self.client.patch(
            self.url, {"first_name": "Alice", "last_name": "Smith"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Alice")
        self.assertEqual(self.user.last_name, "Smith")
        self.assertEqual(response.data["first_name"], "Alice")

    def test_names_and_profile_fields_save_together(self):
        response = self.client.patch(
            self.url, {"first_name": "Alice", "enthusiast_since": 1987}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Alice")
        self.assertEqual(self.user.profile.enthusiast_since, 1987)

    def test_member_since_is_the_join_year(self):
        response = self.client.get(self.url)
        self.assertEqual(response.data["member_since"], self.user.date_joined.year)

    def test_member_since_is_read_only(self):
        self.client.patch(self.url, {"member_since": 1985})
        response = self.client.get(self.url)
        self.assertEqual(response.data["member_since"], self.user.date_joined.year)

    def test_enthusiast_since_rejects_years_out_of_range(self):
        for year in (1978, date.today().year + 1):
            with self.subTest(year=year):
                response = self.client.patch(self.url, {"enthusiast_since": year})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("enthusiast_since", response.data)

    def test_enthusiast_since_can_be_cleared(self):
        self.user.profile.enthusiast_since = 1990
        self.user.profile.save()
        response = self.client.patch(
            self.url, {"enthusiast_since": None}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertIsNone(self.user.profile.enthusiast_since)


class SellerStateTests(APITestCase):
    """State is public on listings; street, city and ZIP must never leak."""

    def setUp(self):
        seller = make_user(
            "seller", state="OH", street="9 Secret Ln", city="Dayton", zip_code="45402"
        )
        self.listing = Listing.objects.create(
            user=seller, username="seller", title="GT40 intake", price=100
        )

    def test_state_visible_to_anonymous_users(self):
        for url in ("/listing/", f"/listing/{self.listing.id}/"):
            with self.subTest(url=url):
                response = self.client.get(url)
                body = response.data[0] if isinstance(response.data, list) else response.data
                self.assertEqual(body["seller_state"], "OH")

    def test_private_address_parts_are_not_exposed(self):
        body = self.client.get(f"/listing/{self.listing.id}/").content.decode()
        for secret in ("9 Secret Ln", "Dayton", "45402"):
            self.assertNotIn(secret, body)

    def test_blank_state_is_empty_string(self):
        other = make_user("nostate")
        listing = Listing.objects.create(
            user=other, username="nostate", title="Cam", price=50
        )
        response = self.client.get(f"/listing/{listing.id}/")
        self.assertEqual(response.data["seller_state"], "")

    def test_seller_state_is_read_only(self):
        self.client.force_authenticate(self.listing.user)
        self.client.put(
            f"/listing/{self.listing.id}/",
            {"title": "GT40 intake", "price": 100, "seller_state": "CA"},
            format="multipart",
        )
        self.listing.user.profile.refresh_from_db()
        self.assertEqual(self.listing.user.profile.state, "OH")


class WelcomeEmailTests(APITestCase):
    url = "/register/"

    def setUp(self):
        # See RegistrationStateTests.setUp for why this is needed.
        cache.clear()
        # These tests are about the welcome email, not Turnstile; treat
        # every token as verified so they aren't coupled to that check.
        patcher = mock.patch(
            "backend_app.views.verify_turnstile_token",
            return_value=True,
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def register(self, **extra):
        data = {"username": "newbie", "email": "n@example.com", "password": PASSWORD}
        data.update(extra)
        # on_commit callbacks only run in tests when we ask for them.
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(self.url, data)

    def test_welcome_email_sent_to_new_user(self):
        response = self.register()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["n@example.com"])
        self.assertEqual(message.subject, "Welcome to Fox Body Swap Meet")
        self.assertIn("newbie", message.body)
        self.assertIn("/login", message.body)
        html, mimetype = message.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn("newbie", html)

    def test_sender_is_the_noreply_address(self):
        self.register()
        self.assertIn("noreply@foxbodyswapmeet.com", mail.outbox[0].from_email)

    def test_no_email_sent_when_user_has_no_address(self):
        response = self.register(email="")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mail.outbox, [])

    def test_no_email_sent_when_registration_is_invalid(self):
        response = self.register(password="123")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(mail.outbox, [])

    def test_send_failure_does_not_break_registration(self):
        with mock.patch(
            "django.core.mail.message.EmailMessage.send",
            side_effect=RuntimeError("resend is down"),
        ):
            with self.assertLogs("backend_app.emails", "ERROR"):
                response = self.register()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newbie").exists())

    def test_email_is_not_sent_until_commit(self):
        with self.captureOnCommitCallbacks(execute=False) as callbacks:
            self.client.post(
                self.url,
                {"username": "newbie", "email": "n@example.com", "password": PASSWORD},
            )
        self.assertEqual(mail.outbox, [])
        self.assertEqual(len(callbacks), 1)


class RegistrationBotProtectionTests(APITestCase):
    url = "/register/"

    def setUp(self):
        # See RegistrationStateTests.setUp for why this is needed.
        cache.clear()

    def register(self, **extra):
        data = {"username": "newbie", "email": "n@example.com", "password": PASSWORD}
        data.update(extra)
        return self.client.post(self.url, data)

    def test_honeypot_filled_is_rejected(self):
        # Real users never see or fill the "website" field; only a bot that
        # blindly fills every input on the page would send a value here.
        response = self.register(website="http://spammy-example.com")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="newbie").exists())

    def test_honeypot_rejection_message_is_generic(self):
        # A bot shouldn't be able to tell "honeypot tripped" apart from any
        # other validation failure by reading the error message.
        response = self.register(website="http://spammy-example.com")
        messages = [str(m) for m in response.data.get("non_field_errors", [])]
        self.assertEqual(messages, ["Unable to complete registration."])

    def test_missing_turnstile_token_is_rejected(self):
        # No TURNSTILE_SECRET_KEY is configured in the test environment and
        # no token is sent, so this exercises the "fail closed" behavior:
        # verify_turnstile_token isn't mocked at all here.
        response = self.register()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="newbie").exists())

    def test_invalid_turnstile_token_is_rejected(self):
        with mock.patch(
            "backend_app.views.verify_turnstile_token",
            return_value=False,
        ) as verify:
            response = self.register(**{"cf-turnstile-response": "bad-token"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="newbie").exists())
        verify.assert_called_once()

    def test_valid_turnstile_token_allows_registration(self):
        # Simulates Cloudflare's siteverify call succeeding, without making a
        # real network call in the test suite.
        with mock.patch(
            "backend_app.views.verify_turnstile_token",
            return_value=True,
        ):
            response = self.register(**{"cf-turnstile-response": "good-token"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newbie").exists())


class SignupDigestTests(TestCase):
    def run_digest(self, *args):
        out = StringIO()
        call_command("send_signup_digest", *args, stdout=out)
        return out.getvalue()

    def unreported(self):
        return Profile.objects.filter(signup_digest_sent_at__isnull=True)

    def test_new_profiles_are_included_then_stamped(self):
        old = make_user("old_timer")
        Profile.objects.filter(user=old).update(signup_digest_sent_at=timezone.now())
        later = make_user("later")
        earlier = make_user("earlier")
        User.objects.filter(pk=earlier.pk).update(
            date_joined=timezone.now() - timedelta(days=2)
        )

        output = self.run_digest()

        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["sam@foxbodyswapmeet.com"])
        self.assertEqual(message.subject, "Fox Body Swap Meet: 2 new signups this week")
        self.assertNotIn("old_timer", message.body)
        # Oldest first.
        self.assertLess(message.body.index("earlier"), message.body.index("later"))
        self.assertIn("Site totals: 3 accounts, 0 listings", message.body)
        self.assertIn("Sent digest with 2 signups", output)
        self.assertFalse(self.unreported().exists())

        # Already stamped, so the next run reports nobody.
        self.run_digest()
        self.assertEqual(
            mail.outbox[1].subject, "Fox Body Swap Meet: No new signups this week"
        )

    def test_zero_signup_week_still_sends(self):
        output = self.run_digest()
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.subject, "Fox Body Swap Meet: No new signups this week")
        self.assertIn("No new signups since the last digest", message.body)
        self.assertIn("Site totals: 0 accounts, 0 listings", message.body)
        self.assertIn("Sent digest with 0 signups", output)

    def test_activity_counts_filled_fields_and_listings(self):
        busy = make_user("busy", state="TX", city="Austin", bio="Notchback guy")
        busy.first_name = "Bea"
        busy.save()
        for title in ("Hood", "Seats"):
            Listing.objects.create(user=busy, username="busy", title=title, price=100)
        make_user("quiet")

        self.run_digest()

        body = mail.outbox[0].body
        busy_block, quiet_block = body.split("\nbusy\n")[1], body.split("\nquiet\n")[1]
        self.assertIn("State:    TX", busy_block)
        self.assertIn("Profile:  3 of 7 filled (name, city, bio)", busy_block)
        self.assertIn("Listings: 2", busy_block)
        self.assertIn("/admin/auth/user/%d/change/" % busy.pk, busy_block)
        self.assertIn("State:    —", quiet_block)
        self.assertIn("Profile:  not filled in yet", quiet_block)
        self.assertIn("Listings: 0", quiet_block)

    def test_send_failure_stamps_nothing_and_raises(self):
        make_user("newbie")
        with mock.patch(
            "django.core.mail.message.EmailMessage.send",
            side_effect=RuntimeError("resend is down"),
        ):
            with self.assertRaisesMessage(CommandError, "resend is down"):
                self.run_digest()
        self.assertEqual(self.unreported().count(), 1)

    def test_dry_run_sends_and_stamps_nothing(self):
        newbie = make_user("newbie")
        output = self.run_digest("--dry-run")
        self.assertEqual(mail.outbox, [])
        self.assertEqual(self.unreported().count(), 1)
        self.assertIn("newbie", output)
        self.assertIn("would stamp profile ids [%d]" % newbie.profile.pk, output)

    def test_html_in_username_is_escaped(self):
        make_user("<b>bold</b>")
        self.run_digest()
        message = mail.outbox[0]
        html = message.alternatives[0][0]
        self.assertIn("&lt;b&gt;bold&lt;/b&gt;", html)
        self.assertNotIn("<b>bold</b>", html)
        # Plain text isn't rendered as HTML, so it shows the name as typed.
        self.assertIn("<b>bold</b>", message.body)


class RegistrationLoginTests(APITestCase):
    """Registering logs the new user in: /register/ returns /token/'s tokens."""

    url = "/register/"

    def setUp(self):
        # See RegistrationStateTests.setUp for why both are needed.
        cache.clear()
        patcher = mock.patch(
            "backend_app.views.verify_turnstile_token",
            return_value=True,
        )
        self.verify = patcher.start()
        self.addCleanup(patcher.stop)

    def register(self, **extra):
        data = {"username": "newbie", "email": "n@example.com", "password": PASSWORD}
        data.update(extra)
        return self.client.post(self.url, data)

    def test_response_includes_tokens_and_user_info(self):
        response = self.register()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="newbie")
        self.assertEqual(response.data["userId"], user.id)
        self.assertEqual(response.data["username"], "newbie")
        self.assertTrue(response.data["access"])
        self.assertTrue(response.data["refresh"])
        self.assertNotIn("password", response.data)

    def test_access_token_works_on_the_new_users_profile(self):
        data = self.register().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        response = self.client.get(f"/profile/{data['userId']}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_refresh_token_works(self):
        data = self.register().data
        response = self.client.post("/token/refresh/", {"refresh": data["refresh"]})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_failed_registrations_return_no_tokens(self):
        make_user("taken")
        cases = {
            "username taken": ({"username": "taken"}, True),
            "honeypot filled": ({"website": "http://spammy-example.com"}, True),
            "turnstile failed": ({}, False),
        }
        for name, (extra, turnstile_ok) in cases.items():
            with self.subTest(name):
                self.verify.return_value = turnstile_ok
                response = self.register(**extra)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertNotIn("access", response.data)
                self.assertNotIn("refresh", response.data)


class SeedDevDataTests(TestCase):
    def setUp(self):
        # The test runner forces DEBUG off and renames the database, so make
        # the settings look local. The tests still use the test database.
        settings_patch = override_settings(DEBUG=True)
        settings_patch.enable()
        self.addCleanup(settings_patch.disable)
        db_patch = mock.patch.dict(
            connection.settings_dict, {"NAME": "foxbody_local", "HOST": "localhost"}
        )
        db_patch.start()
        self.addCleanup(db_patch.stop)
        # Images go to a throwaway folder, never the real mediafiles/.
        media = tempfile.TemporaryDirectory()
        self.addCleanup(media.cleanup)
        self.media_root = Path(media.name)
        media_patch = override_settings(MEDIA_ROOT=media.name)
        media_patch.enable()
        self.addCleanup(media_patch.disable)

    def run_seed(self, *args):
        out = StringIO()
        call_command("seed_dev_data", *args, stdout=out)
        return out.getvalue()

    def seeded(self):
        return User.objects.filter(email__endswith="@seed.example.com")

    def image_files(self):
        return [p for p in self.media_root.rglob("*") if p.is_file()]

    def assert_refused(self, message):
        with self.assertRaisesMessage(CommandError, message):
            self.run_seed("--users", "2")
        self.assertFalse(self.seeded().exists())

    def test_refuses_a_database_with_another_name(self):
        with mock.patch.dict(connection.settings_dict, {"NAME": "railway"}):
            self.assert_refused("Refusing to seed database 'railway'")

    def test_refuses_a_remote_host(self):
        with mock.patch.dict(connection.settings_dict, {"HOST": "db.example.net"}):
            self.assert_refused("on host 'db.example.net'")

    def test_refuses_with_debug_off(self):
        with override_settings(DEBUG=False):
            self.assert_refused("DEBUG off")

    def test_prints_the_database_first(self):
        first_line = self.run_seed("--users", "2").splitlines()[0]
        self.assertEqual(first_line, "Database: foxbody_local on host: localhost")

    def test_counts_match_the_arguments(self):
        self.run_seed("--users", "6")
        self.assertEqual(self.seeded().count(), 6)
        self.assertEqual(Profile.objects.filter(user__in=self.seeded()).count(), 6)
        listings = Listing.objects.filter(user__in=self.seeded())
        self.assertEqual(len(self.image_files()), listings.count())
        self.assertEqual(listings.filter(user__username="seed_demo").count(), 6)
        for listing in listings:
            self.assertEqual(listing.username, listing.user.username)

    def test_seeded_users_can_log_in(self):
        self.run_seed("--users", "2")
        self.assertTrue(
            self.client.login(username="seed_demo", password=seed_data.SEED_PASSWORD)
        )

    def test_same_seed_gives_the_same_users(self):
        self.run_seed("--users", "6", "--seed", "7")
        first = sorted(self.seeded().values_list("username", flat=True))
        self.run_seed("--users", "6", "--seed", "7", "--flush")
        self.assertEqual(first, sorted(self.seeded().values_list("username", flat=True)))

    def test_digest_stamp_is_set_unless_unstamped(self):
        self.run_seed("--users", "2")
        profiles = Profile.objects.filter(user__in=self.seeded())
        self.assertFalse(profiles.filter(signup_digest_sent_at__isnull=True).exists())
        self.run_seed("--users", "2", "--unstamped", "--flush")
        self.assertFalse(profiles.filter(signup_digest_sent_at__isnull=False).exists())

    def test_rerun_without_flush_is_blocked(self):
        self.run_seed("--users", "3")
        with self.assertRaisesMessage(CommandError, "--flush"):
            self.run_seed("--users", "3")
        self.assertEqual(self.seeded().count(), 3)

    def test_taken_username_is_reported(self):
        make_user("seed_demo")
        with self.assertRaisesMessage(CommandError, "already taken: seed_demo"):
            self.run_seed("--users", "2")

    def test_flush_only_removes_seeded_data_and_files(self):
        self.run_seed("--users", "3")
        self.run_seed("--flush-only")
        self.assertFalse(self.seeded().exists())
        self.assertFalse(Listing.objects.exists())
        self.assertFalse(Cart.objects.exists())
        self.assertEqual(self.image_files(), [])

    def test_flush_leaves_other_users_alone(self):
        # alice is @example.com, the closest thing to the seed's own domain.
        alice = make_user("alice")
        self.assertEqual(alice.email, "alice@example.com")
        listing = Listing.objects.create(user=alice, username="alice", title="Hood", price=1)
        cart = Cart.objects.create(user_id=alice, cart_item="Hood", price=1)
        self.run_seed("--users", "3")
        self.run_seed("--flush-only")
        self.assertTrue(User.objects.filter(pk=alice.pk).exists())
        self.assertTrue(Listing.objects.filter(pk=listing.pk).exists())
        self.assertTrue(Cart.objects.filter(pk=cart.pk).exists())

    def test_failure_partway_leaves_no_rows_or_files(self):
        original = SeedCommand.attach_image
        calls = []

        def fail_on_third(command, *args):
            calls.append(1)
            if len(calls) == 3:
                raise RuntimeError("boom")
            return original(command, *args)

        with mock.patch.object(SeedCommand, "attach_image", fail_on_third):
            with self.assertRaises(RuntimeError):
                self.run_seed("--users", "3")
        self.assertFalse(self.seeded().exists())
        self.assertEqual(self.image_files(), [])

    def test_failed_reseed_keeps_the_old_data_and_files(self):
        self.run_seed("--users", "3")
        before = sorted(self.image_files())
        with mock.patch.object(
            SeedCommand, "seed_carts", side_effect=RuntimeError("boom")
        ):
            with self.assertRaises(RuntimeError):
                self.run_seed("--users", "3", "--flush")
        self.assertEqual(self.seeded().count(), 3)
        self.assertEqual(sorted(self.image_files()), before)

    def test_cart_items_never_come_from_the_buyers_own_listings(self):
        buyer, seller = make_user("buyer"), make_user("seller")
        mine = Listing.objects.create(user=buyer, title="Mine", price=1)
        theirs = Listing.objects.create(user=seller, title="Theirs", price=1)
        SeedCommand().seed_carts(
            random.Random(1), [(buyer, "full"), (seller, "full")], [mine, theirs]
        )
        titles = Cart.objects.filter(user_id=buyer).values_list("cart_item", flat=True)
        self.assertEqual(list(titles), ["Theirs"])

    def test_catalog_fits_the_models(self):
        self.assertEqual(len(seed_data.LONGEST_BIO), 400)
        for bio in seed_data.BIOS:
            self.assertLessEqual(len(bio), 400)
        cart_title_limit = Cart._meta.get_field("cart_item").max_length
        for category, _label, title, price, description in seed_data.LISTINGS:
            self.assertIn(category, seed_data.CATEGORY_COLORS)
            self.assertLessEqual(len(title), cart_title_limit)
            self.assertLessEqual(len(description), 250)
            self.assertIsInstance(price, int)
