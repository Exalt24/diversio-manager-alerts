import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.http import JsonResponse
from django.db.models import Q
from .models import Employee, Alert
from .serializers import AlertSerializer
from .utils import get_employee_subtree

logger = logging.getLogger("alerts")


@api_view(["GET"])
def health_check(request):
    """
    Health check endpoint for monitoring.
    Returns 200 if database is accessible.
    """
    try:
        # Check database connection
        connection.ensure_connection()

        # Simple query to verify DB works
        employee_count = Employee.objects.count()
        alert_count = Alert.objects.count()

        return JsonResponse(
            {
                "status": "healthy",
                "database": "connected",
                "employees": employee_count,
                "alerts": alert_count,
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=503)


@api_view(["GET"])
def get_alerts(request):
    """
    GET /api/alerts
    Query params:
    - manager_id (required): Employee ID
    - scope (optional, default: direct): 'direct' or 'subtree'
    - severity (optional): comma-separated list of 'low', 'medium', 'high'
    - status (optional, default: all): comma-separated list of 'open', 'dismissed'
    - q (optional): case-insensitive search on employee name
    Returns: List of alerts sorted by created_at DESC, id ASC
    """
    # Validate manager_id (required)
    manager_id = request.GET.get("manager_id")
    if not manager_id:
        logger.warning("get_alerts called without manager_id")
        return Response(
            {"detail": "manager_id is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check if manager exists
    if not Employee.objects.filter(id=manager_id).exists():
        logger.warning(f"Manager not found: {manager_id}")
        return Response(
            {"detail": "manager not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Validate scope
    scope = request.GET.get("scope", "direct")
    if scope not in ["direct", "subtree"]:
        logger.warning(f"Invalid scope: {scope}")
        return Response({"detail": "invalid scope"}, status=status.HTTP_400_BAD_REQUEST)

    # Validate severity
    severity_param = request.GET.get("severity")
    severity_filter = []
    if severity_param:
        severity_filter = [s.strip() for s in severity_param.split(",")]
        valid_severities = {"low", "medium", "high"}
        if not all(s in valid_severities for s in severity_filter):
            logger.warning(f"Invalid severity: {severity_param}")
            return Response(
                {"detail": "invalid severity"}, status=status.HTTP_400_BAD_REQUEST
            )

    # Validate status
    status_param = request.GET.get("status")
    status_filter = []
    if status_param:
        status_filter = [s.strip() for s in status_param.split(",")]
        valid_statuses = {"open", "dismissed"}
        if not all(s in valid_statuses for s in status_filter):
            logger.warning(f"Invalid status: {status_param}")
            return Response(
                {"detail": "invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

    # Get employee IDs in scope (excluding manager)
    try:
        employee_ids = get_employee_subtree(manager_id, scope)
    except Exception as e:
        logger.error(f"Error in get_employee_subtree: {str(e)}")
        raise

    # Base query: alerts for employees in scope
    alerts = Alert.objects.filter(employee_id__in=employee_ids)

    # Apply severity filter
    if severity_filter:
        alerts = alerts.filter(severity__in=severity_filter)

    # Apply status filter (default: all)
    if status_filter:
        alerts = alerts.filter(status__in=status_filter)

    # Apply employee name search
    q = request.GET.get("q")
    if q:
        alerts = alerts.filter(employee__name__icontains=q)

    logger.info(
        f"get_alerts: manager={manager_id}, scope={scope}, results={alerts.count()}"
    )

    # Sort is handled by Alert.Meta.ordering: ['-created_at', 'id']
    # Serialize and return
    serializer = AlertSerializer(alerts, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def dismiss_alert(request, alert_id):
    """
    POST /api/alerts/{alert_id}/dismiss
    Dismiss an alert. Idempotent - returns 200 even if already dismissed.
    Returns: Updated alert
    """
    try:
        alert = Alert.objects.get(id=alert_id)
    except Alert.DoesNotExist:
        logger.warning(f"Alert not found: {alert_id}")
        return Response({"detail": "alert not found"}, status=status.HTTP_404_NOT_FOUND)

    # Set status to dismissed (idempotent)
    alert.status = "dismissed"
    alert.save()

    logger.info(f"Alert dismissed: {alert_id}")

    serializer = AlertSerializer(alert)
    return Response(serializer.data, status=status.HTTP_200_OK)
