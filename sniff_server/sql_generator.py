from inferrer.raw_types import *
from collections import OrderedDict
import xml.dom.minidom
import logging
import re



class SQLGeneratorException(Exception):
    def __init__(self, msg):
        super(SQLGeneratorException, self).__init__("could not create SQL statement: %s" % msg)

# Class SQLGenerator
# Holds a table name and a file structure  
# Provides a function to build an SQL statement to create the corresponding table in a database
class SQLGenerator():
    def __init__(self, name,structure):
        self.table_name = name
        self.struct = structure
        #self.db_forbidden_char = re.compile('[^a-zA-Z0-9_]+')
        
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
                raise SQLGeneratorException("Unsupported rawListType structure:" % rawType)
        elif isinstance(rawType, rawRecordType):
            tmp = "DROP TABLE IF EXISTS %s; CREATE TABLE %s ( \n"%(self.table_name,self.table_name)
            for (k, v) in rawType.desc.items():
                not_null_tag = ' NOT NULL'
                if isinstance(v, rawOptionType):
                    not_null_tag = ''
                    v = v.desc
                    
                if not(isinstance(v, rawIntType) or isinstance(v, rawStringType) or isinstance(v, rawFloatType) or isinstance(v, rawBooleanType)):
                    raise SQLGeneratorException("Unsupported rawRecordType structure: %s" % v)
                    
                tmp += '\t'
                tmp += '"%s" ' % k #self.db_forbidden_char.sub('',k)
                tmp += self.recurse(v) 
                tmp += not_null_tag
                tmp += ',\n'
                
            tmp = tmp[:-2]
            tmp += "\n)"
            return tmp
        else:
            # ValueException is unknown, I switched it to ValueError
            raise SQLGeneratorException("Unknown type: %s" % rawType)

    def getCreateTableQuery(self):
        sqlStatement = self.recurse(self.struct)
        return sqlStatement


if __name__ == '__main__':
    name = "foobarType"
    schema = rawListType(rawRecordType(OrderedDict([('field1', rawIntType()), ('field2', rawStringType())])))
    obj = SQLGenerator("test_table",schema)
    print obj.getCreateTableQuery()
