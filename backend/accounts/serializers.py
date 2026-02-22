from rest_framework import serializers
from django.contrib import auth
from rest_framework.exceptions import AuthenticationFailed, NotAcceptable
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse

from accounts.models import CustomUser
from .utils import Util
import requests
from profiles.serializers import (
    BusinessSerializer, InvestmentProfileSerializer,
    JobApplicationSerializer, CommunitySerializer,
    FamilyMemberSerializer
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        max_length=60, min_length=6, write_only=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'full_name', 'password', 'id', 'phone', 'address', 'location', 'postal_code']

    def validate(self, attrs):
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(
            email=validated_data.get('email'),
            full_name=validated_data.get('full_name', ''),
            password=password
        )
        for field in ['phone', 'address', 'location', 'postal_code']:
            if field in validated_data and validated_data.get(field):
                setattr(user, field, validated_data[field])
        user.save()
        return user


class EmailVerificationSerializer(serializers.ModelSerializer):
    token = serializers.CharField(max_length=555)

    class Meta:
        model = CustomUser
        fields = ['token']


class LoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255, min_length=3)
    password = serializers.CharField(
        max_length=58, min_length=6, write_only=True)
    full_name = serializers.CharField(max_length=255, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'password',]

    def validate(self, attrs):
        email = attrs.get('email', '')
        password = attrs.get('password', '')

        user = auth.authenticate(email=email, password=password)
        if not user:
            raise NotAcceptable("Email or Password Incorrect, try again")
        if not user.is_active:
            raise NotAcceptable("Account Disabled, contact admin")
        if not user.is_verified:
            raise NotAcceptable("Email is not verified.")
        return {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'tokens': user.tokens()
        }


class ResetPasswordWithEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(min_length=2)

    class Meta:
        fields = ['email']


class PasswordTokenCheckSerializer(serializers.Serializer):
    token = serializers.CharField(min_length=1, write_only=True)
    uidb64 = serializers.CharField(min_length=1, write_only=True)

    class Meta:
        fields = ['token', 'token']


class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=8, write_only=True)
    token = serializers.CharField(min_length=1, write_only=True)
    uidb64 = serializers.CharField(min_length=1, write_only=True)

    class Meta:
        fields = ['password', 'token', 'uidb64']

    def validate(self, attrs):
        try:
            password = attrs.get('password')
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')

            id = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed('The reset link is invalid', 401)

            user.set_password(password)
            user.save()
        except Exception as err:
            raise AuthenticationFailed('The reset link is invalid', 401)
        return super().validate(attrs)


class UsersSerializer(serializers.ModelSerializer):
    businesses = BusinessSerializer(source='business_set', many=True, read_only=True)
    investment_profiles = InvestmentProfileSerializer(source='investmentprofile_set', many=True, read_only=True)
    job_applications = JobApplicationSerializer(many=True, read_only=True)
    communities = CommunitySerializer(source='community_people', many=True, read_only=True)
    family_members = FamilyMemberSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'full_name', 'email', 'phone',
                  'photo', 'address', 'location', 'postal_code', 'status', 'created_at',
                  'family_visibility', 'bio_visibility',
                  'businesses', 'investment_profiles', 'job_applications', 'communities', 'family_members']


class MeAPIViewSerializer(serializers.ModelSerializer):
    businesses = BusinessSerializer(source='business_set', many=True, read_only=True)
    investment_profiles = InvestmentProfileSerializer(source='investmentprofile_set', many=True, read_only=True)
    job_applications = JobApplicationSerializer(many=True, read_only=True)
    communities = CommunitySerializer(source='community_people', many=True, read_only=True)
    family_members = FamilyMemberSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'full_name', 'email', 'bio',
                  'phone', 'photo', 'address', 'location', 'postal_code', 'created_at',
                  'family_visibility', 'bio_visibility',
                  'businesses', 'investment_profiles', 'job_applications', 'communities', 'family_members']


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserWithTokenSerializer(serializers.Serializer):
    user = UsersSerializer()
    token = serializers.CharField()

    def to_representation(self, instance):
        return {
            'user': instance.get('user'),
            'token': instance.get('token'),
        }


class UserDataSerialiser(serializers.ModelSerializer):
    user_data = UsersSerializer(source='*', read_only=True)

    class Meta:
        model = CustomUser
        fields = ('user_data', )
