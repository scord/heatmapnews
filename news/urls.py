from django.conf.urls import url
from django.conf.urls.static import static
from django.conf import settings

from news import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^articles/$', views.articles, name='articles'),
    url(r'^locations/$', views.locations, name='locations'),
]
