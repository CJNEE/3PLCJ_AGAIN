import os
import sys
import pathlib
import django

project_root = pathlib.Path(__file__).resolve().parents[0]
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Employee

admin_emp = Employee.objects.filter(user__username='admin_test').first()
if admin_emp:
    admin_emp.can_login = True
    admin_emp.save()
    print(f'✓ Updated {admin_emp.firstname} - can_login set to True')
else:
    print('✗ Admin employee not found')
