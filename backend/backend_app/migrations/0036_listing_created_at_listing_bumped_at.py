from datetime import timedelta

from django.db import migrations, models
from django.utils import timezone


def spread_bumped_at(apps, schema_editor):
    """Give existing listings distinct times, with older ids sorting lower."""
    Listing = apps.get_model("backend_app", "Listing")
    now = timezone.now()
    listings = list(Listing.objects.order_by("-id").only("id"))
    for position, listing in enumerate(listings):
        listing.bumped_at = now - timedelta(seconds=5 * position)
    Listing.objects.bulk_update(listings, ["bumped_at"], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("backend_app", "0035_listing_category_listing_fits"),
    ]

    operations = [
        # Added without a default so existing rows stay null: their real posting
        # dates were never recorded, and we don't invent them.
        migrations.AddField(
            model_name="listing",
            name="created_at",
            field=models.DateTimeField(blank=True, editable=False, null=True),
        ),
        # Only affects new rows from here on; no existing row changes.
        migrations.AlterField(
            model_name="listing",
            name="created_at",
            field=models.DateTimeField(
                blank=True, default=timezone.now, editable=False, null=True
            ),
        ),
        migrations.AddField(
            model_name="listing",
            name="bumped_at",
            field=models.DateTimeField(db_index=True, default=timezone.now),
        ),
        migrations.RunPython(spread_bumped_at, migrations.RunPython.noop),
    ]
