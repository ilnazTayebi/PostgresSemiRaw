from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint
import logging
import psycopg2
import re


pg_raw = Blueprint('pg_raw', __name__)

def format_cursor(cur):
    # Transforms the results of a cursor into list of dicts
    out = []
    colnames = [desc[0] for desc in cur.description]
    for row in cur.fetchall():
        d = dict()
        for i, name in enumerate(colnames):
            d[name] = row[i]
        out.append(d)
    return out

@pg_raw.route('/query-start', methods=['POST'])
def query_start():
    data = json.loads(request.data)
    cur = conn.cursor()
    cur.execute(data["query"])
    conn.commit()
    data = format_cursor(cur)
    return jsonify(dict(data=data))

@pg_raw.route('/query-start', methods=['POST'])
def query_start():
    data = json.loads(request.data)
    cur = conn.cursor()
    cur.execute(data["query"])
    conn.commit()
    data = format_cursor(cur)
    return jsonify(dict(data=data))

# Regex to parse error messages from postgres and extract error position
error_regex = re.compile("(.*)\nLINE (\\d+):(.*)\n(\\s*\^)")
def pg_error_to_dict(error):
    #Transforms a psycopg2.Error into a dict that can be handled by javascript
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
    errorclass=error.pgcode[:2]
    response = jsonify(pg_error_to_dict(error))
    #connection exception class
    if errorclass == "08":
        response.status_code = 500
    else:
        conn.rollback()
        response.status_code = 400
    return response

@pg_raw.route('/schemas', methods=['GET'])
def schemas():
    cur = conn.cursor()
    query = """SELECT table_name
                FROM information_schema.tables
                WHERE table_schema != 'pg_catalog'
                AND table_schema != 'information_schema' """
    cur.execute(query)
    return jsonify(dict(schemas=cur.fetchall()))

@pg_raw.route('/<path:filename>', methods=['GET'])
def static_file(filename):
    return send_from_directory("../static", filename)

@pg_raw.route('/query-start', methods=['POST'])
def query_start():
    data = json.loads(request.data)
    cur = conn.cursor()
    cur.execute(data["query"])
    conn.commit()
    data = format_cursor(cur)
    return jsonify(dict(data=data))

def init_db(args):
    global conn
    conn = psycopg2.connect(database=args.dbname,
                            user=args.user,
                            host=args.host,
                            password=args.password)