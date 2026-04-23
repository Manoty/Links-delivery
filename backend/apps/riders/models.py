from django.db import models
from django.conf import settings


class RiderProfile(models.Model):
    # ... existing code unchanged ...
    pass


class DispatchLog(models.Model):
    """
    Append-only log of every dispatch event.
    Answers questions like:
    - How many orders did we auto-dispatch today?
    - What was the average rider distance?
    - Which orders needed manual override?

    Why store distance_km?
    Raw coordinates change as rider moves. Logging distance
    at dispatch time captures the actual assignment context.
    """

    class Method(models.TextChoices):
        AUTO   = 'auto',   'Automatic'
        MANUAL = 'manual', 'Manual'

    order      = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='dispatch_logs',
    )
    rider      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dispatch_logs',
    )
    distance_km = models.DecimalField(
        max_digits=6, decimal_places=4,
        null=True, blank=True,
        help_text="Haversine distance from rider to pickup at time of dispatch"
    )
    method      = models.CharField(
        max_length=10,
        choices=Method.choices,
        default=Method.AUTO,
    )
    dispatched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-dispatched_at']

    def __str__(self):
        return (
            f"Order #{self.order.id} → {self.rider.username} "
            f"({self.method}) {self.distance_km}km"
        )