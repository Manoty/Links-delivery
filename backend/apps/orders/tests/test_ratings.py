import pytest
from apps.orders.models import Order, Rating


@pytest.mark.django_db
class TestRatings:

    def _delivered_order(self, sample_order, rider):
        sample_order.status = Order.Status.DELIVERED
        sample_order.rider  = rider
        sample_order.save()
        return sample_order

    def test_customer_can_rate_delivered_order(
        self, api_client, customer, rider, sample_order
    ):
        order = self._delivered_order(sample_order, rider)
        api_client.force_authenticate(user=customer)

        res = api_client.post('/api/orders/rate/', {
            'order_id': order.id,
            'stars':    5,
            'comment':  'Great service!',
        }, format='json')

        assert res.status_code == 201
        assert Rating.objects.filter(order=order).exists()
        rating = Rating.objects.get(order=order)
        assert rating.stars   == 5
        assert rating.rider   == rider
        assert rating.customer == customer

    def test_cannot_rate_undelivered_order(
        self, api_client, customer, sample_order
    ):
        api_client.force_authenticate(user=customer)
        res = api_client.post('/api/orders/rate/', {
            'order_id': sample_order.id,
            'stars':    4,
        }, format='json')
        assert res.status_code == 400

    def test_cannot_double_rate(
        self, api_client, customer, rider, sample_order
    ):
        order = self._delivered_order(sample_order, rider)
        Rating.objects.create(
            order=order, customer=customer,
            rider=rider, stars=4
        )
        api_client.force_authenticate(user=customer)
        res = api_client.post('/api/orders/rate/', {
            'order_id': order.id, 'stars': 5,
        }, format='json')
        assert res.status_code == 400

    def test_invalid_stars_rejected(
        self, api_client, customer, rider, sample_order
    ):
        order = self._delivered_order(sample_order, rider)
        api_client.force_authenticate(user=customer)
        res = api_client.post('/api/orders/rate/', {
            'order_id': order.id, 'stars': 6,
        }, format='json')
        assert res.status_code == 400

    def test_rider_can_view_ratings(
        self, api_client, rider, customer, sample_order
    ):
        order = self._delivered_order(sample_order, rider)
        Rating.objects.create(
            order=order, customer=customer,
            rider=rider, stars=5, comment='Fast!'
        )
        api_client.force_authenticate(user=rider)
        res = api_client.get('/api/orders/my-ratings/')
        assert res.status_code == 200
        assert res.data['count']   == 1
        assert res.data['average'] == 5.0

    def test_rider_rating_creates_notification(
        self, api_client, customer, rider, sample_order
    ):
        from apps.users.models import Notification
        order = self._delivered_order(sample_order, rider)
        api_client.force_authenticate(user=customer)
        api_client.post('/api/orders/rate/', {
            'order_id': order.id, 'stars': 5,
            'comment': 'Excellent!',
        }, format='json')

        notif = Notification.objects.filter(
            user=rider,
            type=Notification.Type.RATING_RECEIVED
        ).first()
        assert notif is not None
        assert '5' in notif.title or '★★★★★' in notif.title


@pytest.mark.django_db
class TestNotifications:

    def test_notification_created_on_order_place(
        self, api_client, customer
    ):
        from apps.users.models import Notification
        api_client.force_authenticate(user=customer)
        api_client.post('/api/orders/', {
            'delivery_address': 'Westlands',
            'pickup_address':   'Sarit',
            'total_amount':     '500.00',
            'items': [{'name': 'Burger', 'quantity': 1, 'price': '500.00'}],
        }, format='json')

        assert Notification.objects.filter(
            user=customer,
            type=Notification.Type.ORDER_PLACED
        ).exists()

    def test_unread_count_decrements_on_mark_read(
        self, api_client, customer
    ):
        from apps.users.models import Notification
        Notification.objects.create(
            user=customer, type='order_placed',
            title='Test', body='Test body',
        )
        api_client.force_authenticate(user=customer)

        res1 = api_client.get('/api/users/notifications/')
        assert res1.data['unread_count'] == 1

        api_client.post('/api/users/notifications/read/', {}, format='json')

        res2 = api_client.get('/api/users/notifications/')
        assert res2.data['unread_count'] == 0