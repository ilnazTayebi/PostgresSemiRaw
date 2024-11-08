/*-------------------------------------------------------------------------
 *
 * createsemiradb
 *
 * Portions Copyright (c) 1996-2016, PostgreSQL Global Development Group
 * Portions Copyright (c) 1994, Regents of the University of California
 *
 * src/bin/scripts/createsemiradb.c
 *
 *-------------------------------------------------------------------------
 */
#include "postgres_fe.h"

#include "common.h"
#include "fe_utils/string_utils.h"

#include <sys/stat.h>
#include "snooping/global.h"

/* internal vars */
static const char *progname;
static char *init_schema_file;
static char *dump_path = "";

#define exit_nicely(code) exit(code)

static PGresult *executingQuery(PGconn *conn, const char *query, const char *progname);
static void setup_schema(PGconn *conn, const char *progname);
static void set_input(char **dest, char *filename);
static char **readfile(const char *path);
static void help(const char *progname);

/*
 * get the lines from a text file
 */
static char **
readfile(const char *path)
{
    FILE *infile;
    int maxlength = 1,
        linelen = 0;
    int nlines = 0;
    int n;
    char **result;
    char *buffer;
    int c;

    if ((infile = fopen(path, "r")) == NULL)
    {
        fprintf(stderr, _("%s: could not open file \"%s\" for reading: %s\n"),
                progname, path, strerror(errno));
    }

    /* pass over the file twice - the first time to size the result */
    while ((c = fgetc(infile)) != EOF)
    {
        linelen++;
        if (c == '\n')
        {
            nlines++;
            if (linelen > maxlength)
                maxlength = linelen;
            linelen = 0;
        }
    }

    /* handle last line without a terminating newline (yuck) */
    if (linelen)
        nlines++;
    if (linelen > maxlength)
        maxlength = linelen;

    /* set up the result and the line buffer */
    result = (char **)pg_malloc((nlines + 1) * sizeof(char *));
    buffer = (char *)pg_malloc(maxlength + 1);
    /* now reprocess the file and store the lines */
    rewind(infile);
    n = 0;
    while (fgets(buffer, maxlength + 1, infile) != NULL && n < nlines)
        result[n++] = pg_strdup(buffer);
    fclose(infile);
    free(buffer);
    result[n] = NULL;

    return result;
}

/*
 * set name of given input file variable under data directory
 */
static void
set_input(char **dest, char *filename)
{
    *dest = psprintf("%s/%s", dump_path, filename);
}

/*
 * load init schema and create provided tables
 */
static void
setup_schema(PGconn *conn, const char *progname)
{
    char **line;
    char **lines;
    char *query = NULL;
    size_t query_len = 0;
    size_t query_alloc = 1024;

    set_input(&init_schema_file, "init_schema.sql");

    query = (char *)malloc(query_alloc);

    if (!query)
    {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    query[0] = '\0';

    lines = readfile(init_schema_file);

    /*
     * Collect all the lines in a query string and call a executingQuery
     * each time reach to a semicolon (;) at the end of a line
     */
    for (line = lines; *line != NULL; line++)
    {
        size_t line_len = strlen(*line);

        while (query_len + line_len + 1 >= query_alloc)
        {
            query_alloc *= 2;
            query = (char *)realloc(query, query_alloc);
            if (!query)
            {
                fprintf(stderr, "Memory allocation failed\n");
                exit(1);
            }
        }

        strcat(query, *line);
        query_len += line_len;

        /* Trim whitespace to check if the line ends with a semicolon */
        size_t i = line_len;
        while (i > 0 && isspace((*line)[i - 1]))
        {
            i--;
        }

        /* Check if the line ends with a semicolon */
        if (i > 0 && (*line)[i - 1] == ';')
        {
            executingQuery(conn, query, progname);

            /* Reset query buffer for the next query */
            query[0] = '\0';
            query_len = 0;
        }

        free(*line);
    }

    free(query);
    free(lines);
}

/*
 * Run a query, return the results, exit program on failure.
 */
static PGresult *
executingQuery(PGconn *conn, const char *query, const char *progname)
{
    PGresult *results;
    PQExpBuffer query_buffer = createPQExpBuffer();

    appendPQExpBufferStr(query_buffer, query);

    printf("%s\n", query);

    results = PQexec(conn, query);
    if (!results ||
        PQresultStatus(results) != PGRES_COMMAND_OK)
    {
        fprintf(stderr, _("%s: query failed: %s"),
                progname, PQerrorMessage(conn));
        fprintf(stderr, _("%s: query was: %s\n"),
                progname, query);
        PQfinish(conn);
        exit_nicely(1);
    }

    PQclear(results);
    return results;
}

int main(int argc, char *argv[])
{
    static struct option long_options[] = {
        {"metadata_path", required_argument, NULL, 'M'},
        {"host", required_argument, NULL, 'h'},
        {"port", required_argument, NULL, 'p'},
        {"username", required_argument, NULL, 'U'},
        {"no-password", no_argument, NULL, 'w'},
        {"password", no_argument, NULL, 'W'},
        {"echo", no_argument, NULL, 'e'},
        {"owner", required_argument, NULL, 'O'},
        {"tablespace", required_argument, NULL, 'D'},
        {"template", required_argument, NULL, 'T'},
        {"encoding", required_argument, NULL, 'E'},
        {"lc-collate", required_argument, NULL, 1},
        {"lc-ctype", required_argument, NULL, 2},
        {"locale", required_argument, NULL, 'l'},
        {"maintenance-db", required_argument, NULL, 3},
        {NULL, 0, NULL, 0}};

    const char *progname;
    int optindex;
    int c;

    const char *dbname = NULL;
    const char *maintenance_db = NULL;
    char *comment = NULL;
    char *host = NULL;
    char *port = NULL;
    char *username = NULL;
    enum trivalue prompt_password = TRI_DEFAULT;
    bool echo = false;
    char *owner = NULL;
    char *tablespace = NULL;
    char *template = NULL;
    char *encoding = NULL;
    char *lc_collate = NULL;
    char *lc_ctype = NULL;
    char *locale = NULL;

    PQExpBufferData sql;

    PGconn *conn;
    PGresult *result;

    progname = get_progname(argv[0]);
    set_pglocale_pgservice(argv[0], PG_TEXTDOMAIN("pgscripts"));

    handle_help_version_opts(argc, argv, "createsemirawdb", help);
    while ((c = getopt_long(argc, argv, "h:p:U:wWeO:D:T:E:l:M:", long_options, &optindex)) != -1)
    {

        switch (c)
        {
        case 'M':
            dump_path = pg_strdup(optarg);
            break;
        case 'h':
            host = pg_strdup(optarg);
            break;
        case 'p':
            port = pg_strdup(optarg);
            break;
        case 'U':
            username = pg_strdup(optarg);
            break;
        case 'w':
            prompt_password = TRI_NO;
            break;
        case 'W':
            prompt_password = TRI_YES;
            break;
        case 'e':
            echo = true;
            break;
        case 'O':
            owner = pg_strdup(optarg);
            break;
        case 'D':
            tablespace = pg_strdup(optarg);
            break;
        case 'T':
            template = pg_strdup(optarg);
            break;
        case 'E':
            encoding = pg_strdup(optarg);
            break;
        case 1:
            lc_collate = pg_strdup(optarg);
            break;
        case 2:
            lc_ctype = pg_strdup(optarg);
            break;
        case 'l':
            locale = pg_strdup(optarg);
            break;
        case 3:
            maintenance_db = pg_strdup(optarg);
            break;
        default:
            fprintf(stderr, _("Try \"%s --help\" for more information.\n"), progname);
            exit(1);
        }
    }

    switch (argc - optind)
    {
    case 0:
        break;
    case 1:
        dbname = argv[optind];
        break;
    case 2:
        dbname = argv[optind];
        comment = argv[optind + 1];
        break;
    default:
        fprintf(stderr, _("%s: too many command-line arguments (first is \"%s\")\n"),
                progname, argv[optind + 2]);
        fprintf(stderr, _("Try \"%s --help\" for more information.\n"), progname);
        exit(1);
    }

    if (locale)
    {
        if (lc_ctype)
        {
            fprintf(stderr, _("%s: only one of --locale and --lc-ctype can be specified\n"),
                    progname);
            exit(1);
        }
        if (lc_collate)
        {
            fprintf(stderr, _("%s: only one of --locale and --lc-collate can be specified\n"),
                    progname);
            exit(1);
        }
        lc_ctype = locale;
        lc_collate = locale;
    }

    if (encoding)
    {
        if (pg_char_to_encoding(encoding) < 0)
        {
            fprintf(stderr, _("%s: \"%s\" is not a valid encoding name\n"),
                    progname, encoding);
            exit(1);
        }
    }

    if (dbname == NULL)
    {
        if (getenv("PGDATABASE"))
            dbname = getenv("PGDATABASE");
        else if (getenv("PGUSER"))
            dbname = getenv("PGUSER");
        else
            dbname = get_user_name_or_exit(progname);
    }

    initPQExpBuffer(&sql);

    appendPQExpBuffer(&sql, "CREATE DATABASE %s",
                      fmtId(dbname));

    if (owner)
        appendPQExpBuffer(&sql, " OWNER %s", fmtId(owner));
    if (tablespace)
        appendPQExpBuffer(&sql, " TABLESPACE %s", fmtId(tablespace));
    if (encoding)
        appendPQExpBuffer(&sql, " ENCODING '%s'", encoding);
    if (template)
        appendPQExpBuffer(&sql, " TEMPLATE %s", fmtId(template));
    if (lc_collate)
        appendPQExpBuffer(&sql, " LC_COLLATE '%s'", lc_collate);
    if (lc_ctype)
        appendPQExpBuffer(&sql, " LC_CTYPE '%s'", lc_ctype);

    appendPQExpBufferChar(&sql, ';');

    /* No point in trying to use postgres db when creating postgres db. */
    if (maintenance_db == NULL && strcmp(dbname, "postgres") == 0)
        maintenance_db = "template1";

    conn = connectMaintenanceDatabase(maintenance_db, host, port, username,
                                      prompt_password, progname);

    if (echo)
        printf("%s\n", sql.data);
    result = PQexec(conn, sql.data);

    if (PQresultStatus(result) != PGRES_COMMAND_OK)
    {
        fprintf(stderr, _("%s: database creation failed: %s"),
                progname, PQerrorMessage(conn));
        PQfinish(conn);
        exit(1);
    }

    PQclear(result);

    if (comment)
    {
        printfPQExpBuffer(&sql, "COMMENT ON DATABASE %s IS ", fmtId(dbname));
        appendStringLiteralConn(&sql, comment, conn);
        appendPQExpBufferChar(&sql, ';');

        if (echo)
            printf("%s\n", sql.data);
        result = PQexec(conn, sql.data);

        if (PQresultStatus(result) != PGRES_COMMAND_OK)
        {
            fprintf(stderr, _("%s: comment creation failed (database was created): %s"),
                    progname, PQerrorMessage(conn));
            PQfinish(conn);
            exit(1);
        }

        PQclear(result);
    }

    /* Close the connection for the maintenance_db */
    PQfinish(conn);

    /* Set the connection to the created dbname */
    maintenance_db = dbname;
    conn = connectMaintenanceDatabase(maintenance_db, host, port, username,
                                      prompt_password, progname);

    /* Initialize schema for the created dbname */
    setup_schema(conn, progname);
    
    /* Close the connection for the created dbname */
    PQfinish(conn);

    exit(0);
}

static void
help(const char *progname)
{
    printf(_("%s creates a PostgreSQL database.\n\n"), progname);
    printf(_("Usage:\n"));
    printf(_("  %s [OPTION]... [DBNAME] [DESCRIPTION]\n"), progname);
    printf(_("\nOptions:\n"));
    printf(_("  -M, --metadata_path=TABLESPACE   default metadata script space for the database\n"));
    printf(_("  -D, --tablespace=TABLESPACE  default tablespace for the database\n"));
    printf(_("  -e, --echo                   show the commands being sent to the server\n"));
    printf(_("  -E, --encoding=ENCODING      encoding for the database\n"));
    printf(_("  -l, --locale=LOCALE          locale settings for the database\n"));
    printf(_("      --lc-collate=LOCALE      LC_COLLATE setting for the database\n"));
    printf(_("      --lc-ctype=LOCALE        LC_CTYPE setting for the database\n"));
    printf(_("  -O, --owner=OWNER            database user to own the new database\n"));
    printf(_("  -T, --template=TEMPLATE      template database to copy\n"));
    printf(_("  -V, --version                output version information, then exit\n"));
    printf(_("  -?, --help                   show this help, then exit\n"));
    printf(_("\nConnection options:\n"));
    printf(_("  -h, --host=HOSTNAME          database server host or socket directory\n"));
    printf(_("  -p, --port=PORT              database server port\n"));
    printf(_("  -U, --username=USERNAME      user name to connect as\n"));
    printf(_("  -w, --no-password            never prompt for password\n"));
    printf(_("  -W, --password               force password prompt\n"));
    printf(_("  --maintenance-db=DBNAME      alternate maintenance database\n"));
    printf(_("\nBy default, a database with the same name as the current user is created.\n"));
    printf(_("\nReport bugs to <pgsql-bugs@postgresql.org>.\n"));
}
