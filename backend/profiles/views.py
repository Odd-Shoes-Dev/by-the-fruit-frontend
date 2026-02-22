from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from services.customPermission import IsApprovedUser
from .models import (
    InvestmentProfile, Business, BusinessMileStone,
    InvestmentRequest, Investment, Community, CommunityPost,
    JobPosting, JobApplication,
    Connection, Channel, ChannelMember, ChannelProgressUpdate, ChannelMessage,
    FamilyMember,
    Event, EventRegistration, EventReminder, EventParticipant,
    Testimonial, ContactMessage, Notification
)
from .serializers import (
    InvestmentProfileSerializer, BusinessSerializer, BusinessMileStoneSerializer,
    InvestmentRequestSerializer, InvestmentSerializer, CommunitySerializer,
    CommunityPostSerializer,
    JobPostingSerializer, JobApplicationSerializer,
    ConnectionSerializer, ChannelSerializer, ChannelMemberSerializer,
    ChannelProgressUpdateSerializer, ChannelMessageSerializer,
    FamilyMemberSerializer,
    EventSerializer, EventRegistrationSerializer, EventReminderSerializer, EventParticipantSerializer,
    TestimonialSerializer, ContactMessageSerializer, NotificationSerializer
)


def _notify(user, notification_type, title, message='', link=''):
    Notification.objects.create(user=user, notification_type=notification_type, title=title, message=message, link=link)


class InvestmentProfileViewSet(viewsets.ModelViewSet):
    queryset = InvestmentProfile.objects.all()
    serializer_class = InvestmentProfileSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated(), IsApprovedUser()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FounderListViewSet(viewsets.ViewSet):
    """List founders (users who have businesses). Admin only."""
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        from accounts.models import CustomUser
        founder_ids = Business.objects.filter(user__isnull=False).values_list('user_id', flat=True).distinct()
        founders = CustomUser.objects.filter(id__in=founder_ids).prefetch_related('business_set')
        data = []
        for f in founders:
            biz = f.business_set.first()
            data.append({
                'id': f.id,
                'name': f.full_name,
                'full_name': f.full_name,
                'email': f.email,
                'company': biz.name if biz else None,
            })
        return Response(data)


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BusinessMileStoneViewSet(viewsets.ModelViewSet):
    queryset = BusinessMileStone.objects.all()
    serializer_class = BusinessMileStoneSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]


class InvestmentRequestViewSet(viewsets.ModelViewSet):
    queryset = InvestmentRequest.objects.all()
    serializer_class = InvestmentRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    @action(detail=False, methods=['get'], url_path='deals-for-creators')
    def deals_for_creators(self, request):
        """Deals (investment requests) surfaced for creator/influencer investors by relevance."""
        user = request.user
        profile = InvestmentProfile.objects.filter(user=user).first()
        if not profile or not profile.is_creator_influencer:
            return Response(
                {'detail': 'Only creator/influencer investors can access this feed.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Open requests with business + founder info, newest first; optional boost by category match
        qs = (
            InvestmentRequest.objects.filter(status='pending')
            .select_related('business', 'user')
            .order_by('-date', '-created_at')
        )
        investor_types = list(InvestmentProfile.objects.filter(user=user).values_list('investment_type', flat=True))
        data = []
        for req in qs[:50]:
            biz = req.business
            founder = req.user
            score = 0
            if biz and investor_types and biz.category in investor_types:
                score = 10
            data.append({
                'id': req.id,
                'amount': str(req.amount),
                'description': req.description,
                'date': req.date.isoformat() if req.date else None,
                'status': req.status,
                'business': {
                    'id': biz.id if biz else None,
                    'name': biz.name if biz else None,
                    'category': biz.category if biz else None,
                    'description': (biz.description or '')[:200] if biz else None,
                } if biz else None,
                'founder': {
                    'id': founder.id if founder else None,
                    'full_name': founder.full_name if founder else None,
                } if founder else None,
                'relevance_score': score,
            })
        data.sort(key=lambda x: (-x['relevance_score'], x['date'] or ''), reverse=True)
        return Response(data)


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


class CommunityPostViewSet(viewsets.ModelViewSet):
    """Community feed posts (Phase 5). GET /community-posts/feed/ for relevance-ordered feed."""
    queryset = CommunityPost.objects.all()
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'feed'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsApprovedUser()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        """Relevance-ordered feed: connected users first, then community, then category match."""
        from django.db.models import Case, When, Value, IntegerField
        from django.db.models.functions import Coalesce

        user = request.user
        posts = CommunityPost.objects.all().select_related('author', 'community').order_by('-created_at')

        if not user.is_authenticated:
            return Response(CommunityPostSerializer(posts[:50], many=True).data)

        connected_ids = set()
        for c in Connection.objects.filter(Q(investor=user) | Q(founder=user), status='connected').select_related('investor', 'founder'):
            connected_ids.add(c.investor_id if c.founder_id == user.id else c.founder_id)

        community_member_ids = set()
        for c in Community.objects.filter(people=user).prefetch_related('people'):
            community_member_ids.update(c.people.values_list('id', flat=True))

        user_categories = set()
        for ip in InvestmentProfile.objects.filter(user=user).values_list('investment_type', flat=True):
            user_categories.add(ip)
        for b in Business.objects.filter(user=user).values_list('category', flat=True):
            user_categories.add(b)

        scored = []
        for p in posts[:200]:
            score = 0
            if p.author_id in connected_ids:
                score += 10
            if p.author_id in community_member_ids and p.community_id:
                score += 5
            if p.category and p.category in user_categories:
                score += 2
            scored.append((score, p))

        scored.sort(key=lambda x: (x[0], x[1].created_at or timezone.now()), reverse=True)
        ordered = [p for _, p in scored[:50]]
        return Response(CommunityPostSerializer(ordered, many=True).data)


class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]


class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]


class FamilyMemberViewSet(viewsets.ModelViewSet):
    """CRUD for current user's family members (Phase 4)."""
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        return FamilyMember.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Events (Phase 6)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'upcoming', 'live'):
            return [permissions.AllowAny()]
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'tag_participant'):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated(), IsApprovedUser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming(self, request):
        qs = Event.objects.filter(status='scheduled', starts_at__gt=timezone.now()).order_by('starts_at')
        return Response(EventSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='live')
    def live(self, request):
        qs = Event.objects.filter(status='live').order_by('starts_at')
        return Response(EventSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'], url_path='register')
    def register(self, request, pk=None):
        event = self.get_object()
        user = request.user
        if event.max_slots is not None and event.registrations.count() >= event.max_slots:
            return Response({'error': 'No slots available'}, status=status.HTTP_400_BAD_REQUEST)
        reg, created = EventRegistration.objects.get_or_create(event=event, user=user)
        return Response(EventRegistrationSerializer(reg).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='remind-me')
    def remind_me(self, request, pk=None):
        event = self.get_object()
        remind_at = request.data.get('remind_at')
        rem, _ = EventReminder.objects.get_or_create(event=event, user=request.user, defaults={'remind_at': remind_at})
        if remind_at and not rem.remind_at:
            rem.remind_at = remind_at
            rem.save()
        return Response(EventReminderSerializer(rem).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='tag-participant')
    def tag_participant(self, request, pk=None):
        if not request.user.is_staff and not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        event = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        from accounts.models import CustomUser
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        part, _ = EventParticipant.objects.get_or_create(event=event, user=user, defaults={'tagged_by': request.user})
        return Response(EventParticipantSerializer(part).data, status=status.HTTP_200_OK)


class EventRegistrationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        return EventRegistration.objects.filter(user=self.request.user)


class EventReminderViewSet(viewsets.ModelViewSet):
    serializer_class = EventReminderSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        return EventReminder.objects.filter(user=self.request.user)


# Connection & Channel views (Phase 2)

class ConnectionViewSet(viewsets.ModelViewSet):
    queryset = Connection.objects.all()
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        user = self.request.user
        return Connection.objects.filter(Q(investor=user) | Q(founder=user))

    @action(detail=False, methods=['post'], url_path='interested')
    def mark_interested(self, request):
        """Investor marks interest in a founder. Founder can see interested investors."""
        founder_id = request.data.get('founder_id')
        if not founder_id:
            return Response({'error': 'founder_id required'}, status=status.HTTP_400_BAD_REQUEST)
        investor = request.user
        from accounts.models import CustomUser
        try:
            founder = CustomUser.objects.get(id=founder_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Founder not found'}, status=status.HTTP_404_NOT_FOUND)
        conn, created = Connection.objects.get_or_create(investor=investor, founder=founder)
        if created:
            conn.status = 'interested'
            conn.interested_at = timezone.now()
            conn.save()
        return Response(ConnectionSerializer(conn).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='connect')
    def request_connect(self, request):
        """Investor requests to connect. Founder must accept."""
        founder_id = request.data.get('founder_id')
        if not founder_id:
            return Response({'error': 'founder_id required'}, status=status.HTTP_400_BAD_REQUEST)
        investor = request.user
        from accounts.models import CustomUser
        try:
            founder = CustomUser.objects.get(id=founder_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Founder not found'}, status=status.HTTP_404_NOT_FOUND)
        conn, created = Connection.objects.get_or_create(investor=investor, founder=founder)
        conn.status = 'connect_pending'
        conn.connect_requested_at = timezone.now()
        if not conn.interested_at:
            conn.interested_at = timezone.now()
        conn.save()
        _notify(conn.founder, 'connection_request', f'{investor.full_name or investor.email} wants to connect', link='/connections')
        return Response(ConnectionSerializer(conn).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept_connection(self, request, pk=None):
        """Founder accepts connect request. Creates channel and adds both as members."""
        conn = self.get_object()
        if conn.founder != request.user:
            return Response({'error': 'Only the founder can accept'}, status=status.HTTP_403_FORBIDDEN)
        if conn.status != 'connect_pending':
            return Response({'error': 'Connection is not pending'}, status=status.HTTP_400_BAD_REQUEST)
        conn.status = 'connected'
        conn.accepted_at = timezone.now()
        conn.save()
        channel, _ = Channel.objects.get_or_create(connection=conn, defaults={
            'founder': conn.founder, 'investor': conn.investor
        })
        ChannelMember.objects.get_or_create(channel=channel, user=conn.founder, defaults={'role': 'founder'})
        ChannelMember.objects.get_or_create(channel=channel, user=conn.investor, defaults={'role': 'investor'})
        _notify(conn.investor, 'connection_accepted', f'{conn.founder.full_name or conn.founder.email} accepted your connection', link='/connections')
        return Response(ConnectionSerializer(conn).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_connection(self, request, pk=None):
        """Founder rejects connect request."""
        conn = self.get_object()
        if conn.founder != request.user:
            return Response({'error': 'Only the founder can reject'}, status=status.HTTP_403_FORBIDDEN)
        conn.status = 'rejected'
        conn.save()
        return Response(ConnectionSerializer(conn).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='interested-in-me')
    def interested_in_me(self, request):
        """Founders: list investors who marked interested (visible in founder's interested section)."""
        user = request.user
        conns = Connection.objects.filter(founder=user, status__in=['interested', 'connect_pending', 'connected'])
        return Response(ConnectionSerializer(conns, many=True).data)

    @action(detail=False, methods=['get'], url_path='pending-for-me')
    def pending_for_me(self, request):
        """Founders: list pending connect requests to accept/reject."""
        user = request.user
        conns = Connection.objects.filter(founder=user, status='connect_pending')
        return Response(ConnectionSerializer(conns, many=True).data)


class ChannelViewSet(viewsets.ModelViewSet):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        user = self.request.user
        return Channel.objects.filter(members__user=user).distinct()

    @action(detail=True, methods=['post'], url_path='invite')
    def invite_member(self, request, pk=None):
        """Invite another user to the channel. They must accept to join."""
        channel = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        if not ChannelMember.objects.filter(channel=channel, user=request.user).exists():
            return Response({'error': 'Only channel members can invite'}, status=status.HTTP_403_FORBIDDEN)
        from accounts.models import CustomUser
        try:
            invitee = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        member, created = ChannelMember.objects.get_or_create(channel=channel, user=invitee, defaults={
            'invited_by': request.user, 'invite_status': 'pending', 'role': 'member'
        })
        if not created and member.invite_status == 'accepted':
            return Response({'message': 'User already in channel'}, status=status.HTTP_200_OK)
        member.invite_status = 'pending'
        member.invited_by = request.user
        member.save()
        return Response(ChannelMemberSerializer(member).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='accept-invite')
    def accept_invite(self, request, pk=None):
        """Accept invitation to join channel (e.g. by admin)."""
        channel = self.get_object()
        try:
            member = ChannelMember.objects.get(channel=channel, user=request.user, invite_status='pending')
        except ChannelMember.DoesNotExist:
            return Response({'error': 'No pending invite'}, status=status.HTTP_404_NOT_FOUND)
        member.invite_status = 'accepted'
        member.save()
        return Response(ChannelMemberSerializer(member).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        """Remove a member from the channel (founder/investor only)."""
        channel = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        requester = ChannelMember.objects.get(channel=channel, user=request.user)
        if requester.role not in ['founder', 'investor']:
            return Response({'error': 'Only founder or investor can remove members'}, status=status.HTTP_403_FORBIDDEN)
        member = ChannelMember.objects.filter(channel=channel, user_id=user_id).first()
        if not member:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        if member.role in ['founder', 'investor']:
            return Response({'error': 'Cannot remove founder or investor'}, status=status.HTTP_400_BAD_REQUEST)
        member.delete()
        return Response({'status': 'removed'}, status=status.HTTP_200_OK)


class ChannelProgressUpdateViewSet(viewsets.ModelViewSet):
    queryset = ChannelProgressUpdate.objects.all()
    serializer_class = ChannelProgressUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        user = self.request.user
        qs = ChannelProgressUpdate.objects.filter(channel__members__user=user).distinct()
        channel_id = self.request.query_params.get('channel')
        if channel_id:
            qs = qs.filter(channel_id=channel_id)
        return qs

    def perform_create(self, serializer):
        channel = serializer.validated_data['channel']
        if not ChannelMember.objects.filter(channel=channel, user=self.request.user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only channel members can post updates')
        serializer.save(posted_by=self.request.user)


class ChannelMessageViewSet(viewsets.ModelViewSet):
    queryset = ChannelMessage.objects.all()
    serializer_class = ChannelMessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        user = self.request.user
        qs = ChannelMessage.objects.filter(channel__members__user=user).distinct()
        channel_id = self.request.query_params.get('channel')
        if channel_id:
            qs = qs.filter(channel_id=channel_id)
        return qs

    def perform_create(self, serializer):
        channel = serializer.validated_data['channel']
        if not ChannelMember.objects.filter(channel=channel, user=self.request.user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only channel members can send messages')
        msg = serializer.save(sender=self.request.user)
        sender_name = self.request.user.full_name or self.request.user.email
        for member in ChannelMember.objects.filter(channel=channel).exclude(user=self.request.user).select_related('user'):
            _notify(member.user, 'channel_message', f'New message in channel', f'{sender_name}: {(msg.content or "")[:100]}', link=f'/channels/{channel.id}')


class TestimonialViewSet(viewsets.ModelViewSet):
    """Public: list visible testimonials. Admin: full CRUD."""
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(visible=True)
        return qs.order_by('order', 'created_at')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class ContactMessageViewSet(viewsets.ModelViewSet):
    """Public: create (submit message). Admin: list/retrieve/delete."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class NotificationViewSet(viewsets.ModelViewSet):
    """List my notifications, mark as read, get unread count."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedUser]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def partial_update(self, request, *args, **kwargs):
        """Mark as read."""
        obj = self.get_object()
        if obj.user != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        if not obj.read_at:
            obj.read_at = timezone.now()
            obj.save(update_fields=['read_at'])
        return Response(NotificationSerializer(obj).data)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        n = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
        return Response({'count': n})
