from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Notification


class NotificationListView(APIView):
    """
    GET  /api/users/notifications/
    Returns latest 30 notifications for the current user.
    Frontend polls this every 10 seconds.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')[:30]

        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()

        data = [
            {
                'id':         n.id,
                'type':       n.type,
                'title':      n.title,
                'body':       n.body,
                'data':       n.data,
                'is_read':    n.is_read,
                'created_at': n.created_at,
            }
            for n in notifs
        ]

        return Response({
            'notifications': data,
            'unread_count':  unread_count,
        })


class MarkNotificationsReadView(APIView):
    """
    POST /api/users/notifications/read/
    Marks all or specific notifications as read.
    Body: { "ids": [1,2,3] } or {} for all.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', [])
        qs  = Notification.objects.filter(user=request.user, is_read=False)
        if ids:
            qs = qs.filter(id__in=ids)
        updated = qs.update(is_read=True)
        return Response({'marked_read': updated})