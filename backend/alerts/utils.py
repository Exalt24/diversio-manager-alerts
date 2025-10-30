from typing import Set
from collections import deque
from .models import Employee


def get_employee_subtree(manager_id: str, scope: str) -> Set[str]:
    """
    Returns set of employee IDs under a manager (excluding manager).

    Args:
        manager_id: The manager's employee ID
        scope: "direct" for direct reports only, "subtree" for full tree

    Returns:
        Set of employee IDs (excluding manager_id)

    Time Complexity: O(n) where n is number of employees
    Space Complexity: O(n) for visited set and queue
    """
    if scope == "direct":
        # Simple case: just get direct reports
        direct_reports = Employee.objects.filter(reports_to_id=manager_id).values_list(
            "id", flat=True
        )
        return set(direct_reports)

    # Subtree case: BFS with cycle detection
    result: Set[str] = set()
    visited: Set[str] = set()
    queue = deque([manager_id])
    visited.add(manager_id)

    while queue:
        current_id = queue.popleft()

        # Get all direct reports of current employee
        reports = Employee.objects.filter(reports_to_id=current_id).values_list(
            "id", flat=True
        )

        for report_id in reports:
            if report_id not in visited:
                visited.add(report_id)
                result.add(report_id)  # Exclude manager, add all descendants
                queue.append(report_id)

    return result
