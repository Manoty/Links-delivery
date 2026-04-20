from rest_framework import serializers
from .models import Order, OrderItem
from apps.users.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model  = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'subtotal']


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Used when a customer places a new order.
    Items are nested — sent as a list inside the order payload.

    Why nested writes?
    Sending order + items in one request is atomic from the
    customer's perspective. We handle splitting them server-side.
    """
    items = OrderItemSerializer(many=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'delivery_address', 'delivery_lat', 'delivery_lng',
            'delivery_notes', 'pickup_address', 'pickup_lat',
            'pickup_lng', 'total_amount', 'items',
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError(
                'Order must contain at least one item.'
            )
        return items

    def validate_total_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                'Total amount must be greater than zero.'
            )
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # customer is injected from the view (request.user)
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        return order


class OrderSerializer(serializers.ModelSerializer):
    """
    Full order detail — includes nested items and user info.
    Used for GET responses.
    """
    items    = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    rider    = UserSerializer(read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'customer', 'rider', 'status',
            'delivery_address', 'delivery_lat', 'delivery_lng',
            'delivery_notes', 'pickup_address', 'pickup_lat',
            'pickup_lng', 'total_amount', 'items',
            'created_at', 'updated_at',
        ]


class AssignRiderSerializer(serializers.Serializer):
    """
    Admin uses this to manually assign a rider.
    Just needs the rider's user ID.
    """
    rider_id = serializers.IntegerField()

    def validate_rider_id(self, value):
        from apps.users.models import User
        try:
            rider = User.objects.get(id=value, role='rider')
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'No rider found with this ID.'
            )
        return value


class UpdateOrderStatusSerializer(serializers.Serializer):
    """
    Admin/Rider uses this to move order through lifecycle.
    We validate only allowed transitions happen.
    """
    status = serializers.ChoiceField(choices=Order.Status.choices)

    def validate_status(self, value):
        order = self.context.get('order')
        if not order:
            return value

        # Define allowed transitions
        # Key = current status, Value = statuses it can move to
        allowed = {
            Order.Status.PENDING:   [Order.Status.PAID, Order.Status.CANCELLED],
            Order.Status.PAID:      [Order.Status.ASSIGNED, Order.Status.CANCELLED],
            Order.Status.ASSIGNED:  [Order.Status.PICKED_UP, Order.Status.CANCELLED],
            Order.Status.PICKED_UP: [Order.Status.DELIVERED],
            Order.Status.DELIVERED: [],
            Order.Status.CANCELLED: [],
        }

        if value not in allowed.get(order.status, []):
            raise serializers.ValidationError(
                f"Cannot move from '{order.status}' to '{value}'."
            )
        return value