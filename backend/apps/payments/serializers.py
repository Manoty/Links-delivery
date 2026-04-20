from rest_framework import serializers
from .models import Payment
from apps.orders.models import Order


class InitiatePaymentSerializer(serializers.Serializer):
    """
    Customer initiates payment for an order.
    Phone number can differ from account phone
    (e.g. paying with a different SIM).
    """
    order_id     = serializers.IntegerField()
    phone_number = serializers.CharField(max_length=15)

    def validate_order_id(self, value):
        request = self.context.get('request')
        try:
            order = Order.objects.get(
                id=value,
                customer=request.user,           # Must own the order
                status=Order.Status.PENDING,     # Must not be paid yet
            )
        except Order.DoesNotExist:
            raise serializers.ValidationError(
                'Order not found or not eligible for payment.'
            )
        return value


class PaymentSerializer(serializers.ModelSerializer):
    """Read-only payment status for customers."""
    class Meta:
        model  = Payment
        fields = [
            'id', 'order', 'phone_number', 'amount',
            'status', 'mpesa_receipt_number',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields