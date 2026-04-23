import logging
from apps.tracking.services import haversine_distance

logger = logging.getLogger(__name__)


class DispatchService:
    """
    Finds the best available rider for a given order.

    Algorithm (simple nearest-rider):
    1. Get all riders with is_available=True AND known location
    2. Calculate Haversine distance from each rider to pickup point
    3. Filter out riders beyond MAX_RADIUS_KM
    4. Return the closest one

    Why pickup point and not delivery point?
    The rider needs to get to the restaurant/store first.
    Closest to pickup = fastest to collect the order.

    Tradeoffs vs production systems:
    - We use straight-line distance, not road distance
    - No load balancing (rider with 5 deliveries vs 0)
    - No rider rating or acceptance rate weighting
    - No order batching (one order per rider)
    These are all valid Phase 2 upgrades.
    """

    MAX_RADIUS_KM = 10.0    # Only consider riders within 10km
                             # Tunable — tighter in dense cities

    def find_nearest_rider(self, order):
        """
        Returns the nearest available rider User object,
        or None if no eligible riders found.

        Args:
            order: Order instance with pickup_lat / pickup_lng set

        Returns:
            User (rider) or None
        """
        from apps.riders.models import RiderProfile

        if not order.pickup_lat or not order.pickup_lng:
            logger.warning(
                f"Order #{order.id} has no pickup coordinates — "
                f"cannot auto-dispatch."
            )
            return None

        # Fetch all available riders with a known position
        available = RiderProfile.objects.filter(
            is_available=True,
            current_lat__isnull=False,
            current_lng__isnull=False,
        ).select_related('user')

        if not available.exists():
            logger.info("No available riders with known location.")
            return None

        # Score each rider by distance to pickup
        candidates = []
        for profile in available:
            distance = haversine_distance(
                float(profile.current_lat),
                float(profile.current_lng),
                float(order.pickup_lat),
                float(order.pickup_lng),
            )
            if distance <= self.MAX_RADIUS_KM:
                candidates.append((distance, profile))
                logger.debug(
                    f"Rider {profile.user.username} — "
                    f"{distance:.2f}km from pickup"
                )

        if not candidates:
            logger.info(
                f"No riders within {self.MAX_RADIUS_KM}km "
                f"of Order #{order.id} pickup."
            )
            return None

        # Sort by distance ascending — nearest first
        candidates.sort(key=lambda x: x[0])
        nearest_distance, nearest_profile = candidates[0]

        logger.info(
            f"Nearest rider: {nearest_profile.user.username} "
            f"({nearest_distance:.2f}km away) for Order #{order.id}"
        )
        return nearest_profile.user

    def assign(self, order):
        """
        Full dispatch flow:
        1. Find nearest rider
        2. Assign to order
        3. Update rider availability
        4. Log dispatch event

        Returns:
            dict with result details
        """
        from apps.orders.models import Order
        from apps.riders.models import DispatchLog

        rider = self.find_nearest_rider(order)

        if not rider:
            return {
                'success': False,
                'reason':  'No available riders nearby.',
                'order_id': order.id,
            }

        # Calculate distance for the log
        distance = haversine_distance(
            float(rider.rider_profile.current_lat),
            float(rider.rider_profile.current_lng),
            float(order.pickup_lat),
            float(order.pickup_lng),
        )

        # Assign rider to order
        order.rider  = rider
        order.status = Order.Status.ASSIGNED
        order.save()

        # Mark rider unavailable
        rider.rider_profile.is_available = False
        rider.rider_profile.save()

        # Log the dispatch event
        DispatchLog.objects.create(
            order=order,
            rider=rider,
            distance_km=round(distance, 4),
            method='auto',
        )

        logger.info(
            f"Auto-dispatched Order #{order.id} → "
            f"Rider {rider.username} ({distance:.2f}km)"
        )

        return {
            'success':      True,
            'rider_id':     rider.id,
            'rider_name':   rider.username,
            'rider_phone':  rider.phone_number,
            'distance_km':  round(distance, 2),
            'order_id':     order.id,
        }
        
        