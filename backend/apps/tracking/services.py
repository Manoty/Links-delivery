import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates straight-line distance between two GPS coordinates
    using the Haversine formula. Returns distance in kilometres.

    Why Haversine?
    The Earth is a sphere — you can't use flat Pythagorean geometry
    for GPS coordinates. Haversine accounts for Earth's curvature.
    It's accurate enough for city-scale delivery distances.

    Limitations:
    - Straight-line distance, not road distance
    - Real systems use routing APIs (Google Maps, OSRM) for road distance
    - For MVP, straight-line with a road multiplier is good enough

    Args:
        lat1, lon1: Rider's current position
        lat2, lon2: Customer's delivery position

    Returns:
        Distance in kilometres (float)
    """
    R = 6371  # Earth's radius in kilometres

    # Convert degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [
        float(lat1), float(lon1),
        float(lat2), float(lon2)
    ])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(lat1) * math.cos(lat2) *
        math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    return R * c


def calculate_eta(rider_lat, rider_lng, delivery_lat, delivery_lng):
    """
    Estimates delivery time in minutes.

    Approach:
    1. Calculate straight-line distance via Haversine
    2. Apply road multiplier (roads are ~1.4x straight-line distance)
    3. Divide by average motorcycle speed in Nairobi traffic (25 km/h)
    4. Add 2 min buffer for pickup/handoff

    Why 25 km/h average?
    Nairobi traffic is dense. A motorcycle doing 40–60 km/h on open
    road averages ~25 km/h city-wide including stops and junctions.
    This is a tunable constant — adjust based on real delivery data.

    Returns:
        ETA in minutes (int), or None if coordinates missing
    """
    if any(v is None for v in [rider_lat, rider_lng, delivery_lat, delivery_lng]):
        return None

    ROAD_MULTIPLIER   = 1.4    # Road distance ≈ 1.4× straight-line
    AVG_SPEED_KMH     = 25     # Avg motorcycle speed in city traffic
    HANDOFF_BUFFER    = 2      # Minutes for handoff at delivery point

    straight_line_km = haversine_distance(
        rider_lat, rider_lng,
        delivery_lat, delivery_lng
    )
    road_distance_km = straight_line_km * ROAD_MULTIPLIER
    travel_minutes   = (road_distance_km / AVG_SPEED_KMH) * 60

    return max(1, round(travel_minutes + HANDOFF_BUFFER))