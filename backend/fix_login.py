from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from employees.models import Employee, Hub
from django.utils import timezone

class Command(BaseCommand):
    help = 'Fix login - Create test users for Admin/HR/Employee dashboards'

    def handle(self, *args, **options):
        # Create test hub first
        hub, created = Hub.objects.get_or_create(
            name='Test Hub',
            defaults={
                'location': 'Test Location',
                'address': '123 Test St',
                'latitude': 0.0,
                'longitude': 0.0
            }
        )
        self.stdout.write(self.style.SUCCESS(f'Hub: {"Created" if created else "Exists"}'))

        # 1. Admin (superuser)
        admin_user, admin_created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@test.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
                'password': 'pbkdf2_sha256$390000$test$salt$hash123'  # admin123
            }
        )
        if admin_created:
            admin_user.set_password('admin123')
            admin_user.save()
        self.stdout.write(self.style.SUCCESS(f'Admin user: {"Created" if admin_created else "Exists"} - admin/admin123'))

        # 2. HR (staff)
        hr_user, hr_created = User.objects.get_or_create(
            username='hr',
            defaults={
                'email': 'hr@test.com',
                'first_name': 'HR',
                'last_name': 'Manager',
                'is_staff': True,
                'is_active': True,
                'is_superuser': False,
                'password': 'pbkdf2_sha256$390000$test$salt$hash456'  # hr123
            }
        )
        if hr_created:
            hr_user.set_password('hr123')
            hr_user.save()
        self.stdout.write(self.style.SUCCESS(f'HR user: {"Created" if hr_created else "Exists"} - hr/hr123'))

        # 3. Employee (normal user + Employee record)
        emp_user, emp_created = User.objects.get_or_create(
            username='employee',
            defaults={
                'email': 'employee@test.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'is_staff': False,
                'is_active': True,
                'is_superuser': False,
                'password': 'pbkdf2_sha256$390000$test$salt$hash789'  # emp123
            }
        )
        if emp_created:
            emp_user.set_password('emp123')
            emp_user.save()

        # Link to Employee
        employee, emp_link_created = Employee.objects.get_or_create(
            user=emp_user,
            defaults={
                'name': 'John Doe',
                'position': 'Driver',
                'department': 'Operations',
                'status': 'Active',
                'employment_type': 'Full-time',
                'role': 'Employee',
                'hub': hub,
                'employee_id': 'EMP001',
                'can_login': True,
                'email': 'employee@test.com',
                'phone': '+1234567890'
            }
        )
        self.stdout.write(self.style.SUCCESS(f'Employee user: {"Created" if emp_created else "Exists"} - employee/emp123'))
        self.stdout.write(self.style.SUCCESS(f'Employee record: {"Created" if emp_link_created else "Linked"}'))

        self.stdout.write(self.style.SUCCESS('✅ Login fix complete! Test credentials:'))
        self.stdout.write(self.style.SUCCESS('   Admin: admin/admin123 → AdminDashboard'))
        self.stdout.write(self.style.SUCCESS('   HR: hr/hr123 → HRDashboard'))
        self.stdout.write(self.style.SUCCESS('   Employee: employee/emp123 → EmployeeDashboard'))

