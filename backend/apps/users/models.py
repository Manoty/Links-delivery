from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    We add role and phone_number here.
    
    Why AbstractUser over AbstractBaseUser?
    - AbstractUser keeps all existing fields (username, email, password)
      and lets us ADD fields cleanly.
    - AbstractBaseUser requires rebuilding auth from scratch — overkill here.
    """

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        RIDER    = 'rider',    'Rider'
        ADMIN    = 'admin',    'Admin'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone_number = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    # Helper properties for clean permission checks
    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_rider(self):
        return self.role == self.Role.RIDER

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN