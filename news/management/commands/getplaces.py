from django.core.management.base import BaseCommand, CommandError
from news.models import Location, Place
import json
import sys

def locations():
    f = open("countries.json")
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
            if l['latlng']:
                location.latitude = l['latlng'][0]
                location.longitude = l['latlng'][1]
            location.save()
