# api/urls.py

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import PublicFounderSubmitAPIView, PublicInvestorSubmitAPIView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('submit/founder/', PublicFounderSubmitAPIView.as_view(), name='submit_founder'),
    path('submit/investor/', PublicInvestorSubmitAPIView.as_view(), name='submit_investor'),
]