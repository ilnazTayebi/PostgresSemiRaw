#!/usr/bin/env python
from argparse import ArgumentParser, FileType
import executor

if __name__ == '__main__':
    argp = ArgumentParser(description="List schemas of a user")
    argp.add_argument( "--executer","-e",default="http://localhost:54321",
            help="url of the scala executer", metavar="URL")
    argp.add_argument("--user", "-u", required=True, help="user name")

    args = argp.parse_args()
    executer_url = args.executer
    user = args.user

    print "Args: %s. Executor URL: %s, user: %s" % (args, executer_url, user)
    executor.schemas(executer_url, user)
