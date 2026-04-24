import logging
from .models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Central place to fire notifications.
    Every call creates a DB record AND logs the event.

    Pattern: call these from views/signals after state changes.
    In production you'd extend this to send FCM push or SMS.
    """

    @staticmethod
    def _create(user, ntype, title, body, data=None):
        try:
            Notification.objects.create(
                user=user, type=ntype,
                title=title, body=body,
                data=data or {},
            )
            logger.info(f"Notification → {user.username}: {title}")
        except Exception as e:
            logger.error(f"Notification failed: {e}")

    @classmethod
    def order_placed(cls, order):
        cls._create(
            user=order.customer,
            ntype=Notification.Type.ORDER_PLACED,
            title="Order placed",
            body=f"Your order #{order.id} has been placed. Awaiting payment.",
            data={"order_id": order.id},
        )

    @classmethod
    def payment_success(cls, payment):
        cls._create(
            user=payment.order.customer,
            ntype=Notification.Type.PAYMENT_SUCCESS,
            title="Payment confirmed ✓",
            body=f"KES {payment.amount} received. We're finding you a rider.",
            data={"order_id": payment.order.id, "receipt": payment.mpesa_receipt_number},
        )

    @classmethod
    def rider_assigned(cls, order):
        cls._create(
            user=order.customer,
            ntype=Notification.Type.RIDER_ASSIGNED,
            title="Rider on the way 🏍️",
            body=f"{order.rider.username} has been assigned to your order.",
            data={"order_id": order.id, "rider_id": order.rider.id},
        )
        # Also notify the rider
        cls._create(
            user=order.rider,
            ntype=Notification.Type.NEW_ORDER,
            title="New order assigned",
            body=f"Order #{order.id} — {order.pickup_address} → {order.delivery_address}",
            data={"order_id": order.id},
        )

    @classmethod
    def order_picked_up(cls, order):
        cls._create(
            user=order.customer,
            ntype=Notification.Type.ORDER_PICKED_UP,
            title="Order picked up 🚀",
            body=f"{order.rider.username} has collected your order and is heading your way.",
            data={"order_id": order.id},
        )

    @classmethod
    def order_delivered(cls, order):
        cls._create(
            user=order.customer,
            ntype=Notification.Type.ORDER_DELIVERED,
            title="Order delivered! 🎉",
            body=f"Your order #{order.id} has been delivered. Enjoy your meal!",
            data={"order_id": order.id, "show_rating": True},
        )
        cls._create(
            user=order.rider,
            ntype=Notification.Type.ORDER_DELIVERED,
            title="Delivery complete",
            body=f"Order #{order.id} delivered. Great work!",
            data={"order_id": order.id},
        )

    @classmethod
    def order_cancelled(cls, order):
        cls._create(
            user=order.customer,
            ntype=Notification.Type.ORDER_CANCELLED,
            title="Order cancelled",
            body=f"Order #{order.id} has been cancelled.",
            data={"order_id": order.id},
        )

    @classmethod
    def rating_received(cls, rating):
        cls._create(
            user=rating.rider,
            ntype=Notification.Type.RATING_RECEIVED,
            title=f"New rating — {'★' * rating.stars}",
            body=rating.comment or "A customer rated your delivery.",
            data={"rating_id": rating.id, "stars": rating.stars},
        )