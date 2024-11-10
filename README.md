# Docker container for PostgresSemiRAW

This project creates a lightweight Docker image for running PostgresSemiRAW.

It has been developed on Ubuntu and not tested on other platforms.

## Clone this project

```sh
$ git clone https://github.com/ilnazTayebi/PostgresSemiRaw.git
$ cd deploy
```

## Build and Use the PostgresSemiRAW docker image

To start PostgresRAW, you will need two folders to store the data, one for the PostgreSQL data, and one for the raw CSV files.

Those two folders need to be owned by the user `999`, which is the `Postgres` user id inside the PostgresRAW container.

You can create those two folders with the following commands:

```sh
$ mkdir -p $PWD/../data/pgdata
$ mkdir -p $PWD/../datasets
$ mkdir -p $PWD/../result
$ sudo chown 999 $PWD/../data/pgdata $PWD/../datasets $PWD/../result
```

The image is build and given the name 'semiraw/postgresraw' with the following command:

```sh
$ export VCS_REF=$(git -C ../../PostgresSemiRaw/ rev-parse --short HEAD)
$ export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
$ export JOBS=8
$ docker-compose up --build
```

**Warning:** If you update the sources, add `--no-cache=true` to the command above to take the new version in consideration.

**Note:** Replace the `8` in `JOBS=8` with the number of CPU threads to reduce the build time on your machine.


The only specificity compared to a regular PostgreSQL image, is the extra volume which is mounted read-only on `datasets`. This volume is the folder which contains the CSV files to register as tables.

For more information on how to register manually CSV files, please refer to the [source documentation](https://github.com/HBPMedical/PostgresRAW).

You might want to checkout the web interface, which will also watch the folder and automatically register files: [PostgresRAW-UI](https://github.com/HBPMedical/PostgresRAW-UI-docker).

Alternatively, you can use `psql` as usual, for example, assuming the container was started as above:

```sh
psql -U dbuser -d db -h localhost -p 5554
```

Other than that, this container behaves as the official Postgres container, for more
information, please refer to https://hub.docker.com/_/postgres/. 
