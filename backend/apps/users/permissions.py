from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    """Allow access only to users with role=customer."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_customer
        )


class IsRider(BasePermission):
    """Allow access only to users with role=rider."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_rider
        )


class IsAdmin(BasePermission):
    """Allow access only to users with role=admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin
        )


class IsRiderOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_rider or request.user.is_admin)
        )