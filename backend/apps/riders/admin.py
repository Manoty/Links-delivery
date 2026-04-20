from django.contrib import admin
from .models import RiderProfile

@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'is_available', 'current_lat', 'current_lng']