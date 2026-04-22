import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from django.shortcuts import get_object_or_404

from .models import RiderProfile
from .serializers import (
    RiderProfileSerializer,
    RiderProfileUpdateSerializer,
    LocationUpdateSerializer,
)
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.tracking.models import LocationUpdate
from apps.users.permissions import IsRider, IsRiderOrAdmin

logger = logging.getLogger(__name__)


class RiderProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  → rider views their own profile
    PUT  → rider updates vehicle type or availability
    """
    permission_classes = [IsRider]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RiderProfileUpdateSerializer
        return RiderProfileSerializer

    def get_object(self):
        return get_object_or_404(
            RiderProfile,
            user=self.request.user
        )

    def update(self, request, *args, **kwargs):
        partial  = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return full profile after update
        return Response(
            RiderProfileSerializer(instance).data
        )


class AvailableOrdersView(generics.ListAPIView):
    """
    Rider sees all PAID orders that have no rider assigned yet.
    These are orders ready to be picked up.

    Why filter by PAID (not PENDING)?
    A pending order hasn't been paid. Assigning a rider before
    payment is confirmed wastes rider time if payment fails.
    Only paid orders are ready for dispatch.
    """
    serializer_class   = OrderSerializer
    permission_classes = [IsRider]

    def get_queryset(self):
        return Order.objects.filter(
            status=Order.Status.PAID,
            rider__isnull=True,        # Not yet assigned to anyone
        ).prefetch_related('items').select_related('customer')


class AcceptOrderView(APIView):
    """
    Rider self-assigns to an available order.
    POST /api/riders/orders/<order_id>/accept/

    This is the self-serve version of admin assignment from Phase 4.
    In Phase 10 (dispatch), the system will handle assignment automatically.
    For now riders can claim orders from the available pool.

    Race condition consideration:
    Two riders could try to accept the same order simultaneously.
    We handle this by re-checking status inside the same operation.
    In production you'd use select_for_update() with a DB transaction.
    """
    permission_classes = [IsRider]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        # Re-check eligibility at the point of acceptance
        if order.status != Order.Status.PAID:
            return Response(
                {'error': 'This order is no longer available.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.rider is not None:
            return Response(
                {'error': 'This order has already been claimed by another rider.'},
                status=status.HTTP_409_CONFLICT
            )

        # Check rider profile exists
        rider_profile = getattr(request.user, 'rider_profile', None)
        if not rider_profile:
            return Response(
                {'error': 'Rider profile not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Assign and update
        order.rider  = request.user
        order.status = Order.Status.ASSIGNED
        order.save()

        rider_profile.is_available = False
        rider_profile.save()

        logger.info(
            f"Rider {request.user.username} accepted Order #{order.id}"
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK
        )


class RejectOrderView(APIView):
    """
    Rider explicitly rejects an assigned order.
    POST /api/riders/orders/<order_id>/reject/

    Why allow rejection?
    Riders may be close to shift end, have vehicle issues,
    or be outside the delivery area. Forcing acceptance
    leads to abandoned deliveries — worse than rejection.

    On rejection: order reverts to PAID so another rider can claim it.
    """
    permission_classes = [IsRider]

    def post(self, request, order_id):
        order = get_object_or_404(
            Order,
            id=order_id,
            rider=request.user,
            status=Order.Status.ASSIGNED,
        )

        # Unassign rider and revert order to paid pool
        order.rider  = None
        order.status = Order.Status.PAID
        order.save()

        # Free up rider
        rider_profile = getattr(request.user, 'rider_profile', None)
        if rider_profile:
            rider_profile.is_available = True
            rider_profile.save()

        logger.info(
            f"Rider {request.user.username} rejected Order #{order.id} "
            f"— returned to available pool"
        )

        return Response({
            'message': f'Order #{order.id} rejected. It is now available for other riders.'
        })


class LocationUpdateView(APIView):
    """
    Rider pushes their current GPS position.
    POST /api/riders/location/update/

    Called every 5 seconds by the rider app.
    Does two writes in one request:
      1. Updates RiderProfile (current position for dispatch)
      2. Creates LocationUpdate record (history for tracking)

    Why both?
    RiderProfile.current_lat/lng = fast lookup for "where is this rider now"
    LocationUpdate = append-only log for "where has this rider been"
    Each serves a different query pattern.
    """
    permission_classes = [IsRider]

    def post(self, request):
        serializer = LocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lat      = serializer.validated_data['latitude']
        lng      = serializer.validated_data['longitude']
        order_id = serializer.validated_data.get('order_id')

        # 1. Update rider's current position on their profile
        rider_profile = getattr(request.user, 'rider_profile', None)
        if not rider_profile:
            return Response(
                {'error': 'Rider profile not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        rider_profile.current_lat = lat
        rider_profile.current_lng = lng
        rider_profile.save()

        # 2. Resolve the order if provided
        order = None
        if order_id:
            try:
                order = Order.objects.get(
                    id=order_id,
                    rider=request.user,
                )
            except Order.DoesNotExist:
                pass   # Don't fail the location update over this

        # 3. Append to location history
        LocationUpdate.objects.create(
            rider=request.user,
            order=order,
            latitude=lat,
            longitude=lng,
        )

        return Response({
            'message':   'Location updated.',
            'latitude':  str(lat),
            'longitude': str(lng),
        }, status=status.HTTP_200_OK)


class ActiveRidersView(APIView):
    """
    Admin sees all currently available riders and their positions.
    GET /api/riders/active/
    Used in the admin dashboard for dispatch overview.
    """
    permission_classes = [IsRiderOrAdmin]

    def get(self, request):
        profiles = RiderProfile.objects.filter(
            is_available=True,
            current_lat__isnull=False,
            current_lng__isnull=False,
        ).select_related('user')

        data = [
            {
                'rider_id':     p.user.id,
                'username':     p.user.username,
                'phone':        p.user.phone_number,
                'vehicle_type': p.vehicle_type,
                'latitude':     str(p.current_lat),
                'longitude':    str(p.current_lng),
                'last_seen':    p.updated_at,
            }
            for p in profiles
        ]

        return Response(data)