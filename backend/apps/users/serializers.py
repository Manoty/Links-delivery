from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from apps.riders.models import RiderProfile


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    We validate password strength and ensure phone is unique.
    """
    password  = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model  = User
        fields = [
            'username', 'email', 'phone_number',
            'password', 'password2', 'role'
        ]
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': 'Passwords do not match.'}
            )
        if attrs.get('role') == User.Role.ADMIN:
            raise serializers.ValidationError(
                {'role': 'Cannot self-register as admin.'}
            )
        return attrs

    def create(self, validated_data):
        # Remove password2 — not a model field
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)   # Hashes the password
        user.save()

        # Auto-create RiderProfile if registering as rider
        if user.role == User.Role.RIDER:
            RiderProfile.objects.create(user=user)

        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Read/update current user profile.
    Password excluded — handled separately.
    """
    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email',
            'phone_number', 'role',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']


class LoginSerializer(serializers.Serializer):
    """
    Custom login — accepts phone_number instead of username.
    Why phone? In Kenya, phone number is the primary identity
    (tied to M-Pesa). More natural for this market.
    """
    phone_number = serializers.CharField()
    password     = serializers.CharField(write_only=True)