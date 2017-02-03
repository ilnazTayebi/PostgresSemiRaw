# Docker container for PostgresRAW

This project creates a lightweight Docker image for running PostgresRAW. It has been developed on Ubuntu and not tested on other platforms.

The container is build and given the name 'hbpmip/postgresraw' with the following command:
$ docker build -t hbpmip/postgresraw .

For building, it expects a compatible, compiled and archived version of PostgresRAW named PostgresRaw.tar.bz2. To compile a new version of PostgresRAW in a compatible environment, see build/README.

Once running, this container behaves as the official Postgres container, for more
information on that, please refer to https://hub.docker.com/_/postgres/.

