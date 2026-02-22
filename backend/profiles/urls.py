from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InvestmentProfileViewSet, BusinessViewSet, BusinessMileStoneViewSet,
    InvestmentRequestViewSet, InvestmentViewSet, CommunityViewSet,
    CommunityPostViewSet,
    JobPostingViewSet, JobApplicationViewSet,
    FamilyMemberViewSet,
    EventViewSet, EventRegistrationViewSet, EventReminderViewSet,
    ConnectionViewSet, ChannelViewSet, ChannelProgressUpdateViewSet, ChannelMessageViewSet,
    FounderListViewSet,
    TestimonialViewSet, ContactMessageViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'founders', FounderListViewSet, basename='founder')
router.register(r'investment-profiles', InvestmentProfileViewSet)
router.register(r'businesses', BusinessViewSet)
router.register(r'milestones', BusinessMileStoneViewSet)
router.register(r'investment-requests', InvestmentRequestViewSet)
router.register(r'investments', InvestmentViewSet)
router.register(r'communities', CommunityViewSet)
router.register(r'community-posts', CommunityPostViewSet, basename='community-post')
router.register(r'events', EventViewSet, basename='event')
router.register(r'event-registrations', EventRegistrationViewSet, basename='event-registration')
router.register(r'event-reminders', EventReminderViewSet, basename='event-reminder')
router.register(r'job-postings', JobPostingViewSet)
router.register(r'job-applications', JobApplicationViewSet)
router.register(r'family-members', FamilyMemberViewSet, basename='family-member')
router.register(r'connections', ConnectionViewSet, basename='connection')
router.register(r'channels', ChannelViewSet, basename='channel')
router.register(r'channel-progress', ChannelProgressUpdateViewSet, basename='channel-progress')
router.register(r'channel-messages', ChannelMessageViewSet, basename='channel-messages')
router.register(r'testimonials', TestimonialViewSet, basename='testimonial')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-message')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
