from django.db import models
from django.conf import settings


class RiderProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rider_profile'
    )

    vehicle_type = models.CharField(max_length=50, default="motorcycle")

    is_available = models.BooleanField(default=True)

    current_lat = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True
    )

    current_lng = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username