from .token_utils import get_tokens_for_user
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import User
from .serializers import RegisterSerializer, UserSerializer, LoginSerializer


class RegisterView(generics.CreateAPIView):
    """
    Public endpoint — no auth required.
    Creates user and immediately returns JWT tokens
    so the user is logged in right after registration.
    """
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        tokens = get_tokens_for_user(user)
        return Response({
            'user':   UserSerializer(user).data,
            'tokens': tokens,
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    """
    Login with phone_number + password.
    Returns access + refresh tokens on success.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone    = serializer.validated_data['phone_number']
        password = serializer.validated_data['password']

        # Look up user by phone number
        try:
            user = User.objects.get(phone_number=phone)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid phone number or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verify password
        user = authenticate(request, username=user.username, password=password)
        if not user:
            return Response(
                {'error': 'Invalid phone number or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = get_tokens_for_user(user)
        return Response({
            'user':   UserSerializer(user).data,
            'tokens': tokens,
        })

class LogoutView(APIView):
    """
    Blacklists the refresh token so it can't be reused.
    The access token will expire naturally (60 min).

    Why not delete the access token?
    JWTs are stateless — there's nothing to delete server-side.
    We blacklist the refresh token to stop new access tokens
    from being generated.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  → returns current user's profile
    PUT/PATCH → updates current user's profile
    """
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user