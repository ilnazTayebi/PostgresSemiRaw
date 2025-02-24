# PostgresSemiRAW
This project is a modified version of [PostgreSQL 9.5.6](https://www.postgresql.org/docs/9.5/index.html), originally sourced from [postgresRaw](https://github.com/HBPMedical/PostgresRAW), with custom modifications.
PostgresRAW allows to access data in csv files through empty dummy tables defined in the database. PostgresSemiRAW enables the injection of database metadata into PostgresRaw and allows for the evaluation of the effects of different types of metadata on query execution time and query plans.


## Table Of Content
- [Project Folder Structure](#project-folder-structure)
- [Data Preparation](#data-preparation)
- [Setup PostgresSemiRaw](#setup-postgressemiraw)
  - [Setup PostgresSemiRaw On Local](#setup-postgressemiraw-on-local)
  - [Setup PostgresSemiRaw Using Docker](#setup-postgressemiraw-using-docker) 
-  [Run The Experiment](#run-the-experiment)
- [Build The Report Automatically](#build-the-report-automatically)

## Project Folder Structure
```sh
📂 PostgresSemiRaw
│── 📂 analysis                # Python scripts for analysis the experiment's results.
│── 📂 data                    # Postgres configuration files.
│── 📂 deploy                  # DockerFile and docker compose.
│   ├── 📂 Analysis            # DockerFile for the analysis container.
│   │── 📂 PostgresRaw         # DockerFile for the postgresSemiRAW container.
│   └── 📂 PostgresRawUI       # DockerFile for the PostgresRawUI container.
│── 📂 dumpData                # Script and readme files for data cleaning of the TPC-H dataset.
│   └── 📂 script              # Script for data cleaning of the TPC-H dataset.
│── 📂 experimentData          # Schema, scripts and results of our run experiments as sample results.
│     ├── 📂 initSchema        # Sample of schema of our experiments.
│     └── 📂 results           # Sample of results of our experiments.
│── 📂 PostgresRaw             # Source code of postgresSemiRaw.
│     ├── 📂 postgresql-9.0.0  # Source code of postgresql-9.6.5.
│     │── 📂 postgresql-9.6.5  # Source code of postgresSemiRaw based on the postgresql-9.6.5.
│     └── 📂 test              # Testing PostgresRAW over PostgreSQL 9.6.5.
│── 📂 result                  # Results csv files.
│── 📂 schema                  # Script for database initialization.
│── 📂 test                    # Script for run the experiment.
│── LISENSE
│── README.md
```
## Data Preparation
If you intend to use the TPC-H benchmark, refer to the [README](dumpData/README.md) file for guidance on dumping the TPCH dataset using PostgreSQL.

## Setup PostgresSemiRAW
Use your favorite IDEA such as Visual Studio Code to set up and run the PostgresSemiRaw.
1. Clone the project:

    ```sh
    $ git clone https://github.com/ilnazTayebi/PostgresSemiRaw.git    
    ```

2. Create the folders if they do not exist:

   To start PostgresRAW, we will need the following folders:

    - data: For the PostgreSQL data
    - datasets: For the raw CSV files
    - result: For save the experiment's results.
    - schema: For the database initialization script.
    - test: For experiments script and queries.
      
   **Note 1:** If you want to run the project using the Docker file, those folders must be owned by the user `999`, which is the `Postgres` user id within the PostgresRAW container.

   **Note 2:** If you want to run the project on the local machine use the postgres user to set up the folders and files.

   You can create those folders with the following commands:

    ```sh
    $ mkdir -p $PWD/../data
    $ mkdir -p $PWD/../datasets
    $ mkdir -p $PWD/../result
    $ mkdir -p $PWD/../schema
    $ mkdir -p $PWD/../test
    
    $ sudo chown 999 $PWD/../data $PWD/../datasets $PWD/../result $PWD/../schema
    ```
3. Upload raw data files into **datasets** folder.

4. Upload the file `init_schema.sql` into **schema**:
   
   This file holds the schema and metadata necessary for initialising the database.
   For raw files, PostgresSemiraRAW assumes:
    - that the schema is known **a priori** and will automatically register as a table using the `init_schema.sql`.
    - the schema should *map* the structure of the raw data file, as there is *no semi-structured data, nor schema discovery*.
    - the exposed table will be used in read-only mode, no updates, insert nor delete operations.
    - that modifications of the data are done directly in the file, in which case PostgresSemiRAW will invalidate its caches as required. If the CSV layout changes, the table needs to be recreated to map to the new layout.

5. Upload the file `experiment.sql` into **test**. This file holds the lists of queries for evaluate the database. Note that each query should be in one line.

   ```sh
   $ SELECT O.O_CUSTKEY, AVG(O.O_TOTALPRICE) AS AVG_TOTAL_PRICE FROM Orders O GROUP BY O.O_CUSTKEY;
   $ SELECT O_ORDERKEY, O_TOTALPRICE FROM Orders WHERE O_TOTALPRICE > 100000;
   ```
6. Set the permission of `queryPlan.csv` and `queryExecTime.csv` to be owned by the user `999`, which is the `Postgres` user id inside the PostgresRAW container. The results of the experiments will be saved into these two files. 
   ```sh   
   $ sudo chown 999 result/queryPlan.csv
   $ sudo chown 999 result/queryExecTime.csv
   ```
### Setup PostgresSemiRaw On Local
Follow the following steps to set up the postgresSemiRaw on your local machin.
1. Compile PostgresRaw and install the compiled PostgresRaw binaries with the following commands:

   ```sh
   $ cd postgresRaw/postgresql-9.6.5
   $ ./configure
   $ make -j$(nproc)
   $ make install
   ```
2. Add new postgres user and switch to the postgres user.

3. Initialize PostgreSQL database cluster:

   ```sh
   $ <installation_path>/bin/initdb -D data/pgdata
   ```

4. Enabling Raw File support:

    The PostgreSQL configuration file `postgresql.conf` is found under `<PGDATA>`.The PostgresSemiRaw parameters are found at the end of this file:

    ```
    #------------------------------------------------------------------------------
    # INVISIBLEDB OPTIONS
    #------------------------------------------------------------------------------
    conf_file                     = 'snoop.conf' # Name of the NoDB configuration file.
    enable_invisible_db           = on # Enable PostgresRaw
    enable_invisible_metadata     = on # Enable PotsgresSemiRaw
    ```
   **Note 1:** By default both the settings are enable.

   **Note 2:** For changes in postgresql.conf to be applied, you have to restart the DB.

   **Note 3:** To use the PostgresSemiRaw both `enable_invisible_db` and `enable_invisible_metadata` must be enabled.

5. Create a database:

   ```sh
   $ bin/pg_ctl start -D <PGDATA>
   $ bin/createsemirawdb <DBNAME> -M <SCHEMA>
   ```

6. Connect to the database:

   ```sh
   $ bin/psql <DBNAME>
   ```

### Setup PostgresSemiRaw Using Docker

1. Build and run the docker compose:

   The image is build and given the name 'postgressemiraw' with the following command:
 
    ```sh
    $ cd deploy
    $ docker-compose up --build
    ```
   The postgresSemiRaw container behaves as the official Postgres container, for more information, please refer to https://hub.docker.com/_/postgres/ with this different that PostgresSemiRaw to initialize the database cluster automatically.

2. Access a running Docker container named postgresSemiRaw and open a shell:

   ```sh
   $ docker exec -it postgresSemiRaw sh
   ```
   
3. Switch to the postgres user
   ```sh
   $ gosu postgres sh
   ```

4. Create a database:

   ```sh
   $ createsemirawdb <DBNAME> -M <SCHEMA>
   ```
5. Connect to the database:

   ```sh
   $ psql <DBNAME>
   ```

## Run The Experiment
Once you created the database, run the following commands to run the experiments
1. \exp: To run the experiments n times and save the execution time of the queries in the `experiment.sql` file.
   ```sh
   $ \exp <ITTERATION>
   ```
2. \plan: To run the experiments n times and save the query plan of the queries in the `experiment.sql` file.
   ```sh
   $ \plan <ITTERATION>
   ```
3. \resetexp: reset the queryExecTime.csv and `queryPlan.csv` files.
   ```sh
   $ \resetexp
   ```

## Build The Report Automatically
1. Access a running Docker container named analysis and open a shell:
   ```sh
   $ docker exec -it analysis sh
   ```
2. Run the doall script to build the thesis.pdf file.
   ```sh
   $ ./doall.sh
   ``` 
3. Copy the thesis.pdf file from the docker container to your local machine:
   ```sh
   $ docker cp  analysis:../report/thesis.pdf <destination_path>
   ``` 