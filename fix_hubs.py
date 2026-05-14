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
print("Deleting all hubs...")
Hub.objects.all().delete()

# Update all hubs with correct city names
hubs = [
    ('Lucena DH1 (Main Hub)', 'Lucena DH1 (Main Hub)', 'Lucena City, Quezon', 'J&T Express', 14.2562, 121.6155, 'Magsaysay Boulevard, Lucena City, Quezon'),
    ('Lucena DH2 (Gulang-Gulang)', 'Lucena DH2 (Gulang-Gulang)', 'Lucena City, Quezon', 'J&T Express', 14.2580, 121.6200, 'Gulang-Gulang, Lucena City, Quezon'),
    ('Lucena DH3 (Dalahican)', 'Lucena DH3 (Dalahican)', 'Lucena City, Quezon', 'J&T Express', 14.2598, 121.7032, 'Dalahican, Lucena City, Quezon'),
    ('Tayabas DH1', 'Tayabas DH1', 'Tayabas, Quezon', 'J&T Express', 14.0447, 121.5242, 'San Francisco District, Tayabas, Quezon'),
    ('Sariaya DH1', 'Sariaya DH1', 'Sariaya, Quezon', 'J&T Express', 13.8968, 121.4523, 'Centro, Sariaya, Quezon'),
    ('Candelaria DH1', 'Candelaria DH1', 'Candelaria, Quezon', 'J&T Express', 13.8254, 121.5542, 'Poblacion, Candelaria, Quezon'),
    ('Gumaca DH1', 'Gumaca DH1', 'Gumaca, Quezon', 'J&T Express', 13.6987, 121.8456, 'Poblacion, Gumaca, Quezon'),
    ('Lopez DH1', 'Lopez DH1', 'Lopez, Quezon', 'J&T Express', 13.5234, 121.9876, 'Poblacion, Lopez, Quezon'),
    ('Infanta DH1', 'Infanta DH1', 'Infanta, Quezon', 'J&T Express', 14.0156, 121.8756, 'Poblacion, Infanta, Quezon'),
    ('Real DH1', 'Real DH1', 'Real, Quezon', 'J&T Express', 14.3245, 121.9234, 'Poblacion, Real, Quezon'),
    ('Gen. Nakar DH1', 'Gen. Nakar DH1', 'General Nakar, Quezon', 'J&T Express', 14.5234, 121.7654, 'Poblacion, General Nakar, Quezon'),
    ('Tiaong DH1', 'Tiaong DH1', 'Tiaong, Quezon', 'J&T Express', 14.1654, 121.3876, 'Poblacion, Tiaong, Quezon'),
    ('Dolores DH1', 'Dolores DH1', 'Dolores, Quezon', 'J&T Express', 14.2876, 121.4234, 'Poblacion, Dolores, Quezon'),
    ('San Antonio DH1', 'San Antonio DH1', 'San Antonio, Quezon', 'J&T Express', 14.3456, 121.4876, 'Poblacion, San Antonio, Quezon'),
]

for name, location, city, company, lat, lng, address in hubs:
    Hub.objects.create(name=name, location=location, city=city, company=company, latitude=lat, longitude=lng, address=address)
    print(f"✓ Created: {name}")

print(f"\n✓ Successfully created {len(hubs)} hubs")
