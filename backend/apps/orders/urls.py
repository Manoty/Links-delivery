from django.urls import path
from .views import (
    CustomerOrderListCreateView,
    CustomerOrderDetailView,
    AdminOrderListView,
    AdminAssignRiderView,
    AdminUpdateOrderStatusView,
    RiderOrderListView,
    RiderUpdateOrderStatusView,
    CreateRatingView, RiderRatingsView, AdminRiderRatingsView,
)

urlpatterns = [
    # Customer
    path('', CustomerOrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', CustomerOrderDetailView.as_view(), name='order-detail'),

    # Admin
    path('admin/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/<int:order_id>/assign/', AdminAssignRiderView.as_view(), name='admin-assign-rider'),
    path('admin/<int:order_id>/status/', AdminUpdateOrderStatusView.as_view(), name='admin-update-status'),

    # Rider
    path('rider/', RiderOrderListView.as_view(), name='rider-order-list'),
    path('rider/<int:order_id>/status/', RiderUpdateOrderStatusView.as_view(), name='rider-update-status'),
    
    path('rate/',                               CreateRatingView.as_view(),       name='create-rating'),
    path('my-ratings/',                         RiderRatingsView.as_view(),       name='rider-ratings'),
    path('admin/rider-ratings/<int:rider_id>/', AdminRiderRatingsView.as_view(),  name='admin-rider-ratings'),
]