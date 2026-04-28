from django.db.models import (
    Sum, Count, Avg, Q, FloatField, ExpressionWrapper, F
)
from django.db.models.functions import (
    TruncDate, TruncHour, ExtractHour, ExtractWeekDay
)
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsAdmin
from .models import Order, Rating
from apps.payments.models import Payment
from apps.riders.models import RiderProfile
from apps.users.models import User


class RevenueTrendView(APIView):
    """
    GET /api/analytics/revenue/?range=7d|30d
    Returns daily revenue + order count for the chosen range.
    Powers the revenue trend chart.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        days     = 30 if request.query_params.get('range') == '30d' else 7
        since    = timezone.now() - timedelta(days=days)

        rows = (
            Order.objects
            .filter(status='delivered', created_at__gte=since)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                revenue=Sum('total_amount'),
                orders=Count('id'),
            )
            .order_by('day')
        )

        data = [
            {
                'date':    r['day'].strftime('%d/%m'),
                'revenue': float(r['revenue'] or 0),
                'orders':  r['orders'],
            }
            for r in rows
        ]
        return Response(data)


class PeakHoursView(APIView):
    """
    GET /api/analytics/peak-hours/
    Returns order count grouped by hour-of-day (0-23).
    Powers the peak hours bar chart.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        since = timezone.now() - timedelta(days=7)

        rows = (
            Order.objects
            .filter(created_at__gte=since)
            .annotate(hour=ExtractHour('created_at'))
            .values('hour')
            .annotate(orders=Count('id'))
            .order_by('hour')
        )

        # Build full 24-hour array (missing hours = 0)
        hour_map = {r['hour']: r['orders'] for r in rows}
        data = [
            {'hour': h, 'label': self._label(h), 'orders': hour_map.get(h, 0)}
            for h in range(6, 23)
        ]
        return Response(data)

    @staticmethod
    def _label(h):
        if h == 0:   return '12am'
        if h < 12:   return f'{h}am'
        if h == 12:  return '12pm'
        return f'{h - 12}pm'


class HeatmapView(APIView):
    """
    GET /api/analytics/heatmap/
    Returns order counts by day-of-week × hour-of-day.
    Powers the heatmap grid.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        since = timezone.now() - timedelta(days=28)

        rows = (
            Order.objects
            .filter(created_at__gte=since)
            .annotate(
                dow=ExtractWeekDay('created_at'),
                hour=ExtractHour('created_at'),
            )
            .values('dow', 'hour')
            .annotate(orders=Count('id'))
        )

        # Build matrix [day][hour]
        matrix = {d: {h: 0 for h in range(6, 23)} for d in range(1, 8)}
        for r in rows:
            d, h = r['dow'], r['hour']
            if 6 <= h <= 22:
                matrix[d][h] = r['orders']

        # Django: 1=Sunday, 2=Monday … 7=Saturday
        day_map = {2:'Mon',3:'Tue',4:'Wed',5:'Thu',6:'Fri',7:'Sat',1:'Sun'}
        data = [
            {
                'day':   day_map[d],
                'hours': [
                    {'hour': h, 'orders': matrix[d][h]}
                    for h in range(6, 23)
                ]
            }
            for d in [2, 3, 4, 5, 6, 7, 1]
        ]
        return Response(data)


class ZonePerformanceView(APIView):
    """
    GET /api/analytics/zones/
    Revenue and order count grouped by delivery_address prefix.
    Simple text matching — upgrade to PostGIS for geo zones later.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        since = timezone.now() - timedelta(days=30)

        ZONES = ['Westlands', 'CBD', 'Kilimani', 'Parklands', 'Karen', 'Lavington', 'Ngong Road']

        results = []
        total_rev = float(
            Order.objects
            .filter(status='delivered', created_at__gte=since)
            .aggregate(t=Sum('total_amount'))['t'] or 0
        )

        for zone in ZONES:
            agg = (
                Order.objects
                .filter(
                    status='delivered',
                    created_at__gte=since,
                    delivery_address__icontains=zone,
                )
                .aggregate(
                    revenue=Sum('total_amount'),
                    orders=Count('id'),
                )
            )
            rev = float(agg['revenue'] or 0)
            if rev > 0:
                results.append({
                    'zone':    zone,
                    'revenue': rev,
                    'orders':  agg['orders'],
                    'pct':     round(rev / total_rev * 100, 1) if total_rev else 0,
                })

        results.sort(key=lambda x: -x['revenue'])
        return Response(results)


class RiderLeaderboardView(APIView):
    """
    GET /api/analytics/leaderboard/?metric=deliveries|rating|speed
    Returns sorted rider stats for the leaderboard table.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        metric = request.query_params.get('metric', 'deliveries')
        since  = timezone.now() - timedelta(days=7)

        riders = (
            User.objects
            .filter(role='rider')
            .prefetch_related('deliveries', 'received_ratings')
        )

        results = []
        for rider in riders:
            delivered = rider.deliveries.filter(
                status='delivered',
                updated_at__gte=since,
            )
            count    = delivered.count()
            ratings  = rider.received_ratings.all()
            avg_rating = (
                round(sum(r.stars for r in ratings) / ratings.count(), 1)
                if ratings.count() else None
            )
            results.append({
                'rider_id':    rider.id,
                'rider_name':  rider.username,
                'phone':       rider.phone_number,
                'deliveries':  count,
                'rating':      avg_rating,
                'avg_time_min': 24,  # Placeholder — add actual timing in Phase 2
            })

        # Sort
        if metric == 'rating':
            results.sort(key=lambda x: -(x['rating'] or 0))
        elif metric == 'speed':
            results.sort(key=lambda x: x['avg_time_min'])
        else:
            results.sort(key=lambda x: -x['deliveries'])

        return Response(results[:10])


class KpiSummaryView(APIView):
    """
    GET /api/analytics/kpi/
    Single endpoint for the 4 KPI cards.
    Called on dashboard load + every 30s auto-refresh.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        now       = timezone.now()
        today     = now.date()
        yesterday = today - timedelta(days=1)

        def day_stats(date):
            orders = Order.objects.filter(created_at__date=date)
            delivered = orders.filter(status='delivered')
            return {
                'revenue':   float(delivered.aggregate(r=Sum('total_amount'))['r'] or 0),
                'orders':    orders.count(),
                'delivered': delivered.count(),
            }

        t = day_stats(today)
        y = day_stats(yesterday)

        pay_success = Payment.objects.filter(
            created_at__date=today
        ).count()
        pay_total   = Payment.objects.filter(
            created_at__date=today
        ).count() or 1
        pay_failed  = Payment.objects.filter(
            created_at__date=today,
            status='failed',
        ).count()

        def pct_delta(curr, prev):
            if not prev: return None
            return round((curr - prev) / prev * 100, 1)

        return Response({
            'revenue': {
                'value': t['revenue'],
                'delta': pct_delta(t['revenue'], y['revenue']),
            },
            'orders': {
                'value': t['orders'],
                'delta': t['orders'] - y['orders'],
            },
            'avg_delivery_min': 24,
            'payment_success_pct': round(
                (pay_success - pay_failed) / pay_success * 100, 1
            ) if pay_success else 0,
        })