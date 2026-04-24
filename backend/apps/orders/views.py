from apps.users.notifications import NotificationService
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Order
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    AssignRiderSerializer,
    UpdateOrderStatusSerializer,
)
from apps.users.permissions import IsCustomer, IsAdmin, IsRider, IsRiderOrAdmin
from apps.users.models import User


# ─── Customer Views ───────────────────────────────────────────────────────────

class CustomerOrderListCreateView(generics.ListCreateAPIView):
    """
    GET  → customer sees only their own orders
    POST → customer places a new order
    """
    permission_classes = [IsCustomer]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        # Customers only see their own orders — enforced here, not in model
        return Order.objects.filter(
            customer=self.request.user
        ).prefetch_related('items')

    def perform_create(self, serializer):
        order = serializer.save(customer=self.request.user)
        NotificationService.order_placed(order)

class CustomerOrderDetailView(generics.RetrieveAPIView):
    """Customer views a single order — must own it."""
    serializer_class   = OrderSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        ).prefetch_related('items')


# ─── Admin Views ──────────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    """Admin sees all orders across all customers."""
    serializer_class   = OrderSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        queryset = Order.objects.all().prefetch_related('items')

        # Optional filters via query params
        # e.g. /api/orders/admin/?status=pending
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


class AdminAssignRiderView(APIView):
    """
    Admin manually assigns a rider to a pending/paid order.
    POST /api/orders/admin/<order_id>/assign/
    Body: { "rider_id": 5 }
    """
    permission_classes = [IsAdmin]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        if order.status not in [Order.Status.PENDING, Order.Status.PAID]:
            return Response(
                {'error': f"Cannot assign rider to order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AssignRiderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rider = User.objects.get(
            id=serializer.validated_data['rider_id'],
            role='rider'
        )

        order.rider  = rider
        order.status = Order.Status.ASSIGNED
        order.save()
        
        NotificationService.rider_assigned(order)


        # Mark rider as unavailable
        if hasattr(rider, 'rider_profile'):
            rider.rider_profile.is_available = False
            rider.rider_profile.save()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK
        )


class AdminUpdateOrderStatusView(APIView):
    """
    Admin updates order status manually.
    PUT /api/orders/admin/<order_id>/status/
    Body: { "status": "delivered" }
    """
    permission_classes = [IsAdmin]

    def put(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        serializer = UpdateOrderStatusSerializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)

        new_status   = serializer.validated_data['status']
        order.status = new_status
        order.save()
        
        if new_status == Order.Status.PICKED_UP:
            NotificationService.order_picked_up(order)
        elif new_status == Order.Status.DELIVERED:
            NotificationService.order_delivered(order)
        elif new_status == Order.Status.CANCELLED:
            NotificationService.order_cancelled(order)

        # Free up rider when order completes or is cancelled
        if new_status in [Order.Status.DELIVERED, Order.Status.CANCELLED]:
            if order.rider and hasattr(order.rider, 'rider_profile'):
                order.rider.rider_profile.is_available = True
                order.rider.rider_profile.save()

        return Response(OrderSerializer(order).data)


# ─── Rider Views ──────────────────────────────────────────────────────────────

class RiderOrderListView(generics.ListAPIView):
    """Rider sees orders assigned to them."""
    serializer_class   = OrderSerializer
    permission_classes = [IsRider]

    def get_queryset(self):
        return Order.objects.filter(
            rider=self.request.user
        ).prefetch_related('items')


class RiderUpdateOrderStatusView(APIView):
    """
    Rider updates status of their assigned order.
    PUT /api/orders/rider/<order_id>/status/
    Body: { "status": "picked_up" } or { "status": "delivered" }

    Why does rider have a separate view from admin?
    - Rider can only update THEIR orders
    - Rider can only move to picked_up or delivered
    - Admin can update any order to any valid status
    Keeping them separate enforces this cleanly.
    """
    permission_classes = [IsRider]

    def put(self, request, order_id):
        order = get_object_or_404(
            Order,
            id=order_id,
            rider=request.user   # Rider can only touch their own orders
        )

        # Riders can only set these two statuses
        rider_allowed = [Order.Status.PICKED_UP, Order.Status.DELIVERED]
        incoming = request.data.get('status')

        if incoming not in rider_allowed:
            return Response(
                {'error': f"Riders can only set status to: {rider_allowed}"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UpdateOrderStatusSerializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)

        order.status = serializer.validated_data['status']
        order.save()
        
        if order.status == Order.Status.PICKED_UP:
            NotificationService.order_picked_up(order)
        elif order.status == Order.Status.DELIVERED:
            NotificationService.order_delivered(order)

        # Free up rider when delivered
        if order.status == Order.Status.DELIVERED:
            if hasattr(request.user, 'rider_profile'):
                request.user.rider_profile.is_available = True
                request.user.rider_profile.save()

        return Response(OrderSerializer(order).data)