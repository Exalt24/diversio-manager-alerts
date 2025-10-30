import json
from django.core.management.base import BaseCommand
from alerts.models import Employee, Alert

class Command(BaseCommand):
    help = 'Load seed data from seed_data.json'

    def handle(self, *args, **kwargs):
        # Clear existing data
        Alert.objects.all().delete()
        Employee.objects.all().delete()
        
        # Load JSON
        with open('seed_data.json', 'r') as f:
            data = json.load(f)
        
        # Create employees first (without relationships)
        employees_data = {emp['id']: emp for emp in data['employees']}
        for emp_data in data['employees']:
            Employee.objects.create(
                id=emp_data['id'],
                name=emp_data['name']
            )
        
        # Update relationships
        for emp_data in data['employees']:
            if emp_data['reports_to']:
                emp = Employee.objects.get(id=emp_data['id'])
                emp.reports_to_id = emp_data['reports_to']
                emp.save()
        
        # Create alerts
        for alert_data in data['alerts']:
            Alert.objects.create(
                id=alert_data['id'],
                employee_id=alert_data['employee_id'],
                severity=alert_data['severity'],
                category=alert_data['category'],
                created_at=alert_data['created_at'],
                status=alert_data['status']
            )
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully loaded {Employee.objects.count()} employees and {Alert.objects.count()} alerts'
        ))