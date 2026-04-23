from django.urls import path
from .views import (
    RiderProfileView,
    AvailableOrdersView,
    AcceptOrderView,
    RejectOrderView,
    LocationUpdateView,
    ActiveRidersView,
    AutoDispatchView,
    DispatchLogListView,
    NearestRidersView,
)

urlpatterns = [
    # Profile
    path('profile/',                        RiderProfileView.as_view(),     name='rider-profile'),

    # Order management
    path('orders/available/',               AvailableOrdersView.as_view(),  name='available-orders'),
    path('orders/<int:order_id>/accept/',   AcceptOrderView.as_view(),      name='accept-order'),
    path('orders/<int:order_id>/reject/',   RejectOrderView.as_view(),      name='reject-order'),

    # Location
    path('location/update/',                LocationUpdateView.as_view(),   name='location-update'),
    path('active/',                         ActiveRidersView.as_view(),     name='active-riders'),

    # Dispatch
    path('dispatch/<int:order_id>/',        AutoDispatchView.as_view(),     name='auto-dispatch'),
    path('dispatch/logs/',                  DispatchLogListView.as_view(),  name='dispatch-logs'),
    path('nearest/<int:order_id>/',         NearestRidersView.as_view(),    name='nearest-riders'),
]