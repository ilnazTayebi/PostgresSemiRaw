import logging
from argparse import ArgumentParser
from urlparse import urlparse
import os.path
from cStringIO import StringIO
from . import common, csv_inferrer

logging.basicConfig(level=logging.INFO)
   
# Function get_structure_of_csv_file 
# Reads file of type csv at 'path', and infers the type of data in each column
# Returns a RawListType containing a RawRecordType, which contains the column types (as RawTypes)
### Adapted from the previous 'from_url' function, which accepted s3 or url resources (scheme)
### as well as json and text file types 
def get_structure_from_csv_file(url, n_objs=1000, options=dict(), n_bytes=250000):
    parsed = urlparse(url)
    if parsed.scheme == '' or parsed.scheme == 'file':
        if os.name == 'nt':
            path = parsed.path.lstrip('/').replace('%20', ' ')
        else:
            path = parsed.path
        with open(path,'r') as f:
            s = f.read(n_bytes)
    else:
        # for now ignores
        logging.info('Unsupported path scheme %s',parsed.scheme)
        return None
    
    # here decodes the string 
    try:
        encoding = options.get('encoding', 'UTF-8')
    except UnicodeDecodeError as e:
        logging.info("Error decoding file %s : %s" % (path, e))
        logging.info("File %s will be ignored" % path)
        return
        
    s = s.decode(encoding)
    # the encode('UTF-8') is to force to ascii
    f = StringIO(s.encode('UTF-8'))    
    
    s = common.sample_lines(f, n_objs)
    inf = csv_inferrer.CSVInferrer(s, options)
    out = inf.infer_type()
    
    f.close()
    return out