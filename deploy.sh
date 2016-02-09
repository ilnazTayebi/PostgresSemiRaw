#!/bin/bash

NOW=$(date +"%Y%m%d-%H%M%S")
FILENAME=frontend-$NOW.tgz
FULLPATH=/tmp/$FILENAME

echo Writing to $FULLPATH
tar zcf $FULLPATH static/ rest-client/

DESTKEY=s3://raw-deploy/$FILENAME
LATESTKEY=s3://raw-deploy/frontend-latest.tgz
echo Uploading to $DESTKEY
aws s3 cp $FULLPATH $DESTKEY
echo Copying to $DESTKEY $LATESTKEY
aws s3 cp --acl public-read  $DESTKEY $LATESTKEY
