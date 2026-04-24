import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Payment
from .serializers import InitiatePaymentSerializer, PaymentSerializer
from .mpesa import MpesaService
from apps.orders.models import Order
from apps.users.permissions import IsCustomer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from apps.users.notifications import NotificationService

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    """
    Customer triggers STK Push for their order.
    POST /api/payments/pay/
    Body: { "order_id": 1, "phone_number": "0712345678" }
    """
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = InitiatePaymentSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        order_id     = serializer.validated_data['order_id']
        phone_number = serializer.validated_data['phone_number']
        order        = Order.objects.get(id=order_id)

        # Create a pending Payment record before calling Daraja
        # Why? If Daraja call fails, we still have a record of the attempt
        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                'phone_number': phone_number,
                'amount':       order.total_amount,
                'status':       Payment.Status.PENDING,
            }
        )

        # If payment exists and already succeeded, block retry
        if not created and payment.status == Payment.Status.SUCCESS:
            return Response(
                {'error': 'This order has already been paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update phone in case customer is retrying with different number
        if not created:
            payment.phone_number = phone_number
            payment.status       = Payment.Status.PENDING
            payment.save()

        try:
            mpesa    = MpesaService()
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=order.total_amount,
                order_id=order.id,
            )

            # Store CheckoutRequestID — needed to match the callback
            checkout_request_id = response.get('CheckoutRequestID')
            payment.mpesa_checkout_request_id = checkout_request_id
            payment.save()

            return Response({
                'message':              'STK Push sent. Enter your M-Pesa PIN.',
                'checkout_request_id':  checkout_request_id,
                'order_id':             order.id,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"M-Pesa STK Push failed for order {order_id}: {e}")
            payment.status = Payment.Status.FAILED
            payment.save()
            return Response(
                {'error': 'Payment initiation failed. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackView(APIView):
    """
    Safaricom calls this URL after the customer enters their PIN.
    This endpoint must be publicly accessible (via ngrok locally).

    IMPORTANT: No authentication here — Safaricom doesn't send JWT tokens.
    We verify legitimacy by matching CheckoutRequestID instead.

    Why AllowAny?
    Safaricom's servers call this endpoint, not our users.
    They can't get a JWT token. We trust the callback by
    validating the CheckoutRequestID exists in our DB.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"M-Pesa Callback received: {data}")

        try:
            # Safaricom wraps everything in Body.stkCallback
            callback     = data['Body']['stkCallback']
            result_code  = callback['ResultCode']
            checkout_id  = callback['CheckoutRequestID']

            # Find the payment by CheckoutRequestID
            try:
                payment = Payment.objects.get(
                    mpesa_checkout_request_id=checkout_id
                )
            except Payment.DoesNotExist:
                logger.warning(f"Callback for unknown CheckoutRequestID: {checkout_id}")
                return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

            if result_code == 0:
                # Payment successful
                # Extract receipt from callback metadata
                items = callback.get('CallbackMetadata', {}).get('Item', [])
                meta  = {item['Name']: item.get('Value') for item in items}

                payment.status               = Payment.Status.SUCCESS
                payment.mpesa_receipt_number = meta.get('MpesaReceiptNumber')
                payment.save()

                # Advance the order to PAID
                order        = payment.order
                order.status = Order.Status.PAID
                order.save()
                
                NotificationService.payment_success(payment)

                logger.info(
                    f"Payment SUCCESS — Order #{order.id} | "
                    f"Receipt: {payment.mpesa_receipt_number}"
                )

            else:
                # Payment failed or cancelled by user
                payment.status = Payment.Status.FAILED
                payment.save()
                logger.info(
                    f"Payment FAILED — Order #{payment.order.id} | "
                    f"ResultCode: {result_code} | "
                    f"Reason: {callback.get('ResultDesc')}"
                )

        except Exception as e:
            # Always return 200 to Safaricom even on our errors
            # If we return 4xx/5xx, Safaricom retries repeatedly
            logger.error(f"Callback processing error: {e}")

        # Always acknowledge receipt to Safaricom
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})


class PaymentStatusView(APIView):
    """
    Customer polls this to check if payment went through.
    GET /api/payments/status/<order_id>/

    Why polling here?
    The STK Push is async. After triggering it, the frontend
    polls this endpoint every 3 seconds until status != pending.
    """
    permission_classes = [IsCustomer]

    def get(self, request, order_id):
        try:
            payment = Payment.objects.get(
                order__id=order_id,
                order__customer=request.user,
            )
        except Payment.DoesNotExist:
            return Response(
                {'error': 'No payment found for this order.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(PaymentSerializer(payment).data)