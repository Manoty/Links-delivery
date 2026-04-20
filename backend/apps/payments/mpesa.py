import base64
import requests
from datetime import datetime
from django.conf import settings


class MpesaService:
    """
    Handles all communication with Safaricom Daraja API.

    Why a class instead of functions?
    - Groups related methods together
    - Shares the base_url and credentials cleanly
    - Easy to swap sandbox vs production via settings
    """

    SANDBOX_URL    = 'https://sandbox.safaricom.co.ke'
    PRODUCTION_URL = 'https://api.safaricom.co.ke'

    def __init__(self):
        self.base_url       = (
            self.SANDBOX_URL
            if settings.MPESA_ENV == 'sandbox'
            else self.PRODUCTION_URL
        )
        self.consumer_key    = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode       = settings.MPESA_SHORTCODE
        self.passkey         = settings.MPESA_PASSKEY
        self.callback_url    = settings.MPESA_CALLBACK_URL

    def get_access_token(self):
        """
        OAuth2 token from Daraja.
        Required as Bearer token on every subsequent request.
        Tokens expire after 1 hour — in production you'd cache this.
        """
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"

        # Encode credentials as Base64
        credentials = base64.b64encode(
            f"{self.consumer_key}:{self.consumer_secret}".encode()
        ).decode('utf-8')

        response = requests.get(
            url,
            headers={'Authorization': f'Basic {credentials}'}
        )
        response.raise_for_status()
        return response.json()['access_token']

    def generate_password(self):
        """
        STK Push password = Base64(shortcode + passkey + timestamp).
        Safaricom uses this to verify the request is from you.
        """
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        raw       = f"{self.shortcode}{self.passkey}{timestamp}"
        password  = base64.b64encode(raw.encode()).decode('utf-8')
        return password, timestamp

    def stk_push(self, phone_number, amount, order_id):
        """
        Triggers the M-Pesa PIN prompt on the customer's phone.

        Args:
            phone_number: In format 2547XXXXXXXX (254 prefix, no +)
            amount:       Integer (M-Pesa doesn't accept decimals)
            order_id:     Used as AccountReference so we can trace it

        Returns:
            dict with CheckoutRequestID on success
        """
        access_token     = self.get_access_token()
        password, timestamp = self.generate_password()

        # Normalize phone number
        phone = self._normalize_phone(phone_number)

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password":          password,
            "Timestamp":         timestamp,
            "TransactionType":   "CustomerPayBillOnline",
            "Amount":            int(amount),      # Must be integer
            "PartyA":            phone,
            "PartyB":            self.shortcode,
            "PhoneNumber":       phone,
            "CallBackURL":       self.callback_url,
            "AccountReference":  f"Order#{order_id}",
            "TransactionDesc":   f"Payment for Order {order_id}",
        }

        response = requests.post(
            f"{self.base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        response.raise_for_status()
        return response.json()

    def _normalize_phone(self, phone):
        """
        Converts Kenyan phone formats to 2547XXXXXXXX.

        0712345678  → 254712345678
        +254712345678 → 254712345678
        254712345678 → 254712345678 (unchanged)
        """
        phone = str(phone).strip().replace(' ', '')

        if phone.startswith('+254'):
            return phone[1:]
        if phone.startswith('0'):
            return '254' + phone[1:]
        if phone.startswith('254'):
            return phone
        raise ValueError(f"Unrecognized phone format: {phone}")