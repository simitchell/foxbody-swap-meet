from django.db import migrations
from django.utils.text import slugify

# The starting list. Add more through the admin, not here.
BRANDS = [
    "Aeromotive",
    "Anderson Ford Motorsport",
    "B&M",
    "Baer",
    "BBK",
    "Bilstein",
    "Canton",
    "Cervini's",
    "Edelbrock",
    "Flowmaster",
    "Ford (OEM)",
    "Ford Performance / Ford Racing",
    "Griggs Racing",
    "Holley",
    "Hurst",
    "Kooks",
    "Koni",
    "Latemodel Restoration (LMR)",
    "Lund Racing",
    "MAC",
    "Maximum Motorsports",
    "McLeod",
    "Moser",
    "Motorcraft",
    "MSD",
    "Paxton",
    "Pro 5.0",
    "Pro-M",
    "Saleen",
    "SPEC",
    "Steeda",
    "Strange",
    "Tremec",
    "Trick Flow",
    "UPR",
    "Vortech",
    "Wilwood",
]


def seed_brands(apps, schema_editor):
    # apps.get_model gives a plain historical model without Brand.save(), so the
    # slug has to be set here.
    Brand = apps.get_model("backend_app", "Brand")
    for name in BRANDS:
        Brand.objects.get_or_create(
            name__iexact=name,
            defaults={"name": name, "slug": slugify(name), "is_approved": True},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("backend_app", "0037_brand_listing_brand"),
    ]

    operations = [
        migrations.RunPython(seed_brands, migrations.RunPython.noop),
    ]
