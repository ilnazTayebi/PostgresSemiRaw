#!/usr/bin/env python

from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint, json

from argparse import ArgumentParser, FileType
import logging
from pg_raw_sniffer import init_sniffer as init_pg_sniffer
from pg_raw_server import pg_raw, init_db, execute_query
from raw_sniffer import raw_sniffer, init_sniffer
import time
import decimal

#defaults tables used for MIP views defined in Dockerfile
#defaultTablesForLocalView = ['mip_cde_features', 'harmonized_clinical_data']
#defaultTablesForFederationView = ['harmonized_clinical_data']

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

# Adding support to jsonify numeric types
class MyJSONEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            # Convert decimal instances to strings.
            return float(obj)
        return super(MyJSONEncoder, self).default(obj)

app.json_encoder = MyJSONEncoder

@app.route('/<path:filename>', methods=['GET'])
def static_file(filename):
    return send_from_directory("../static", filename)

def init(args):
    if args.pg_raw:
        init_db(args)
        if("snoop_conf_folder" in args):
            init_pg_sniffer(args,execute_query)
        else:
            logging.error("No snoop_conf_folder provided: sniffer cannot be launched.")
        app.register_blueprint(pg_raw)
    else:
        raw_sniffer.init_sniffer(args)
        app.register_blueprint(raw_sniffer)


if __name__ == '__main__':
    argp = ArgumentParser(description="Raw sniff server")
    argp.add_argument( "--executer","-e",default="http://localhost:54321",
            help="url of the scala executer" , metavar="URL")
    argp.add_argument( "--reload","-r", action="store_true", default=False,
            help="reloads the file if a change was detected")
    argp.add_argument("--folder", "-f", default="/datasets", metavar="FOLDER",
            help="Folder to be sniffed for changes")
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
    argp.add_argument('--pg_raw', '-g',  action='store_true', default=False,
                    help="use postgresRaw instead of Raw")
    argp.add_argument("--snoop_conf_folder", "-c", default="/data/pgdata", metavar="FOLDER",
                    help="Path to the pg_raw configuration file")
    argp.add_argument('--local_data_source', nargs='*', default=[])
    argp.add_argument('--fed_data_source', nargs='*', default=[])

    args = argp.parse_args()
    #time.sleep(3) # allow time for db launch and log

    init(args)

    app.run(host='0.0.0.0', port=5555)
