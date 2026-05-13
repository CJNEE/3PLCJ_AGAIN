import os
import sys
import pathlib
import django

project_root = pathlib.Path(__file__).resolve().parents[0]
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Hub

hubs_data = [
    {
        'name': 'J&T Express Lucena Hub',
        'city': 'Lucena City',
        'company': 'J&T Express',
        'latitude': 14.2562,
        'longitude': 121.6155,
        'address': 'Lucena City, Quezon'
    },
    {
        'name': 'J&T Express Gulang-Gulang Branch',
        'city': 'Quezon',
        'company': 'J&T Express',
        'latitude': 14.4128,
        'longitude': 121.6372,
        'address': 'Gulang-Gulang, Quezon'
    },
    {
        'name': 'J&T Express Dalahican Branch',
        'city': 'Quezon',
        'company': 'J&T Express',
        'latitude': 14.2598,
        'longitude': 121.7032,
        'address': 'Dalahican, Quezon'
    },
    {
        'name': 'J&T Express Tayabas Branch',
        'city': 'Tayabas',
        'company': 'J&T Express',
        'latitude': 14.0447,
        'longitude': 121.5242,
        'address': 'Tayabas, Quezon'
    },
    {
        'name': 'J&T Express Sariaya Branch',
        'city': 'Sariaya',
        'company': 'J&T Express',
        'latitude': 13.8968,
        'longitude': 121.4523,
        'address': 'Sariaya, Quezon'
    },
    {
        'name': 'J&T Express Candelaria Branch',
        'city': 'Candelaria',
        'company': 'J&T Express',
        'latitude': 13.8254,
        'longitude': 121.5542,
        'address': 'Candelaria, Quezon'
    },
    {
        'name': 'J&T Express Gumaca Branch',
        'city': 'Gumaca',
        'company': 'J&T Express',
        'latitude': 13.6987,
        'longitude': 121.8456,
        'address': 'Gumaca, Quezon'
    },
    {
        'name': 'J&T Express Lopez Branch',
        'city': 'Lopez',
        'company': 'J&T Express',
        'latitude': 13.5234,
        'longitude': 121.9876,
        'address': 'Lopez, Quezon'
    },
    {
        'name': 'J&T Express Infanta Branch',
        'city': 'Infanta',
        'company': 'J&T Express',
        'latitude': 14.0156,
        'longitude': 121.8756,
        'address': 'Infanta, Quezon'
    },
    {
        'name': 'J&T Express Real Branch',
        'city': 'Real',
        'company': 'J&T Express',
        'latitude': 14.3245,
        'longitude': 121.9234,
        'address': 'Real, Quezon'
    },
    {
        'name': 'J&T Express General Nakar Branch',
        'city': 'General Nakar',
        'company': 'J&T Express',
        'latitude': 14.5234,
        'longitude': 121.7654,
        'address': 'General Nakar, Quezon'
    },
    {
        'name': 'J&T Express Tiaong Branch',
        'city': 'Tiaong',
        'company': 'J&T Express',
        'latitude': 14.1654,
        'longitude': 121.3876,
        'address': 'Tiaong, Quezon'
    },
    {
        'name': 'J&T Express Dolores Branch',
        'city': 'Dolores',
        'company': 'J&T Express',
        'latitude': 14.2876,
        'longitude': 121.4234,
        'address': 'Dolores, Quezon'
    },
    {
        'name': 'J&T Express San Antonio Branch',
        'city': 'San Antonio',
        'company': 'J&T Express',
        'latitude': 14.3456,
        'longitude': 121.4876,
        'address': 'San Antonio, Quezon'
    },
]

created_count = 0
updated_count = 0

for hub_data in hubs_data:
    hub, created = Hub.objects.get_or_create(
        name=hub_data['name'],
        defaults={
            'city': hub_data['city'],
            'company': hub_data['company'],
            'latitude': hub_data['latitude'],
            'longitude': hub_data['longitude'],
            'address': hub_data['address'],
        }
    )
    
    if created:
        created_count += 1
        print(f'✓ Created: {hub_data["name"]}')
    else:
        # Update coordinates if they exist
        if hub.latitude != hub_data['latitude'] or hub.longitude != hub_data['longitude']:
            hub.latitude = hub_data['latitude']
            hub.longitude = hub_data['longitude']
            hub.address = hub_data['address']
            hub.save()
            updated_count += 1
            print(f'✓ Updated: {hub_data["name"]}')
        else:
            print(f'- Exists: {hub_data["name"]}')

print(f'\nSummary: {created_count} created, {updated_count} updated')
