from rest_framework import serializers
from .models import RiderProfile
from apps.users.serializers import UserSerializer


class RiderProfileSerializer(serializers.ModelSerializer):
    """
    Full rider profile — includes nested user info.
    Used for GET responses.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model  = RiderProfile
        fields = [
            'id', 'user', 'vehicle_type',
            'is_available', 'current_lat',
            'current_lng', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'updated_at']


class RiderProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Rider updates their own profile.
    Can only change vehicle_type and availability.
    Coordinates are updated via the dedicated location endpoint.
    """
    class Meta:
        model  = RiderProfile
        fields = ['vehicle_type', 'is_available']


class LocationUpdateSerializer(serializers.Serializer):
    """
    Rider pushes their current GPS coordinates.
    Simple flat payload — fast to send from mobile.

    Why a separate serializer instead of updating RiderProfile directly?
    We write to TWO places simultaneously:
      1. RiderProfile.current_lat/lng  (latest position — for dispatch)
      2. LocationUpdate table          (history — for tracking)
    The serializer just validates the input; the view handles the writes.
    """
    latitude  = serializers.DecimalField(
        max_digits=9, decimal_places=6
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6
    )
    order_id  = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Active order ID so tracking can be linked."
    )

    def validate_latitude(self, value):
        if not (-90 <= float(value) <= 90):
            raise serializers.ValidationError(
                'Latitude must be between -90 and 90.'
            )
        return value

    def validate_longitude(self, value):
        if not (-180 <= float(value) <= 180):
            raise serializers.ValidationError(
                'Longitude must be between -180 and 180.'
            )
        return value