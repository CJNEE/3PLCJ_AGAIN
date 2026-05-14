import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Hub

for h in Hub.objects.all():
    print(f"{h.name} - Lat: {h.latitude}, Lon: {h.longitude}")
