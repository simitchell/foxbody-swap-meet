from .models import US_STATES, Brand, Cart, Listing, Profile, User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class CartSerializer(serializers.ModelSerializer):
    # user_id = serializers.ReadOnlyField(source="user.id")
    # image_url = serializers.ImageField(required=True)

    class Meta:
        model = Cart
        fields = ["id", "user_id", "cart_item", "image_url", "price", "condition"]
        read_only_fields = ["user_id"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["userId"] = self.user.id
        data["username"] = self.user.username
        data["name"] = self.user.first_name + " " + self.user.last_name
        return data


class BrandSerializer(serializers.ModelSerializer):
    # Only on the brand list, which annotates it.
    listing_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Brand
        fields = ["slug", "name", "is_approved", "listing_count"]


class BrandSuggestionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=Brand._meta.get_field("name").max_length)

    def validate_name(self, value):
        # "Trick   Flow" and "Trick Flow" are the same brand.
        return " ".join(value.split())


class ListingSerializer(serializers.ModelSerializer):
    image_url = serializers.ImageField(required=False)
    # Written by slug, like the filter and the URLs. Blank clears it. Any existing
    # brand is accepted, pending ones too: /brands/suggest/ hands back a pending
    # brand to anyone who types its name, so a seller has to be able to use it.
    brand = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Brand.objects.all(),
        allow_null=True,
        required=False,
        error_messages={"does_not_exist": "Choose a brand from the list."},
    )
    brand_name = serializers.CharField(
        source="brand.name", read_only=True, allow_null=True
    )
    # Public on purpose: a coarse "where is this seller" signal for meetups.
    seller_state = serializers.SerializerMethodField()
    category_label = serializers.CharField(
        source="get_category_display", read_only=True
    )
    fits_label = serializers.CharField(source="get_fits_display", read_only=True)

    # Sellers must choose these to save, even when editing an older listing
    # that has neither set.
    REQUIRED_CHOICE_MESSAGES = {
        "category": "Choose a category.",
        "fits": "Choose which cars it fits.",
    }
    # Only the listing's owner gets these in the response.
    OWNER_ONLY_FIELDS = ["created_at", "bumped_at"]

    class Meta:
        model = Listing
        fields = [
            "id",
            "user",
            "username",
            "title",
            "price",
            "description",
            "image_url",
            "condition",
            "brand",
            "brand_name",
            "category",
            "category_label",
            "fits",
            "fits_label",
            "created_at",
            "bumped_at",
            "seller_state",
        ]
        read_only_fields = ["user", "username", "created_at", "bumped_at"]
        extra_kwargs = {
            "category": {
                "error_messages": {"invalid_choice": "Choose a valid category."}
            },
            "fits": {
                "error_messages": {
                    "invalid_choice": "Choose a valid option for which cars it fits."
                }
            },
        }

    def get_seller_state(self, obj):
        profile = getattr(obj.user, "profile", None)
        return profile.state if profile else ""

    def validate(self, attrs):
        # A PATCH may leave a field out, so check the value the listing would
        # end up with: the incoming one, or else what's already saved.
        errors = {
            field: message
            for field, message in self.REQUIRED_CHOICE_MESSAGES.items()
            if not attrs.get(field, getattr(self.instance, field, ""))
        }
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = request.user if request else None
        # is_authenticated matters: a listing's user can be null, and an
        # anonymous visitor's pk is None too, so None == None would match.
        is_owner = (
            user is not None
            and user.is_authenticated
            and user.pk == instance.user_id
        )
        if not is_owner:
            for field in self.OWNER_ONLY_FIELDS:
                data.pop(field, None)
        return data


class ProfileSerializer(serializers.ModelSerializer):
    # Names live on Django's built-in User, not Profile; exposed here so the
    # profile page can read and edit them in one request.
    first_name = serializers.CharField(
        source="user.first_name", max_length=150, required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        source="user.last_name", max_length=150, required=False, allow_blank=True
    )
    # Year the account was created; set by Django, so users can't change it.
    member_since = serializers.IntegerField(
        source="user.date_joined.year", read_only=True
    )

    class Meta:
        model = Profile
        fields = [
            "id",
            "user_id",
            "first_name",
            "last_name",
            "member_since",
            "bio",
            "street",
            "city",
            "state",
            "zip_code",
            "birthdate",
            "enthusiast_since",
        ]
        read_only_fields = ["user_id"]
        lookup_field = "user_id"

    def update(self, instance, validated_data):
        # DRF collects the "user.*" fields into a nested dict; save those on
        # the User and let the default update handle the Profile fields.
        user_data = validated_data.pop("user", {})
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save(update_fields=list(user_data))
        return super().update(instance, validated_data)


class UserSerializer(serializers.ModelSerializer):
    # profile = ProfileSerializer()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    # Optional at signup; saved to the auto-created Profile.
    state = serializers.ChoiceField(
        choices=US_STATES, required=False, allow_blank=True, write_only=True
    )
    # Honeypot: real users never see or fill this (hidden via CSS on the
    # frontend). Bots that auto-fill every field trip it. Not a model field —
    # popped in validate() and never saved.
    website = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )

    class Meta:
        model = User
        fields = ["id", "email", "username", "password", "state", "website"]

    def validate(self, attrs):
        # Generic message so a bot can't distinguish "honeypot tripped" from
        # any other validation failure.
        if attrs.pop("website", ""):
            raise serializers.ValidationError("Unable to complete registration.")
        return attrs

    def create(self, validated_data):
        state = validated_data.pop("state", "")
        validated_data["password"] = make_password(validated_data["password"])
        user = super().create(validated_data)
        if state:
            user.profile.state = state
            user.profile.save(update_fields=["state"])
        return user
