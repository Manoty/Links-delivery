from django.db import models
from django.conf import settings


class Order(models.Model):
    """
    Central model of the entire platform.
    Everything — payment, tracking, rider assignment — links back here.
    """

    class Status(models.TextChoices):
        PENDING    = 'pending',    'Pending'      # Order placed, awaiting payment
        PAID       = 'paid',       'Paid'          # Payment confirmed
        ASSIGNED   = 'assigned',   'Assigned'      # Rider assigned
        PICKED_UP  = 'picked_up',  'Picked Up'     # Rider has the package
        DELIVERED  = 'delivered',  'Delivered'     # Order complete
        CANCELLED  = 'cancelled',  'Cancelled'     # Order cancelled

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,       # Don't delete orders if user deleted
        related_name='orders',
        limit_choices_to={'role': 'customer'},
    )
    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,      # If rider deleted, order still exists
        related_name='deliveries',
        null=True,
        blank=True,
        limit_choices_to={'role': 'rider'},
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # Delivery details
    delivery_address  = models.TextField()
    delivery_lat      = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    delivery_lng      = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    delivery_notes    = models.TextField(blank=True, default='')

    # Pickup details (restaurant/store location)
    pickup_address    = models.TextField()
    pickup_lat        = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    pickup_lng        = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    total_amount      = models.DecimalField(max_digits=10, decimal_places=2)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']   # Newest orders first

    def __str__(self):
        return f"Order #{self.id} | {self.customer.username} | {self.status}"


class OrderItem(models.Model):
    """
    Line items inside an order.
    Normalized so we can store multiple items per order cleanly.

    Why not a JSON field on Order?
    - JSON fields can't be queried efficiently
    - Can't add foreign keys or constraints to JSON
    - Harder to aggregate (total spend per item, etc.)
    """
    order    = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
    )
    name     = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    price    = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.name} @ {self.price}"

    @property
    def subtotal(self):
        return self.quantity * self.price