from decimal import Decimal
import json
from django.db import models
from django.contrib.auth.models import User
from datetime import date
import os


# ===================== FILE PATH HELPERS =====================

def profile_picture_path(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    emp_id = instance.employee_id or f"new_{instance.firstname}_{instance.lastname}"
    return f'profile_pictures/{emp_id}.{ext}'


def employee_document_path(instance, filename):
    emp_id = instance.employee.employee_id or instance.employee.id
    return f'employee_documents/{emp_id}/{filename}'


def attendance_clock_in_path(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    return f'attendance_records/{instance.employee.id}/{instance.date}/clock_in.{ext}'


def attendance_clock_out_path(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    return f'attendance_records/{instance.employee.id}/{instance.date}/clock_out.{ext}'


# ===================== HUB =====================

class Hub(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    city = models.CharField(max_length=100, default="Quezon")
    company = models.CharField(max_length=100, default="J&T Express")
    address = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    employee_count = models.IntegerField(default=0)
    # Per-hub override rates (percent values). Optional: if zero, fall back to DEFAULT_GOV_RATES
    sss_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    philhealth_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pagibig_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} ({self.city})"


# ===================== EMPLOYEE =====================

class Employee(models.Model):

    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Resign', 'Resign'),
        ('AWOL', 'AWOL'),
        ('Blacklist', 'Blacklist'),
    ]

    EMPLOYMENT_TYPE_CHOICES = [
        ('Full-time', 'Full-time'),
        ('OCW', 'OCW')
    ]

    ROLE_CHOICES = [
        ('Employee', 'Employee'),
        ('HR', 'HR'),
        ('Admin', 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)

    # ===== NAME =====
    firstname = models.CharField(max_length=50)
    lastname = models.CharField(max_length=50)
    middle_initial = models.CharField(max_length=10, blank=True)

    @property
    def full_name(self):
        return f"{self.firstname} {self.lastname}"

    # ===== PERSONAL INFO =====
    place_of_birth = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True)
    nationality = models.CharField(max_length=50, blank=True)
    marital_status = models.CharField(max_length=20, blank=True)

    # ===== CONTACT =====
    email_address = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    current_address = models.TextField(blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)

    # ===== EMPLOYMENT =====
    position = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')

    hub = models.ForeignKey(Hub, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')

    hired_date = models.DateField(null=True, blank=True)
    jtp_code = models.CharField(max_length=50, blank=True)

    employee_id = models.CharField(max_length=20, unique=True)

    # ===== EMERGENCY =====
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)

    # ===== DOCUMENT FIELDS (TEXT) =====
    tin = models.CharField(max_length=20, blank=True, null=True)
    sss = models.CharField(max_length=20, blank=True, null=True)
    philhealth = models.CharField(max_length=20, blank=True, null=True)
    pagibig = models.CharField(max_length=20, blank=True, null=True)

    # ===== PROFILE =====
    profile_image = models.ImageField(upload_to=profile_picture_path, null=True, blank=True)

    # ===== LOGIN =====
    can_login = models.BooleanField(default=False)
    can_edit_info = models.BooleanField(default=True)  # Whether employee can edit their own info

    is_active = models.BooleanField(default=True)  # Ensure this field exists

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.position}"


# ===================== HR PERMISSIONS =====================

class HRPermission(models.Model):
    """Stores permissions for HR users"""
    hr_employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='hr_permissions')
    
    # HR Permissions
    can_view_employees = models.BooleanField(default=False)
    can_edit_employee_info = models.BooleanField(default=False)
    can_edit_payslip = models.BooleanField(default=False)
    can_delete_employees = models.BooleanField(default=False)
    can_reset_password = models.BooleanField(default=False)
    can_enable_employee_edit = models.BooleanField(default=False)  # Enable employees to edit their own info
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"HR Permissions for {self.hr_employee.full_name}"


# ===================== ATTACHMENTS (VERY IMPORTANT FOR YOUR UI) =====================

class EmployeeDocument(models.Model):
    DOCUMENT_TYPES = [
        ('resume', 'Resume'),
        ('id', 'ID'),
        ('license', 'Driver License'),
        ('other', 'Other'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to=employee_document_path)

    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(null=True, blank=True)  # in KB
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='other')

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.file:
            self.file_name = os.path.basename(self.file.name)
            self.file_size = self.file.size // 1024  # KB
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.full_name} - {self.file_name}"


# ===================== ATTENDANCE =====================

class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()

    clock_in_time = models.DateTimeField(null=True, blank=True)
    clock_out_time = models.DateTimeField(null=True, blank=True)

    clock_in_image = models.ImageField(upload_to=attendance_clock_in_path, null=True, blank=True)
    clock_out_image = models.ImageField(upload_to=attendance_clock_out_path, null=True, blank=True)

    status = models.CharField(max_length=20, default='Present')

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.date}"


# ===================== LOCATION =====================

class LiveLocation(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.full_name}"


# ===================== PAYROLL =====================

class Payroll(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    period_start = models.DateField()
    period_end = models.DateField()

# Attendance Summary
    total_hours = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    overtime_hours = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    lates = models.IntegerField(default=0)
    absences = models.IntegerField(default=0)

    # Earnings
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    overtime_pay = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    incentives = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    
    # Deductions (itemized)
    deduction_details = models.JSONField(default=dict)  # e.g., {"RCBC Loan": 500, "Union Dues": 200}
    
    # Government Deductions
    sss_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    philhealth_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    pagibig_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    # Stored percentage overrides (if admin set custom percents for this payroll)
    sss_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    philhealth_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    pagibig_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))

    net_pay = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    payslip_image = models.ImageField(upload_to='payslips/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calculate totals
        total_deductions = 0
        deduction_data = self.deduction_details
        if isinstance(deduction_data, dict):
            total_deductions = sum(float(value or 0) for value in deduction_data.values())
        elif isinstance(deduction_data, (list, tuple)):
            total_deductions = sum(float(value or 0) for value in deduction_data)
        elif isinstance(deduction_data, (int, float, Decimal)):
            total_deductions = float(deduction_data)
        elif isinstance(deduction_data, str):
            try:
                parsed = json.loads(deduction_data)
                if isinstance(parsed, dict):
                    total_deductions = sum(float(value or 0) for value in parsed.values())
                elif isinstance(parsed, (list, tuple)):
                    total_deductions = sum(float(value or 0) for value in parsed)
                else:
                    total_deductions = float(parsed)
            except (ValueError, TypeError, json.JSONDecodeError):
                total_deductions = 0

        gov_deductions = float(self.sss_deduction or 0) + float(self.philhealth_deduction or 0) + float(self.pagibig_deduction or 0)
        total_earnings = float(self.basic_salary or 0) + float(self.allowances or 0) + float(self.overtime_pay or 0) + float(self.incentives or 0)
        self.net_pay = Decimal(total_earnings - total_deductions - gov_deductions).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)


# ===================== EDIT REQUEST =====================

class EditRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)

    requested_data = models.JSONField()  # ALL fields (text + file names)
    uploaded_files = models.FileField(upload_to='edit_requests/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.full_name} - {self.status}"


# ===================== LEAVE REQUEST =====================

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')

    # Leave details
    leave_type = models.CharField(max_length=50, default='Vacation')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type} - {self.status}"


# Attachments for leave requests
class LeaveAttachment(models.Model):
    leave_request = models.ForeignKey(LeaveRequest, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='leave_attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        try:
            return f"Leave {self.leave_request.id} - {self.file.name}"
        except Exception:
            return f"LeaveAttachment {self.id}"

# ===================== ACTIVITY LOG =====================

class ActivityLog(models.Model):
    """Track all employee, HR, and Admin activities"""

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    
    role = models.CharField(max_length=20, choices=[
        ('Employee', 'Employee'),
        ('HR', 'HR'),
        ('Admin', 'Admin'),
    ], default='Employee')
    
    # Free-form action key (e.g. clock_in, approve_request, submit_leave_request)
    action = models.CharField(max_length=50)
    details = models.TextField(blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.role} - {self.action} - {self.created_at}"


# ===================== SECURITY ALERT =====================

class SecurityAlert(models.Model):
    """Track security alerts including login attempts"""
    
    ALERT_TYPE_CHOICES = [
        ('login_attempt', 'Login Attempt'),
        ('failed_login', 'Failed Login'),
        ('suspicious_login', 'Suspicious Login'),
        ('account_locked', 'Account Locked'),
        ('account_disabled', 'Account Disabled'),
        ('multiple_attempts', 'Multiple Login Attempts'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    
    message = models.TextField()
    details = models.JSONField(default=dict)  # Store extra info like IP, location, etc.
    
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_type} - {self.severity} - {self.created_at}"


# ===================== PERMANENT IMAGE STORAGE =====================

def saved_image_path(instance, filename):
    """Generate permanent path for saved images"""
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    emp_id = instance.employee.employee_id or instance.employee.id
    timestamp = instance.created_at.strftime('%Y%m%d_%H%M%S')
    return f'saved_images/{emp_id}/{instance.image_type}/{timestamp}.{ext}'


class SavedImage(models.Model):
    """
    Permanent storage for all employee images.
    Images stored here are retained until explicitly deleted.
    This prevents image loss when editing profiles, approving requests, or deleting temporary records.
    """
    
    IMAGE_TYPE_CHOICES = [
        ('profile', 'Profile Picture'),
        ('edit_request', 'Edit Request Image'),
        ('clock_in', 'Clock In'),
        ('clock_out', 'Clock Out'),
        ('leave_attachment', 'Leave Request Attachment'),
        ('payslip', 'Payslip'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='saved_images')
    image = models.ImageField(upload_to=saved_image_path)
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPE_CHOICES)
    
    # Binary data storage for database persistence
    image_data = models.BinaryField(null=True, blank=True)
    content_type = models.CharField(max_length=100, null=True, blank=True)
    original_filename = models.CharField(max_length=255, null=True, blank=True)
    
    # Link to original request/record (optional, for reference)
    edit_request = models.ForeignKey(EditRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='saved_images')
    attendance = models.ForeignKey(Attendance, on_delete=models.SET_NULL, null=True, blank=True, related_name='saved_images')
    leave_attachment = models.ForeignKey(LeaveAttachment, on_delete=models.SET_NULL, null=True, blank=True, related_name='saved_images')
    
    # Status tracking
    is_active = models.BooleanField(default=True)  # Can be soft-deleted
    is_approved = models.BooleanField(default=False)  # For edit requests/leave requests
    
    description = models.TextField(blank=True)  # Additional metadata
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'image_type']),
            models.Index(fields=['employee', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.image_type} - {self.created_at.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        # If image is provided but image_data is not yet populated
        if self.image and not self.image_data:
            try:
                # Open the image file safely
                self.image.open()
                self.image_data = self.image.read()
                
                # Store metadata if available
                if hasattr(self.image.file, 'content_type'):
                    self.content_type = self.image.file.content_type
                
                self.original_filename = os.path.basename(self.image.name)
                
                # Close after reading
                self.image.close()
            except Exception as e:
                print(f"Error reading image data for DB storage: {e}")
                
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Delete the image file when deleting the record"""
        if self.image:
            self.image.delete(save=False)
        super().delete(*args, **kwargs)


# ===================== SIGNALS FOR PERMANENT BACKUP =====================

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Employee)
def backup_employee_profile_image(sender, instance, created, **kwargs):
    """Backup employee profile image to SavedImage whenever it's updated"""
    if instance.profile_image:
        # Check if this image is already backed up
        existing = SavedImage.objects.filter(
            employee=instance,
            image_type='profile',
            original_filename=os.path.basename(instance.profile_image.name)
        ).exists()
        
        if not existing:
            try:
                SavedImage.objects.create(
                    employee=instance,
                    image=instance.profile_image,
                    image_type='profile',
                    description=f"Auto-backup of profile image for {instance.full_name}"
                )
            except Exception as e:
                print(f"Error auto-backing up profile image: {e}")

@receiver(post_save, sender=Attendance)
def backup_attendance_images(sender, instance, created, **kwargs):
    """Backup clock in/out images to SavedImage"""
    # Backup clock in image
    if instance.clock_in_image:
        existing_in = SavedImage.objects.filter(
            employee=instance.employee,
            image_type='clock_in',
            attendance=instance,
            original_filename=os.path.basename(instance.clock_in_image.name)
        ).exists()
        
        if not existing_in:
            try:
                SavedImage.objects.create(
                    employee=instance.employee,
                    image=instance.clock_in_image,
                    image_type='clock_in',
                    attendance=instance,
                    description=f"Auto-backup of clock-in image for {instance.employee.full_name} on {instance.date}"
                )
            except Exception as e:
                print(f"Error auto-backing up clock-in image: {e}")

    # Backup clock out image
    if instance.clock_out_image:
        existing_out = SavedImage.objects.filter(
            employee=instance.employee,
            image_type='clock_out',
            attendance=instance,
            original_filename=os.path.basename(instance.clock_out_image.name)
        ).exists()
        
        if not existing_out:
            try:
                SavedImage.objects.create(
                    employee=instance.employee,
                    image=instance.clock_out_image,
                    image_type='clock_out',
                    attendance=instance,
                    description=f"Auto-backup of clock-out image for {instance.employee.full_name} on {instance.date}"
                )
            except Exception as e:
                print(f"Error auto-backing up clock-out image: {e}")

@receiver(post_save, sender=LeaveAttachment)
def backup_leave_attachment(sender, instance, created, **kwargs):
    """Backup leave attachments to SavedImage"""
    if instance.file:
        existing = SavedImage.objects.filter(
            employee=instance.leave_request.employee,
            image_type='leave_attachment',
            leave_attachment=instance,
            original_filename=os.path.basename(instance.file.name)
        ).exists()
        
        if not existing:
            try:
                SavedImage.objects.create(
                    employee=instance.leave_request.employee,
                    image=instance.file,
                    image_type='leave_attachment',
                    leave_attachment=instance,
                    description=f"Auto-backup of leave attachment for {instance.leave_request.employee.full_name} (Request #{instance.leave_request.id})"
                )
            except Exception as e:
                print(f"Error auto-backing up leave attachment: {e}")
