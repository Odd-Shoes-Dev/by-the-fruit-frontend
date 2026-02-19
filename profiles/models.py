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
    investment_type=models.CharField(max_length=50, choices=BUSINESS_CATEGORIES, default='other')
    linkedin=models.URLField(max_length=255, null=True, blank=True)
    twitter=models.URLField(max_length=255, null=True, blank=True)
    facebook=models.URLField(max_length=255, null=True, blank=True)
    instagram=models.URLField(max_length=255, null=True, blank=True)
    
class Business(BaseModel):
    user = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=50, choices=BUSINESS_CATEGORIES, default='other')
    description = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
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
    people = models.ManyToManyField(CustomUser, null=True, blank=True, related_name='community_people')
    businesses = models.ManyToManyField(Business, null=True, blank=True, related_name='commmunity_business')


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
