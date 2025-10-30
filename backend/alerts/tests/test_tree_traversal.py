import pytest
from django.test import TestCase
from alerts.models import Employee, Alert
from alerts.utils import get_employee_subtree


@pytest.mark.django_db
class TestTreeTraversal(TestCase):
    """Test tree traversal algorithm with cycle detection."""

    def setUp(self):
        """Create test data matching seed_data.json structure."""
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

        # Set up relationships (second pass to avoid FK constraints)
        Employee.objects.filter(id="E2").update(reports_to_id="E1")
        Employee.objects.filter(id="E3").update(reports_to_id="E2")
        Employee.objects.filter(id="E4").update(reports_to_id="E2")
        Employee.objects.filter(id="E5").update(reports_to_id="E3")
        Employee.objects.filter(id="E6").update(reports_to_id="E7")  # Cycle start
        Employee.objects.filter(id="E7").update(reports_to_id="E8")  # Cycle middle
        Employee.objects.filter(id="E8").update(reports_to_id="E6")  # Cycle end
        Employee.objects.filter(id="E9").update(reports_to_id="E2")
        Employee.objects.filter(id="E10").update(reports_to_id="E9")

    def test_direct_reports_only(self):
        """Test scope='direct' returns only immediate reports."""
        result = get_employee_subtree("E2", "direct")
        assert result == {"E3", "E4", "E9"}
        assert "E2" not in result  # Manager excluded
        assert "E5" not in result  # Grandchild excluded
        assert "E10" not in result  # Great-grandchild excluded

    def test_subtree_full_tree(self):
        """Test scope='subtree' returns all descendants."""
        result = get_employee_subtree("E2", "subtree")
        assert result == {"E3", "E4", "E5", "E9", "E10"}
        assert "E2" not in result  # Manager excluded
        assert len(result) == 5

    def test_subtree_handles_cycle(self):
        """CRITICAL: Test E7→E8→E6→E7 cycle terminates without infinite loop."""
        # E7's subtree should include E6 and E8 (the other two in cycle)
        result = get_employee_subtree("E7", "subtree")
        assert result == {"E6", "E8"}
        assert "E7" not in result  # Manager excluded
        assert len(result) == 2

        # Verify from different entry points in cycle
        result_e6 = get_employee_subtree("E6", "subtree")
        assert result_e6 == {"E7", "E8"}

        result_e8 = get_employee_subtree("E8", "subtree")
        assert result_e8 == {"E6", "E7"}

    def test_empty_reports(self):
        """Test employee with no reports returns empty set."""
        result = get_employee_subtree("E5", "direct")
        assert result == set()

        result_subtree = get_employee_subtree("E5", "subtree")
        assert result_subtree == set()

    def test_single_level_subtree(self):
        """Test subtree with only direct reports (no grandchildren)."""
        result = get_employee_subtree("E9", "subtree")
        assert result == {"E10"}

    def test_manager_never_in_result(self):
        """Verify manager ID is never included in result set."""
        # Test various managers
        for manager_id in ["E1", "E2", "E3", "E7"]:
            result_direct = get_employee_subtree(manager_id, "direct")
            result_subtree = get_employee_subtree(manager_id, "subtree")

            assert (
                manager_id not in result_direct
            ), f"{manager_id} found in direct reports"
            assert manager_id not in result_subtree, f"{manager_id} found in subtree"

    def test_top_level_manager(self):
        """Test CEO (E1) with full organization tree."""
        result = get_employee_subtree("E1", "subtree")
        # E1's subtree: E2, E3, E4, E5, E9, E10 (not the cycle: E6, E7, E8)
        assert result == {"E2", "E3", "E4", "E5", "E9", "E10"}
        assert "E1" not in result
        assert "E6" not in result  # Cycle not connected to E1
        assert "E7" not in result
        assert "E8" not in result
