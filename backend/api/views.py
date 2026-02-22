from django.shortcuts import render
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Create your views here.
from profiles.serializers import BusinessSerializer, InvestmentRequestSerializer, InvestmentProfileSerializer


class PublicFounderSubmitAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		# Expecting JSON with 'business' and 'investment_request' objects
		business_data = request.data.get('business', {})
		request_data = request.data.get('investment_request', {})

		business_serializer = BusinessSerializer(data=business_data)
		if not business_serializer.is_valid():
			return Response({'business_errors': business_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		business = business_serializer.save()

		# attach business id to investment request
		request_data['business'] = business.id
		inv_req_serializer = InvestmentRequestSerializer(data=request_data)
		if not inv_req_serializer.is_valid():
			# rollback business if investment request invalid
			business.delete()
			return Response({'investment_request_errors': inv_req_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		investment_request = inv_req_serializer.save()

		return Response({
			'business': BusinessSerializer(business).data,
			'investment_request': InvestmentRequestSerializer(investment_request).data
		}, status=status.HTTP_201_CREATED)


class PublicInvestorSubmitAPIView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		# Create an InvestmentProfile (investor) from submitted data
		serializer = InvestmentProfileSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		profile = serializer.save()
		return Response(InvestmentProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
