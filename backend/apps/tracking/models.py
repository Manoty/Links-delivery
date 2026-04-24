from django.db import models
from django.conf import settings


class LocationUpdate(models.Model):
    """
    Stores rider movement history (append-only log).
    Used for tracking routes, analytics, and replay.
    """

    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='location_updates',
        limit_choices_to={'role': 'rider'},
    )

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='location_updates',
        null=True,
        blank=True,
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['rider', 'order', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.rider.username} @ ({self.latitude}, {self.longitude})"
    