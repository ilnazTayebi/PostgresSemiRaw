This project creates a Docker image for compiling PostgresRAW in the environment of PostgresRAW-docker. It has been developed on Ubuntu and not tested on other platforms.

In order to use PostgresRAW, it is recommended to copy the compiled PostgresRAW to the lightweight image built by PostgresRAW-docker. This Docker image is used solely to compile PostgresRAW and extract a binary archive.

PostgresRAW can be compiled directly from the head version available on github (Dockerfile), or from a local version cloned in a PostgresRAW folder (Dockerfile.local). (Use -f argument of command 'docker build' to use a file not named 'Dockerfile'.)

# Build the new version, make sure to remove caches as appropriate
```sh
    docker build --build-arg JOBS=8 -t build-postgresraw .
```

# Run the container and copy out the generated binary archive
```sh
    docker run -ti -v $(pwd)/..:/host:rw build-postgresraw
    cp *.bz2 /host
    exit
```

# Copy binary archive of PostgresRAW under a clean name
cd ..
cp PostgresRaw-YYYMMDD-xxxx.tar.bz2 PostgresRaw.tar.bz2

# Build PostgresRAW docker
docker build -t hbpmip/postgresraw .
