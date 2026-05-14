import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Hub

hubs_data = [
    {"name": "Lucena DH1 (Main Hub)", "company": "J&T Express Lucena Hub", "city": "Lucena", "lat": 13.9314, "lon": 121.6173},
    {"name": "Lucena DH2 (Gulang-Gulang)", "company": "J&T Express Gulang-Gulang Branch", "city": "Lucena", "lat": 13.9450, "lon": 121.6100},
    {"name": "Lucena DH3 (Dalahican)", "company": "J&T Express Dalahican Branch", "city": "Lucena", "lat": 13.9000, "lon": 121.6200},
    {"name": "Tayabas DH1", "company": "J&T Express Tayabas Branch", "city": "Tayabas", "lat": 14.0253, "lon": 121.5815},
    {"name": "Sariaya DH1 (Lutucan Area)", "company": "J&T Express Sariaya Branch", "city": "Sariaya", "lat": 13.9631, "lon": 121.5249},
    {"name": "Sariaya DH2 (Tumbaga Area)", "company": "J&T Express Sariaya Branch", "city": "Sariaya", "lat": 13.9500, "lon": 121.5300},
    {"name": "Sariaya DH3 (Extended Area)", "company": "J&T Express Sariaya Branch", "city": "Sariaya", "lat": 13.9700, "lon": 121.5200},
    {"name": "Candelaria DH1", "company": "J&T Express Candelaria Branch", "city": "Candelaria", "lat": 13.9311, "lon": 121.4233},
    {"name": "Gumaca DH1", "company": "J&T Express Gumaca Branch", "city": "Gumaca", "lat": 13.9238, "lon": 122.0991},
    {"name": "Lopez DH1", "company": "J&T Express Lopez Branch", "city": "Lopez", "lat": 13.8821, "lon": 122.2587},
    {"name": "Lopez DH2 (Extended Area)", "company": "J&T Express Lopez Branch", "city": "Lopez", "lat": 13.8700, "lon": 122.2600},
    {"name": "Infanta DH1", "company": "J&T Express Infanta Branch", "city": "Infanta", "lat": 14.7431, "lon": 121.6472},
    {"name": "Real DH1", "company": "J&T Express Real Branch", "city": "Real", "lat": 14.6644, "lon": 121.6042},
    {"name": "Gen. Nakar DH1", "company": "J&T Express General Nakar Branch", "city": "General Nakar", "lat": 14.7644, "lon": 121.6369},
    {"name": "Tiaong DH1", "company": "J&T Express Tiaong Branch", "city": "Tiaong", "lat": 13.9619, "lon": 121.3236},
    {"name": "Dolores DH1", "company": "J&T Express Dolores Branch", "city": "Dolores", "lat": 14.0150, "lon": 121.4024},
    {"name": "San Antonio DH1", "company": "J&T Express San Antonio Branch", "city": "San Antonio", "lat": 13.8967, "lon": 121.2933},
]

created_count = 0
for h in hubs_data:
    obj, created = Hub.objects.get_or_create(
        name=h["name"],
        defaults={
            "location": h["city"],
            "city": h["city"],
            "company": h["company"],
            "address": f"J&T Express {h['city']}, Quezon",
            "latitude": h["lat"],
            "longitude": h["lon"]
        }
    )
    if created:
        created_count += 1
        print(f"Created: {h['name']}")
    else:
        print(f"Already exists: {h['name']}")

print(f"Total hubs created: {created_count}")
