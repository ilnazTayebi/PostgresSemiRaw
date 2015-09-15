from flask import Flask, request, jsonify, Response, send_from_directory, redirect
from argparse import ArgumentParser, FileType

import socket
locahost_ip = socket.gethostbyname(socket.gethostname())

app = Flask(__name__, static_url_path='/static')
worker_url = None

@app.route('/query', methods=['POST'])
def query():
    return redirect( worker_url+'/query', code=307)

@app.route('/register-file', methods=['POST'])
def register_file():
    return redirect( worker_url+'/register-file', code=307)

@app.route('/schemas', methods=['POST'])
def schemas():
    return redirect( worker_url+'/schemas', code=307)

if __name__ == '__main__':
    argp = ArgumentParser(description="Frontend")
    argp.add_argument("--worker-url", "-w",
                      default="http://%s:5001" % locahost_ip,
                      help="worker node url")
    args = argp.parse_args()

    worker_url = args.worker_url

    print worker_url
    app.run(host='0.0.0.0')
