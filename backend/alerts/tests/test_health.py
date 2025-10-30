import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from alerts.models import Employee, Alert


@pytest.mark.django_db
def test_health_check_success(client):
    """Test health check returns 200 when database is accessible"""
    url = reverse("health_check")
    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "employees" in data
    assert "alerts" in data


@pytest.mark.django_db
def test_health_check_returns_counts(client):
    """Test health check returns correct employee and alert counts"""
    # Create test data
    e1 = Employee.objects.create(id="E1", name="Test Manager")
    e2 = Employee.objects.create(id="E2", name="Test Employee", reports_to=e1)

    Alert.objects.create(
        id="A1",
        employee=e2,
        severity="high",
        category="test",
        created_at=timezone.now(),
        status="open",
    )

    url = reverse("health_check")
    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["employees"] == 2
    assert data["alerts"] == 1
