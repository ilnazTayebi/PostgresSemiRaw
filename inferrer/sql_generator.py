from inferrer.raw_types import *
from collections import OrderedDict
import xml.dom.minidom
import logging


class SQLStatementException(Exception):
    def __init__(self, msg):
        super(SQLStatementException, self).__init__("could not create SQL statement: %s" % msg)

class SQLGenerator():
    def __init__(self, name,structure):
        self.table_name = name
        self.struct = structure
        
    def recurse(self,rawType):
        if isinstance(rawType, rawIntType):
            return "int"
        elif isinstance(rawType, rawStringType):
            return "text"
        elif isinstance(rawType, rawFloatType):
            return "real"
        elif isinstance(rawType, rawBooleanType):
            return "boolean"
        elif isinstance(rawType, rawListType):
        # check the list contains a rawRecordType, which is the only allowed structure
            if isinstance(rawType.desc, rawRecordType):
                return self.recurse(rawType.desc)
            else:
                raise SQLStatementException("Unsupported structure:" % rawType)
        elif isinstance(rawType, rawRecordType):
            tmp = "CREATE TABLE %s { \n" % self.table_name
            for (k, v) in rawType.desc.items():
                if not(isinstance(v, rawIntType) or isinstance(v, rawStringType) or isinstance(v, rawFloatType) or isinstance(v, rawBooleanType)):
                    raise SQLStatementException("Unsupported structure:" % rawType)
                    
                tmp += '\t'
                tmp += self.recurse(v)
                tmp += ' %s' % k
                tmp += ',\n'
            tmp = tmp[:-2]
            tmp += "\n}"
            return tmp
        else:
            # ValueException is unknown, I switched it to ValueError
            raise SerializerException("Unknown type: %s" % rawType)

    def serialize(self):
        sqlStatement = self.recurse(self.struct)
        return sqlStatement


if __name__ == '__main__':
    name = "foobarType"
    schema = rawListType(rawRecordType(OrderedDict([('field1', rawIntType()), ('field2', rawStringType())])))
    obj = SQLGenerator("test_table",schema)
    print obj.serialize()
