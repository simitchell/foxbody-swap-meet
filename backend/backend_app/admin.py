from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count
from django.template.response import TemplateResponse
from .models import Brand, Cart, Listing, Profile


# Shows a user's Profile fields on the User edit page in the admin.
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


class CustomUserAdmin(UserAdmin):
    inlines = [ProfileInline]

    # The post_save signal creates the Profile when a User is added, so only
    # show the inline when editing an existing user. Otherwise the inline would
    # try to create a second Profile and fail.
    def get_inline_instances(self, request, obj=None):
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)


class MergeBrandsForm(forms.Form):
    keep = forms.ModelChoiceField(
        queryset=Brand.objects.all(), label="Brand to keep", empty_label="Choose a brand"
    )


class BrandAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "is_approved",
        "listing_count",
        "created_by",
        "created_at",
    ]
    list_filter = ["is_approved"]
    # ListingAdmin's autocomplete searches through this too.
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    actions = ["approve_brands", "merge_brands"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(listing_count=Count("listings"))

    @admin.display(description="Listings", ordering="listing_count")
    def listing_count(self, brand):
        return brand.listing_count

    @admin.action(description="Approve selected brands")
    def approve_brands(self, request, queryset):
        # order_by() and values("pk"): the annotated queryset can't be updated.
        approved = Brand.objects.filter(
            pk__in=queryset.order_by().values("pk")
        ).update(is_approved=True)
        self.message_user(request, f"Approved {approved} brand(s).", messages.SUCCESS)

    # An action normally runs as soon as it's chosen. Returning a page instead
    # shows that page; its form posts the same action back with "apply" added, so
    # this runs a second time and does the merge.
    @admin.action(description="Merge into…")
    def merge_brands(self, request, queryset):
        form = MergeBrandsForm(request.POST if "apply" in request.POST else None)
        if form.is_valid():
            keep = form.cleaned_data["keep"]
            folded_in = Brand.objects.filter(
                pk__in=queryset.order_by().values("pk")
            ).exclude(pk=keep.pk)
            count = folded_in.count()
            if count == 0:
                self.message_user(
                    request, "Nothing to merge: only the kept brand was selected.",
                    messages.WARNING,
                )
                return None
            # All or nothing, so a failure can't leave listings moved but the
            # old brands still there.
            with transaction.atomic():
                moved = Listing.objects.filter(brand__in=folded_in).update(brand=keep)
                folded_in.delete()
            self.message_user(
                request,
                f"Merged {count} brand(s) into {keep.name} and moved {moved} listing(s).",
                messages.SUCCESS,
            )
            if not keep.is_approved:
                self.message_user(
                    request,
                    f"{keep.name} is still pending, so it won't appear in the "
                    "brand list or Browse filter until you approve it.",
                    messages.WARNING,
                )
            return None

        context = {
            **self.admin_site.each_context(request),
            "title": "Merge brands",
            "brands": queryset,
            "form": form,
            "selected_ids": [brand.pk for brand in queryset],
        }
        return TemplateResponse(
            request, "admin/backend_app/brand/merge_brands.html", context
        )


class ListingAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "username",
        "price",
        "brand",
        "category",
        "fits",
        "created_at",
        "bumped_at",
    ]
    list_filter = ["category", "fits", "brand"]
    readonly_fields = ["created_at"]
    autocomplete_fields = ["brand"]
    list_select_related = ["brand"]


# Register your models here.
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Brand, BrandAdmin)
admin.site.register(Listing, ListingAdmin)
admin.site.register(Profile)
admin.site.register(Cart)
