from flask import Flask, request, jsonify, Response, send_from_directory
import os
import threading
from argparse import ArgumentParser, FileType
import collections

from sniff import sniff

lock = threading.Lock()
# deque is like a circular buffer (we will keep the last 100 messages)
info = collections.deque(maxlen=100)
executer_url = ""

def registerfile(f):
    print "registering file %s" % f
    
def on_start(files, do_reload=True):
    for f in files:
        registerfile(f)

def on_create(file, do_reload=True):
    print "new file found %s" % file
  
def on_modified(file):
  print "WARNING: File modified but feature not implemented yet", file

def on_delete(file):
  # Do nothing on delete.
  # The alternative would have been to reload again all other data.
  pass

def background_loader(do_reload=True, folder="data"):
    print "folder=%s , reload = %s " %(folder, reload)
    sniff(folder=folder, lock=lock, interval=1,
        on_start=on_start, on_create=on_create, on_modified=on_modified,
        on_delete=on_delete, do_reload=do_reload)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

@app.route('/status', methods=['GET'])
def query():
    return "Status"

if __name__ == '__main__':
    argp = ArgumentParser(description="Raw sniff server")
    argp.add_argument( "--executer","-e",default="data",
            help="url of the scala executer" , metavar="URL")        
    argp.add_argument( "--reload","-r", action="store_true", default=False,
            help="reloads the file if a change was detected")
    argp.add_argument("--folder", "-f", default="data", metavar="FOLDER",
            help="Folder to be sniffed for changes")

    args = argp.parse_args()
    executer_url = args.executer
    thread = threading.Thread(target=background_loader,
                                      args=(args.reload,args.folder, ))
    thread.setDaemon(True)
    thread.start()                                      
    app.run(host='0.0.0.0', port=5555)
