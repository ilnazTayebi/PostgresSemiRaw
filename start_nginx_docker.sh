#!/bin/sh
 
docker_ip=$(ip addr | awk '/inet/ && /docker0/{sub(/\/.*$/,"",$2); print $2}')

docker run -d  -p 5000:5000 -v $PWD:/data -e host_ip=$docker_ip raw/nginx 
