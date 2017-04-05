#import os
from argparse import ArgumentParser
from flask import Flask, Blueprint, request, json
#from pg_raw_server import pg_raw, init_db, execute_query
import server
import tempfile
import logging
from collections import OrderedDict

# This test file requires access to a postgres database to test the server's
# functionalities
# It can be called with the following parameters:
# python -tt test_pg_raw_server.py --port 5433 --dbname postgres --password xxx
# If no parameters are given, a pgRaw database is expected on localhost port
# 5432, named 'postgres' and accessible to user 'postgres' with password 1234

def test_server():
    with app.app_context():
        rv = client_app.get('/schemas')
        logging.info("Test /schema result: %s" % rv.data)
        assert("schemas" in rv.data)

        query = "select * from pg_operator JOIN pg_tables ON true LIMIT 2000;"
        res = client_app.post('/query', data=json.dumps(dict(query=query)), follow_redirects=True)
        l_res = json.loads(res.data)
        logging.info("Test /query (n rows in pg_operator): %s" % len(l_res["output"]))
        assert("output" in res.data)
        assert(len(l_res["output"])==2000)

        query = "select * from pg_operator JOIN pg_tables ON true;"
        res = client_app.post('/query-start', data=json.dumps(dict(query=query)), follow_redirects=True)
        l_res = json.loads(res.data)
        logging.info("Test /query-start limits output to 1000 lines by default: %s" % len(l_res["data"]))
        assert(len(l_res["data"])==1000)
        assert(l_res["hasMore"])

        query = "select * from pg_tables;"
        res = client_app.post('/query-start', data=json.dumps(dict(query=query)), follow_redirects=True)
        l_res = json.loads(res.data)
        logging.info("Test /query-start limits output to 1000 lines by default: %s" % len(l_res["data"]))
        assert(not l_res["hasMore"])

def create_app(args):
    app = server.app
    server.init(args)
    #app = Flask("app")
    #app.register_blueprint(pg_raw)
    #init_db(args)
    app.config["JSON_SORT_KEYS"] = False
    app.config['TESTING'] = True
    return app

if __name__ == '__main__':
    argp = ArgumentParser(description="pg_raw server test")
    argp.add_argument("--host", "-H", default="localhost",
            help="hostname of (No)DB server")
    argp.add_argument("--port", "-P", default="5432",
            help="port of (No)DB server")
    argp.add_argument("--user", "-u", default="postgres",
            help="user name to register files")
    argp.add_argument("--dbname", "-d", default="postgres",
                    help="database name")
    argp.add_argument("--password", "-p", default="1234",
                    help="password to connect")
    args = argp.parse_args()
    args.pg_raw = True
    #time.sleep(3) # allow time for db launch and log

    app = create_app(args)
    client_app = app.test_client()
    test_server()
