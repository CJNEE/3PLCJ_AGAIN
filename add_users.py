import os
import sys
import pathlib
import django

project_root = pathlib.Path(__file__).resolve().parents[0]
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from employees.models import Employee

# Users to create
users_data = [
    {
        'username': '3plloginadmin',
        'password': '3plcompanyadmin',
        'email': 'admin@3pl.com',
        'is_staff': True,
        'is_superuser': True,
        'employee': {
            'firstname': 'Admin',
            'lastname': 'User',
            'position': 'Administrator',
            'employment_type': 'Full-time',
            'status': 'Active',
            'role': 'Admin',
            'employee_id': 'EMP-3PL-ADMIN',
            'can_login': True
        }
    },
    {
        'username': '3plloginhr',
        'password': '3plcompanyhr',
        'email': 'hr@3pl.com',
        'is_staff': True,
        'is_superuser': False,
        'employee': {
            'firstname': 'HR',
            'lastname': 'User',
            'position': 'HR Manager',
            'employment_type': 'Full-time',
            'status': 'Active',
            'role': 'HR',
            'employee_id': 'EMP-3PL-HR',
            'can_login': True
        }
    },
    {
        'username': 'cjnee',
        'password': 'teken123',
        'email': 'cjnee@3pl.com',
        'is_staff': False,
        'is_superuser': False,
        'employee': {
            'firstname': 'CJNEE',
            'lastname': 'Employee',
            'position': 'Employee',
            'employment_type': 'Full-time',
            'status': 'Active',
            'role': 'Employee',
            'employee_id': 'EMP-CJNEE',
            'can_login': True
        }
    }
]

created_count = 0
exists_count = 0

for user_data in users_data:
    username = user_data['username']
    password = user_data['password']
    email = user_data['email']
    is_staff = user_data['is_staff']
    is_superuser = user_data['is_superuser']
    emp_data = user_data['employee']
    
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'is_staff': is_staff,
            'is_superuser': is_superuser,
            'first_name': emp_data['firstname'],
            'last_name': emp_data['lastname']
        }
    )
    
    if created:
        user.set_password(password)
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.save()
        created_count += 1
        print(f'✓ Created user: {username} (Role: {emp_data["role"]})')
    else:
        exists_count += 1
        print(f'- User exists: {username}')
    
    # Create or update employee record
    emp, emp_created = Employee.objects.get_or_create(
        user=user,
        defaults=emp_data
    )
    
    if not emp_created:
        # Update employee fields
        for key, value in emp_data.items():
            if hasattr(emp, key):
                setattr(emp, key, value)
        emp.save()

print(f'\n✓ Summary: {created_count} users created, {exists_count} users already exist')
