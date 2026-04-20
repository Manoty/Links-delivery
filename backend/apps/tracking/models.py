from django.db import models
from django.conf import settings


class LocationUpdate(models.Model):
    """
    Append-only log of rider location updates.
    
    Why not just update RiderProfile.current_lat/lng?
    - RiderProfile only stores the LATEST position (for dispatch)
    - LocationUpdate stores HISTORY (for route replay, analytics)
    - Separation lets us use each for its purpose efficiently
    
    Why append-only?
    - We never update rows here, just insert new ones
    - This is a pattern from event-sourcing: immutable history
    - Makes debugging easy: "where was rider X at 14:32?"
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
    latitude  = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            # Fast lookup: "latest location for rider X on order Y"
            models.Index(fields=['rider', 'order', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.rider.username} @ ({self.latitude}, {self.longitude}) — {self.timestamp}"