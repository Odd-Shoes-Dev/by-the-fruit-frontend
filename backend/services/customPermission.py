from rest_framework import permissions


class IsApprovedUser(permissions.BasePermission):
    """Allow only authenticated users who are approved (or staff). Pending/rejected users cannot access community/connections/etc."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_staff', False):
            return True
        return getattr(request.user, 'approval_status', None) == 'approved'


class IsUser(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsAdmin(permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user.role.id == 1


class IsBoardMember(permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user.role.id == 2


class IsEditor(permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user.role.id == 3


class IsMember(permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user.role.id == 4


class IsExpensePermission(permissions.BasePermission):

    def has_permission(self, request, view):
        method = ['PATCH', 'POST', 'PUT', 'DELETE']
        if request.method in permissions.SAFE_METHODS:
            return True
        elif request.method in method:
            return request.user.role.id < 4


class IsDonationPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        method = ['PATCH', 'POST', 'PUT', 'DELETE']
        if request.method in permissions.SAFE_METHODS:
            return True
        elif request.method in method:
            return request.user.role.id < 4


class IsCampaignPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        method = ['PATCH', 'POST', 'PUT', 'DELETE']
        if request.method in permissions.SAFE_METHODS:
            return True
        elif request.method in method:
            return request.user.role.id < 4


class IsUsersPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        method = ['PATCH', 'POST', 'PUT']
        if request.method in permissions.SAFE_METHODS:
            return True
        elif request.method in method:
            return request.user.role.id <= 4