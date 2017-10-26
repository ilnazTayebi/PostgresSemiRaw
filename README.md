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

Assuming you started the docker container of PostgresRAW as presented in the [example](https://github.com/HBPMedical/PostgresRAW-docker#use-the-postgresraw-docker-image), you can use the following command:

```sh
$ POSTGRES_PORT=5432 POSTGRES_USER=postgres POSTGRES_PASSWORD=secret POSTGRES_DB=db \
    docker run \
    -p 5555:5555 \
    -v $PWD/../data:/data:rw \
    -v $PWD/../datasets:/datasets:ro \
    hbpmip/postgresraw-ui
```

* **Note 1:** The folder mounted on `/data` is expected to **contain** the `pg_data` folder.
* **Note 2:** The folder mounted on `/datasets` is where you store the CSV files.

The PostgresRAW-UI will be available on `http://localhost:5555` and allows you to execute SQL queries, and choose several display options of the results.
