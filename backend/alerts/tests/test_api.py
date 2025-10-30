import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from alerts.models import Employee, Alert
from datetime import datetime


@pytest.mark.django_db
class TestAlertsAPI(TestCase):
    """Comprehensive API tests for alerts endpoint."""

    def setUp(self):
        """Create test data matching seed_data.json."""
        self.client = APIClient()

        # Create employees
        employees = [
            {"id": "E1", "name": "Taylor Reed", "reports_to": None},
            {"id": "E2", "name": "Alex Morgan", "reports_to": None},
            {"id": "E3", "name": "Jordan Lee", "reports_to": None},
            {"id": "E4", "name": "Casey Kim", "reports_to": None},
            {"id": "E5", "name": "Riley Chen", "reports_to": None},
            {"id": "E6", "name": "Sam Patel", "reports_to": None},
            {"id": "E7", "name": "Jamie Singh", "reports_to": None},
            {"id": "E8", "name": "Morgan Diaz", "reports_to": None},
            {"id": "E9", "name": "Avery Brooks", "reports_to": None},
            {"id": "E10", "name": "Quinn Park", "reports_to": None},
        ]

        for emp in employees:
            Employee.objects.create(id=emp["id"], name=emp["name"])

        # Set up relationships
        Employee.objects.filter(id="E2").update(reports_to_id="E1")
        Employee.objects.filter(id="E3").update(reports_to_id="E2")
        Employee.objects.filter(id="E4").update(reports_to_id="E2")
        Employee.objects.filter(id="E5").update(reports_to_id="E3")
        Employee.objects.filter(id="E6").update(reports_to_id="E7")
        Employee.objects.filter(id="E7").update(reports_to_id="E8")
        Employee.objects.filter(id="E8").update(reports_to_id="E6")
        Employee.objects.filter(id="E9").update(reports_to_id="E2")
        Employee.objects.filter(id="E10").update(reports_to_id="E9")

        # Create alerts matching seed data
        alerts = [
            {
                "id": "A1",
                "employee_id": "E3",
                "severity": "high",
                "category": "retention",
                "created_at": "2025-09-01T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A2",
                "employee_id": "E4",
                "severity": "medium",
                "category": "engagement",
                "created_at": "2025-09-02T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A3",
                "employee_id": "E5",
                "severity": "low",
                "category": "workload",
                "created_at": "2025-09-03T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A4",
                "employee_id": "E5",
                "severity": "high",
                "category": "retention",
                "created_at": "2025-09-04T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A5",
                "employee_id": "E9",
                "severity": "medium",
                "category": "engagement",
                "created_at": "2025-09-05T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A6",
                "employee_id": "E10",
                "severity": "high",
                "category": "retention",
                "created_at": "2025-09-06T09:00:00Z",
                "status": "dismissed",
            },
            {
                "id": "A7",
                "employee_id": "E3",
                "severity": "low",
                "category": "workload",
                "created_at": "2025-09-07T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A8",
                "employee_id": "E6",
                "severity": "medium",
                "category": "engagement",
                "created_at": "2025-09-08T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A9",
                "employee_id": "E7",
                "severity": "high",
                "category": "retention",
                "created_at": "2025-09-09T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A10",
                "employee_id": "E8",
                "severity": "low",
                "category": "workload",
                "created_at": "2025-09-10T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A11",
                "employee_id": "E4",
                "severity": "high",
                "category": "retention",
                "created_at": "2025-09-11T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A12",
                "employee_id": "E9",
                "severity": "low",
                "category": "workload",
                "created_at": "2025-09-12T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A13",
                "employee_id": "E10",
                "severity": "medium",
                "category": "engagement",
                "created_at": "2025-09-13T09:00:00Z",
                "status": "open",
            },
            {
                "id": "A14",
                "employee_id": "E2",
                "severity": "low",
                "category": "workload",
                "created_at": "2025-09-14T09:00:00Z",
                "status": "open",
            },
        ]

        for alert_data in alerts:
            Alert.objects.create(**alert_data)

    # EXPECTED RESULTS TESTS (Spec Verification)

    def test_expected_results_e2_direct(self):
        """Test E2 direct returns exactly 6 alerts (E3, E4, E9 only)."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "direct"}
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 6

        # Verify employees
        employee_ids = {alert["employee"]["id"] for alert in data}
        assert employee_ids == {"E3", "E4", "E9"}

        # Verify alert IDs
        alert_ids = {alert["id"] for alert in data}
        assert alert_ids == {"A1", "A2", "A5", "A7", "A11", "A12"}

    def test_expected_results_e2_subtree(self):
        """Test E2 subtree returns exactly 10 alerts (adds E5, E10)."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "subtree"}
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 10

        # Verify employees
        employee_ids = {alert["employee"]["id"] for alert in data}
        assert employee_ids == {"E3", "E4", "E5", "E9", "E10"}

        # Verify alert IDs (A14 is E2's own alert, should be excluded)
        alert_ids = {alert["id"] for alert in data}
        assert alert_ids == {
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A11",
            "A12",
            "A13",
        }
        assert "A14" not in alert_ids  # E2's own alert excluded

    def test_expected_results_e2_subtree_open_high(self):
        """Test E2 subtree + status=open + severity=high returns 3 alerts."""
        response = self.client.get(
            "/api/alerts",
            {
                "manager_id": "E2",
                "scope": "subtree",
                "status": "open",
                "severity": "high",
            },
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 3

        alert_ids = {alert["id"] for alert in data}
        assert alert_ids == {"A1", "A4", "A11"}

    def test_expected_results_e7_cycle(self):
        """Test E7 subtree (cycle) returns exactly 2 alerts from E6, E8."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E7", "scope": "subtree"}
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2

        employee_ids = {alert["employee"]["id"] for alert in data}
        assert employee_ids == {"E6", "E8"}

        alert_ids = {alert["id"] for alert in data}
        assert alert_ids == {"A8", "A10"}

    # DISMISS ENDPOINT TESTS

    def test_dismiss_is_idempotent(self):
        """CRITICAL: Test dismiss returns 200 unchanged on second call."""
        # First dismiss
        response1 = self.client.post("/api/alerts/A1/dismiss")
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["status"] == "dismissed"

        # Second dismiss (idempotent)
        response2 = self.client.post("/api/alerts/A1/dismiss")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["status"] == "dismissed"
        assert data1 == data2  # Unchanged

    def test_dismiss_alert_not_found(self):
        """Test dismiss non-existent alert returns 404."""
        response = self.client.post("/api/alerts/INVALID/dismiss")
        assert response.status_code == 404
        assert response.json() == {"detail": "alert not found"}

    # VALIDATION TESTS

    def test_invalid_scope(self):
        """Test invalid scope returns 400 with exact error format."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "invalid"}
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "invalid scope"}

    def test_invalid_severity(self):
        """Test invalid severity returns 400 with exact error format."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "severity": "critical"}
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "invalid severity"}

    def test_invalid_status(self):
        """Test invalid status returns 400 with exact error format."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "status": "pending"}
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "invalid status"}

    def test_manager_not_found(self):
        """Test non-existent manager returns 404 with exact error format."""
        response = self.client.get("/api/alerts", {"manager_id": "INVALID"})
        assert response.status_code == 404
        assert response.json() == {"detail": "manager not found"}

    # SORTING TESTS

    def test_sorting_order(self):
        """Test results sorted by created_at DESC, id ASC."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "direct"}
        )
        assert response.status_code == 200

        data = response.json()
        # Should be sorted by created_at DESC, id ASC
        # A12 (2025-09-12), A11 (2025-09-11), A7 (2025-09-07), A5 (2025-09-05), A2 (2025-09-02), A1 (2025-09-01)
        expected_order = ["A12", "A11", "A7", "A5", "A2", "A1"]
        actual_order = [alert["id"] for alert in data]
        assert actual_order == expected_order

    # FILTER TESTS

    def test_filter_by_severity_single(self):
        """Test filter by single severity value."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "direct", "severity": "high"}
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2
        assert all(alert["severity"] == "high" for alert in data)

    def test_filter_by_severity_multiple(self):
        """Test filter by multiple severity values."""
        response = self.client.get(
            "/api/alerts",
            {"manager_id": "E2", "scope": "direct", "severity": "high,medium"},
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 4  # A1, A2, A5, A11
        severities = {alert["severity"] for alert in data}
        assert severities == {"high", "medium"}

    def test_filter_by_status_open_only(self):
        """Test filter by status=open excludes dismissed."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "subtree", "status": "open"}
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 9  # Excludes A6 (dismissed)
        assert all(alert["status"] == "open" for alert in data)
        assert "A6" not in [alert["id"] for alert in data]

    def test_filter_by_employee_name(self):
        """Test case-insensitive search on employee name."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "subtree", "q": "lee"}
        )
        assert response.status_code == 200

        data = response.json()
        # Should only return alerts for Jordan Lee (E3)
        assert all("Lee" in alert["employee"]["name"] for alert in data)
        employee_ids = {alert["employee"]["id"] for alert in data}
        assert employee_ids == {"E3"}

    # RESPONSE FORMAT TESTS

    def test_response_format_exact(self):
        """Test response format matches spec exactly."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "direct", "severity": "high"}
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) > 0

        # Verify first alert has exact format
        alert = data[0]
        assert "id" in alert
        assert "employee" in alert
        assert "id" in alert["employee"]
        assert "name" in alert["employee"]
        assert "severity" in alert
        assert "category" in alert
        assert "created_at" in alert
        assert "status" in alert

        # Verify timestamp format (ISO-8601 UTC with Z)
        assert alert["created_at"].endswith("Z")

    # EDGE CASES

    def test_manager_with_no_reports(self):
        """Test manager with no reports returns empty list."""
        response = self.client.get("/api/alerts", {"manager_id": "E5"})
        assert response.status_code == 200
        assert response.json() == []

    def test_default_scope_is_direct(self):
        """Test scope defaults to 'direct' when omitted."""
        response = self.client.get("/api/alerts", {"manager_id": "E2"})
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 6  # Same as explicit scope=direct

    def test_manager_own_alert_excluded(self):
        """Test manager's own alerts are never included."""
        response = self.client.get(
            "/api/alerts", {"manager_id": "E2", "scope": "subtree"}
        )
        assert response.status_code == 200

        data = response.json()
        # A14 is E2's alert, should not be in results
        alert_ids = [alert["id"] for alert in data]
        assert "A14" not in alert_ids

        # Verify E2 is not in employee list
        employee_ids = {alert["employee"]["id"] for alert in data}
        assert "E2" not in employee_ids
