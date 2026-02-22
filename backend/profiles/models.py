from django.db import models

from accounts.models import BaseModel, CustomUser

# Create your models here.


BUSINESS_CATEGORIES = [
    ('technology', 'Technology'),
    ('finance', 'Finance'),
    ('retail', 'Retail'),
    ('healthcare', 'Healthcare'),
    ('education', 'Education'),
    ('manufacturing', 'Manufacturing'),
    ('agriculture', 'Agriculture'),
    ('real_estate', 'Real Estate'),
    ('hospitality', 'Hospitality'),
    ('logistics', 'Logistics'),
    ('other', 'Other'),
]
CHECK_RANGE = [
    ('1000-5000', '1000-5000'),
    ('5000-10000', '5000-10000'),
    ('10000-20000', '10000-20000'),
    ('20000-50000', '20000-50000'),
    ('50000-100000', '50000-100000'),
    ('100000+', '100000+'),
]

class InvestmentProfile(BaseModel):
    user = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    bio = models.TextField(null=True, blank=True)
    philosophy = models.TextField(null=True, blank=True)
    check_size_range = models.CharField(max_length=50, choices=CHECK_RANGE, default='1000-5000')
    investment_type = models.CharField(max_length=50, choices=BUSINESS_CATEGORIES, default='other')
    location = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    linkedin = models.URLField(max_length=255, null=True, blank=True)
    twitter = models.URLField(max_length=255, null=True, blank=True)
    facebook = models.URLField(max_length=255, null=True, blank=True)
    instagram = models.URLField(max_length=255, null=True, blank=True)
    # Phase 7: micro-investors (Reg CF limits to be enforced later)
    is_micro_investor = models.BooleanField(default=False)
    # Phase 7: creators/influencers get relevant deals by reach
    is_creator_influencer = models.BooleanField(default=False)
    audience_reach = models.CharField(max_length=255, null=True, blank=True, help_text='e.g. "10K LinkedIn", "50K YouTube"')
    
class Business(BaseModel):
    user = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=50, choices=BUSINESS_CATEGORIES, default='other')
    description = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    website = models.URLField(max_length=255, null=True, blank=True)
    logo = models.ImageField(upload_to='business_logos/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.name if self.name else "Business"


class BusinessMileStone(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='milestones')

    def __str__(self):
        return self.title


InvestmentRequestStatus = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
]


class InvestmentRequest(BaseModel):
    user = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='investment_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    date = models.DateField()
    status = models.CharField(max_length=50, choices=InvestmentRequestStatus, default='pending')

    # def __str__(self):
    #     return "self.title"


class Investment(BaseModel):
    investor = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    request = models.ForeignKey(InvestmentRequest, on_delete=models.CASCADE,
                                related_name='investments', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=InvestmentRequestStatus, default='pending')

    # def __str__(self):
    #     return "self.title"


class Community(BaseModel):
    name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='community_images/', null=True, blank=True)
    thumbnail = models.ImageField(upload_to='community_thumbnails/', null=True, blank=True)
    people = models.ManyToManyField(CustomUser, blank=True, related_name='community_people')
    businesses = models.ManyToManyField(Business, blank=True, related_name='commmunity_business')


class CommunityPost(BaseModel):
    """Feed post in community (Phase 5). Text, image, or video."""
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='community_posts')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, null=True, blank=True, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='community_posts/', null=True, blank=True)
    video = models.FileField(upload_to='community_posts_video/', null=True, blank=True)
    category = models.CharField(max_length=50, choices=BUSINESS_CATEGORIES, null=True, blank=True)

    def __str__(self):
        return f"{self.author.email}: {self.content[:50]}"


JOB_TYPES = [
    ('full_time', 'Full Time'),
    ('part_time', 'Part Time'),
    ('freelance', 'Freelance'),
    ('internship', 'Internship'),
    ('contract', 'Contract'),
]


class JobPosting(BaseModel):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='job_postings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=50, choices=JOB_TYPES, default='full_time')
    salary_range = models.CharField(max_length=100, null=True, blank=True)
    posted_date = models.DateField(auto_now_add=True)
    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} at {self.business.name}"


APPLICATION_STATUS = [
    ('pending', 'Pending'),
    ('reviewed', 'Reviewed'),
    ('shortlisted', 'Shortlisted'),
    ('rejected', 'Rejected'),
    ('hired', 'Hired'),
]


class JobApplication(BaseModel):
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='job_applications')
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    cover_letter = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=APPLICATION_STATUS, default='pending')
    applied_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.applicant.full_name} for {self.job.title}"


# Connection & Channel models (Phase 2)

CONNECTION_STATUS = [
    ('interested', 'Interested'),       # Investor clicked "Interested" - founder can see them
    ('connect_pending', 'Connect Pending'),  # Investor clicked "Connect" - waiting for founder
    ('connected', 'Connected'),          # Founder accepted - channel created
    ('rejected', 'Rejected'),            # Founder declined
]

INVITE_STATUS = [
    ('pending', 'Pending'),
    ('accepted', 'Accepted'),
    ('declined', 'Declined'),
]


class Connection(BaseModel):
    """Investor ↔ Founder connection. Both must accept before channel is created."""
    investor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='investor_connections')
    founder = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='founder_connections')
    status = models.CharField(max_length=20, choices=CONNECTION_STATUS, default='interested')
    interested_at = models.DateTimeField(null=True, blank=True)
    connect_requested_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [['investor', 'founder']]

    def __str__(self):
        return f"{self.investor.email} ↔ {self.founder.email} ({self.status})"


class Channel(BaseModel):
    """Private channel between connected investor and founder. Created when connection is accepted."""
    connection = models.OneToOneField(Connection, on_delete=models.CASCADE, related_name='channel', null=True, blank=True)
    founder = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='founder_channels')
    investor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='investor_channels')

    def __str__(self):
        return f"Channel: {self.founder.email} ↔ {self.investor.email}"


class ChannelMember(BaseModel):
    """Members of a channel. Founders/investors are auto-added. Others need invitation."""
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='channel_memberships')
    role = models.CharField(max_length=20, default='member')  # founder, investor, member
    invited_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='channel_invites_sent')
    invite_status = models.CharField(max_length=20, choices=INVITE_STATUS, default='accepted')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['channel', 'user']]

    def __str__(self):
        return f"{self.user.email} in {self.channel}"


class ChannelProgressUpdate(BaseModel):
    """Founder posts progress updates; visible only to channel members (linked investors)."""
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='progress_updates')
    posted_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='progress_posts')
    content = models.TextField()
    media = models.FileField(upload_to='channel_updates/', null=True, blank=True)

    def __str__(self):
        return f"Update by {self.posted_by.email}"


class ChannelMessage(BaseModel):
    """Messages in investor-founder channel (real-time in Phase 3)."""
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='channel_messages_sent')
    content = models.TextField()

    def __str__(self):
        return f"{self.sender.email}: {self.content[:50]}"


# Family members (Phase 4)

RELATIONSHIP_CHOICES = [
    ('spouse', 'Spouse'),
    ('child', 'Child'),
    ('parent', 'Parent'),
    ('sibling', 'Sibling'),
    ('other', 'Other'),
]


class FamilyMember(BaseModel):
    """Family member on user profile. Optional link if they have an account."""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='family_members')
    name = models.CharField(max_length=255)
    photo = models.ImageField(upload_to='family_photos/', null=True, blank=True)
    profile_link = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='linked_from_family_members'
    )
    relationship = models.CharField(max_length=50, choices=RELATIONSHIP_CHOICES, default='other')

    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()})"


# Events & Pitching Competitions (Phase 6)

EVENT_STATUS = [
    ('scheduled', 'Scheduled'),
    ('live', 'Live'),
    ('ended', 'Ended'),
]


class Event(BaseModel):
    """Admin-scheduled event (e.g. pitching competition). Shown in Events section."""
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    theme = models.CharField(max_length=255, null=True, blank=True, help_text='Theme or subject of the event')
    requirements = models.TextField(null=True, blank=True, help_text='Requirements for participants')
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_events')
    max_slots = models.PositiveIntegerField(null=True, blank=True, help_text='Max founder slots; null = unlimited')
    status = models.CharField(max_length=20, choices=EVENT_STATUS, default='scheduled')
    recording_url = models.URLField(max_length=500, null=True, blank=True, help_text='Set when live ends (auto or manual)')

    def __str__(self):
        return self.title


class EventRegistration(BaseModel):
    """Founder registers for an event (takes a slot)."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='event_registrations')

    class Meta:
        unique_together = [['event', 'user']]

    def __str__(self):
        return f"{self.user.email} @ {self.event.title}"


class EventReminder(BaseModel):
    """Investor (or any user) wants a reminder for an event."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reminders')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='event_reminders')
    remind_at = models.DateTimeField(null=True, blank=True, help_text='When to remind (e.g. 1 day before)')

    class Meta:
        unique_together = [['event', 'user']]

    def __str__(self):
        return f"{self.user.email} reminder for {self.event.title}"


class EventParticipant(BaseModel):
    """Admin-tagged participant in a competition (founder)."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tagged_participants')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='event_participations')
    tagged_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='tagged_participants')

    class Meta:
        unique_together = [['event', 'user']]

    def __str__(self):
        return f"{self.user.email} in {self.event.title}"


class Testimonial(BaseModel):
    """Admin-curated testimonial shown on the landing page."""
    author_name = models.CharField(max_length=255)
    role = models.CharField(max_length=100, blank=True, help_text='e.g. Founder, Investor')
    quote = models.TextField()
    order = models.PositiveIntegerField(default=0, help_text='Lower = show first')
    visible = models.BooleanField(default=True, help_text='Admin toggles which testimonials appear')

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.author_name} — {self.quote[:50]}..."


class ContactMessage(BaseModel):
    """Newsletter / contact form: message from visitor to admin."""
    email = models.EmailField()
    message = models.TextField()
    # optional: subject, name fields can be added later

    def __str__(self):
        return f"{self.email} — {self.created_at}"


NOTIFICATION_TYPES = [
    ('connection_request', 'Connection request'),
    ('connection_accepted', 'Connection accepted'),
    ('channel_message', 'Channel message'),
]


class Notification(BaseModel):
    """In-app notification for a user. read_at is null until read."""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=500, blank=True, help_text='Frontend path or URL to open when clicked')
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email}: {self.title}"
