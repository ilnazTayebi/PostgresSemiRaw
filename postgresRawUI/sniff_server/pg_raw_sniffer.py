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
import fileinput

#executer_url = ""
#user = ''

config_file = ""
execute_query = None
n_snoop_conf_entries = 1
snoop_conf_path = ""

mipTablesForLocalView = []
mipTablesForFederationView = []

lock = threading.Lock()
# deque is like a circular buffer (we will keep the last 100 messages)
info = collections.deque(maxlen=100)
last_info = collections.deque(maxlen=100)


# Function registerfile
# Given the path of a csv file, creates the corresponding table in pgRAW database and updates
# pgRAW configuration in order to access the file's content
def registerfile(path):
    # extracts name and type from the filename
    name,extension = get_filename_and_extension_from_path(path)
    table_name = get_tablename_from_filename(name)
    if (extension != ".csv" or name[0]=='.'):
        logging.warn("\tSniffer: Unsupported file '%s' will not be registered" % path)
        append_msg( "Warning", "Unsupported file '%s' will not be registered" % path )
        return

    logging.info("\tSniffer: Found csv file '%s'" % path )

    # TODO check name conflict (same table_name for another path)

    logging.debug("\tSniffer: Try to get schema out of csv file '%s'" % path)
    schema, properties = infer_schema(path,'csv',name)
    if schema is None:
        logging.warning("\tSniffer: File '%s' will be ignored (schema is None)" % path)
        return

    try:
        sqlGen = SQLGenerator(table_name, schema, path)
        existingTableColumnsQuery = sqlGen.getExistingTableColumnsQuery()
        #logging.info("\tSniffer: existingTableColumnsQuery: '%s' " % existingTableColumnsQuery)
        existingTableColumns = execute_query(existingTableColumnsQuery)
        #logging.info("\tSniffer: existingTableColumns '%s'" % existingTableColumns)
        existingTableSchema = sqlGen.getExistingTableCreateCode(existingTableColumns)
        #logging.info("\tSniffer: existingTableSchema: '%s'" % sqlGen.existingTableQuery)
        query = sqlGen.getCreateTableQuery() # return empty string in table already exists with correct schema.
        #logging.info("\tSniffer: query to create new table: '%s'" % query)

    except SQLGeneratorException as e:
        logging.error("\tSniffer: Error reading file '%s' : %s" % (path,e))
        logging.error("\t\tFaulty structure : %s" % schema)
        logging.error("\tSniffer: File '%s' will be ignored" % path)
        return


    if (table_name in mipTablesForLocalView+mipTablesForFederationView):
        drop_create_mip_views(sqlGen,query)

    else:
        #logging.info('execute_query %s' % query)
        execute_query(query) #pg_raw_server.

    load=False
    if (load):
        logging.info("\tSniffer: loading data")
        query = " COPY %s FROM \'%s\' CSV HEADER;"%(table_name, path)
    else:
        logging.info("\tSniffer: declaring file in PostgresRAW config")
        global n_snoop_conf_entries
        try:
            with open(snoop_conf_path, mode='a+') as f:
                f.write("filename-%i = '%s'\n" % (n_snoop_conf_entries,path))
                f.write("relation-%i = '%s'\n" % (n_snoop_conf_entries,table_name))
                f.write("delimiter-%i = '%s'\n" % (n_snoop_conf_entries,properties['delimiter']))
                f.write("header-%i = '%s'\n\n" % (n_snoop_conf_entries,properties['has_header']))
                n_snoop_conf_entries +=1
        except EnvironmentError as e: # parent of IOError, OSError *and* WindowsError where available
            logging.error("\tError while trying to write in %s: " % snoop_conf_path)
            logging.error("\t%s" % e)

    logging.info("\tSniffer: File '%s' registered as table '%s'" % (path,table_name))

def unregisterfile(path):
    # extracts name and type from the filename
    name,extension = get_filename_and_extension_from_path(path)
    table_name = get_tablename_from_filename(name)

    if (extension != ".csv" or name[0]=='.'):
        return

    logging.info("\tSniffer: File '%s' was deleted; it will be unregistered" % path )

    global n_snoop_conf_entries
    try:
        #with open(snoop_conf_path, mode='a+') as snoop:
            linesToDrop = 0
            reg = "filename-[0-9]+ = \'%s\'"%path
            for line in fileinput.FileInput(snoop_conf_path, inplace=1):
                matchObj = re.match( reg, line, re.I)
                if matchObj:
                    logging.info("\tSniffer: deleting corresponding lines in configuration file")
                    #line = line.replace("Config","AnotherConfig")
                    linesToDrop = 4
                else:
                    if linesToDrop > 0:
                        linesToDrop -= 1
                    else:
                        print line,
                        #sys.stdout.write(line)
    except EnvironmentError as e: # parent of IOError, OSError *and* WindowsError where available
        logging.error("\tError while trying to write in %s: " % snoop_conf_path)
        logging.error("\t%s" % e)

    try:
        sqlGen = SQLGenerator(table_name, None, path)
        query = sqlGen.getDropTableQuery()
        if (table_name in mipTablesForLocalView):
            drop_create_mip_views(sqlGen,query)
    except SQLGeneratorException as e:
        logging.error("\t"+e)
        logging.error("\tSniffer: File '%s' could not be unregistered" % path)
        return

    #logging.info('execute_query %s' % query)
    execute_query(query) #pg_raw_server.

    logging.info("\tSniffer: File '%s' unregistered, table '%s' dropped" % (path,table_name))


def drop_create_mip_views(sqlGen,middle_query):
    # Create mip_local_features view (use all tables in mipTablesForLocalView)
    query = sqlGen.getDropViewsQuery() + middle_query
    execute_query(query)
    query = sqlGen.getExistingTablesQuery(mipTablesForLocalView)
    tables = execute_query(query)  # Return value: ['table0', 'table1', 'table2']
    if (len(tables)==0): return
    query = sqlGen.getTablesColumnsQuery(tables)
    columns = execute_query(query)  # Return value: [('col_name', 'type0', 'type1','type2'), ('col_name2', 'type0', 'type1','type2'), ...]
    query = sqlGen.getCreateMipLocalFeaturesViewQuery(tables,columns)
    #logging.info("\tSniffer: CreateMipLocalFeaturesViewQuery: \n '%s'" % (query))
    execute_query(query)

    # Create mip_federation_features view (use all tables in mipTablesForFederationView)
    query = sqlGen.getExistingTablesQuery(mipTablesForFederationView)
    tables = execute_query(query)  # Return value: ['table0', 'table1', 'table2']
    if (len(tables)==0): return
    query = sqlGen.getTablesCdeColumnsQuery(tables)
    columns = execute_query(query)  # Return value: [('col_name', 'type0', 'type1', 'type2'), ('col_name2', 'type0', 'type1', 'type2'), ...]
    query = sqlGen.getCreateMipFederationFeaturesViewQuery(tables,columns)
    #logging.info("\tSniffer: CreateMipFederationFeaturesViewQuery: \n '%s'" % (query))
    execute_query(query)
    return

def get_filename_and_extension_from_path(path):
    basename = os.path.basename(path)
    parts = os.path.splitext(basename)
    name = parts[0].lower()             # two files with the same .lower() name will not be distinguished...
    extension = parts[1].lower()

    return name,extension

def get_tablename_from_filename(name):
    rx = re.compile('[-]+')
    table_name = rx.sub('_',name)
    rx = re.compile('[^a-zA-Z0-9_]+')
    table_name = rx.sub('',table_name)
    rx2 = re.compile('^[^a-zA-Z]+')
    table_name = rx2.sub('',table_name)

    return table_name

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
# def infer_create_table_query(file_path, file_type, name, options = dict()):
#     query = SQLGenerator(name, schema).getCreateTableQuery()
#     return query

def append_msg(msg_type, msg):
    info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))
    last_info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))


def on_start(files, do_reload=True):
    for f in files:
        registerfile(f)

def on_create(f, do_reload=True):
    registerfile(f)

def on_modified(f):
    #append_msg("info", "File changed detected (%s). Table will be deleted and re-created." % f) # TODO: check if same schema, keep old table if so.
    registerfile(f)

def on_delete(f):
    # Do nothing on delete.
    # The alternative would have been to reload again all other data.
    unregisterfile(f)

# Function background_loader
# Launches the actual sniffer using the functions defined above
def background_loader(do_reload=True, folder="./datasets"):
    print "folder=%s , reload = %s " %(folder, reload)
    clear_snoop_conf_file()
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
    #logging.info("pg_raw_server_sniffer.py init_sniffer")
    global execute_query
    global snoop_conf_path
    global mipTablesForLocalView
    global mipTablesForFederationView

    execute_query = execute_query_method

    snoop_conf_path = args.snoop_conf_folder + "/snoop.conf"
    logging.info("Configuration file path: %s" % snoop_conf_path)
    clear_snoop_conf_file()

    mipTablesForLocalView = args.local_data_source
    logging.info("Tables for MIP Local view: %s" % mipTablesForLocalView)
    mipTablesForFederationView = args.fed_data_source
    logging.info("Tables for MIP Federated view: %s" % mipTablesForFederationView)

    # Create views with existing tables
    drop_create_mip_views(SQLGenerator("", "", ""),"")

    thread = threading.Thread(target=threadwrap(background_loader), args=(args.reload,args.folder, ))
    thread.setDaemon(True)
    thread.start()

def clear_snoop_conf_file():
    if os.access(snoop_conf_path, os.F_OK):
        logging.info("Clearing configuration file")
        os.remove(snoop_conf_path)
        global n_snoop_conf_entries
        n_snoop_conf_entries=1
