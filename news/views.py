from django.shortcuts import render
from django.core import serializers
from news.models import Article
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
from math import sqrt
import json


def index(request):
    return render(request, 'news/index.html')


def getDates(date):
    result = ["", ""]

    if date[0] == "now":
        result[0] = timezone.now() - timedelta(hours=12)
        result[1] = timezone.now()
    else:
        result[0] = datetime(
            int(date[2]),
            int(date[1]),
            int(date[0]),
            0, 0, 0
            ) - timedelta(days=1)

        result[1] = datetime(
            int(date[2]),
            int(date[1]),
            int(date[0]),
            0, 0, 0
            )

    return result


def locations(request):

    if request.method == 'GET':
        date = request.GET['date'].split('-')

    dates = getDates(date)
    minDate = dates[0]
    maxDate = dates[1]

    data = serializers.serialize(
        "json",
        (Article.objects.all()
            .filter(date__range=(minDate, maxDate))
            .order_by('-importance')),
        fields=('importance', 'location'),
        use_natural_keys=True
        )

    return HttpResponse(data)

def articles(request):

    lat = 0
    lng = 0

    index = 0
    if request.method == 'GET':
        lat = request.GET['lat']
        lng = request.GET['lng']
        index = int(request.GET['index'])
        date = request.GET['date'].split('-')

    minLat = float(lat) - 8.0
    maxLat = float(lat) + 8.0

    minLng = float(lng) - 10.0
    maxLng = float(lng) + 10.0

    dates = getDates(date)
    minDate = dates[0]
    maxDate = dates[1]

    articles = (
        Article.objects.all()
        .filter(date__range=(minDate, maxDate),
                location__latitude__range=(minLat, maxLat),
                location__longitude__range=(minLng, maxLng))
        .order_by('importance')
        )

    item = sorted(
        articles,
        key=lambda x: (
            sqrt((x.location.latitude - float(lat))**2 +
                 (x.location.longitude - float(lng))**2),
            -x.importance
            )
        )[index:index+1]

    data = serializers.serialize("json", item, use_natural_keys=True)
    return HttpResponse(data)
