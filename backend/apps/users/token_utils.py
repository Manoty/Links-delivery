from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user):
    """
    Generates JWT tokens with extra claims baked in.
    Frontend can decode the token and immediately know
    the user's role without hitting /api/users/me/.
    """
    refresh = RefreshToken.for_user(user)

    # Add custom claims
    refresh['role']         = user.role
    refresh['phone_number'] = user.phone_number
    refresh['username']     = user.username

    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }