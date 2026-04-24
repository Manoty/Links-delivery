from django.contrib import admin
from .models import Order, OrderItem, Rating

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ['id', 'customer', 'rider', 'status', 'total_amount', 'created_at']
    list_filter   = ['status']
    inlines       = [OrderItemInline]
    
@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ['order', 'customer', 'rider', 'stars', 'created_at']
    list_filter  = ['stars']    