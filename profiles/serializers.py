from rest_framework import serializers
from .models import (
    InvestmentProfile, Business, BusinessMileStone,
    InvestmentRequest, Investment, Community,
    JobPosting, JobApplication
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


class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = '__all__'


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = '__all__'
