from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.utils import timezone
from . import models
from import_export.admin import ImportExportModelAdmin

user = get_user_model()


@admin.action(description='Approve selected users')
def approve_users(modeladmin, request, queryset):
    queryset.filter(approval_status='pending').update(
        approval_status='approved',
        approved_at=timezone.now(),
        approved_by_id=request.user.id
    )


@admin.action(description='Reject selected users')
def reject_users(modeladmin, request, queryset):
    queryset.filter(approval_status='pending').update(approval_status='rejected')


class UserModelAdmin(ImportExportModelAdmin):
    actions = [approve_users, reject_users]

    def get_queryset(self, request):
        return self.model.all_objects.all()

    list_display = ('full_name', 'email', 'auth_provider', 'approval_status', 'photo', 'is_staff', 'is_active')
    list_filter = ('full_name', 'email', 'approval_status', 'is_staff', 'is_active')
    search_fields = ('full_name', 'email', 'is_staff', 'is_active')


admin.site.register(user, UserModelAdmin)
admin.site.register(models.ErrorLog)