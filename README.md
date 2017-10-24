# Docker container for PostgresRAW

This project creates a lightweight Docker image for running PostgresRAW.

It has been developed on Ubuntu and not tested on other platforms.

## Clone this project

```sh
    $ git clone https://github.com/HBPMedical/PostgresRAW-docker.git
    $ cd PostgresRAW-docker
```

## Clone the PostgresRAW sources

```sh
    $ git clone https://github.com/HBPMedical/PostgresRAW.git src
```

## Build PostgresRAW docker 

The image is build and given the name 'hbpmip/postgresraw' with the following command:

```sh
    $ docker build -t hbpmip/postgresraw \
    --build-arg JOBS=8 \
    --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
    --build-arg VCS_REF=`git -C ./src/ rev-parse --short HEAD` \
    .
```

**Warning:** If you update the sources, add `--no-cache=true` to the command above to take the new version in consideration.

Once running, this container behaves as the official Postgres container, for more
information on that, please refer to https://hub.docker.com/_/postgres/.
