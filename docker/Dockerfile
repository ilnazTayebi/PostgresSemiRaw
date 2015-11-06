FROM ubuntu:14.04
MAINTAINER Cesar Matos <cesar.matos@gmail.com>

EXPOSE 5000
# Setup a volume for data
VOLUME ["/data"]

# for the moment just nginx
RUN apt-get update && apt-get install -y \
    nginx \
    vim

ADD nginx.conf /etc/nginx/
ADD start_nginx.sh /
RUN chmod +x start_nginx.sh
CMD [ "./start_nginx.sh"]
