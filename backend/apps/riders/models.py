from django.db import models
from django.conf import settings


class RiderProfile(models.Model):
    """
    OneToOne with User (role=rider).
    Stores rider-specific info separate from auth data.

    Why OneToOne and not fields directly on User?
    - Not every user is a rider. Keeping this separate means
      the users table stays lean.
    - Clean separation of concerns: auth data vs operational data.
    """

    class VehicleType(models.TextChoices):
        BICYCLE    = 'bicycle',    'Bicycle'
        MOTORCYCLE = 'motorcycle', 'Motorcycle'
        CAR        = 'car',        'Car'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rider_profile',
    )
    vehicle_type = models.CharField(
        max_length=15,
        choices=VehicleType.choices,
        default=VehicleType.MOTORCYCLE,
    )
    is_available = models.BooleanField(default=False)

    # Current position — updated by rider app periodically
    current_lat  = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    current_lng  = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rider: {self.user.username} | {self.vehicle_type} | {'Available' if self.is_available else 'Offline'}"