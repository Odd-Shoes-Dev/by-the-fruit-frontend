from django.contrib import admin
from .models import (
    InvestmentRequest, Business, BusinessMileStone, Investment,
    JobPosting, JobApplication, Connection, Channel, ChannelMember,
    ChannelProgressUpdate, ChannelMessage, FamilyMember, CommunityPost,
    Event, EventRegistration, EventReminder, EventParticipant
)
from import_export.admin import ImportExportModelAdmin

# Register your models here.


class InvestmentRequestAdmin(ImportExportModelAdmin):
    list_display = ('user', 'business', 'amount', 'status', 'date')
    list_filter = ('status', 'date')
    search_fields = ('user__email', 'business__name', 'description')


class BusinessAdmin(ImportExportModelAdmin):
    list_display = ('name', 'category', 'is_verified', 'created_at')
    search_fields = ('name', 'email', 'phone')
    list_filter = ('category', 'is_verified')


class BusinessMileStoneAdmin(ImportExportModelAdmin):
    pass


class InvestmentAdmin(ImportExportModelAdmin):
    pass


class JobPostingAdmin(ImportExportModelAdmin):
    list_display = ('title', 'business', 'type', 'posted_date', 'deadline', 'is_active')
    list_filter = ('type', 'is_active', 'posted_date')
    search_fields = ('title', 'business__name', 'description')


class JobApplicationAdmin(ImportExportModelAdmin):
    list_display = ('applicant', 'job', 'status', 'applied_date')
    list_filter = ('status', 'applied_date')
    search_fields = ('applicant__email', 'job__title')


admin.site.register(InvestmentRequest, InvestmentRequestAdmin)
admin.site.register(Business, BusinessAdmin)
admin.site.register(BusinessMileStone, BusinessMileStoneAdmin)
admin.site.register(Investment, InvestmentAdmin)
admin.site.register(JobPosting, JobPostingAdmin)
admin.site.register(JobApplication, JobApplicationAdmin)
admin.site.register(Connection)
admin.site.register(Channel)
admin.site.register(ChannelMember)
admin.site.register(ChannelProgressUpdate)
admin.site.register(ChannelMessage)
admin.site.register(FamilyMember)
admin.site.register(CommunityPost)
admin.site.register(Event)
admin.site.register(EventRegistration)
admin.site.register(EventReminder)
admin.site.register(EventParticipant)
