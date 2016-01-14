#!/bin/sh
 
docker_ip=$(ip addr | awk '/inet/ && /docker0/{sub(/\/.*$/,"",$2); print $2}')
sed -e  "s/__executor_ip__/$docker_ip/g" conf/nginx_template.conf > conf/nginx.conf

docker run -d \
    -p 5000:5000 \
    -v $PWD:/usr/share/nginx/html:ro \
    -v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v $PWD/log:/var/log/nginx:rw \
    nginx 
