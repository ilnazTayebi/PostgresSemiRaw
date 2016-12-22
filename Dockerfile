#                    Copyright (c) 2016-2016
#   Data Intensive Applications and Systems Labaratory (DIAS)
#            Ecole Polytechnique Federale de Lausanne
#
#                      All Rights Reserved.
#
# Permission to use, copy, modify and distribute this software and its
# documentation is hereby granted, provided that both the copyright notice
# and this permission notice appear in all copies of the software, derivative
# works or modified versions, and any portions thereof, and that both notices
# appear in supporting documentation.
#
# This code is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. THE AUTHORS AND ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE
# DISCLAIM ANY LIABILITY OF ANY KIND FOR ANY DAMAGES WHATSOEVER RESULTING FROM THE
# USE OF THIS SOFTWARE.

FROM alpine:3.4
MAINTAINER Lionel Sambuc <lionel.sambuc@epfl.ch>

# explicitly set user/group IDs
RUN \
	delgroup ping && \
	deluser postgres && \
	addgroup -g 999 -S postgres && adduser -S -G postgres -u 999 postgres

RUN apk update && apk add readline zlib curl

RUN mkdir /docker-entrypoint-initdb.d && \
    curl -o /usr/local/bin/gosu -sSL "https://github.com/tianon/gosu/releases/download/1.2/gosu-amd64" && \
    chmod +x /usr/local/bin/gosu

ADD PostgresRaw.tar.bz2 /
COPY docker-entrypoint.sh /

VOLUME /data

ENV PG_MAJOR 9.0
ENV PG_VERSION g07b5ed1 

ENV LANG en_US.utf8

ENV PATH /opt/PostgresRaw/lib/postgresql/bin:$PATH
ENV PGDATA /data/pgdata

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 5432

CMD ["postgres"]
