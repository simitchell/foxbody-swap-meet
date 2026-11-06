"""
URL configuration for backend_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from rest_framework import routers
from backend_app.views import CustomTokenObtainPairView
from backend_app.views import LogoutView
from backend_app import views
from rest_framework_simplejwt import views as jwt_views
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from backend_app.views import CartDeleteViewSet

router = routers.DefaultRouter()
# router.register()
router.register(r"brands", views.BrandViewSet)
router.register(r"cart", views.CartViewSet),
router.register(r"listing", views.ListingViewSet)
router.register(r"profile", views.ProfileViewSet)
# router.register(r"logout", views.LogoutView)

urlpatterns = [
    path("", include(router.urls)),
    path("admin/", admin.site.urls),
    path("hijack/", include("hijack.urls")),
    # path("api/users/", include("users.urls")),
    # path("api/", include("commerce.urls")),
    path("cart/item/<int:pk>/", CartDeleteViewSet.as_view(), name="cart-delete"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # path("logout_all/", LogoutAllView.as_view(), name="auth_logout_all"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += staticfiles_urlpatterns()
