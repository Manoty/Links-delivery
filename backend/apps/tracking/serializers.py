from rest_framework import serializers
from .models import LocationUpdate


class LocationUpdateReadSerializer(serializers.ModelSerializer):
    """
    Serializes a single location point for API responses.
    Flat structure — easy for frontend to consume directly
    into a Leaflet marker or polyline coordinate.
    """
    rider_name  = serializers.CharField(
        source='rider.username', read_only=True
    )
    rider_phone = serializers.CharField(
        source='rider.phone_number', read_only=True
    )

    class Meta:
        model  = LocationUpdate
        fields = [
            'id', 'rider_name', 'rider_phone',
            'latitude', 'longitude', 'timestamp',
        ]


class TrackingResponseSerializer(serializers.Serializer):
    """
    Full tracking payload returned to the customer.
    Combines latest position, ETA, and order context
    into one response so the frontend needs one API call.
    """
    order_id       = serializers.IntegerField()
    order_status   = serializers.CharField()
    rider_name     = serializers.CharField(allow_null=True)
    rider_phone    = serializers.CharField(allow_null=True)
    latitude       = serializers.DecimalField(
        max_digits=9, decimal_places=6, allow_null=True
    )
    longitude      = serializers.DecimalField(
        max_digits=9, decimal_places=6, allow_null=True
    )
    last_updated   = serializers.DateTimeField(allow_null=True)
    eta_minutes    = serializers.IntegerField(allow_null=True)
    delivery_lat   = serializers.DecimalField(
        max_digits=9, decimal_places=6, allow_null=True
    )
    delivery_lng   = serializers.DecimalField(
        max_digits=9, decimal_places=6, allow_null=True
    )