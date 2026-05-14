# Database Cleanup & Security Verification - Quick Start Guide

## Overview
This guide will help you:
1. ✓ Verify the system security (is authentication working correctly?)
2. ✓ Check all data models (attendance, payroll, documents)
3. ✓ Clean up the database (delete all accounts except admin_test)

---

## Step 1: Generate a Report (Check-Only Mode)

### Option A: On Render (Production)
```bash
# SSH into Render service
# Navigate to your backend
cd /app

# Run report only (no changes)
python manage.py verify_and_cleanup_db --report --check-only
```

### Option B: Locally in VS Code
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/Scripts/activate  # Windows
# or
source .venv/bin/activate      # Mac/Linux

# Run migrations first (if needed)
python manage.py migrate

# Generate report
python manage.py verify_and_cleanup_db --report --check-only
```

---

## Step 2: Review the Report Output

The report will show:
- ✓ All user accounts and their current login status
- ✓ Database statistics (attendance, payroll, edit requests, etc.)
- ✓ Security verification results
- ✓ Image upload functionality status

**Example Output:**
```
--- SYSTEM REPORT ---

Total Django Users: 5
  - Active: 4
  - Inactive: 1

User Accounts:
  • admin_test ✓ ACTIVE [SUPERUSER] - System Admin (Admin) - CAN LOGIN
  • john_doe ✓ ACTIVE - John Doe (Employee) - CAN LOGIN
  • jane_smith ✓ ACTIVE - Jane Smith (HR) - CANNOT LOGIN
  • test_user ✗ INACTIVE - Test User (Employee) - CANNOT LOGIN
```

---

## Step 3: Delete All Accounts Except admin_test

### ⚠️ IMPORTANT: This is irreversible!
Before proceeding, ensure:
1. You have a database backup
2. You've reviewed the report and know which accounts will be deleted
3. You have the admin_test credentials saved

### Execute Cleanup

#### On Render (via SSH/Console):
```bash
# SSH into your Render service
cd /app
python manage.py verify_and_cleanup_db
```

#### Locally in VS Code:
```bash
cd backend
source .venv/Scripts/activate  # or .venv/bin/activate on Mac/Linux
python manage.py verify_and_cleanup_db
```

### You'll be prompted:
```
Users to be deleted (X):
  • user1 (Employee Name - Role)
  • user2 (Employee Name - Role)
  ...

⚠ WARNING: This will permanently delete all accounts except admin_test!
Type 'DELETE ALL' to confirm: 
```

**Type exactly:** `DELETE ALL` and press Enter

### After Cleanup:
```
✓ Successfully deleted X user(s)
✓ Remaining user: admin_test
```

---

## Step 4: Verify Login Works

After cleanup, test that login is working correctly:

### Test 1: Login as admin_test (should succeed)
```
Endpoint: POST https://backend.onrender.com/api/v1/login/
Body: {
  "username": "admin_test",
  "password": "<your_password>"
}
Expected: ✓ 200 OK with JWT token
```

### Test 2: Try non-existent user (should fail)
```
Endpoint: POST https://backend.onrender.com/api/v1/login/
Body: {
  "username": "deleted_user",
  "password": "password"
}
Expected: ✗ 400 Bad Request (account did not exist)
```

---

## Step 5: Important Post-Cleanup Steps

### 1. Change admin_test Password
```bash
# Locally
python manage.py changepassword admin_test

# Or on Render console
python manage.py changepassword admin_test
```

### 2. Verify Frontend Can Still Login
- Go to https://3-plcj-again.vercel.app
- Click "Login"
- You should see an error (no test accounts exist)
- This is expected and correct behavior

### 3. Create New Test Accounts (if needed)
```bash
# Create a new employee account
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from employees.models import Employee
>>> 
>>> # Create new user
>>> new_user = User.objects.create_user(
...     username='new_employee',
...     email='employee@3pl.local',
...     password='securepassword123'
... )
>>>
>>> # Create associated employee
>>> employee = Employee.objects.create(
...     user=new_user,
...     firstname='John',
...     lastname='Doe',
...     employee_id='EMP001',
...     position='Delivery Driver',
...     employment_type='Full-time',
...     can_login=True  # IMPORTANT: Enable login
... )
>>> exit()
```

---

## Alternative: Standalone Script

If you prefer not to use Django management commands, use the standalone script:

```bash
cd backend

# Check-only mode
python cleanup_db.py --check-only

# Generate report
python cleanup_db.py --report

# Execute cleanup
python cleanup_db.py --execute
```

---

## Troubleshooting

### Issue: "command not found: python manage.py"
**Solution:** Ensure you're in the correct directory (`backend/`) and virtual environment is activated

### Issue: "Django settings not configured"
**Solution:** 
```bash
export DJANGO_SETTINGS_MODULE=backend.settings
python manage.py verify_and_cleanup_db --report
```

### Issue: "ModuleNotFoundError: No module named 'employees'"
**Solution:** 
```bash
pip install -r requirements.txt
python manage.py migrate
```

### Issue: "database connection refused"
**Solution:** Ensure DATABASE_URL environment variable is set correctly
```bash
# Check on Render
echo $DATABASE_URL  # Should show your PostgreSQL connection string
```

---

## What Gets Deleted?

When you run cleanup:

### ✓ Gets DELETED:
- All Django User accounts (except admin_test)
- All associated Employee records
- All Attendance records
- All Payroll records
- All LeaveRequest records
- All EditRequest records
- All EmployeeDocument records
- All HRPermission records

### ✓ Gets PRESERVED:
- admin_test superuser account
- ActivityLog records (audit trail)
- SecurityAlert records
- Hub configuration
- All app settings

### ✗ NOT deleted (manual cleanup needed):
- Media files in `/media/` directory
- Old images in storage
- Consider running: `python manage.py collectstatic --clear`

---

## Security Improvements Made

### ✅ can_login Check ENABLED
- Previously: Any active user could bypass `can_login` restriction
- Now: Only users with `can_login=True` can login
- This is enforced in the LoginView

### ✅ Database Reset
- Removes all test/temporary accounts
- Only admin_test remains (fully controlled by you)
- Clean state for production use

### ✅ Audit Trail Preserved
- ActivityLog records maintained
- You can review who did what before cleanup
- Security alerts are preserved

---

## Next Steps

1. ✓ Run report to verify everything is working
2. ✓ Delete accounts (except admin_test)
3. ✓ Change admin_test password
4. ✓ Test login functionality
5. ✓ Create new accounts as needed for testing
6. ✓ Monitor ActivityLog for any issues

---

## Need Help?

- View full report: [SECURITY_VERIFICATION_REPORT.md](./SECURITY_VERIFICATION_REPORT.md)
- Check backend code: `backend/employees/views.py` (LoginView at line 1525)
- Database schema: `backend/employees/models.py`

---

**System Status:** ✓ Ready for cleanup  
**Last Updated:** May 14, 2026
