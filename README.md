# PostgresRAW-UI: Web UI and file sniffer for PostgresRAW

PostgresRAW-UI offers a web UI for PostgresRAW and automates detection and registration of raw files (sniffer). The folder containing the files to be automatically added to the database must be provided as an argument when starting the server.

## 1. Running PostgresRAW-UI

Requirements:

 * python 2.7
 * flask
 * requests
 * psycopg2

PostgresRAW-UI is launched using the command:

```sh
$ python sniff_server/server.py (args)
```

For the list of the arguments to be provided, type:

```sh
$ python sniff_server/server.py --help
```

Here is an example command to start the server:

```sh
$ python server.py --reload \
    --pg_raw \
    --host ${POSTGRES_HOST} \
    --port ${POSTGRES_PORT} \
    --user ${POSTGRES_USER} \
    --password ${POSTGRES_PASSWORD} \
    --dbname ${POSTGRES_DB} \
    --folder /datasets \
    --snoop_conf_folder /data
```

This example assumes that:

 * PostresRAW is used
 * POSTGRES_* environment variables are defined and link to PostgresRAW
 * PostgresRAW configuration file is expected to be found in /data
 * the watched folder (containing raw data files to be automatically registered) is `/datasets`
 * the folder containing the NoDB configuration file is `/data`, and the file itself is found in `/data/pgdata/snoop.conf`

To see the web UI go to: http://localhost:5555/static/raw_demo.html 

## 2. Using PostgresRAW-UI with PostgresRAW

In PostgresRAW mode, the sniffer of PostgresRAW-UI detects CSV files in the folder given by the **folder** argument. The inferrer module then infers their schema and creates corresponding dummy tables in the given database **dbname** (more details below). 

The sniffer also registers the associations `{file; dummy table}` through a configuration file named `snoop.conf`. This file is created in the **snoop\_conf\_folder**. PostgresRAW expects to find the configuration file in its data folder (as defined by `PGDATA`), so the **snoop\_conf\_folder** argument must give the path of that folder. please refer to the [PostgresRAW](https://github.com/HBPMedical/PostgresRAW) project for more information.

Using the sniffer of PostgresRAW-UI, no schema has to be defined manually in the database for the raw CSV files. Rather, the structure of data made available for querying in the watched folder is translated in real time to a database schema based on the following rules:

For each `[name].csv` file discovered in **datasets**, an equivalent table is made available in the Query Engine for querying. The table name is based on the file name, with the following rules uppercase characters are transformed to lowercase and any special character removed (except underscore '\_').

Here are two examples:

 1. A file named `Brain_Feature_Set.csv` is accessed through a table named **`brain_feature_set`**.
 2. A file named `B%dExämp|e.csv` will be exposed through a table named **`bdexmpe`**.

The column names are retrieved from the header line of the CSV file, without modifications. It is highly recommended to stick to simple lowercase names in order to access data seamlessly. Columns of CSV files without header are named by default `_1`, `_2`, `_3`, etc…

The type of each data feature (column) is inferred based on the first lines of the file, as one of the following types: *int*, *real*, *boolean* or *text*. Data not fitting any of the specialised types defaults to *text* type. Empty values are recognised as *NULL*s.

The CSV file delimiter is expected to be a comma (`,`). Other standard delimiters used in a consistent way should be recognised automatically. The double quote character (`"`) must be used for text quoting (and escaping). NULL values are represented with an empty unquoted string (for instance with comma delimiters : `,,`).

Note: files without a `.csv` extension are not recognised as CSV.


## 3. Automated deployment

The git project RAW-deploy automates the deployment of two connected docker containers running PostgresRAW and PostgresRAW-UI. 

