from django.core.management.base import BaseCommand
from employees.models import Hub
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seed J&T Quezon hubs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all existing hubs first',
        )

    def handle(self, *args, **options):
        if options['reset']:
            Hub.objects.all().delete()
            self.stdout.write(self.style.WARNING('Deleted all existing hubs'))

        hubs_data = [
            {
                'name': 'J&T Express Lucena Hub',
                'location': 'Lucena City',
                'city': 'Quezon',
                'company': 'J&T Express',
                'address': '123 Quezon Ave, Lucena City, Quezon',
                'latitude': 13.9365,
                'longitude': 121.6173
            },
            {
                'name': 'J&T Express Tayabas Hub',
                'location': 'Tayabas City',
                'city': 'Quezon',
                'company': 'J&T Express',
                'address': 'Tayabas National Rd, Tayabas City, Quezon',
                'latitude': 14.0105,
                'longitude': 121.5181
            },
            {
                'name': 'J&T Express Sariaya DH1',
                'location': 'Lutucan Malabag',
                'city': 'Sariaya, Quezon',
                'company': 'J&T Express',
                'address': 'WF4Q+8XP, Lutucan Malabag, Sariaya, 4322 Quezon',
                'latitude': 13.956,
                'longitude': 121.539
            },
            {
                'name': 'J&T Express Sariaya DH2',
                'location': 'Tumbaga 1',
                'city': 'Sariaya, Quezon',
                'company': 'J&T Express',
                'address': 'XG2H+C67 Tumbaga 1, Sariaya, 4322 Quezon',
                'latitude': 13.962,
                'longitude': 121.546
            },
            {
                'name': 'J&T Express Sariaya DH3',
                'location': 'Sariaya',
                'city': 'Quezon',
                'company': 'J&T Express',
                'address': 'WFJ9+MH8, Sariaya, Quezon',
                'latitude': 13.970,
                'longitude': 121.535
            },
            {
                'name': 'J&T Express Tiaong DH',
                'location': 'Tiaong',
                'city': 'Quezon',
                'company': 'J&T Express',
                'address': 'X8JH+P6X, Tiaong, Quezon',
                'latitude': 13.951,
                'longitude': 121.501
            },
            {
                'name': 'J&T Express Tiaong DH2',
                'location': 'Tiaong',
                'city': 'Quezon',
                'company': 'J&T Express',
                'address': 'X839+7VF, Tiaong, Quezon',
                'latitude': 13.949,
                'longitude': 121.503
            },
            {
                'name': 'J&T Express Candelaria DH',
                'location': 'Rev Avenue',
                'city': 'Candelaria, Quezon',
                'company': 'J&T Express',
                'address': 'WCJJ+263, Rev Avenue, Candelaria, Quezon',
                'latitude': 13.927,
                'longitude': 121.629
            },
            {
                'name': 'J&T Express Candelaria DH2',
                'location': 'Masin Sur',
                'city': 'Candelaria, Quezon',
                'company': 'J&T Express',
                'address': 'WCGC+Q5P, Masin Sur, Candelaria, Quezon',
                'latitude': 13.930,
                'longitude': 121.632
            },
            {
                'name': 'J&T Express San Antonio DH',
                'location': 'Sampaguita',
                'city': 'San Antonio, Quezon',
                'company': 'J&T Express',
                'address': 'V7QP+MJP, Sampaguita, San Antonio, Quezon',
                'latitude': 13.766,
                'longitude': 121.400
            },
        ]
        
        created = 0
        for data in hubs_data:
            hub, new = Hub.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if new:
                created += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully seeded/verified {len(hubs_data)} J&T Quezon hubs ({created} new)')
        )
