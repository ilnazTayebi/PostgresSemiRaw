FROM alpine:3.4
MAINTAINER Lionel Sambuc <lionel.sambuc@epfl.ch>

RUN apk update && apk add readline zlib curl

RUN mkdir /docker-entrypoint-initdb.d && \
    curl -o /usr/local/bin/gosu -sSL "https://github.com/tianon/gosu/releases/download/1.2/gosu-amd64" && \
    chmod +x /usr/local/bin/gosu

ADD PostgresRaw.tar.bz2 /
COPY docker-entrypoint.sh /

ENV LANG en_US.utf8
ENV PGDATA /host/pgdata

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 5432
CMD ["postgres"]
