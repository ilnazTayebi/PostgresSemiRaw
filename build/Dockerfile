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

FROM alpine:3.6
MAINTAINER Lionel Sambuc <lionel.sambuc@epfl.ch>

ENV LANG=C.UTF-8

ARG JOBS=1
ENV JOBS=$JOBS

RUN apk update && \
    apk add git openssh alpine-sdk bison flex perl readline-dev zlib-dev

COPY PostgresRAW PostgresRAW
RUN cd /PostgresRAW/PostgresRaw && \
    CFLAGS=-O0 ./configure --prefix=/opt/PostgresRaw && \
    make -j $JOBS && \
    make install && \
    tar -jcf PostgresRaw-$(date +'%Y%m%d-%H%M').tar.bz2 /opt/PostgresRaw

VOLUME ["/host"]

WORKDIR "/PostgresRAW/PostgresRaw"

CMD ["/bin/sh" ]
