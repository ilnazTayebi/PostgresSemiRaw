#!/bin/sh
 
docker_ip=$(ip addr | awk '/inet/ && /docker0/{sub(/\/.*$/,"",$2); print $2}')
echo "Found docker host ip: $docker_ip"

docker run -d -p 80:80 \
    -v $PWD/static:/usr/share/nginx/html:ro \
    -v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v $PWD/log:/var/log/nginx:rw \
    --add-host dockerhost:${docker_ip} \
    nginx 
