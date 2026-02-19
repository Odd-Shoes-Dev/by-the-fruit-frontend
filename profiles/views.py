from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    InvestmentProfile, Business, BusinessMileStone,
    InvestmentRequest, Investment, Community,
    JobPosting, JobApplication
)
from .serializers import (
    InvestmentProfileSerializer, BusinessSerializer, BusinessMileStoneSerializer,
    InvestmentRequestSerializer, InvestmentSerializer, CommunitySerializer,
    JobPostingSerializer, JobApplicationSerializer
)


class InvestmentProfileViewSet(viewsets.ModelViewSet):
    queryset = InvestmentProfile.objects.all()
    serializer_class = InvestmentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]


class BusinessMileStoneViewSet(viewsets.ModelViewSet):
    queryset = BusinessMileStone.objects.all()
    serializer_class = BusinessMileStoneSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvestmentRequestViewSet(viewsets.ModelViewSet):
    queryset = InvestmentRequest.objects.all()
    serializer_class = InvestmentRequestSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvestmentViewSet(viewsets.ModelViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class CommunityViewSet(viewsets.ModelViewSet):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='add-people')
    def add_people(self, request, pk=None):
        community = self.get_object()
        user_ids = request.data.get('user_ids', [])
        if not isinstance(user_ids, list):
            return Response({'error': 'user_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        community.people.add(*user_ids)
        return Response({'status': 'people added'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='add-businesses')
    def add_businesses(self, request, pk=None):
        community = self.get_object()
        business_ids = request.data.get('business_ids', [])
        if not isinstance(business_ids, list):
            return Response({'error': 'business_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        community.businesses.add(*business_ids)
        return Response({'status': 'businesses added'}, status=status.HTTP_200_OK)


class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated]


class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
