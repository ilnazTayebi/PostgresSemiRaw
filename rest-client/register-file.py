#!/usr/bin/env python
from argparse import ArgumentParser, FileType
import executor

if __name__ == '__main__':
    argp = ArgumentParser(description="Register file")
    argp.add_argument( "--executer", "-e", default="http://localhost:54321",
            help="url of the scala executer" , metavar="URL")        
    argp.add_argument("--user", "-u", default="admin",
            help="user name to register files")
    argp.add_argument("file", help="file to register")

    args = argp.parse_args()
    executer_url = args.executer
    user = args.user
    f = args.file

    print "Args: %s. Executor URL: %s, user: %s, file: %s" % (args, executer_url, user, f)
    executor.registerfile(executer_url, user, f)
