# Docker container for building PostgresRAW

This project creates a Docker image for compiling PostgresRAW in the environment of PostgresRAW-docker. It has been developed on Ubuntu and not tested on other platforms.

In order to use PostgresRAW, it is recommended to copy the compiled PostgresRAW to the lightweight image built by PostgresRAW-docker. This Docker image is used solely to compile PostgresRAW and extract a binary archive.

### Clone the PostgresRAW sources in PostgresRAW-docker/built/PostgresRAW (or pull last version)

```sh
 $ cd PostgresRAW-docker/built
 $ git clone https://github.com/HBPMedical/PostgresRAW.git PostgresRAW
```
    
### Build the new version, make sure to remove caches as appropriate
    
```sh
 docker build --build-arg JOBS=8 -t build-postgresraw .
```

### Run the container and copy out the generated binary archive

```sh
 docker run -ti -v $(pwd)/..:/host:rw build-postgresraw
 cp *.bz2 /host
 exit
```

### Copy binary archive of PostgresRAW under a clean name

   ```sh
   cd ..
   cp PostgresRaw-YYYMMDD-xxxx.tar.bz2 PostgresRaw.tar.bz2
   ```

### Build PostgresRAW docker (cf. README in PostgresRaw-docker)
   
```sh
 $ docker build -t hbpmip/postgresraw \
 --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
 --build-arg VCS_REF=`git -C build/PostgresRAW/ rev-parse --short HEAD` \
 .
```