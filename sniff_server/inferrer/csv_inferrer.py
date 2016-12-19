import csv
import re
from collections import OrderedDict
import logging

from .common import *
from raw_types import *


class CSVInferrer(object):
    def __init__(self, content, options=dict()):
        self._content = content
        self._options = options
        if self._options.has_key('nulls'): # re to look for lines starting and ending with self._options['nulls']
            self._null_reg = re.compile("^%s$" % self._options['nulls'])
        else:
            self._null_reg = re.compile("^$")
    def infer_type(self):
        sniffer = csv.Sniffer()
        # it will replace the options if available
        delimiters = self._options.get('delimiter', ";,|\t ") # get option 'delimiter' or use default ?
        dialect = sniffer.sniff(self._content, delimiters=delimiters)
        has_header = self._options.get('has_header', sniffer.has_header(self._content))
        for o in self._options: # transfert options attributes to dialect ?? only existing attributes or adding possibly new ones ? 
            dialect.__dict__[o] = self._options[o]

        reader = csv.reader(self._content.splitlines(), dialect)
        ctypes = OrderedDict()
        field_names=  []
        for row in reader:
            if field_names == []:
                if has_header or self._options.has_key('header'):
                    field_names = self._options.get('header', row)
                    # check that field_names are unique
                    # TODO: Automatically rename repeated field names
                    seen = []
                    for name in field_names:
                        if name not in seen:
                            seen.append(name)
                        else:
                            raise TypeInferenceException("Field name '%s' exists more than once" % name)
                    # skip the first row if it is a header row (otherwise, next step is to get data out of the row)
                    if has_header:
                        continue
                else:
                    field_names = ["_%s" % (i + 1) for i in xrange(len(row))]
            for i, value in enumerate(row):
                field = field_names[i]
                found_type = self.__what_is(value)
                try:
                    known_type = ctypes[field]
                except KeyError:
                    known_type = found_type
                if found_type.compatible_with(known_type):
                    ctypes[field] = found_type.max_of(known_type)
                else:
                    raise TypeInferenceException(value)

        inferred_type = rawListType(rawRecordType(ctypes))

        properties = dict(has_header=has_header,
                          delimiter=dialect.delimiter,
                          doublequote=dialect.doublequote,
                          escapechar=dialect.escapechar,
                          lineterminator=dialect.lineterminator,
                          quotechar=dialect.quotechar,
                          quoting=dialect.quoting,
                          skipinitialspace=dialect.skipinitialspace)
        to_copy = ['encoding', 'nulls']
        for p in to_copy:
            if self._options.has_key(p):
                properties[p] = self._options[p]
        return inferred_type, properties

    __regexps = [
        (re.compile("[0-9]*\\.[0-9]+$"), rawFloatType()),
        (re.compile("[0-9]+$"), rawIntType()),
        (re.compile("(true|false)$"), rawBooleanType()),
    ]
    def __what_is(self, txt):
        if self._null_reg:
            if self._null_reg.match(txt):
                return rawOptionType(rawSomeType())
        for reg, v in self.__regexps:
            if reg.match(txt):
                return v
        return rawStringType()
        

