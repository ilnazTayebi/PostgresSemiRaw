# Build the new version, make sure to remove caches as appropriate
```sh
    docker build --build-arg JOBS=8 -t build-postgresraw .
```

# Copy out the generated binary archive
```sh
    docker run -ti -v $(pwd)/..:/host:rw build-postgresraw
    cp *.bz2 /host
```
