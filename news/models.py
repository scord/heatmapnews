from django.db import models
from django.utils import timezone


class LocationManager(models.Manager):
    def get_by_natural_key(self, name, longitude, latitude):
        return self.get(name=name, longitude=longitude, latitude=latitude)


class Location(models.Model):
    objects = LocationManager()

    name = models.CharField(max_length=50)
    latitude = models.FloatField(default=0)
    longitude = models.FloatField(default=0)

    def natural_key(self):
        return (self.name, self.latitude, self.longitude)

    class Meta:
        unique_together = (('name', 'longitude', 'latitude'),)


class Article(models.Model):
    article_url = models.TextField()
    title = models.TextField(default="")
    provider = models.CharField(max_length=50, default="")
    summary = models.TextField(default="")
    image_url = models.TextField(default="")
    cluster_url = models.TextField(default="")
    location = models.ForeignKey(Location)
    importance = models.IntegerField(default=1)
    date = models.DateTimeField('date retrieved', default=timezone.now)
