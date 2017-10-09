from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint
import os
import threading
import logging
import collections
import requests
import json
import datetime
import re
from sniff import sniff
#import pg_raw_server
from inferrer import inferrer
from sql_generator import SQLGenerator, SQLGeneratorException
import time

#executer_url = ""
#user = ''

config_file = ""
execute_query = None
n_snoop_conf_entries = 0
snoop_conf_path = ""

lock = threading.Lock()
# deque is like a circular buffer (we will keep the last 100 messages)
info = collections.deque(maxlen=100)
last_info = collections.deque(maxlen=100)


# Function registerfile
# Given the path of a csv file, creates the corresponding table in pgRAW database and updates
# pgRAW configuration in order to access the file's content
def registerfile(path):
    # extracts name and type from the filename
    logging.info("\tSniffer: Found file '%s'" % path )

    basename = os.path.basename(path)
    parts = os.path.splitext(basename)
    name = parts[0].lower()             # two files with the same .lower() name will not be distinguished...
    extension = parts[1].lower()
    if extension != ".csv":
        logging.warn("\tSniffer: Unsupported file '%s' will not be registered" % path)
        append_msg( "warning", "Unsupported file '%s' will not be registered" % path )
        return

    file_type = 'csv'

    logging.debug("\tSniffer: Try to get schema out of csv file '%s'" % path)
    schema, properties = infer_schema(path,'csv',name)
    if schema is None:
        logging.warning("\tSniffer: File '%s' will be ignored (schema is None)" % path)
        return

#     if properties['has_header']:
#         logging.warning("\tSniffer: File '%s' will be ignored (first line is header)" % path)
#         return

    rx = re.compile('[-]+')
    table_name = rx.sub('_',name)
    rx = re.compile('[^a-zA-Z0-9_]+')
    table_name = rx.sub('',table_name)
    rx2 = re.compile('^[^a-zA-Z]+')
    table_name = rx2.sub('',table_name)
    try:
        query = SQLGenerator(table_name, schema).getCreateTableQuery()
    except SQLGeneratorException as e:
        logging.error("\tSniffer: Error reading file '%s' : %s" % (path,e))
        logging.error("\t\tFaulty structure : %s" % schema)
        logging.error("\tSniffer: File '%s' will be ignored" % path)
        return

    #logging.warning('execute_query %s' % query)
    execute_query(query) #pg_raw_server.

    global n_snoop_conf_entries
    with open(snoop_conf_path, mode='a+') as f:
        f.write("filename-%i = '%s'\n" % (n_snoop_conf_entries,path))
        f.write("relation-%i = '%s'\n" % (n_snoop_conf_entries,table_name))
        f.write("delimiter-%i = '%s'\n" % (n_snoop_conf_entries,properties['delimiter']))
        f.write("header-%i = '%s'\n\n" % (n_snoop_conf_entries,properties['has_header']))
        n_snoop_conf_entries +=1

    logging.info("\tSniffer: File '%s' registered as table '%s'" % (path,table_name))

    '''
    data = dict(
        protocol='url',
        filename =basename,
        url='file://%s' % os.path.abspath(path),
        name=name,
        type=file_type)
    url = '%s/register-file' % executer_url
    response=requests.post(url, json=data, auth=(user, 'pass'))
    if response.status_code == 200:
        append_msg("success", "Registered file %s, schema name %s" % (path,name))
    else:
        append_msg("response-error", dict(msg="Error registering file %s" %path, response=json.loads(response.text)))
    '''

# Function infer_schema
# Builds and returns the schema corresponding to a given csv file (a rawListType from raw_types module)
# calls get_structure_from_csv_file from module inferrer to infer the schema
def infer_schema(file_path, file_type, name, options = dict()):
    n_objs = 500
    n_max = 10000
    schema = None
    properties = dict()
    while n_objs < n_max:
        try :
            # Infer schema
            schema, properties = inferrer.get_structure_from_csv_file(file_path, n_objs=n_objs, options=options)
            logging.debug("Schema: %s; Properties: %s" % (schema, properties))
            break
        except Exception as e:
            logging.warn("Exception: %s" % e)
            logging.info('Could not infer type with %d, retrying with %d' % (n_objs, 2*n_objs))
            n_objs = 2*n_objs

    # basedir = os.path.dirname(file)
    return schema, properties


# Function infer_create_table_query
# Builds and returns a CREATE TABLE query corresponding to a given csv file
# calls from_url to infer the schema and uses an SQLGenerator to create the query
def infer_create_table_query(file_path, file_type, name, options = dict()):
    query = SQLGenerator(name, schema).getCreateTableQuery()
    return query

def append_msg(msg_type, msg):
    info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))
    last_info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))


def on_start(files, do_reload=True):
    for f in files:
        registerfile(f)

def on_create(f, do_reload=True):
    registerfile(f)

def on_modified(f):
    append_msg("warning", "File changed detected (%s)" % f) #, modification of file scheme not supported
    registerfile(f)

def on_delete(f):
    # Do nothing on delete.
    # The alternative would have been to reload again all other data.
    append_msg("warning","File deleted (%s), but feature not implemented yet" % f)

# Function background_loader
# Launches the actual sniffer using the functions defined above
def background_loader(do_reload=True, folder="./datasets"):
    print "folder=%s , reload = %s " %(folder, reload)
    sniff(folder=folder, lock=lock, interval=1,
          on_start=on_start, on_create=on_create, on_modified=on_modified,
          on_delete=on_delete, do_reload=do_reload)

# Wrapper for a thread function based on http://stackoverflow.com/questions/29692250/restarting-a-thread-in-python
# Makes sure the thread function stays alive
def threadwrap(threadfunc, *args):
    def wrapper(*args):
        while True:
            try:
                threadfunc(*args)
            except BaseException as e:
                logging.info("\tSniffer: {!r}".format(e))
                logging.info("\tSniffer: restarting...".format(e))
                time.sleep(1)
            else:
                logging.info('\tSniffer: exited normally; restarting...')
                time.sleep(1)
    return wrapper

# Function init_sniffer
# Sets global variables snoop_conf_path and execute_query_method, and launches a sniffer in a thread
# Passing the execute_query_method as argument makes pg_raw_sniffer independent of database
def init_sniffer(args,execute_query_method):
    logging.info("pg_raw_server_sniffer.py init_sniffer")
    global execute_query
    global snoop_conf_path
    execute_query = execute_query_method
    snoop_conf_path = args.snoop_conf_folder + "/snoop.conf"
    logging.info("snoop_conf_path: %s" % snoop_conf_path)
    if os.access(snoop_conf_path, os.F_OK):
        os.remove(snoop_conf_path)

    thread = threading.Thread(target=threadwrap(background_loader), args=(args.reload,args.folder, ))
    thread.setDaemon(True)
    thread.start()

def clear_snoop_conf_file():
    if os.access(snoop_conf_path, os.F_OK):
        os.remove(snoop_conf_path)
