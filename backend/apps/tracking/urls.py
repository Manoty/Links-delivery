from django.urls import path
from .views import (
    OrderTrackingView,
    OrderRouteHistoryView,
    AdminRiderTrackingView,
    AllActiveRidersTrackingView,
)

urlpatterns = [
    # Customer tracking
    path(
        'order/<int:order_id>/location/',
        OrderTrackingView.as_view(),
        name='order-tracking'
    ),
    path(
        'order/<int:order_id>/history/',
        OrderRouteHistoryView.as_view(),
        name='order-route-history'
    ),

    # Admin tracking
    path(
        'rider/<int:rider_id>/location/',
        AdminRiderTrackingView.as_view(),
        name='admin-rider-tracking'
    ),
    path(
        'riders/live/',
        AllActiveRidersTrackingView.as_view(),
        name='all-riders-live'
    ),
]