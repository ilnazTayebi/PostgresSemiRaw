from .common import *
from raw_types import *
import inspect
import re
from collections import OrderedDict

class LogInferrer(object):
    def __init__(self, content, options=dict()):
        self._content = content
        self._options = options

    def infer_type(self, min_match=0.8):
        matchers=[
            RegexMatcher("apache_logs1",
                '([\w\d\.]+)\s+- -\s+\[(.*)\] "(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+) ([^"]+)\s*"\s+(\d+)\s+(\d+)',
                [ ("hostname",rawStringType()), 
                    ("timestamp",rawStringType()), 
                    ("method",rawStringType()),
                    ("url",rawStringType()), 
                    ("version",rawStringType()), 
                    ("returned",rawIntType()),
                    ("size",rawIntType()) ]
            ),
            RegexMatcher("apache_logs2",
                '\[([^\[\]]+)\]\s+\[?(\w+)\]?:?\s+(.*)',
                [ ("timestamp",rawStringType()),
                ("level",rawStringType()),
                ("message",rawStringType())]
            ),
            RegexMatcher("axa_syslogs",
                '(\w+\s+\d+\s+\d\d:\d\d:\d\d\.?\d*)\s+(.*)',
                [ ("timestamp",rawStringType()), ("message",rawStringType())]
            )
        ]
        lines=self._content.split('\n')
        results= [ m.match(lines) for m in matchers]
        results.sort( key= lambda x : x[1]["matched_value"], reverse=True)
        schema, properties = results[0]
        if properties["matched_value"] < min_match:
            schema = rawListType(rawStringType())
            properties = dict()
            
        if self._options.has_key('encoding'):
            properties['encoding'] = self._options['encoding']
        return schema, properties

class RegexMatcher(object):
    def __init__(self, name, regex, tipes, timestamp_field="timestamp"):
        self.regex=regex
        self.tipes=tipes
        self.timestamp_filed=timestamp_field
        self.name=name
        desc=OrderedDict()	
        for name,t in tipes:
            desc[name]=t
        self.schema=rawListType( rawOptionType(rawRecordType(desc)) )
    def match(self, lines):
        r = re.compile(self.regex)
        results=[1.0 if r.match(l) else 0.0 for l in lines]
        value = sum(results)/len(results)
        properties=dict(matched_name=self.name,
                        matched_value=value,
                        regex=self.regex)

        return (self.schema, properties)

