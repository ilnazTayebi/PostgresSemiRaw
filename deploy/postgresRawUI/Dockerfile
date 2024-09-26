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
MAINTAINER Ilnaz Tayebi <tayebi01@ads.uni-passau.de>

ARG BUILD_DATE
ARG VCS_REF
LABEL org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.name="hbpmip/postgresraw-ui" \
    org.label-schema.description="Docker image for running PostgresRAW-UI" \
    org.label-schema.url="https://github.com/HBPMedical/PostgresRAW-UI-docker" \
    org.label-schema.vcs-type="git" \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.vcs-url="https://github.com/HBPMedical/PostgresRAW-UI" \
    org.label-schema.vendor="DIAS EPFL" \
    org.label-schema.docker.dockerfile="Dockerfile" \
    org.label-schema.schema-version="1.0"


RUN apk update && apk add --no-cache \
     wget \
    ca-certificates \
    openssl \
    py-setuptools \
    py-psycopg2 \
    py-flask


# the default version of requests
RUN wget https://github.com/requests/requests/archive/v2.13.0.zip && \
    unzip ../v2.13.0.zip && mv requests* requests && \
    cd requests && python setup.py install && \
    rm -rf master requests



# Add the PostgresRAW-UI
ADD postgresRawUI/sniff_server /opt/postgresraw-ui
ADD postgresRawUI/static /opt/static

# Display version in the UI
RUN sed -i "s,VCS_REF,${VCS_REF},;s,BUILD_DATE,${BUILD_DATE}," /opt/static/pg_raw.html

EXPOSE 5555

# These default environment variables can be overwritten when running the
# container (docker run -e FED_DATA_SOURCE="..." or environment: in docker compose)
ENV FED_DATA_SOURCE="harmonized_clinical_data"
ENV LOCAL_DATA_SOURCE="mip_cde_features harmonized_clinical_data"

CMD cd /opt/postgresraw-ui; exec /usr/bin/python /opt/postgresraw-ui/server.py \
    --reload \
    --pg_raw \
    --host ${POSTGRES_HOST} \
    --port ${POSTGRES_PORT} \
    --user ${POSTGRES_USER} \
    --password ${POSTGRES_PASSWORD} \
    --dbname ${POSTGRES_DB} \
    --fed_data_source ${FED_DATA_SOURCE} \
    --local_data_source ${LOCAL_DATA_SOURCE} \
    --folder /datasets \
    --snoop_conf_folder /data/pgdata