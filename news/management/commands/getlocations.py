from django.core.management.base import BaseCommand, CommandError
from news.models import Location
import json
import sys, os

def locations():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "locations.json")
    f = open(path)
    data = json.load(f)
    return data

class Command(BaseCommand):
    help = 'Updates database with new articles'


    def handle(self, **options):
        ls = locations()
        Location.objects.all().delete()
        for l in ls:
            location = Location()
            location.name = l['name']
            if l['capital']['latlng']:
                location.latitude = l['capital']['latlng'][0]
                location.longitude = l['capital']['latlng'][1]
            location.save()
