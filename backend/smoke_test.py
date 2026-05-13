import os
import sys
from datetime import date
from uuid import uuid4

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.utils import timezone
from employees.models import Hub, Employee, Attendance


def run():
    print('Starting smoke tests...')
    # Create Hub
    hub_name = f'Smoke Hub {uuid4().hex[:6]}'
    hub = Hub.objects.create(
        name=hub_name,
        location='Smoke Location',
        address='123 Smoke St',
        city='TestCity',
        latitude=0.0,
        longitude=0.0,
    )
    print('Created Hub:', hub.id)

    # Create Employee
    emp_id = f'smoke-{uuid4().hex[:8]}'
    employee = Employee.objects.create(
        firstname='Smoke',
        lastname='Tester',
        position='Courier',
        employment_type='OCW',
        employee_id=emp_id,
        hub=hub,
    )
    print('Created Employee:', employee.id)

    # Create Attendance
    att = Attendance.objects.create(
        employee=employee,
        date=date.today(),
        clock_in_time=timezone.now(),
        status='Present',
    )
    print('Created Attendance:', att.id)

    # Verify counts
    emp_count = Employee.objects.filter(employee_id=emp_id).count()
    att_count = Attendance.objects.filter(employee=employee, date=date.today()).count()
    print('Verification: emp_count=', emp_count, 'att_count=', att_count)

    # Cleanup
    att.delete()
    employee.delete()
    hub.delete()
    print('Cleanup done. Smoke tests passed.')


if __name__ == '__main__':
    try:
        run()
    except Exception as e:
        print('Smoke tests failed:', e)
        sys.exit(2)
    sys.exit(0)
