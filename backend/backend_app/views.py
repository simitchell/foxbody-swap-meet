import os
from django.db import transaction
from django.shortcuts import render
from rest_framework import generics
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
from rest_framework import status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.throttling import ScopedRateThrottle
from .emails import send_welcome_email
from .models import Cart, Listing, Profile
from .turnstile import verify_turnstile_token

from .serializers import (
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

class ListingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    queryset = Listing.objects.select_related("user__profile")
    serializer_class = ListingSerializer
    parser_classes = (MultiPartParser, FormParser)
    search_fields = ["title"]
    filter_backends = [SearchFilter, OrderingFilter]

    def perform_create(self, serializer):
        image = self.request.FILES.get('image_url')
        if image:
            check_image_moderation(image)
        serializer.save(
            user=self.request.user, username=self.request.user.username
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
