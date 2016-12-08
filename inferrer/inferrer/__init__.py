# Infer schema from a local file or url
import urllib2
from urlparse import urlparse
from boto.s3.connection import S3Connection
from cStringIO import StringIO
import urllib
import io
import os
import logging

from csv_inferrer import CSVInferrer
from json_inferrer import JSONInferrer, json_sample
from log_inferrer import LogInferrer
from .common import InferrerException, sample_lines
from raw_types import *

def from_url(url, file_type, n_objs=1000, options=dict(), n_bytes=250000):
    parsed = urlparse(url)
    if parsed.scheme == 's3':
        conn = S3Connection()
        bucket = conn.get_bucket(parsed.netloc)
        key = urllib.unquote(parsed.path)
        obj = bucket.get_key(key)
        s = obj.read(n_bytes)
    elif parsed.scheme == '' or parsed.scheme == 'file':
        if os.name == 'nt':
            path = parsed.path.lstrip('/').replace('%20', ' ')
        else:
            path = parsed.path
        with open(path,'r') as f:
            s = f.read(n_bytes)
    else:
        # here we are trying to get a range only 
        # not all servers honor this 
        req = urllib2.Request(url)
        req.headers['Range']='bytes=%s-%s' % (0, n_bytes)
        f = urllib2.urlopen(req)
        s = f.read()
        f.close()
               
    # here decodes the string 
    encoding = options.get('encoding', 'UTF-8')
    s = s.decode(encoding)
    # the encode('UTF-8') is to force to ascii
    f = StringIO(s.encode('UTF-8'))    
    out = None
    if file_type == 'json' or file_type == 'hjson':
        s = json_sample(f, n_objs, file_format=file_type)
        inferrer = JSONInferrer(s, options)
        out=  inferrer.infer_type()
    elif file_type == 'csv':
        s = sample_lines(f, n_objs)
        inferrer = CSVInferrer(s, options)
        out = inferrer.infer_type()
    elif file_type == 'text':
        s = sample_lines(f, n_objs)
        inferrer = LogInferrer(s, options)
        out = inferrer.infer_type()
    else:
        raise ValueError("Type not supported")
    f.close()
    return out

def supported_types():
    """ Helper function just to return the supported type by the inferrer """
    return ['json','csv', 'text', 'hjson']

    
