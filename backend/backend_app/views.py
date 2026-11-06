import os
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.db.models.functions import Lower
from django.shortcuts import render
from rest_framework import generics, mixins
from rest_framework.decorators import action
from rest_framework import status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import (
    RefreshToken,
    OutstandingToken,
    BlacklistedToken,
)
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.throttling import ScopedRateThrottle
from .emails import send_welcome_email
from .filters import ListingFilter
from .models import Brand, Cart, Listing, Profile
from .pagination import ListingPagination
from .turnstile import verify_turnstile_token

from .serializers import (
    BrandSerializer,
    BrandSuggestionSerializer,
    ProfileSerializer,
    TokenObtainPairSerializer,
    UserSerializer,
    ListingSerializer,
    CartSerializer,
    CustomTokenObtainPairSerializer,
)

import boto3
from rest_framework.exceptions import ValidationError


# Create your views here.


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission: only the owner may modify; reads are open."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class CartViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Cart.objects.all()  # used only for router basename; see get_queryset
    serializer_class = CartSerializer
    lookup_field = "user_id"
    # parser_classes = JSONParser

    def get_queryset(self):
        return Cart.objects.filter(user_id=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user)


class CartDeleteViewSet(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_queryset(self):
        return Cart.objects.filter(user_id=self.request.user)



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


def check_image_moderation(image_file):
    """
    Sends image to AWS Rekognition for content moderation.
    Raises ValidationError if inappropriate content is detected.
    Skipped when SKIP_IMAGE_MODERATION=true (local dev without AWS credentials).
    """
    if os.environ.get("SKIP_IMAGE_MODERATION", "").lower() == "true":
        return

    client = boto3.client('rekognition', region_name='us-east-1')
    
    image_bytes = image_file.read()
    image_file.seek(0)  # Reset file pointer after reading
    
    response = client.detect_moderation_labels(
        Image={'Bytes': image_bytes},
        MinConfidence=75
    )
    
    if response['ModerationLabels']:
        labels = [label['Name'] for label in response['ModerationLabels']]
        raise ValidationError(
            f"Image contains inappropriate content and cannot be uploaded."
        )

# A cap rather than a rate limit: it can't be waited out, so one account can
# never leave more than this for an admin to review. It needs no cache, and it
# frees up as soon as a suggestion is approved or merged.
MAX_PENDING_BRANDS_PER_USER = 5


class BrandViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = BrandSerializer
    # A small list that the forms and filters want in full.
    pagination_class = None
    # Sorted here because annotate() drops the model's default ordering, and by
    # Lower so "MSD" doesn't land ahead of "Motorcraft".
    queryset = (
        Brand.objects.filter(is_approved=True)
        .annotate(listing_count=Count("listings"))
        .order_by(Lower("name"))
    )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def suggest(self, request):
        suggestion = BrandSuggestionSerializer(data=request.data)
        suggestion.is_valid(raise_exception=True)
        name = suggestion.validated_data["name"]

        existing = Brand.objects.filter(name__iexact=name).first()
        if existing:
            return Response(BrandSerializer(existing).data)

        pending = Brand.objects.filter(
            created_by=request.user, is_approved=False
        ).count()
        if pending >= MAX_PENDING_BRANDS_PER_USER:
            raise ValidationError(
                {
                    "name": "You have several brands waiting for approval. "
                    "Please wait for those, or leave the brand blank for now."
                }
            )

        try:
            # Its own transaction, so a lost race can still query afterward.
            with transaction.atomic():
                brand = Brand.objects.create(
                    name=name, is_approved=False, created_by=request.user
                )
        except IntegrityError:
            # Someone added the same name in the moment since the check above.
            return Response(BrandSerializer(Brand.objects.get(name__iexact=name)).data)
        return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)


class ListingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    # A fixed order, with id as the tie-breaker. Without one, the database can
    # return rows in a different order per query, so a listing could appear on
    # two pages, or on none.
    queryset = Listing.objects.select_related("user__profile", "brand").order_by(
        "-bumped_at", "-id"
    )
    serializer_class = ListingSerializer
    pagination_class = ListingPagination
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [DjangoFilterBackend]
    filterset_class = ListingFilter

    def perform_create(self, serializer):
        image = self.request.FILES.get('image_url')
        if image:
            check_image_moderation(image)
        # One timestamp for both: separate model defaults would differ by
        # microseconds, and a listing starts out never bumped.
        now = timezone.now()
        serializer.save(
            user=self.request.user,
            username=self.request.user.username,
            created_at=now,
            bumped_at=now,
        )

    def perform_update(self, serializer):
        image = self.request.FILES.get('image_url')
        if image:
            check_image_moderation(image)
        serializer.save()


def _client_ip(request):
    # Same single-proxy assumption as NUM_PROXIES in settings.py: Railway's
    # proxy sets X-Forwarded-For to just the real client IP.
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


class RegisterView(APIView):
    # Scoped to "registration" only — doesn't touch any other endpoint's
    # throttling, since there's no DEFAULT_THROTTLE_CLASSES globally.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "registration"

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verified after the honeypot/field checks above (cheap, local) but
        # before saving the user — fail closed, so any Turnstile problem
        # (bad token, network error, missing key) blocks the signup rather
        # than letting it through.
        token = request.data.get("cf-turnstile-response", "")
        if not verify_turnstile_token(token, remote_ip=_client_ip(request)):
            raise ValidationError("Unable to complete registration.")

        user = serializer.save()
        # After commit, so we never email someone whose signup rolled back.
        # send_welcome_email swallows and logs its own errors.
        transaction.on_commit(lambda: send_welcome_email(user))

        # Log the new user straight in: return the same tokens /token/ would,
        # built by the same serializer so any custom claims stay identical.
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        data = {
            **serializer.data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "userId": user.id,
            "username": user.username,
        }
        return Response(data, status=status.HTTP_201_CREATED)


class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.all()  # used only for router basename; see get_queryset
    serializer_class = ProfileSerializer
    lookup_field = "user_id"
    lookup_url_kwarg = "user_id"

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
