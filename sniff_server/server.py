#!/usr/bin/env python

from flask import Flask, request, jsonify, Response, send_from_directory, Blueprint

from argparse import ArgumentParser, FileType
import logging
from pg_raw import pg_raw, init_db
from raw_sniffer import raw_sniffer, init_sniffer

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

@app.route('/<path:filename>', methods=['GET'])
def static_file(filename):
    return send_from_directory("../static", filename)

if __name__ == '__main__':
    argp = ArgumentParser(description="Raw sniff server")
    argp.add_argument( "--executer","-e",default="http://localhost:54321",
            help="url of the scala executer" , metavar="URL")
    argp.add_argument( "--reload","-r", action="store_true", default=False,
            help="reloads the file if a change was detected")
    argp.add_argument("--folder", "-f", default="data", metavar="FOLDER",
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
    args = argp.parse_args()
    if args.pg_raw:
        init_db(args)
        app.register_blueprint(pg_raw)
    else:
        init_sniffer(args)
        app.register_blueprint(raw_sniffer)

    app.run(host='0.0.0.0', port=5555)