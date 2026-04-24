import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsRider, IsAdmin, IsRiderOrAdmin
from apps.tracking.services import haversine_distance

from .models import RiderProfile, DispatchLog
from .serializers import (
    RiderProfileSerializer,
    RiderProfileUpdateSerializer,
    LocationUpdateSerializer,
)

from .dispatch import DispatchService
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.tracking.models import LocationUpdate

logger = logging.getLogger(__name__)


# =========================================================
# RIDER PROFILE
# =========================================================
class RiderProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  → rider views profile
    PUT  → rider updates vehicle / availability
    """
    permission_classes = [IsRider]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return RiderProfileUpdateSerializer
        return RiderProfileSerializer

    def get_object(self):
        return get_object_or_404(RiderProfile, user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=kwargs.pop("partial", False),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(RiderProfileSerializer(instance).data)


# =========================================================
# AVAILABLE ORDERS
# =========================================================
class AvailableOrdersView(generics.ListAPIView):
    permission_classes = [IsRider]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            status=Order.Status.PAID,
            rider__isnull=True,
        ).select_related("customer").prefetch_related("items")


# =========================================================
# ACCEPT ORDER
# =========================================================
class AcceptOrderView(APIView):
    permission_classes = [IsRider]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        if order.status != Order.Status.PAID:
            return Response(
                {"error": "Order not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.rider:
            return Response(
                {"error": "Already assigned."},
                status=status.HTTP_409_CONFLICT,
            )

        rider_profile = getattr(request.user, "rider_profile", None)
        if not rider_profile:
            return Response(
                {"error": "Rider profile missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.rider = request.user
        order.status = Order.Status.ASSIGNED
        order.save()

        rider_profile.is_available = False
        rider_profile.save()

        logger.info(f"Rider {request.user.username} accepted order {order.id}")

        return Response(OrderSerializer(order).data)


# =========================================================
# REJECT ORDER
# =========================================================
class RejectOrderView(APIView):
    permission_classes = [IsRider]

    def post(self, request, order_id):
        order = get_object_or_404(
            Order,
            id=order_id,
            rider=request.user,
            status=Order.Status.ASSIGNED,
        )

        order.rider = None
        order.status = Order.Status.PAID
        order.save()

        rider_profile = getattr(request.user, "rider_profile", None)
        if rider_profile:
            rider_profile.is_available = True
            rider_profile.save()

        return Response(
            {"message": f"Order {order.id} returned to pool."}
        )


# =========================================================
# LOCATION UPDATE
# =========================================================
class LocationUpdateView(APIView):
    permission_classes = [IsRider]

    def post(self, request):
        serializer = LocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lat = serializer.validated_data["latitude"]
        lng = serializer.validated_data["longitude"]
        order_id = serializer.validated_data.get("order_id")

        rider_profile = getattr(request.user, "rider_profile", None)
        if not rider_profile:
            return Response(
                {"error": "Rider profile missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # update current position
        rider_profile.current_lat = lat
        rider_profile.current_lng = lng
        rider_profile.save()

        order = None
        if order_id:
            try:
                order = Order.objects.get(id=order_id, rider=request.user)
            except Order.DoesNotExist:
                pass

        LocationUpdate.objects.create(
            rider=request.user,
            order=order,
            latitude=lat,
            longitude=lng,
        )

        return Response(
            {"message": "Location updated."}
        )


# =========================================================
# AUTO DISPATCH (CORE LOGIC)
# =========================================================
class AutoDispatchView(APIView):
    """
    Admin triggers nearest rider assignment.
    """
    permission_classes = [IsAdmin]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        if order.status != Order.Status.PAID:
            return Response(
                {"error": "Order must be paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = DispatchService()
        result = service.assign(order)

        if result["success"]:
            return Response(result)
        return Response(result, status=status.HTTP_404_NOT_FOUND)


# =========================================================
# DISPATCH LOGS
# =========================================================
class DispatchLogListView(generics.ListAPIView):
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return DispatchLog.objects.select_related("order", "rider").all()

    def list(self, request, *args, **kwargs):
        logs = self.get_queryset()

        return Response([
            {
                "id": log.id,
                "order_id": log.order.id,
                "rider": log.rider.username,
                "phone": log.rider.phone_number,
                "distance_km": str(log.distance_km),
                "method": log.method,
                "dispatched_at": log.dispatched_at,
            }
            for log in logs
        ])


# =========================================================
# NEAREST RIDERS PREVIEW
# =========================================================
class NearestRidersView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        if not order.pickup_lat or not order.pickup_lng:
            return Response(
                {"error": "Missing pickup coordinates."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        riders = RiderProfile.objects.filter(
            is_available=True,
            current_lat__isnull=False,
            current_lng__isnull=False,
        ).select_related("user")

        results = []

        for r in riders:
            distance = haversine_distance(
                float(r.current_lat),
                float(r.current_lng),
                float(order.pickup_lat),
                float(order.pickup_lng),
            )

            results.append({
                "rider": r.user.username,
                "phone": r.user.phone_number,
                "distance_km": round(distance, 2),
                "available": r.is_available,
            })

        results.sort(key=lambda x: x["distance_km"])

        return Response({
            "order_id": order.id,
            "riders": results,
        })
class ActiveRidersView(APIView):
    """
    Admin sees all active riders
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
                'rider_id': p.user.id,
                'username': p.user.username,
                'phone': p.user.phone_number,
                'vehicle_type': p.vehicle_type,
                'latitude': str(p.current_lat),
                'longitude': str(p.current_lng),
            }
            for p in profiles
        ]

        return Response(data)        