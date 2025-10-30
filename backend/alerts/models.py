from django.db import models

class Employee(models.Model):
    id = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=100)
    reports_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )

    class Meta:
        db_table = 'employees'

    def __str__(self):
        return f"{self.id} - {self.name}"


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('dismissed', 'Dismissed'),
    ]

    id = models.CharField(max_length=10, primary_key=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='alerts')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    category = models.CharField(max_length=50)
    created_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')

    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at', 'id']

    def __str__(self):
        return f"{self.id} - {self.employee.name} ({self.severity})"