from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint
import logging
import psycopg2
import re
import json
from collections import OrderedDict

pg_raw = Blueprint('pg_raw_server', __name__)

# init_db(args)
# Creates and stores a connection string based on arguments received
def init_db(args):
    global connection_string
     # is it ok to store all these as global variables ???
    connection_string = 'dbname=%s user=%s host=%s port=%s password=%s' \
                        % (args.dbname,args.user,args.host,args.port,args.password)
    #return connection_string

# CustomConnection class
# Allow to use a 'with' structure, which will automatically close the connection
# eg. "with CustomConnection(conn_str) as conn: "
class CustomConnection(object):
    def __init__(self,conn_string):
      self.conn = psycopg2.connect(conn_string)

    def __enter__(self):
        return self.conn

    def __exit__(self, ctx_type, ctx_value, ctx_traceback):
        self.conn.close()

# Function execute_query
# Execute query given as string (mainly for use outside of the module)
def execute_query(query):
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        cur.execute(query)
        conn.commit()
        cur.close()

def format_cursor(cur):
    # Transforms the results of a cursor into list of dicts
    out = []
    colnames = [desc[0] for desc in cur.description]
    for row in cur.fetchall():
        d = OrderedDict()
        for i, name in enumerate(colnames):
            d[name] = row[i]
        out.append(d)
    return out

# Regex to parse error messages from postgres and extract error position
error_regex = re.compile("(.*)\nLINE (\\d+):(.*)\n(\\s*\^)")
def pg_error_to_dict(error):
    """Transforms a psycopg2.Error into a dict that can be handled by javascript"""
    logging.debug("error code '%s', message: %s" % (error.pgcode, error.message))
    error_info = dict(
        errorType="pgError",
        errorCode=error.pgcode,
        message=error.message,
    )
    #connection exception class
    if error.pgcode[:2] == "08":
        return dict(errorType="ConnectionError", error=error_info)

    r = error_regex.match(error.message)
    if r:
        line = int(r.group(2))
        c_start = len(r.group(4)) - (len(r.group(2)) + 7)
        c_end = c_start + 10
        position =dict(
            begin=dict(line=line,column=c_start),
            end=dict(line=line,column=c_end)
        )
        error_info["errors"] = [dict(
            message=error.message,
            errorType="SemanticError",
            positions=[position]
        )]
        return dict(errorType="SemanticErrors", error=error_info)
    else:
        #this will mark the full first line
        error_info["position"] = dict(
            begin=dict(line=1,column=1),
            end=dict(line=1,column=2)
        )
        return dict(errorType="ParserError", error=error_info)

@pg_raw.errorhandler(psycopg2.Error)
def handle_database_error(error):
    """Handler for database errors
    It copies the REST query error API"""
    errorclass=error.pgcode[:2]
    response = jsonify(pg_error_to_dict(error))
    #connection exception class
    if errorclass == "08":
        response.status_code = 500
    else:
        #error.cursor.connection.rollback() # -> error message: 'connection already closed'
        response.status_code = 400
    return response

@pg_raw.route('/query-start', methods=['POST'])
def query_start():
    data = json.loads(request.data)
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        cur.execute(data["query"])
        conn.commit()
        data = format_cursor(cur)
        cur.close()
        return jsonify(OrderedDict(data=data))

@pg_raw.route('/schemas', methods=['GET'])
def schemas():
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        query = """SELECT table_name
                FROM information_schema.tables
                WHERE table_schema != 'pg_catalog'
                AND table_schema != 'information_schema' """
        cur.execute(query)
        res = jsonify(OrderedDict(schemas=cur.fetchall()))
        cur.close()
        return res

@pg_raw.route('/', methods=['GET'])
def index():
    return send_from_directory("../static/", "pg_raw.html")
