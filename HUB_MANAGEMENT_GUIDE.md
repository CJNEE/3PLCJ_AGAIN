# Hub Management Guide

## Update Hubs - Quick Start

### Step 1: Replace All Hubs in PostgreSQL (Local)

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Mac/Linux

# Replace all existing hubs with new hub list
python manage.py seed_hubs --reset

# Expected output:
# Deleted all existing hubs
# ✓ Created: J&T Express Lucena Hub
# ✓ Created: J&T Express Tayabas Hub
# ✓ Created: J&T Express Sariaya DH1
# ... (10 hubs total)
# ✓ Total new hubs created: 10
# ✓ Total hubs in database: 10
```

### Step 2: Update Hubs on Render (Production)

```bash
# 1. Open Render Dashboard
# 2. Go to your Backend Service → Shell tab
# 3. Run these commands:

cd /app
python manage.py seed_hubs --reset

# Output shows all 10 hubs created
```

---

## Hubs List (10 Total)

| # | Hub Name | Location | City |
|---|----------|----------|------|
| 1 | J&T Express Lucena Hub | Lucena | Quezon |
| 2 | J&T Express Tayabas Hub | Tayabas | Quezon |
| 3 | J&T Express Sariaya DH1 | Sariaya | Quezon |
| 4 | J&T Express Sariaya DH2 | Sariaya | Quezon |
| 5 | J&T Express Sariaya DH3 | Sariaya | Quezon |
| 6 | J&T Express Tiaong DH | Tiaong | Quezon |
| 7 | J&T Express Tiaong DH2 | Tiaong | Quezon |
| 8 | J&T Express Candelaria DH | Candelaria | Quezon |
| 9 | J&T Express Candelaria DH2 | Candelaria | Quezon |
| 10 | J&T Express San Antonio DH | San Antonio | Quezon |

---

## Edit Employee Hub - API Documentation

### Updating an Employee's Hub Assignment

**Endpoint:** `PUT /api/v1/employees/{id}/` or `PATCH /api/v1/employees/{id}/`

**Method:** PUT or PATCH

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "hub_id": 1
}
```

**Parameters:**
- `hub_id` (integer): ID of the hub to assign to the employee
- Use `null` or omit field to unassign hub

**Response:**
```json
{
  "id": 123,
  "firstname": "John",
  "lastname": "Doe",
  "hub": 1,
  "hub_name": "J&T Express Lucena Hub",
  "status": "Active",
  "role": "Employee",
  ...
}
```

**Example cURL:**
```bash
curl -X PATCH https://backend.onrender.com/api/v1/employees/123/ \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "hub_id": 1
  }'
```

**Example JavaScript (Frontend):**
```javascript
const response = await fetch('/api/v1/employees/123/', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hub_id: 1  // Change to hub ID
  })
});
const data = await response.json();
console.log(`Changed hub to: ${data.hub_name}`);
```

---

## Get List of Hubs - API Documentation

### Retrieve All Available Hubs

**Endpoint:** `GET /api/v1/hubs/`

**Method:** GET

**Authentication:** Required (JWT Token)

**Response:**
```json
[
  {
    "id": 1,
    "name": "J&T Express Lucena Hub",
    "location": "Lucena",
    "city": "Quezon",
    "address": "Lucena, Quezon",
    "latitude": 13.9365,
    "longitude": 121.6173,
    "company": "J&T Express",
    "employee_count": 15
  },
  {
    "id": 2,
    "name": "J&T Express Tayabas Hub",
    "location": "Tayabas",
    "city": "Quezon",
    "address": "Tayabas, Quezon",
    "latitude": 14.0105,
    "longitude": 121.5181,
    "company": "J&T Express",
    "employee_count": 12
  },
  ...
]
```

**Example cURL:**
```bash
curl https://backend.onrender.com/api/v1/hubs/ \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Example JavaScript:**
```javascript
const response = await fetch('/api/v1/hubs/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const hubs = await response.json();
console.log(hubs);
```

---

## Verify Hub Changes

### Check Hub Count
```bash
python manage.py shell
>>> from employees.models import Hub
>>> Hub.objects.count()
10
>>> Hub.objects.values_list('name', 'location', 'city')
```

### Check Employee Hub Assignment
```bash
python manage.py shell
>>> from employees.models import Employee
>>> emp = Employee.objects.first()
>>> print(f"Employee: {emp.full_name}, Hub: {emp.hub.name}")
```

### Check Hub Details
```bash
python manage.py shell
>>> from employees.models import Hub
>>> hub = Hub.objects.get(name='J&T Express Lucena Hub')
>>> print(f"Hub: {hub.name}")
>>> print(f"Location: {hub.location}")
>>> print(f"City: {hub.city}")
>>> print(f"Employees: {hub.employees.count()}")
```

---

## Hub Editing Features in Employee Form

### When Editing Employee Information:

✓ **Hub can now be changed** using hub_id field
✓ **Hub name displayed** as hub_name (read-only reference)
✓ **Location field** in hub information
✓ **City field** in hub information
✓ **Activity logging** - all hub changes are logged

### Change Tracking

When a hub is changed for an employee:
1. ✓ Old hub logged in ActivityLog
2. ✓ New hub logged in ActivityLog
3. ✓ Change format: `hub: {old_id} → {new_id}`
4. ✓ Admin/HR can review who made the change and when

---

## Command Reference

### Seed/Reset Hubs
```bash
# Create hubs (skip if already exist)
python manage.py seed_hubs

# Delete all hubs and create new ones
python manage.py seed_hubs --reset
```

### List All Hubs
```bash
python manage.py shell -c "
from employees.models import Hub
for hub in Hub.objects.all():
    print(f'ID: {hub.id}, Name: {hub.name}, Location: {hub.location}')
"
```

### Get Hub IDs for Frontend
```bash
curl https://backend.onrender.com/api/v1/hubs/ \
  -H "Authorization: Bearer <TOKEN>" | jq '.[] | {id: .id, name: .name}'
```

---

## Troubleshooting

### Issue: Hubs not showing in frontend
**Solution:** 
1. Run seed_hubs command
2. Clear browser cache (Ctrl+Shift+Delete)
3. Refresh page

### Issue: Can't change hub for employee
**Solution:**
1. Ensure JWT token is valid
2. Verify hub_id is valid: `GET /api/v1/hubs/`
3. Use correct endpoint: `PATCH /api/v1/employees/{id}/`

### Issue: Hub changes not logged
**Solution:**
1. Check ActivityLog: `python manage.py shell`
2. Verify user has permission to edit
3. Check if hub field is actually changing

---

## Next Steps

1. ✓ Run hub seeding command (locally and on Render)
2. ✓ Verify 10 hubs are in database
3. ✓ Test employee hub update via API
4. ✓ Update frontend dropdown to use new hubs
5. ✓ Test full employee edit flow with hub changes

---

**System Ready:** Hubs are configured and employees can be assigned to different hubs  
**Date Updated:** May 14, 2026
