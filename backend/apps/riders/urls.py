from django.urls import path
from .views import (
    RiderProfileView,
    AvailableOrdersView,
    AcceptOrderView,
    RejectOrderView,
    LocationUpdateView,
    ActiveRidersView,
)

urlpatterns = [
    # Profile
    path('profile/',                            RiderProfileView.as_view(),     name='rider-profile'),

    # Order management
    path('orders/available/',                   AvailableOrdersView.as_view(),  name='available-orders'),
    path('orders/<int:order_id>/accept/',       AcceptOrderView.as_view(),      name='accept-order'),
    path('orders/<int:order_id>/reject/',       RejectOrderView.as_view(),      name='reject-order'),

    # Location
    path('location/update/',                    LocationUpdateView.as_view(),   name='location-update'),
    path('active/',                             ActiveRidersView.as_view(),     name='active-riders'),
]