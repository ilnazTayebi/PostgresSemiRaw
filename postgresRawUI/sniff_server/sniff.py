import logging
import os
import sys
import time
import threading

cache = {}

def safe_mtime(file):
  try:
    return os.path.getmtime(file)
  except Exception as exc:
    return None

def walk_directory(folder):
  for dirpath, dirnames, filenames in os.walk(folder):
    for f in filenames:
      yield os.path.join(dirpath, f)

def sniff(folder=os.getcwd(), lock=threading.Lock(), interval=1, on_start=None, on_create=None, on_modified=None, on_delete=None, do_reload=True):
  logging.debug("Starting to sniff files...")
  if on_start:
    with lock:
      files = walk_directory(folder)
      filenames = []
      for file in files:
        filenames.append(file)
        cache[file] = safe_mtime(file)
      on_start(filenames, do_reload)
  logging.info("All files loaded")

  while True:
    time.sleep(interval)

    with lock:
      if on_delete:
        to_delete = []
        for file in cache:
          if not os.path.exists(file):
            on_delete(file)
            to_delete.append(file)
        for file in to_delete:
          del cache[file]

      for file in walk_directory(folder):
        mtime = safe_mtime(file)
        if file in cache:
          if on_modified and cache[file] != mtime:
            on_modified(file)
            cache[file] = mtime
        else:
          if on_create:
            on_create(file, do_reload)
            cache[file] = mtime

if __name__ == '__main__':
  # Test code
  def on_start(file): print "On start", file
  def on_create(file): print "On create", file
  def on_modified(file): print "On modified", file
  def on_delete(file): print "On delete", file
  sniff(interval=1, on_start=on_start, on_create=on_create, on_modified=on_modified, on_delete=on_delete)
