import os
import sys
import pathlib
import django

project_root = pathlib.Path(__file__).resolve().parents[0]
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Hub

hubs = Hub.objects.all()
print(f'Total hubs: {hubs.count()}')
for hub in hubs:
    print(f'{hub.id}: {hub.name} - {hub.location}')
