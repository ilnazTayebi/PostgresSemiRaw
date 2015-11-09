#!/bin/sh
sed -i -e  "s/__host_ip__/$host_ip/g" /etc/nginx/nginx.conf
service nginx start
#we will wait forever
while true; do
  sleep 1000
done
