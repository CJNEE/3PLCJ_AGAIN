import os
import sys
import pathlib
import django

project_root = pathlib.Path(__file__).resolve().parents[0]
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Hub

# Delete all existing hubs
print("Deleting existing hubs...")
try:
    deleted_count, _ = Hub.objects.all().delete()
    print(f"✓ Deleted {deleted_count} existing hub(s)")
except Exception as e:
    print(f"Note: Could not delete existing hubs: {e}")
    deleted_count = 0

hubs_data = [
    {
        'name': 'Lucena DH1 (Main Hub)',
        'location': 'Lucena DH1 (Main Hub)',
        'city': 'Lucena City',
        'company': 'J&T Express',
        'latitude': 14.2562,
        'longitude': 121.6155,
        'address': 'Magsaysay Boulevard, Lucena City, Quezon'
    },
    {
        'name': 'Lucena DH2 (Gulang-Gulang)',
        'location': 'Lucena DH2 (Gulang-Gulang)',
        'city': 'Lucena City',
        'company': 'J&T Express',
        'latitude': 14.2580,
        'longitude': 121.6200,
        'address': 'Gulang-Gulang, Lucena City, Quezon'
    },
    {
        'name': 'Lucena DH3 (Dalahican)',
        'location': 'Lucena DH3 (Dalahican)',
        'city': 'Lucena City',
        'company': 'J&T Express',
        'latitude': 14.2598,
        'longitude': 121.7032,
        'address': 'Dalahican, Lucena City, Quezon'
    },
    {
        'name': 'Tayabas DH1',
        'location': 'Tayabas DH1',
        'city': 'Tayabas',
        'company': 'J&T Express',
        'latitude': 14.0447,
        'longitude': 121.5242,
        'address': 'San Francisco District, Tayabas, Quezon'
    },
    {
        'name': 'Sariaya DH1',
        'location': 'Sariaya DH1',
        'city': 'Sariaya',
        'company': 'J&T Express',
        'latitude': 13.8968,
        'longitude': 121.4523,
        'address': 'Centro, Sariaya, Quezon'
    },
    {
        'name': 'Candelaria DH1',
        'location': 'Candelaria DH1',
        'city': 'Candelaria',
        'company': 'J&T Express',
        'latitude': 13.8254,
        'longitude': 121.5542,
        'address': 'Poblacion, Candelaria, Quezon'
    },
    {
        'name': 'Gumaca DH1',
        'location': 'Gumaca DH1',
        'city': 'Gumaca',
        'company': 'J&T Express',
        'latitude': 13.6987,
        'longitude': 121.8456,
        'address': 'Poblacion, Gumaca, Quezon'
    },
    {
        'name': 'Lopez DH1',
        'location': 'Lopez DH1',
        'city': 'Lopez',
        'company': 'J&T Express',
        'latitude': 13.5234,
        'longitude': 121.9876,
        'address': 'Poblacion, Lopez, Quezon'
    },
    {
        'name': 'Infanta DH1',
        'location': 'Infanta DH1',
        'city': 'Infanta',
        'company': 'J&T Express',
        'latitude': 14.0156,
        'longitude': 121.8756,
        'address': 'Poblacion, Infanta, Quezon'
    },
    {
        'name': 'Real DH1',
        'location': 'Real DH1',
        'city': 'Real',
        'company': 'J&T Express',
        'latitude': 14.3245,
        'longitude': 121.9234,
        'address': 'Poblacion, Real, Quezon'
    },
    {
        'name': 'Gen. Nakar DH1',
        'location': 'Gen. Nakar DH1',
        'city': 'General Nakar',
        'company': 'J&T Express',
        'latitude': 14.5234,
        'longitude': 121.7654,
        'address': 'Poblacion, General Nakar, Quezon'
    },
    {
        'name': 'Tiaong DH1',
        'location': 'Tiaong DH1',
        'city': 'Tiaong',
        'company': 'J&T Express',
        'latitude': 14.1654,
        'longitude': 121.3876,
        'address': 'Poblacion, Tiaong, Quezon'
    },
    {
        'name': 'Dolores DH1',
        'location': 'Dolores DH1',
        'city': 'Dolores',
        'company': 'J&T Express',
        'latitude': 14.2876,
        'longitude': 121.4234,
        'address': 'Poblacion, Dolores, Quezon'
    },
    {
        'name': 'San Antonio DH1',
        'location': 'San Antonio DH1',
        'city': 'San Antonio',
        'company': 'J&T Express',
        'latitude': 14.3456,
        'longitude': 121.4876,
        'address': 'Poblacion, San Antonio, Quezon'
    },
]

created_count = 0

print("\nAdding new hubs...")
for hub_data in hubs_data:
    hub = Hub.objects.create(
        name=hub_data['name'],
        location=hub_data['location'],
        city=hub_data['city'],
        company=hub_data['company'],
        latitude=hub_data['latitude'],
        longitude=hub_data['longitude'],
        address=hub_data['address'],
    )
    created_count += 1
    print(f'✓ Created: {hub_data["name"]}')

print(f'\nSummary: {deleted_count} deleted, {created_count} created')
