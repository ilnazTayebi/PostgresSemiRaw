# Docker container for PostgresRAW-UI

This project creates a Docker image for running PostgresRAW-UI.

It has been developed on Ubuntu and not tested on other platforms.

## Clone this project

```sh
$ git clone git@github.com:HBPMedical/PostgresRAW-UI-docker.git
$ cd PostgresRAW-UI-docker
```

## Clone the PostgresRAW-UI sources

```sh
$ git clone https://github.com/HBPMedical/PostgresRAW-UI.git src
```

## Build the PostgresRAW-UI docker image

 The image is build and given the name 'hbpmip/postgresraw-ui' with the following command:

```sh
$ docker build -t hbpmip/postgresraw-ui \
    --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
    --build-arg VCS_REF=`git -C ./src/ rev-parse --short HEAD` \
    .
```

## Use the PostgresRAW-UI docker image

To start this image you need to specify the following variables:

```yaml
   environment:
    - POSTGRES_HOST
    - POSTGRES_USER
    - POSTGRES_PASSWORD
    - POSTGRES_DB=db

   # - raw_data_root: The folder containing the data on the swarm node host
   # - docker_data_folder: Where to map the data folder WITHIN the containers
   volumes:
    - "${raw_data_root}:/${docker_data_folder}:ro"

   links:
    - "PostgresRAW:db"
```

Adapt the ```POSTGRES_DB``` variable value and the name of the docker container which runs PostgresRAW (under "links") according to your settings.
