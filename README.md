# Packages Required

Instructions based on Ubuntu 14.04:
    
you will need nginx or docker in order run the web UI

## Howto run
The easiest way is to run using docker, so if you do not have it installed already type:
```
sudo apt-get install docker.io
```

then you can just use a standard nginx docker image.

just use the script start.sh
```
cd <cloned folder>
./start.sh
```

to see the web UI go to:

http://localhost:5000/static/raw_demo.html 
