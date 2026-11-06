from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Cart, Listing, Profile


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


class ListingAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "username",
        "price",
        "category",
        "fits",
        "created_at",
        "bumped_at",
    ]
    list_filter = ["category", "fits"]
    readonly_fields = ["created_at"]


# Register your models here.
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Listing, ListingAdmin)
admin.site.register(Profile)
admin.site.register(Cart)
