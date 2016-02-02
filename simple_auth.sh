#!/bin/sh
 
docker_ip=$(ip addr | awk '/inet/ && /docker0/{sub(/\/.*$/,"",$2); print $2}')

docker run -d -p 5000:5000 \
    -v $PWD:/usr/share/nginx/html:ro \
    -v $PWD/conf/nginx_auth.conf:/etc/nginx/nginx.conf:ro \
    -v $PWD/conf/.htpasswd:/etc/nginx/.htpasswd:ro \
    -v $PWD/log:/var/log/nginx:rw \
    --add-host dockerhost:${docker_ip} \
    nginx 
