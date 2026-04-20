from django.urls import path
from .views import InitiatePaymentView, MpesaCallbackView, PaymentStatusView

urlpatterns = [
    path('pay/',                    InitiatePaymentView.as_view(),  name='initiate-payment'),
    path('callback/',               MpesaCallbackView.as_view(),    name='mpesa-callback'),
    path('status/<int:order_id>/',  PaymentStatusView.as_view(),    name='payment-status'),
]