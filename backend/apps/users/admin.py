from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['id','username', 'email', 'phone_number', 'role', 'is_active']
    list_filter  = ['role', 'is_active']
    fieldsets    = UserAdmin.fieldsets + (
        ('Scott Delivery', {'fields': ('role', 'phone_number')}),
    )