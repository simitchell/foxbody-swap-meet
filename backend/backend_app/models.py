import uuid
from datetime import date
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


# lets us explicitly set upload path and filename
def upload_to(instance, filename):
    ext = filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    return f"images/{unique_filename}"


CONDITION_CHOICES = [
    ("new", "New"),
    ("great", "Great"),
    ("good", "Good"),
    ("fair", "Fair"),
]


# The value on the left is what's stored; the label is only for display, so a
# label can be reworded without touching any data. Blank means "Not set".
class Category(models.TextChoices):
    ENGINE = "engine", "Engine"
    DRIVETRAIN = "drivetrain", "Drivetrain"
    SUSPENSION_BRAKES = "suspension_brakes", "Suspension & Brakes"
    EXTERIOR = "exterior", "Exterior"
    INTERIOR = "interior", "Interior"
    WHEELS_TIRES = "wheels_tires", "Wheels & Tires"
    OTHER = "other", "Other"


class Fits(models.TextChoices):
    FOUR_EYE = "four_eye", "Four-eye ('79–'86)"
    AERO = "aero", "Aero ('87–'93)"
    ALL = "all", "All Fox Bodies ('79–'93)"


# Create your models here.
class Cart(models.Model):
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True
    )
    cart_item = models.CharField(max_length=100)
    image_url = models.CharField(blank=True, null=True)
    price = models.IntegerField(null=True)
    condition = models.CharField(
        max_length=10,
        choices=CONDITION_CHOICES,
        default="good",
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return self.cart_item


class Listing(models.Model):
    username = models.CharField(null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True
    )
    title = models.CharField(null=True)
    price = models.IntegerField(null=True)
    image_url = models.ImageField(upload_to=upload_to, blank=True, null=True)
    description = models.TextField(null=True)
    condition = models.CharField(
        max_length=10,
        choices=CONDITION_CHOICES,
        default="good",
        null=True,
        blank=True,
    )
    category = models.CharField(
        max_length=20, choices=Category.choices, blank=True, default=""
    )
    fits = models.CharField(
        max_length=10, choices=Fits.choices, blank=True, default=""
    )
    # When the listing was first posted. Never changes. Null means it was posted
    # before we recorded dates.
    created_at = models.DateTimeField(
        null=True, blank=True, default=timezone.now, editable=False
    )
    # What "Newest" sorts by. A future paid bump sets this to now, moving the
    # listing back to the top without rewriting its real age.
    bumped_at = models.DateTimeField(default=timezone.now, db_index=True)

    def __str__(self) -> str:
        return self.title


US_STATES = [
    ("AL", "Alabama"), ("AK", "Alaska"), ("AZ", "Arizona"), ("AR", "Arkansas"),
    ("CA", "California"), ("CO", "Colorado"), ("CT", "Connecticut"),
    ("DE", "Delaware"), ("DC", "District of Columbia"), ("FL", "Florida"),
    ("GA", "Georgia"), ("HI", "Hawaii"), ("ID", "Idaho"), ("IL", "Illinois"),
    ("IN", "Indiana"), ("IA", "Iowa"), ("KS", "Kansas"), ("KY", "Kentucky"),
    ("LA", "Louisiana"), ("ME", "Maine"), ("MD", "Maryland"),
    ("MA", "Massachusetts"), ("MI", "Michigan"), ("MN", "Minnesota"),
    ("MS", "Mississippi"), ("MO", "Missouri"), ("MT", "Montana"),
    ("NE", "Nebraska"), ("NV", "Nevada"), ("NH", "New Hampshire"),
    ("NJ", "New Jersey"), ("NM", "New Mexico"), ("NY", "New York"),
    ("NC", "North Carolina"), ("ND", "North Dakota"), ("OH", "Ohio"),
    ("OK", "Oklahoma"), ("OR", "Oregon"), ("PA", "Pennsylvania"),
    ("RI", "Rhode Island"), ("SC", "South Carolina"), ("SD", "South Dakota"),
    ("TN", "Tennessee"), ("TX", "Texas"), ("UT", "Utah"), ("VT", "Vermont"),
    ("VA", "Virginia"), ("WA", "Washington"), ("WV", "West Virginia"),
    ("WI", "Wisconsin"), ("WY", "Wyoming"),
]

zip_code_validator = RegexValidator(
    r"^\d{5}(-\d{4})?$", "Enter a ZIP code like 12345 or 12345-6789."
)

# The Fox body platform debuted with the 1979 model year.
FOX_BODY_FIRST_YEAR = 1979


# A function (not a fixed number) so the upper limit moves with the calendar.
def current_year():
    return date.today().year


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # street/city/zip_code are private to the user; state is shown publicly on
    # their listings (see ListingSerializer.seller_state).
    street = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=2, blank=True, choices=US_STATES)
    zip_code = models.CharField(
        max_length=10, blank=True, validators=[zip_code_validator]
    )
    bio = models.TextField(max_length=400, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    enthusiast_since = models.PositiveSmallIntegerField(
        "Fox body enthusiast since",
        null=True,
        blank=True,
        validators=[
            MinValueValidator(FOX_BODY_FIRST_YEAR),
            MaxValueValidator(current_year),
        ],
    )
    # Internal: set when this account has been reported in the weekly signup
    # digest (see the send_signup_digest command). Null means "not reported yet".
    signup_digest_sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.username


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
