from rest_framework import serializers
from accounts.models import CustomUser
from .models import (
    InvestmentProfile, Business, BusinessMileStone,
    InvestmentRequest, Investment, Community,
    CommunityPost,
    JobPosting, JobApplication,
    Connection, Channel, ChannelMember, ChannelProgressUpdate, ChannelMessage,
    FamilyMember,
    Event, EventRegistration, EventReminder, EventParticipant
)


class InvestmentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentProfile
        fields = '__all__'


class BusinessMileStoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessMileStone
        fields = '__all__'


class BusinessSerializer(serializers.ModelSerializer):
    milestones = BusinessMileStoneSerializer(many=True, read_only=True)

    class Meta:
        model = Business
        fields = '__all__'


class InvestmentRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentRequest
        fields = '__all__'


class InvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = '__all__'


class CommunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = '__all__'


class CommunityPostSerializer(serializers.ModelSerializer):
    author_detail = UserBriefSerializer(source='author', read_only=True)

    class Meta:
        model = CommunityPost
        fields = '__all__'


class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = '__all__'


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = '__all__'


# Connection & Channel serializers

class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'photo']


class ConnectionSerializer(serializers.ModelSerializer):
    investor_detail = UserBriefSerializer(source='investor', read_only=True)
    founder_detail = UserBriefSerializer(source='founder', read_only=True)

    class Meta:
        model = Connection
        fields = '__all__'


class ChannelMemberSerializer(serializers.ModelSerializer):
    user_detail = UserBriefSerializer(source='user', read_only=True)

    class Meta:
        model = ChannelMember
        fields = '__all__'


class ChannelSerializer(serializers.ModelSerializer):
    founder_detail = UserBriefSerializer(source='founder', read_only=True)
    investor_detail = UserBriefSerializer(source='investor', read_only=True)
    members = ChannelMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Channel
        fields = '__all__'


class ChannelProgressUpdateSerializer(serializers.ModelSerializer):
    posted_by_detail = UserBriefSerializer(source='posted_by', read_only=True)

    class Meta:
        model = ChannelProgressUpdate
        fields = '__all__'


class ChannelMessageSerializer(serializers.ModelSerializer):
    sender_detail = UserBriefSerializer(source='sender', read_only=True)

    class Meta:
        model = ChannelMessage
        fields = '__all__'


# Family members (Phase 4)

class FamilyMemberSerializer(serializers.ModelSerializer):
    profile_link_detail = UserBriefSerializer(source='profile_link', read_only=True)

    class Meta:
        model = FamilyMember
        fields = '__all__'


# Events (Phase 6)

class EventSerializer(serializers.ModelSerializer):
    created_by_detail = UserBriefSerializer(source='created_by', read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    registration_count = serializers.SerializerMethodField()
    slots_available = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_registration_count(self, obj):
        return obj.registrations.count()

    def get_slots_available(self, obj):
        if obj.max_slots is None:
            return None
        return max(0, obj.max_slots - obj.registrations.count())


class EventRegistrationSerializer(serializers.ModelSerializer):
    user_detail = UserBriefSerializer(source='user', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventRegistration
        fields = '__all__'


class EventReminderSerializer(serializers.ModelSerializer):
    user_detail = UserBriefSerializer(source='user', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventReminder
        fields = '__all__'


class EventParticipantSerializer(serializers.ModelSerializer):
    user_detail = UserBriefSerializer(source='user', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventParticipant
        fields = '__all__'
