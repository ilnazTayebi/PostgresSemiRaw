from flask import Flask, request, jsonify, Response, send_from_directory, redirect
from argparse import ArgumentParser, FileType
from flask.ext.basicauth import BasicAuth
from flask.ext.cors import CORS

from functools import wraps, update_wrapper


app = Flask(__name__, static_url_path='/static')
#CORS(app)

#app = Flask(__name__)

# settigns for basic auth
app.config['BASIC_AUTH_USERNAME'] = 'admin'
app.config['BASIC_AUTH_PASSWORD'] = 'admin'
app.config['PROPAGATE_EXCEPTIONS'] = True
app.config['DEBUG'] = True

basic_auth = BasicAuth(app)
#app.config['BASIC_AUTH_FORCE'] = True

worker_url = None

#@app.route('/static/index.html')
#@basic_auth.required
#def index(filename):
#    print "need auth"
#    return send_from_directory('static', 'index.html')

def pass_auth(f):
    def decorated_function(*args, **kwargs):
        print "checking headers"
        print request.headers
        auth= request.headers.get('Authorization', None)
        resp = app.make_response(f(*args, **kwargs))
        if auth:
            print "adding auth header!!"
            resp.headers['Authorization'] = auth
        else:
            print "No authorization found"
        return resp
    return update_wrapper(decorated_function, f)


@app.route('/test', methods=['GET'])
def test():
    return 'Hello world'

@app.route('/query', methods=['POST'])
def query():
    return redirect( worker_url+'/query', code=307)

@app.route('/register-file', methods=['POST'])
def register_file():
    return redirect( worker_url+'/register-file', code=307)

@app.route('/schemas', methods=['GET'])
@pass_auth
def schemas():
    return redirect( worker_url+'/schemas', code=307)

if __name__ == '__main__':
    argp = ArgumentParser(description="Frontend")
    argp.add_argument("--worker-url", "-w",
                      default="http://0.0.0.0:54321" ,
                      help="worker node url")
    args = argp.parse_args()

    worker_url = args.worker_url

    print "Worker node: " + worker_url
    app.run(host='0.0.0.0')
