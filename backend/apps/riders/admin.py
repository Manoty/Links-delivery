from django.contrib import admin
from .models import RiderProfile, DispatchLog

@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'is_available', 'current_lat', 'current_lng']

@admin.register(DispatchLog)
class DispatchLogAdmin(admin.ModelAdmin):
    list_display  = ['order', 'rider', 'distance_km', 'method', 'dispatched_at']
    list_filter   = ['method']
    ordering      = ['-dispatched_at']