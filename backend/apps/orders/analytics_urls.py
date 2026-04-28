from django.urls import path
from .analytics import (
    RevenueTrendView,
    PeakHoursView,
    HeatmapView,
    ZonePerformanceView,
    RiderLeaderboardView,
    KpiSummaryView,
)

urlpatterns = [
    path('revenue/',     RevenueTrendView.as_view(),      name='analytics-revenue'),
    path('peak-hours/',  PeakHoursView.as_view(),         name='analytics-peak'),
    path('heatmap/',     HeatmapView.as_view(),           name='analytics-heatmap'),
    path('zones/',       ZonePerformanceView.as_view(),   name='analytics-zones'),
    path('leaderboard/', RiderLeaderboardView.as_view(),  name='analytics-leaderboard'),
    path('kpi/',         KpiSummaryView.as_view(),        name='analytics-kpi'),
]