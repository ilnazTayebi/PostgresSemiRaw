#                    Copyright (c) 2016-2017
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

FROM alpine:3.6 as builder
MAINTAINER Lionel Sambuc <lionel.sambuc@epfl.ch>

ENV LANG=C.UTF-8
ENV PREFIX=/opt/PostgresRAW

ARG JOBS=1
ENV JOBS=$JOBS

RUN apk update && \
    apk add git openssh alpine-sdk bison flex perl readline-dev zlib-dev

COPY src /PostgresRAW
RUN cd /PostgresRAW/PostgresRaw && \
    CFLAGS=-O0 ./configure --prefix=$PREFIX && \
    make -j $JOBS && \
    make install

#######################################################################
FROM alpine:3.6
# LSC: All environment variables are resetted by the FROM:
ENV PREFIX=/opt/PostgresRAW

ARG BUILD_DATE
ARG VCS_REF
LABEL org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.name="hbpmip/postgresraw" \
    org.label-schema.description="Docker image for running PostgresRAW" \
    org.label-schema.url="https://github.com/HBPMedical/PostgresRAW-docker" \
    org.label-schema.vcs-type="git" \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.vcs-url="https://github.com/HBPMedical/PostgresRAW" \
    org.label-schema.vendor="DIAS EPFL" \
    org.label-schema.docker.dockerfile="Dockerfile" \
    org.label-schema.schema-version="1.0"

# explicitly set user/group IDs
RUN \
	delgroup ping && \
	deluser postgres && \
	addgroup -g 999 -S postgres && adduser -S -G postgres -u 999 postgres

RUN apk update && apk add readline zlib curl

RUN mkdir /docker-entrypoint-initdb.d && \
    curl -o /usr/local/bin/gosu -sSL "https://github.com/tianon/gosu/releases/download/1.2/gosu-amd64" && \
    chmod +x /usr/local/bin/gosu

COPY --from=builder $PREFIX $PREFIX
COPY docker-entrypoint.sh /

VOLUME /data

# Not sure if and how the next two parameters are used
ENV PG_MAJOR 9.6
ENV PG_VERSION PostgresRAW-$VCS_REF

ENV LANG en_US.utf8

ENV PATH $PATH:$PREFIX/bin
ENV PGDATA /data/pgdata

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 5432

CMD ["postgres"]
