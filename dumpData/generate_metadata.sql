----------------Run the ANALYZE to updata the statistic----------------------
VACUUM ANALYZE nation;
VACUUM ANALYZE region;
VACUUM ANALYZE part;
VACUUM ANALYZE supplier;
VACUUM ANALYZE partsupp;
VACUUM ANALYZE customer;
VACUUM ANALYZE orders;
VACUUM ANALYZE lineitem;

ANALYZE;

REINDEX TABLE nation;
REINDEX TABLE region;
REINDEX TABLE part;
REINDEX TABLE supplier;
REINDEX TABLE partsupp;
REINDEX TABLE customer;
REINDEX TABLE orders;
REINDEX TABLE lineitem;

---------- RUN the following query to get the statistic--------

SELECT
    relname AS table_name,
    relnamespace::regnamespace AS schema_name,
    reltuples AS estimated_rows,
    relpages AS table_pages
FROM
    pg_class
WHERE
    relkind = 'r'  -- Regular tables only
  AND relnamespace::regnamespace NOT IN ('pg_catalog', 'information_schema')
----------------------