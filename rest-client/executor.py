import os
import requests
import json

def schemas(executer_url, user):
    url = '%s/schemas' % executer_url
    print "Sending request to %s." % (url)
    response=requests.get(url, auth=(user, 'pass'))
    if response.status_code == 200:
        print "Schemas: %s" % (json.loads(response.text))
    else:
        print "Error: %s" % (json.loads(response.text))

def registerfile(executer_url, user, path):
  # extracts name and type from the filename 
    basename = os.path.basename(path)
    parts = os.path.splitext(basename)
    name = parts[0]    
    extension = parts[1].lower()
    if extension == ".csv":
        file_type = 'csv'
    elif extension == ".json":
        file_type = 'json'
    elif extension == ".parquet":
        file_type = 'parquet'
    elif extension == '.log' or \
            extension == '.text' or \
            extension =='.txt':
        file_type = 'text'
    else:
        print "not registering unknon file type %s " % path
        return

    file_url = 'file://%s' % os.path.abspath(path)
    data = dict( 
        protocol='url',
        filename =basename,
        url=file_url,
        name=name,
        type=file_type)
    url = '%s/register-file' % executer_url 
    print "Sending request to %s:\n%s" % (url, data)
    response=requests.post(url, json=data, auth=(user, 'pass'))
    if response.status_code == 200:
        print "Registered file %s, shema name %s" % (path,name)
    else:
        print "Error registering file %s. %s" % (path, json.loads(response.text))

