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
from django.db import DataError

def locations():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "locations.json")
    f = open(path)
    data = json.load(f)

    return data


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


        prev = 0
        #Article.objects.all().delete()
        ls = locations()

        feeds = [
            feedparser.parse('feed://news.google.com/news?pz=1&cf=all&ned=uk&hl=en&topic=w&output=rss'), #world
            feedparser.parse('feed://news.google.com/news?cf=all&ned=uk&hl=en&topic=m&output=rss'), #health
            feedparser.parse('feed:https://news.google.com/news/feeds?cf=all&ned=en_za&hl=en&topic=af&output=rss'), #africa
            feedparser.parse('feed:https://news.google.com/news/feeds?cf=all&ned=en_sg&hl=en&topic=se&output=rss'), #southeast asia
        ]


        for l in ls:
            feed = feedparser.parse('feed:https://news.google.com/news/feeds?pz=1&cf=all&ned=us&hl=en&geo='+l['name'].replace(" ", "+")+'&output=rss')

            for item in feed.entries:
                soup = BeautifulSoup(item.description)
                title = soup.find("div", {"class": "lh"}).find_all('b')[0].getText()
                if not Article.objects.all().filter(title=title).exists():

                    article = Article()

                    article.article_url=item.link

                    article.date=timezone.now()

                    location = l['name']
                    print(location)

                    if soup.find("img").has_attr('src'):
                        article.image_url = soup.find("img")['src']
                    else:
                        article.image_url = ""

                    lh = soup.find("div", {"class": "lh"})
                    article.importance = 1
                    fonts = lh.find_all('font')
                    article.title = title
                    article.provider = fonts[1].getText()
                    article.summary = fonts[2].getText()
                    article.cluster_url = lh.find("a", {"class": "p"})['href']

                    if location:
                        article.location = Location.objects.get(name=location)
                        try:
                            article.save()
                        except DataError:
                            print("data error")
