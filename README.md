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
$ docker run --rm \
    -e POSTGRES_HOST=db \
    -e POSTGRES_PORT=5432 \
    -e POSTGRES_USER=dbuser \
    -e POSTGRES_PASSWORD=secret \
    -e POSTGRES_DB=db \
    -p 4445:5555 \
    -v $PWD/../data:/data:rw \
    -v $PWD/../datasets:/datasets:ro \
    --name PostgresRAW-UI \
    --link PostgresRAW:db \
    hbpmip/postgresraw-ui
```

* **Note 1:** The folder mounted on `/data` is expected to **contain** the `pg_data` folder.
* **Note 2:** The folder mounted on `/datasets` is where you store the CSV files.
* **Note 3:** In the example above, we use `--link` to link to the PostgresRAW container. In this case, we have to connect to the port used internaly by the PostgresRAW docker container, which is `5432`, and not the externally mapped `5554`.
* **Note 4:** Use the `LOCAL_DATA_SOURCE` and `FED_DATA_SOURCE` environment variables to override the default configuration for the MIP views. See [PostgresRAW-UI documentation](https://github.com/HBPMedical/PostgresRAW-UI) for more information. Example use (to show the research data at the Federation level): `-e FED_DATA_SOURCE="mip_cde_features"`

The PostgresRAW-UI will be available on `http://localhost:4445` and allows you to execute SQL queries, and choose several display options of the results.
