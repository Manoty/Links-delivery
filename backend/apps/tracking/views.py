import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import LocationUpdate
from .serializers import LocationUpdateReadSerializer, TrackingResponseSerializer
from .services import calculate_eta
from apps.orders.models import Order
from apps.users.models import User
from apps.users.permissions import IsCustomer, IsAdmin, IsRiderOrAdmin

logger = logging.getLogger(__name__)


class OrderTrackingView(APIView):
    """
    Customer polls this to get live rider position + ETA.
    GET /api/tracking/order/<order_id>/location/

    Called every 5 seconds by the frontend.
    Returns everything the map needs in one response:
      - Rider's latest coordinates
      - Order status
      - ETA in minutes
      - Delivery destination coordinates (to draw the route)

    Why one fat response instead of separate calls?
    Mobile apps on Kenyan networks benefit from fewer round-trips.
    Bundling everything reduces latency and data usage.
    """
    permission_classes = [IsCustomer]

    def get(self, request, order_id):
        # Customer can only track their own orders
        order = get_object_or_404(
            Order,
            id=order_id,
            customer=request.user,
        )

        # Orders without a rider have no position to report
        if not order.rider:
            return Response({
                'order_id':     order.id,
                'order_status': order.status,
                'rider_name':   None,
                'rider_phone':  None,
                'latitude':     None,
                'longitude':    None,
                'last_updated': None,
                'eta_minutes':  None,
                'delivery_lat': str(order.delivery_lat) if order.delivery_lat else None,
                'delivery_lng': str(order.delivery_lng) if order.delivery_lng else None,
            })

        # Get the most recent location for this rider on this order
        latest = (
            LocationUpdate.objects
            .filter(rider=order.rider, order=order)
            .order_by('-timestamp')
            .first()
        )

        # Fall back to rider's profile position if no order-linked update yet
        if not latest:
            profile = getattr(order.rider, 'rider_profile', None)
            lat = profile.current_lat if profile else None
            lng = profile.current_lng if profile else None
            last_updated = profile.updated_at if profile else None
        else:
            lat          = latest.latitude
            lng          = latest.longitude
            last_updated = latest.timestamp

        # Calculate ETA only when order is active
        eta = None
        if order.status in [Order.Status.ASSIGNED, Order.Status.PICKED_UP]:
            eta = calculate_eta(
                rider_lat=lat,
                rider_lng=lng,
                delivery_lat=order.delivery_lat,
                delivery_lng=order.delivery_lng,
            )

        payload = {
            'order_id':     order.id,
            'order_status': order.status,
            'rider_name':   order.rider.get_full_name() or order.rider.username,
            'rider_phone':  order.rider.phone_number,
            'latitude':     str(lat) if lat else None,
            'longitude':    str(lng) if lng else None,
            'last_updated': last_updated,
            'eta_minutes':  eta,
            'delivery_lat': str(order.delivery_lat) if order.delivery_lat else None,
            'delivery_lng': str(order.delivery_lng) if order.delivery_lng else None,
        }

        serializer = TrackingResponseSerializer(payload)
        return Response(serializer.data)


class OrderRouteHistoryView(APIView):
    """
    Returns all location points for this order as an ordered list.
    GET /api/tracking/order/<order_id>/history/

    Used by Leaflet to draw a polyline showing the rider's route.
    Frontend maps this directly:
      points.map(p => [p.latitude, p.longitude])

    Why return the full history?
    As the rider moves, the polyline grows. Each poll adds new points
    to the existing line on the map — gives the route-replay effect.
    """
    permission_classes = [IsCustomer]

    def get(self, request, order_id):
        order = get_object_or_404(
            Order,
            id=order_id,
            customer=request.user,
        )

        if not order.rider:
            return Response([])

        updates = (
            LocationUpdate.objects
            .filter(rider=order.rider, order=order)
            .order_by('timestamp')   # Oldest first — correct polyline order
        )

        serializer = LocationUpdateReadSerializer(updates, many=True)
        return Response(serializer.data)


class AdminRiderTrackingView(APIView):
    """
    Admin tracks any specific rider live.
    GET /api/tracking/rider/<rider_id>/location/

    Used in admin dashboard dispatch view.
    Returns rider's latest position regardless of order.
    """
    permission_classes = [IsAdmin]

    def get(self, request, rider_id):
        rider = get_object_or_404(
            User,
            id=rider_id,
            role='rider'
        )

        profile = getattr(rider, 'rider_profile', None)
        latest  = (
            LocationUpdate.objects
            .filter(rider=rider)
            .order_by('-timestamp')
            .first()
        )

        # Active order for context
        active_order = (
            Order.objects
            .filter(
                rider=rider,
                status__in=[Order.Status.ASSIGNED, Order.Status.PICKED_UP]
            )
            .first()
        )

        return Response({
            'rider_id':       rider.id,
            'rider_name':     rider.username,
            'rider_phone':    rider.phone_number,
            'is_available':   profile.is_available if profile else None,
            'vehicle_type':   profile.vehicle_type if profile else None,
            'latitude':       str(latest.latitude)  if latest else None,
            'longitude':      str(latest.longitude) if latest else None,
            'last_updated':   latest.timestamp      if latest else None,
            'active_order_id': active_order.id      if active_order else None,
        })


class AllActiveRidersTrackingView(APIView):
    """
    Admin sees all riders with recent location updates.
    GET /api/tracking/riders/live/

    Powers the admin map overview — all riders as markers.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.riders.models import RiderProfile
        from django.utils import timezone
        from datetime import timedelta

        # Only riders who updated in the last 2 minutes are "live"
        two_minutes_ago = timezone.now() - timedelta(minutes=2)

        profiles = (
            RiderProfile.objects
            .filter(
                updated_at__gte=two_minutes_ago,
                current_lat__isnull=False,
                current_lng__isnull=False,
            )
            .select_related('user')
        )

        data = []
        for p in profiles:
            active_order = (
                Order.objects
                .filter(
                    rider=p.user,
                    status__in=[Order.Status.ASSIGNED, Order.Status.PICKED_UP]
                )
                .first()
            )
            data.append({
                'rider_id':        p.user.id,
                'rider_name':      p.user.username,
                'is_available':    p.is_available,
                'vehicle_type':    p.vehicle_type,
                'latitude':        str(p.current_lat),
                'longitude':       str(p.current_lng),
                'last_updated':    p.updated_at,
                'active_order_id': active_order.id if active_order else None,
            })

        return Response(data)