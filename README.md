# Docker container for PostgresRAW-UI

This project creates a Docker image for running PostgresRAW-UI. It has been developed on Ubuntu and not tested on other platforms.

## Build procedure

 1. Clone the PostgresRAW-UI-docker and PostgresRAW-UI sources
    ```sh
    $ git clone git@github.com:HBPSP8Repo/PostgresRAW-UI-docker.git
    $ cd PostgresRAW-UI-docker
    $ git clone git@github.com:HBPSP8Repo/PostgresRAW-UI.git src
    ```

 2. The container is built and given the name 'hbpmip/postgresraw-ui' with the following command:
    $ docker build -t hbpmip/postgresraw-ui .

## Deployment

To start this image you need to specify the following variables:
```yml
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

If you change the name of the docker container which runs PostgresRAW,
update as well the link and/or ```POSTGRES_DB``` variable value.
