from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InvestmentProfileViewSet, BusinessViewSet, BusinessMileStoneViewSet,
    InvestmentRequestViewSet, InvestmentViewSet, CommunityViewSet,
    JobPostingViewSet, JobApplicationViewSet
)

router = DefaultRouter()
router.register(r'investment-profiles', InvestmentProfileViewSet)
router.register(r'businesses', BusinessViewSet)
router.register(r'milestones', BusinessMileStoneViewSet)
router.register(r'investment-requests', InvestmentRequestViewSet)
router.register(r'investments', InvestmentViewSet)
router.register(r'communities', CommunityViewSet)
router.register(r'job-postings', JobPostingViewSet)
router.register(r'job-applications', JobApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
