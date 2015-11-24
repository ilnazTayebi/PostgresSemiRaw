#!/usr/bin/env python

from flask import Flask, request, jsonify, Response, send_from_directory
import os
import threading
from argparse import ArgumentParser, FileType
import collections
import requests
import logging
import json
from sniff import sniff

lock = threading.Lock()
# deque is like a circular buffer (we will keep the last 100 messages)
info = collections.deque(maxlen=100)
executer_url = ""
user = ''


logging.basicConfig(level=logging.INFO)

def append_msg(msg, msg_type='response'):
    info.append(dict(type=msg_type,msg=msg))
    print info

def registerfile(path):
  # extracts name and type from the filename 
    logging.info("Registering file %s" % path )
    basename = os.path.basename(path)
    parts = os.path.splitext(basename)
    name = parts[0]    
    extension = parts[1].lower()
    if extension == ".csv":
        file_type = 'csv'
    elif extension == ".json":
        file_type = 'json'
    elif extension == '.log' or \
            extension == '.text' or \
            extension =='.txt':
        file_type = 'text'
    else:
        logging.warn("not registering unknon file type "+ path)
        return

    data = dict( 
        protocol='url',
        filename =basename,
        url='file://%s' % os.path.abspath(path),
        name=name,
        type=file_type)
    url = '%s/register-file' % executer_url 
    response=requests.post(url, json=data, auth=(user, 'pass'))
    append_msg(dict(status=response.status_code, data=json.loads(response.text)))


def on_start(files, do_reload=True):
    for f in files:
        registerfile(f)

def on_create(f, do_reload=True):
    registerfile(f)
  
def on_modified(f):
  append_msg("WARNING: File modified but feature not implemented yet" + f, msg_type = 'warning')

def on_delete(f):
    # Do nothing on delete.
    # The alternative would have been to reload again all other data.
    append_msg("WARNING: File delete but feature not implemented yet" + f, msg_type = 'warning')
    

def background_loader(do_reload=True, folder="data"):
    print "folder=%s , reload = %s " %(folder, reload)
    sniff(folder=folder, lock=lock, interval=1,
        on_start=on_start, on_create=on_create, on_modified=on_modified,
        on_delete=on_delete, do_reload=do_reload)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

@app.route('/status', methods=['GET'])
def status():
    print info
    return jsonify(dict(status=list(info)))

if __name__ == '__main__':
    argp = ArgumentParser(description="Raw sniff server")
    argp.add_argument( "--executer","-e",default="http://localhost:54321",
            help="url of the scala executer" , metavar="URL")        
    argp.add_argument( "--reload","-r", action="store_true", default=False,
            help="reloads the file if a change was detected")
    argp.add_argument("--folder", "-f", default="data", metavar="FOLDER",
            help="Folder to be sniffed for changes")
    argp.add_argument("--user", "-u", default="admin",
            help="user name to register files")

    args = argp.parse_args()
    executer_url = args.executer
    user = args.user
    thread = threading.Thread(target=background_loader,
                                      args=(args.reload,args.folder, ))
    thread.setDaemon(True)
    thread.start()                                      
    app.run(host='0.0.0.0', port=5555)
