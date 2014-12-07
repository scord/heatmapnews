from .base import *

DEBUG = True
TEMPLATE_DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'heatmapnews',
        'USER': os.environ['HMN_USER'],
        'PASSWORD': os.environ['HMN_PASS'],
        'HOST': '127.0.0.1',
        'PORT': '',
    }
}
