from django.db import models
from django.conf import settings


class RiderProfile(models.Model):
    """
    Stores rider's live status + latest GPS position.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rider_profile'
    )

    vehicle_type = models.CharField(max_length=50, default="motorcycle")

    is_available = models.BooleanField(default=True)

    current_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    current_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class DispatchLog(models.Model):
    """
    Stores every dispatch decision (audit trail).
    """

    class Method(models.TextChoices):
        AUTO = 'auto', 'Automatic'
        MANUAL = 'manual', 'Manual'

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='dispatch_logs'
    )

    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dispatch_logs'
    )

    distance_km = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )

    method = models.CharField(
        max_length=10,
        choices=Method.choices,
        default=Method.AUTO
    )

    dispatched_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.order_id} → {self.rider.username}"