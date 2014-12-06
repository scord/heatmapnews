from django.core.management.base import BaseCommand, CommandError
from news.models import Article
from news.models import Location
import feedparser
import json
import urllib
from bs4 import BeautifulSoup
import sys
import datetime
from django.utils import timezone

def locations():
    f = open("countries.json")
    data = json.load(f)
    return data

def subject(url):
    ls = locations()
    a = article(url)

    for l in ls:
        a = a.replace(l['name'], l['name'].replace(" ", ""))
        a = a.replace(l['capital'], l['capital'].replace(" ", ""))
        a = a.replace(l['demonym'], l['demonym'].replace(" ", ""))
        a = a.replace(l['region'], l['region'].replace(" ", ""))
        a = a.replace(l['subregion'], l['subregion'].replace(" ", ""))

        for s in l['altSpellings']:
            a = a.replace(s, s.replace(" ", ""))

    a = a.lower()

    counts = wordCount(a)

    topscore = 0
    toplocation = ""
    topcountry = ""
    relevance = 0.0

    for x in sorted(ls, key= lambda c: -float(c['relevance'])):
        l = makeLowercase(x)
        score = 0

        if l['name'].replace(" ", "") in counts:
            score += 3 * counts[l['name'].replace(" ", "")]
        if l['capital'].replace(" ", "") in counts:
            score += 2 * counts[l['capital'].replace(" ", "")]
        if l['demonym'].replace(" ","") in counts:
            score += 3 * counts[l['demonym'].replace(" ","")]
        if l['region'].replace(" ", "") in counts:
            score += counts[l['region'].replace(" ", "")]
        if l['subregion'].replace(" ", "") in counts:
            score += counts[l['subregion'].replace(" ", "")]

        smallWords = ["so","st","in","is","as","to","at","be","of","it","mr","ms","by","me","my","no","mp","la","on"]

        for spelling in l['altSpellings']:
            if len(spelling) >= 2 and spelling not in smallWords:
                if spelling in counts:
                    score += 2* counts[spelling.replace(" ", "")]

        if score > topscore or (score >= topscore and float(x['relevance']) > relevance):
            topcountry = x['name']
            topscore = score
            relevance = float(x['relevance'])

    print(topcountry, topscore)

    if topscore <= 5:
        return ""



    return topcountry

def makeLowercase(location):
    l = {}
    l['name'] = location['name'].lower()
    l['capital'] = location['capital'].lower()
    l['demonym'] = location['demonym'].lower()
    l['region'] = location['region'].lower()
    l['subregion'] = location['subregion'].lower()
    l['altSpellings'] = location['altSpellings']

    for i in range(len(l['altSpellings'])):
        l['altSpellings'][i] = l['altSpellings'][i].lower()

    return l

def wordCount(s):
    for c in set(',.[]\"\'/-'):
        s = s.replace(c, " ")
    counts = {}
    for word in s.split():
        if word in counts:
            counts[word] += 1
        else:
            counts[word] = 1

    return counts

def article(url):
    page = urllib.request.urlopen(url)
    soup = BeautifulSoup(page)
    ps = soup.find_all('p')
    text = []
    for p in ps:
        text.append(p.getText())

    if soup.find('h1'):
        text.append(soup.find('h1').getText())
    text.append(url)

    return " ".join(text)



class Command(BaseCommand):
    help = 'Updates database with new articles'


    def handle(self, **options):

        feeds = [
            feedparser.parse('feed://feeds.bbci.co.uk/news/world/rss.xml'),
            feedparser.parse('feed://mf.feeds.reuters.com/reuters/UKWorldNews'),
            feedparser.parse('feed://feeds.reuters.com/reuters/MostRead'),
        ]



        Article.objects.all().delete()


        for feed in feeds:
            importance = 1
            for item in feed.entries:
                article = Article()
                article.article_url=item.link
                article.publisher=feed.channel.title
                article.title=item.title
                article.date=timezone.now()
                article.importance = importance
                importance += 1
                location = subject(item.link)
                if location:
                    article.location = Location.objects.get(name=location)
                    article.save()
