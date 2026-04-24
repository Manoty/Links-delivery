from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    We add role and phone_number here.
    
    Why AbstractUser over AbstractBaseUser?
    - AbstractUser keeps all existing fields (username, email, password)
      and lets us ADD fields cleanly.
    - AbstractBaseUser requires rebuilding auth from scratch — overkill here.
    """

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        RIDER    = 'rider',    'Rider'
        ADMIN    = 'admin',    'Admin'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone_number = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    # Helper properties for clean permission checks
    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_rider(self):
        return self.role == self.Role.RIDER

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    
class Notification(models.Model):
    """
    Persistent notification record per user.
    Created server-side on key events (order status changes,
    payment confirmed, rider assigned, etc).

    Why store in DB and not just push?
    Users may be offline when the event fires.
    DB storage means they see missed notifications on next login.
    """

    class Type(models.TextChoices):
        ORDER_PLACED    = 'order_placed',    'Order Placed'
        PAYMENT_SUCCESS = 'payment_success', 'Payment Confirmed'
        RIDER_ASSIGNED  = 'rider_assigned',  'Rider Assigned'
        ORDER_PICKED_UP = 'order_picked_up', 'Order Picked Up'
        ORDER_DELIVERED = 'order_delivered', 'Order Delivered'
        ORDER_CANCELLED = 'order_cancelled', 'Order Cancelled'
        NEW_ORDER       = 'new_order',       'New Order Available'
        RATING_RECEIVED = 'rating_received', 'Rating Received'

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type       = models.CharField(max_length=30, choices=Type.choices)
    title      = models.CharField(max_length=120)
    body       = models.TextField()
    data       = models.JSONField(default=dict, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [models.Index(fields=['user', 'is_read', '-created_at'])]

    def __str__(self):
        return f"{self.user.username} — {self.type} ({self.created_at:%Y-%m-%d %H:%M})"    