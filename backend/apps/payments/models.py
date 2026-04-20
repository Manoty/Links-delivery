from django.db import models
from apps.orders.models import Order


class Payment(models.Model):
    """
    OneToOne with Order — one order, one payment record.
    
    We store the M-Pesa CheckoutRequestID so we can match
    the async callback to the right order when M-Pesa calls back.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESS = 'success', 'Success'
        FAILED  = 'failed',  'Failed'

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name='payment',
    )

    # M-Pesa specific fields
    phone_number           = models.CharField(max_length=15)
    amount                 = models.DecimalField(max_digits=10, decimal_places=2)
    mpesa_checkout_request_id = models.CharField(
        max_length=100, unique=True, null=True, blank=True
    )
    mpesa_receipt_number   = models.CharField(
        max_length=50, null=True, blank=True
    )  # Filled in after successful payment

    status     = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id} | {self.status} | KES {self.amount}"