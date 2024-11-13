# Dumping TPCH dataset using postgresSQL

## Download and install

Install [TPCH](https://www.tpc.org/tpch/) data version 3.0.1 data using the DBGEN tool.
In the first step download the 

1- Download the TPCH DBGEN tool and unzipped the tar file:
  
```sh
 $ unzip 05bc7108-2175-4a4b-8e50-b9443ab82e22-tpc-h-tool.zip
  
 $  ls
```
2- Built a DBGEN file:
 
Open the makefile and change it as follows. you should change the cc to gcc and set the DATABASE to ORACLE .

```sh
 $ nano makefile.suite
 ```

    ################

    ## CHANGE NAME OF ANSI COMPILER HERE

    ################

    CC      = gcc

    # Current values for DATABASE are: INFORMIX, DB2, TDAT (Teradata)

    #                                  SQLSERVER, SYBASE, ORACLE

    # Current values for MACHINE are:  ATT, DOS, HP, IBM, ICL, MVS,

    #                                  SGI, SUN, U2200, VMS, LINUX, WIN32

    # Current values for WORKLOAD are:  TPCH

    DATABASE= ORACLE

    MACHINE = LINUX

    WORKLOAD = TPCH

3- Run the make command

```sh
 $ make makefile.suite
 ```

4- Invoked the DBGEN executable file in the current working directory to load TPCH data.

```sh
 $ ./dbgen -s  <n> -- set Scale Factor (SF) to  <n> (default: 1)
```
## Data cleaning

When using the **\copy** command in PostgreSQL, if your data file contains an extra trailing delimiter 
(such as a | at the end of each row), PostgreSQL might interpret it as an additional column. 
This can cause errors during data import. To handle this case, we provide shell script that takes the .tbl files folder name as input and processes all .tbl files in the folder by 
removing  the ending | from each line and save the cleaned data file in the new folder.

```sh
 $ ./datacleaning.sh <folder_path>
```
## Import data into the PostgreSQL

### 1- Set up Postgres using docker
```sh
 $ docker pull postgres
 $ docker volume create postgres_data
 $ docker run --name postgres_container -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres
```
### 2- Run the \copy command in the postgres terminal to import data into the tables.
note: If we use Postgres using docker, then first we need to copy the .tbl files to the container.
```sh
 $ \copy "region"     from '/tpch/region.tbl'        DELIMITER '|' CSV;
 $ \copy "nation"     from '/tpch/nation.tbl'        DELIMITER '|' CSV;
 $ \copy "customer"   from '/tpch/customer.tbl'    DELIMITER '|' CSV;
 $ \copy "supplier"   from '/tpch/supplier.tbl'    DELIMITER '|' CSV;
 $ \copy "part"       from '/tpch/part.tbl'            DELIMITER '|' CSV;
 $ \copy "partsupp"   from '/tpch/partsupp.tbl'    DELIMITER '|' CSV;
 $ \copy "orders"     from '/tpch/orders.tbl'        DELIMITER '|' CSV;
 $ \copy "lineitem"   from '/tpch/lineitem.tbl'    DELIMITER '|' CSV;
```