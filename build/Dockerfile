FROM alpine:3.4
MAINTAINER Lionel Sambuc <lionel.sambuc@epfl.ch>

ENV LANG=C.UTF-8

ARG JOBS=1
ENV JOBS=$JOBS

RUN apk update && \
    apk add git openssh alpine-sdk bison flex perl readline-dev zlib-dev

RUN git clone https://github.com/HBPSP8Repo/NoDB.git && \
    cd /NoDB/PostgresRaw && \
    CFLAGS=-O0 ./configure --prefix=/opt/PostgresRaw && \
    make -j $JOBS && \
    make install && \
    tar -jcf PostgresRaw-$(date +'%Y%m%d-%H%M').tar.bz2 /opt/PostgresRaw

VOLUME ["/host"]

WORKDIR "/NoDB/PostgresRaw"

CMD ["/bin/sh" ]
