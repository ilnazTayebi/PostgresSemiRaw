from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint
import logging
import psycopg2
import re
import json
from collections import OrderedDict
import timeit

pg_raw = Blueprint('pg_raw_server', __name__)

# init_db(args)
# Creates and stores a connection string based on arguments received
def init_db(args):
    global connection_string
     # is it ok to store all these as global variables ???
    connection_string = 'dbname=%s user=%s host=%s port=%s password=%s' \
                        % (args.dbname,args.user,args.host,args.port,args.password)

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
    #logging.info("execute_query '%s'" % (query))
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        cur.execute(query)
        conn.commit()
        res =[]
        #logging.info("fetching res, status: %s, rowcount: %s" % (cur.statusmessage,cur.rowcount))
        try:
            res = cur.fetchall() # example return value: [(1, 100, "abc'def"), (2, None, 'dada'), (3, 42, 'bar')]
        except psycopg2.ProgrammingError as e:
            pass

        #logging.info("res: %s" % res)
        logging.info(" Query status message: %s" % cur.statusmessage)
        cur.close()
    return res

def format_cursor(cur,maxRows=1000):
    # Transforms the results of a cursor into list of dicts
    out = []
    colnames = [desc[0] for desc in cur.description]
    try:
        for row in cur.fetchall():
            if (len(out)==maxRows): return out,True
            d = OrderedDict()
            for i, name in enumerate(colnames):
                d[name] = row[i]
            out.append(d)
    except psycopg2.ProgrammingError as e:
        pass
    return out,False

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
    if error.pgcode == None: logging.error(type(error).__name__ ); return error.message
    errorclass=error.pgcode[:2]
    response = jsonify(pg_error_to_dict(error))
    #connection exception class
    if errorclass == "08":
        response.status_code = 500
    else:
        #error.cursor.connection.rollback() # -> error message: 'connection already closed'
        response.status_code = 400
    return response

# URI /query
# Request: case class QueryRequest(query: String)
# Response Success case class QueryResponse(output: Any, compilationTime: Long, executionTime: Long)
@pg_raw.route('/query', methods=['POST'])
def query_full():
    start_time = timeit.default_timer()
    data = json.loads(request.data)
    logging.debug("query: %s" % data["query"])
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        cur.execute(data["query"])
        conn.commit()
        (data,has_more) = format_cursor(cur,-1)
        cur.close()
        elapsed = timeit.default_timer() - start_time
        return jsonify(output=data,compilationTime=0, executionTime=elapsed)


# URI /query-start
# Request: case class QueryStartRequest(query: String, resultsPerPage:Int)
# Response: case class QueryBlockResponse(data: Any, start: Int, size: Int, hasMore: Boolean, token: String, var compilationTime: Long, var executionTime: Long)
@pg_raw.route('/query-start', methods=['POST'])
def query_start():
    start_time = timeit.default_timer()
    data = json.loads(request.data)
    resPerPage = None
    if ("resultsPerPage" in data): resPerPage = data["resultsPerPage"]
    if (resPerPage==None): resPerPage=1000
    logging.debug("query-start: %s" % data["query"])
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        cur.execute(data["query"])
        conn.commit()
        (data,has_more) = format_cursor(cur,resPerPage)
        cur.close()
        elapsed = timeit.default_timer() - start_time
        return jsonify(data=data,start=0,size=len(data),hasMore=has_more,token='',compilationTime=0, executionTime=elapsed)

@pg_raw.route('/schemas', methods=['GET'])
def schemas():
    with CustomConnection(connection_string) as conn:
        cur = conn.cursor()
        query = """SELECT table_name
                FROM information_schema.tables
                WHERE table_schema != 'pg_catalog'
                AND table_schema != 'information_schema' """
        cur.execute(query)
        res =[]
        try:
            res = jsonify(OrderedDict(schemas=cur.fetchall()))
        except psycopg2.ProgrammingError as e:
            pass
        cur.close()
        return res

@pg_raw.route('/', methods=['GET'])
def index():
    return send_from_directory("../static/", "pg_raw.html")
