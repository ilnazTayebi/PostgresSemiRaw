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
$ mkdir -p $PWD/../dumpData

$ sudo chown 999 $PWD/../data/pgdata $PWD/../datasets $PWD/../result $PWD/../dumpData
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

## Using PostgresSemiRAW

1. Initialize PostgreSQL database cluster:

   ```sh
   $ <installation_path>/bin/initdb -D <PGDATA>
   ```

2. Create a database:

   ```sh
   $ bin/pg_ctl start -D <PGDATA>
   $ bin/createsemirawdb <DBNAME> -M <DUMPDATA>
   ```

3. Create a table:

   ```sh
   $ bin/psql <DBNAME>
   $ <DBNAME>=# create table [...]
   ```
For more information on the `create table` syntax, please refer to the [official documentation](http://www.postgresql.org/docs/9.1/static/sql-createtable.html).

For raw files, PostgresSemiraRAW assumes:
1. that the schema is known **a priori** and registered as a table.
2. the schema should *map* the structure of the file, as there is *no semi-structured data, nor schema discovery*.
3. the exposed table will be used in read-only mode, no updates, insert nor delete operations.
4. that modifications of the data are done directly in the file, in which case PostgresRAW will invalidate its caches as required. If the CSV layout changes, the table needs to be recreated to map to the new layout.

Unless the steps presented below to register the file are taken, the table will use the regular PostgreSQL storage, and will allow all usual operations on the table, even with the RAW file access backend enabled.

See below how to enable and configure PostgresRAW.

## Configuring PostgresSemiRAW

PostgresSemiRAW allows to access data in csv files through empty dummy tables defined in the database.

Each dummy table encodes a file's schema. When those dummy tables are queried, the data is read from the corresponding file directly (assuming the configuration further described here is completed).

### 1. Enabling Raw File support

The PostgreSQL configuration file `postgresql.conf` is found under `<PGDATA>`.

The NoDB parameters are found at the end of this file:

```
#------------------------------------------------------------------------------
# INVISIBLEDB OPTIONS
#------------------------------------------------------------------------------
conf_file                     = 'snoop.conf'
enable_invisible_db           = on
enable_invisible_metadata     = on
```

* **conf_file**: Name of the NoDB configuration file:
  Uncommenting this line allows the conf_file to be found and read. The conf_file should be stored under `<PGDATA>` (same folder as postgresql.conf).

* **enable\_invisible\_db**: Enable/Disable NoDB

### 2. Registering files as tables

PostgresSemiRaw automatically initialize the conf_file (by default `snoop.conf`) which contains the following structure for each raw text file to register :

```
# Link to data file
filename-1 = '/home/NoDB/datafiles/load.txt'
# Table name (dummy table in the database)
relation-1 = 'persons'
# Delimiter for the file
delimiter-1 = ','

```

Similarly for more files...

```
filename-2 = '/home/NoDB/datafiles/load2.txt'
relation-2 = 'persons2'
delimiter-2 = ','
```

* **Note 1:**
  For each file (filename-n parameter), the corresponding table name (relation-n parameter) refers to an empty table that must be created in the database, with columns mapping exactly the data in the file. When a query is performed on the empty table, the data will be read from the file directly (if noDB is enabled).

* **Note 2:**
  For changes in `postgresql.conf` to be applied, you have to restart the DB.

* **Note 3:**
  For changes in `snoop.conf` to be applied, you have to restart the interactive terminal.

* **Note 4:**
  For maximum performance, an important action after running any query accessing a table for the first time, iis to subsequently run `ANALYZE <tablename>` where *<tablename>* is the name of the table accessed. This populates the statistics and improves the optimization in case the table is used in joins.
* **Note 5:**
   For now only full line comments are supported, in other words line which start with `#`.
* 
## Using PostgresRAW

1. Initialize PostgreSQL database cluster:

   ```sh
   $ <installation_path>/bin/initdb -D <PGDATA>
   ```

2. Create a database:

   ```sh
   $ bin/pg_ctl start -D <PGDATA>
   $ bin/createdb <DBNAME>
   ```

3. Create a table:

   ```sh
   $ bin/psql <DBNAME>
   $ <DBNAME>=# create table [...]
   ```
For more information on the `create table` syntax, please refer to the [official documentation](http://www.postgresql.org/docs/9.1/static/sql-createtable.html).

For raw files, PostgresRAW assumes:
1. that the schema is known **a priori** and registered as a table.
2. the schema should *map* the structure of the file, as there is *no semi-structured data, nor schema discovery*.
3. the exposed table will be used in read-only mode, no updates, insert nor delete operations.
4. that modifications of the data are done directly in the file, in which case PostgresRAW will invalidate its caches as required. If the CSV layout changes, the table needs to be recreated to map to the new layout.

Unless the steps presented below to register the file are taken, the table will use the regular PostgreSQL storage, and will allow all usual operations on the table, even with the RAW file access backend enabled.

See below how to enable and configure PostgresRAW.

## Configuring PostgresRAW

PostgresRAW allows to access data in csv files through empty dummy tables defined in the database.

Each dummy table encodes a file's schema. When those dummy tables are queried, the data is read from the corresponding file directly (assuming the configuration further described here is completed).

### 1. Enabling Raw File support

The PostgreSQL configuration file `postgresql.conf` is found under `<PGDATA>`.

The NoDB parameters are found at the end of this file:

```
#------------------------------------------------------------------------------
# INVISIBLEDB OPTIONS
#------------------------------------------------------------------------------
conf_file                     = 'snoop.conf'
enable_invisible_db           = on

```

* **conf_file**: Name of the NoDB configuration file:
  Uncommenting this line allows the conf_file to be found and read. The conf_file should be stored under `<PGDATA>` (same folder as postgresql.conf).

* **enable\_invisible\_db**: Enable/Disable NoDB

### 2. Registering files as tables

The conf_file (by default `snoop.conf`) must contain the following structure for each raw text file to register :

```
# Link to data file
filename-1 = '/home/NoDB/datafiles/load.txt'
# Table name (dummy table in the database)
relation-1 = 'persons'
# Delimiter for the file
delimiter-1 = ','
```

Similarly for more files...

```
filename-2 = '/home/NoDB/datafiles/load2.txt'
relation-2 = 'persons2'
delimiter-2 = ','
```

* **Note 1:**
  For each file (filename-n parameter), the corresponding table name (relation-n parameter) refers to an empty table that must be created in the database, with columns mapping exactly the data in the file. When a query is performed on the empty table, the data will be read from the file directly (if noDB is enabled).

* **Note 2:**
  For changes in `postgresql.conf` to be applied, you have to restart the DB.

* **Note 3:**
  For changes in `snoop.conf` to be applied, you have to restart the interactive terminal.

* **Note 4:**
  For maximum performance, an important action after running any query accessing a table for the first time, iis to subsequently run `ANALYZE <tablename>` where *<tablename>* is the name of the table accessed. This populates the statistics and improves the optimization in case the table is used in joins.
* **Note 5:**
   For now only full line comments are supported, in other words line which start with `#`.

