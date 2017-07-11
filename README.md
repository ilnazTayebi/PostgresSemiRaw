# Docker container for PostgresRAW

This project creates a lightweight Docker image for running PostgresRAW. It has been developed on Ubuntu and not tested on other platforms.

1. Clone the PostgresRAW-docker sources

    ```sh
    $ git clone https://github.com/HBPMedical/PostgresRAW-docker.git
    $ cd PostgresRAW-docker
    ```

2. For building, PostgresRAW-docker expects a compatible, compiled and archived version of PostgresRAW named PostgresRaw.tar.bz2. To compile a new version of PostgresRAW in a compatible environment, see build/README.

3. Once the latest archived version of PostgresRAW is available under the name PostgresRaw.tar.bz2, the container is build and given the name 'hbpmip/postgresraw' with the following command:
   
   ```sh
    $ docker build -t hbpmip/postgresraw \
    --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
    --build-arg VCS_REF=`git -C build/PostgresRAW/ rev-parse --short HEAD` \
    .
    ```

Once running, this container behaves as the official Postgres container, for more
information on that, please refer to https://hub.docker.com/_/postgres/.

