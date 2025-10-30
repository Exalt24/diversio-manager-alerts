from rest_framework import serializers
from .models import Employee, Alert


class EmployeeSerializer(serializers.ModelSerializer):
    """Nested employee serializer for alert responses."""

    class Meta:
        model = Employee
        fields = ["id", "name"]


class AlertSerializer(serializers.ModelSerializer):
    """Alert serializer with nested employee."""

    employee = EmployeeSerializer(read_only=True)

    class Meta:
        model = Alert
        fields = ["id", "employee", "severity", "category", "created_at", "status"]
