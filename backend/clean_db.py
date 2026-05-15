import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import (
    Hub, Employee, EditRequest, LeaveRequest, Attendance, 
    LiveLocation, Payroll, EmployeeDocument, ActivityLog, 
    SecurityAlert, HRPermission, SavedImage, LeaveAttachment
)
from django.contrib.auth.models import User

def clean():
    print("Deleting all data...")
    ActivityLog.objects.all().delete()
    SecurityAlert.objects.all().delete()
    HRPermission.objects.all().delete()
    SavedImage.objects.all().delete()
    Payroll.objects.all().delete()
    LiveLocation.objects.all().delete()
    Attendance.objects.all().delete()
    LeaveAttachment.objects.all().delete()
    LeaveRequest.objects.all().delete()
    EditRequest.objects.all().delete()
    EmployeeDocument.objects.all().delete()
    
    # Delete employees but keep users? Or delete all?
    # Usually better to delete employees first
    Employee.objects.all().delete()
    
    # Delete non-superuser users
    User.objects.filter(is_superuser=False).delete()
    
    print("Cleanup complete.")

if __name__ == "__main__":
    clean()
