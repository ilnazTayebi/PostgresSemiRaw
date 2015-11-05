from flask import Flask, request, jsonify, Response, send_from_directory, redirect
from argparse import ArgumentParser, FileType
from flask.ext.basicauth import BasicAuth

import socket
localhost_ip = socket.gethostbyname(socket.gethostname())

app = Flask(__name__, static_url_path='/static')
#app = Flask(__name__)

# settigns for basic auth
app.config['BASIC_AUTH_USERNAME'] = 'admin'
app.config['BASIC_AUTH_PASSWORD'] = 'admin'
basic_auth = BasicAuth(app)
#app.config['BASIC_AUTH_FORCE'] = True

worker_url = None

#@app.route('/static/index.html')
#@basic_auth.required
#def index(filename):
#    print "need auth"
#    return send_from_directory('static', 'index.html')

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
                      default="http://%s:54321" % localhost_ip,
                      help="worker node url")
    args = argp.parse_args()

    worker_url = args.worker_url

    print "Worker node: " + worker_url
    app.run(host='0.0.0.0')
