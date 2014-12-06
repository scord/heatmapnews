from django.core.management.base import BaseCommand, CommandError
from news.models import Article
from news.models import Location
import feedparser
import json
import urllib
from bs4 import BeautifulSoup
import sys
import datetime
import os
from django.utils import timezone

def locations():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "locations.json")
    f = open(path)
    data = json.load(f)

    return data

def subject(a):
    ls = locations()


    for l in ls:
        a = a.replace(l['name'], l['name'].replace(" ", ""))
        a = a.replace(l['capital']['name'], l['capital']['name'].replace(" ", ""))
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
        if l['capital']['name'].replace(" ", "") in counts:
            score += 2 * counts[l['capital']['name'].replace(" ", "")]
        if l['demonym'].replace(" ","") in counts:
            score += 3 * counts[l['demonym'].replace(" ","")]
        if l['region'].replace(" ", "") in counts:
            score += counts[l['region'].replace(" ", "")]
        if l['subregion'].replace(" ", "") in counts:
            score += counts[l['subregion'].replace(" ", "")]


        for spelling in l['altSpellings']:
            if len(spelling) > 2 and spelling in counts:
                    score += 2* counts[spelling.replace(" ", "")]

        if score > topscore or (score >= topscore and float(x['relevance']) > relevance):
            topcountry = x['name']
            topscore = score
            relevance = float(x['relevance'])

    if topscore <= 6:
        return ""


    return topcountry

def makeLowercase(location):
    l = {}
    l['capital'] = {}
    l['name'] = location['name'].lower()
    l['capital']['name'] = location['capital']['name'].lower()
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

def getArticle(item, soup):

    ps = soup.find_all('font')[5:]

    text = []

    for p in ps[:len(ps)]:
        articleText = p.getText()
        if len(articleText) > 20:
            text.append(articleText)

    text.append(item.title)

    return " ".join(text)



class Command(BaseCommand):
    help = 'Updates database with new articles'

    def handle(self, **options):

        feeds = [
            feedparser.parse('feed://news.google.com/news?pz=1&cf=all&ned=uk&hl=en&topic=w&output=rss'), #world
            feedparser.parse('feed://news.google.com/news?cf=all&ned=uk&hl=en&topic=m&output=rss'), #health
        ]

        prev = 0
        #Article.objects.all().delete()

        for feed in feeds:
            for item in feed.entries:
                soup = BeautifulSoup(item.description)
                title = soup.find("div", {"class": "lh"}).find_all('b')[0].getText()
                if not Article.objects.all().filter(title=title).exists():

                    article = Article()

                    article.article_url=item.link

                    article.date=timezone.now()

                    location = subject(getArticle(item, soup))

                    if soup.find("img").has_attr('src'):
                        article.image_url = soup.find("img")['src']
                    else:
                        article.image_url = ""

                    lh = soup.find("div", {"class": "lh"})
                    importance = lh.find("a", {"class": "p"}).getText().split()[1].replace(",","").replace(".","")
                    fonts = lh.find_all('font')
                    article.title = title
                    article.provider = fonts[1].getText()
                    article.summary = fonts[2].getText()
                    article.cluster_url = lh.find("a", {"class": "p"})['href']

                    if importance.isdigit():
                        article.importance = float(importance)
                        prev = importance
                    else:
                        article.importance = prev

                    if location:
                        article.location = Location.objects.get(name=location)
                        article.save()
