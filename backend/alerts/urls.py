from django.urls import path
from . import views

urlpatterns = [
    path("health", views.health_check, name="health_check"),
    path("alerts", views.get_alerts, name="get_alerts"),
    path("alerts/<str:alert_id>/dismiss", views.dismiss_alert, name="dismiss_alert"),
]
