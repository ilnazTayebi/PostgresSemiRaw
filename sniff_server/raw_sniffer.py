from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint
import os
import threading
import logging
import collections
import requests
import json
import datetime
from sniff import sniff

executer_url = ""
user = ''

lock = threading.Lock()
# deque is like a circular buffer (we will keep the last 100 messages)
info = collections.deque(maxlen=100)
last_info = collections.deque(maxlen=100)

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
    elif extension == ".parquet":
        file_type = 'parquet'
    elif extension == '.log' or \
                    extension == '.text' or \
                    extension =='.txt':
        file_type = 'text'
    else:
        logging.warn("not registering unknon file type "+ path)
        append_msg( "warning", "not registering unknown file type %s" % path )
        return

    data = dict(
        protocol='url',
        filename =basename,
        url='file://%s' % os.path.abspath(path),
        name=name,
        type=file_type)
    url = '%s/register-file' % executer_url
    response=requests.post(url, json=data, auth=(user, 'pass'))
    if response.status_code == 200:
        append_msg("success", "Registered file %s, shema name %s" % (path,name))
    else:
        append_msg("response-error", dict(msg="Error registering file %s" %path, response=json.loads(response.text)))

def append_msg(msg_type, msg):
    info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))
    last_info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))


def on_start(files, do_reload=True):
    for f in files:
        registerfile(f)

def on_create(f, do_reload=True):
    registerfile(f)

def on_modified(f):
    append_msg("warning", "File changed detected, registering again %s" % f)
    registerfile(f)

def on_delete(f):
    # Do nothing on delete.
    # The alternative would have been to reload again all other data.
    append_msg("warning","File delete but feature not implemented yet %s" % f)

def background_loader(do_reload=True, folder="data"):
    print "folder=%s , reload = %s " %(folder, reload)
    sniff(folder=folder, lock=lock, interval=1,
          on_start=on_start, on_create=on_create, on_modified=on_modified,
          on_delete=on_delete, do_reload=do_reload)

def init_sniffer(args):
    global  executer_url
    global user
    executer_url = args.executer
    user = args.user
    thread = threading.Thread(target=background_loader, args=(args.reload,args.folder, ))
    thread.setDaemon(True)
    thread.start()

raw_sniffer = Blueprint('raw_sniffer', __name__)

@raw_sniffer.route('/', methods=['GET'])
def index():
    return send_from_directory("../static/", "raw.html")

@raw_sniffer.route('/status', methods=['GET'])
def status():
    return jsonify(dict(status=list(info)))

@raw_sniffer.route('/last_status', methods=['GET'])
def last_status():
    l = list(last_info)
    last_info.clear()
    return jsonify(dict(status=l))