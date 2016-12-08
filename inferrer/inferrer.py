import logging
from argparse import ArgumentParser
import os.path
import json

import schema_serializer
import inferrer

logging.basicConfig(level=logging.INFO)

# this is to byteify the strings for the options
# the csv module was not accepting the unicode strings
def _byteify(data):
    # if this is a unicode string, return its string representation
    if isinstance(data, unicode):
        return data.encode('utf-8')
    # if this is a list of values, return list of byteified values
    if isinstance(data, list):
        return [ _byteify(item) for item in data ]
    if isinstance(data, dict):
        return {
            _byteify(key): _byteify(value)
            for key, value in data.iteritems()
        }
    # if it's anything else, return it in its original form
    return data


if __name__ == '__main__':
    argp = ArgumentParser(description="Schema inferrer")
    argp.add_argument("--file-path", "-f", required=True, dest='file_path',
                      help="file path or url of the schema to be interred")
    argp.add_argument("--file_type", "-t", required=True, dest='file_type', help="File type")
    argp.add_argument("--output-path", "-o", required=True, dest='output_path', help="Output path")
    argp.add_argument("--options", "-p", dest='option_file', default=None, help="json file with extra options for infering")

    args = argp.parse_args()
    path = args.file_path
    if args.option_file:
        with open(args.option_file) as f:
            # check other option for the ensure_ascii
            options = json.load(f, object_hook=_byteify)
    else:
        options = dict()

    file_type = args.file_type
    basedir = args.output_path
    
    logging.info("Inferring schema %s", args)
    logging.info("options %s", options)
    #TODO: move this loop to the inferrer module
    n_objs = 500
    n_max = 10000
    while n_objs < n_max:
        try :
            # Infer schema
            schema, properties = inferrer.from_url(path, file_type, n_objs=n_objs, options=options)
            logging.debug("Schema: %s; Properties: %s" % (schema, properties))
            serialized_schema = schema_serializer.serialize(schema)
            break
        except schema_serializer.SerializerException as e:
            logging.warn("Exception: %s" % e)
            logging.info('Could not infer type with %d, retrying with %d' % (n_objs, 2*n_objs))
            n_objs = 2*n_objs

    # basedir = os.path.dirname(file)
    serialized_schema = schema_serializer.serialize(schema)

    logging.debug("Serialized Schema:\n%s" % serialized_schema)
    schemaFile = os.path.join(basedir, "schema.xml")
    logging.info("Writing schema: " + schemaFile)
    with open(schemaFile, "w") as text_file:
        text_file.write(serialized_schema)

    serialized_properties = json.dumps(properties)
    propFile = os.path.join(basedir, "properties.json")
    logging.info("Writing properties file: " + propFile)
    with open(propFile, "w") as text_file:
        text_file.write(serialized_properties)
