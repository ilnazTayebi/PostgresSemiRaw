from inferrer.raw_types import *
from collections import OrderedDict
import xml.dom.minidom
import re
from mip_cde import mipCde


class SQLGeneratorException(Exception):
    def __init__(self, msg):
        super(SQLGeneratorException, self).__init__("could not create SQL statement.\n\t\t\t\t\t%s" % msg)

# Class SQLGenerator
# Holds a table name and a file structure
# Provides a function to build an SQL statement to create the corresponding table in a database
class SQLGenerator():
    def __init__(self, name, structure, path):
        self.file_path = path
        self.table_name = name
        self.struct = structure
        self.existingTableQuery = ""
        #self.db_forbidden_char = re.compile('[^a-zA-Z0-9_]+')

    def recurse(self,rawType):
        if isinstance(rawType, rawIntType):
            return "integer"
        elif isinstance(rawType, rawStringType):
            return "text"
        elif isinstance(rawType, rawFloatType):
            return "real"
        elif isinstance(rawType, rawBooleanType):
            return "boolean"
        elif isinstance(rawType, rawSomeType): # column was entirely null -> set text type
            return "text"
        elif isinstance(rawType, rawListType):
        # check the list contains a rawRecordType, which is the only allowed structure
            if isinstance(rawType.desc, rawRecordType):
                return self.recurse(rawType.desc)
            else:
                raise SQLGeneratorException("Unsupported rawListType structure:" % rawType)
        elif isinstance(rawType, rawRecordType):
            tmp = ""
            for (k, v) in rawType.desc.items():

                not_null_tag = ' NOT NULL' # Not null by default
                if isinstance(v, rawOptionType): # Remove not null tag if nulls were detected (hence use of rawOptionType)
                    not_null_tag = ''
                    v = v.desc

                if not((not_null_tag=='' and isinstance(v, rawSomeType)) or isinstance(v, rawIntType) or isinstance(v, rawStringType) or isinstance(v, rawFloatType) or isinstance(v, rawBooleanType)):
                    raise SQLGeneratorException("Unsupported rawRecordType structure: %s" % v)

                tmp+="\t\"%s\" %s,\n"%(k, self.recurse(v))
                #tmp += not_null_tag # Do not write the not null tag for now: only the first 250000 bytes of the file have been parsed

            tmp = tmp[:-2] # remove last ",\n"
            #if(tmp == self.existingTableQuery ): return ''
            #else:
            tmp += "\n);"
            tmp = self.getDropTableQuery() + "CREATE TABLE %s ( \n"%(self.table_name) + tmp
            #tmp += " COPY %s FROM \'%s\' CSV HEADER;"%(self.table_name, self.file_path)
            return tmp
        else:
            # ValueException is unknown, I switched it to ValueError
            raise SQLGeneratorException("Unknown type: %s" % rawType)

    def getCreateTableQuery(self):
        sqlStatement = self.recurse(self.struct)
        return sqlStatement

    def getExistingTableColumnsQuery(self):
        sqlStatement = "SELECT column_name,data_type FROM information_schema.columns WHERE table_name = \'%s\' ORDER BY ordinal_position; "%(self.table_name)
        return sqlStatement

    def getExistingTableCreateCode(self,columns_info):
        tmp=''
        for c in range(0,len(columns_info)):
            if (columns_info[c][1]==None): tmp += "\tNULL::%s,\n"%columns_info[c][1]
            else: tmp+="\t\"%s\" %s,\n"%(columns_info[c][0],columns_info[c][1])
        tmp = tmp[:-2]
        self.existingTableQuery = tmp
        return

    def getDropTableQuery(self):
        sqlStatement= "DROP TABLE IF EXISTS %s CASCADE; "%(self.table_name)
        return sqlStatement

    def getDropViewsQuery(self):
        sqlStatement= "DROP VIEW IF EXISTS mip_local_features; DROP VIEW IF EXISTS mip_federation_features; "
        return sqlStatement

    def getExistingTablesQuery(self,allTables):
        sqlStatement= "SELECT tablename FROM pg_tables WHERE tablename IN (\'" + "\',\'".join(allTables) + "\');"
        return sqlStatement

    def getTablesColumnsQuery(self, existingTables):
        if (len(existingTables)<1): return ""
        sqlStatement = "SELECT * FROM \n"
        i = 0
        for table in existingTables:
            tblName = "\'%s\'"%table
            sqlStatement += "(SELECT column_name,"
            # sqlStatement += "CASE WHEN data_type=\'character\' THEN \'char(\'||character_maximum_length||\')\' "
            # sqlStatement += "WHEN data_type=\'character varying\' AND character_maximum_length IS NOT NULL THEN \'varchar(\'||character_maximum_length||\')\' "
            # sqlStatement += "WHEN data_type=\'numeric\' AND numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN \'numeric(\'||numeric_precision||\',\'||numeric_scale||\')\' "
            sqlStatement += "CASE WHEN data_type=\'character\' THEN \'text\' "
            sqlStatement += "WHEN column_name=\'subjectcode\' THEN \'text\' "
            sqlStatement += "WHEN data_type=\'character varying\' THEN \'text\' "
            sqlStatement += "WHEN data_type=\'numeric\' AND numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN \'numeric(\'||numeric_precision||\',\'||numeric_scale||\')\' "
            sqlStatement += "ELSE data_type END AS data_type_%i FROM information_schema.columns WHERE table_name = %s) AS table_%i "%(i,tblName,i)
            sqlStatement += "NATURAL FULL JOIN \n"
            i += 1

        sqlStatement = sqlStatement[:-19]
        sqlStatement += ";"
        return sqlStatement

    def getTablesCdeColumnsQuery(self, existingTables):
        if (len(existingTables)<1): return ""
        sqlStatement = "SELECT * FROM \n"
        sqlStatement += "(SELECT unnest(array["+mipCde+"]) AS column_name) as columns "
        sqlStatement += "NATURAL LEFT JOIN \n "
        i = 0
        for table in existingTables:
            tblName = "\'%s\'"%table
            sqlStatement += "(SELECT column_name,"
            # sqlStatement += "CASE WHEN data_type=\'character\' THEN \'char(\'||character_maximum_length||\')\' "
            # sqlStatement += "WHEN data_type=\'character varying\' AND character_maximum_length IS NOT NULL THEN \'varchar(\'||character_maximum_length||\')\' "
            # sqlStatement += "WHEN data_type=\'numeric\' AND numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN \'numeric(\'||numeric_precision||\',\'||numeric_scale||\')\' "
            sqlStatement += "CASE WHEN data_type=\'character\' THEN \'text\' "
            sqlStatement += "WHEN column_name=\'subjectcode\' THEN \'text\' "
            sqlStatement += "WHEN data_type=\'character varying\' THEN \'text\' "
            sqlStatement += "WHEN data_type=\'numeric\' AND numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN \'numeric(\'||numeric_precision||\',\'||numeric_scale||\')\' "
            sqlStatement += "ELSE data_type END AS data_type_%i FROM information_schema.columns WHERE table_name = %s) AS table_%i \n "%(i,tblName,i)
            sqlStatement += "NATURAL FULL JOIN \n"
            i += 1

        sqlStatement = sqlStatement[:-22]
        sqlStatement += ";"
        return sqlStatement


    def getMostGeneralType(self,type1,type2):
        # the column types come from getTablesCdeColumnsQuery, so based on tests,
        # they should be limited to boolean, integer, real, double precision, numeric and text

        # if one of the fields is text, return text
        if (type1=="text" or type2=="text"):
            return "text"
        # if one of the fields is numeric and the other is a numeric type, return numeric
        if ((type1=="numeric" and type2 in ["numeric","double precision","real","integer","boolean"]) or (type2=="numeric" and type1 in ["double precision","real","integer","boolean"] )):
            return "numeric"
        # if one of the fields is double precision and the other is the same or a more limited numeric type, return double precision
        if ((type1=="double precision" and type2 in ["double precision","real","integer","boolean"]) or (type2=="double precision" and type1 in ["real","integer","boolean"] )):
            return "double precision"
        # if both fields are real, return real
        if (type1=="real" and type2=="real"):
            return "real"
        # if both fields are integer, return integer
        if (type1=="integer" and type2=="integer"):
            return "integer"
        # in other cases where both fields have numeric types, return numeric
        if (type1 in ["numeric","double precision","real","integer","boolean"] and type2 in ["numeric","double precision","real","integer","boolean"]):
            return "numeric"
        # if both fields are boolean, return boolean
        if (type1=="boolean" and type2=="boolean"):
            return "boolean"
        # in all other cases, return text
        return "text"


    def getCreateMipLocalFeaturesViewQuery(self,tables,columns_info):
        columns_type = [] # Final type for each column, will be used for cast
        n_tables = len(tables)
        for c in columns_info:
            coltyp = None
            for t in range(1,len(c)):
                if (c[t]!=None):
                    if (coltyp==None):
                        coltyp = c[t];
                    else:
                        coltyp = self.getMostGeneralType(coltyp,c[t]);
                    #coltyp = c[t];
                    #break;
            columns_type.append(coltyp)

        sqlStatement = 'CREATE VIEW mip_local_features AS\n'

        for t in range(1,n_tables+1):
            tmp="  SELECT \n"
            for c in range(0,len(columns_type)):
                if (columns_info[c][t]==None): tmp += "\tNULL::%s AS \"%s\",\n"%(columns_type[c],columns_info[c][0])
                else: tmp += "\t\"%s\"::%s,\n"%(columns_info[c][0],columns_type[c])
            tmp = tmp[:-2]
            tmp += "\n  FROM %s"%tables[t-1]
            sqlStatement += tmp
            sqlStatement += "\nUNION\n"

        sqlStatement = sqlStatement[:-7]
        sqlStatement += ";\n"

        return sqlStatement


# TODO(?) mip_federation_features definition as a flat view with fixed columns
#     def getCreateMipFederationFeaturesViewQuery(self,tables,columns_info):
#         columns_type = [] # Final type for each column, will be used for cast
#         n_tables = len(tables)
#         for c in columns_info:
#             coltyp = None
#             for t in range(1,len(c)):
#                 if (c[t]!=None):
#                     coltyp = c[t];
#                     break;
#             columns_type.append(coltyp)
#
#         sqlStatement = 'CREATE VIEW mip_federation_features AS SELECT * FROM (\n'
#
#         for t in range(1,n_tables+1):
#             tmp = "  SELECT \n    subjectcode AS rid,\n    unnest(array["
#             for c in range(0,len(columns_type)):
#                 if (columns_info[c][t]!=None): tmp += "\'%s\',"%(columns_info[c][0])
#             tmp = tmp[:-1]
#             tmp += "]) as colname,\n    unnest(array["
#             for c in range(0,len(columns_type)):
#                 if (columns_info[c][t]!=None): tmp += "\"%s\"::text,"%(columns_info[c][0])
#             tmp = tmp[:-1]
#             tmp += "]) as val FROM %s"%tables[t-1]
#             sqlStatement += tmp
#             sqlStatement += "\nUNION\n"
#
#         sqlStatement = sqlStatement[:-7]
#         sqlStatement += ") AS foo;\n"
#         #sqlStatement += ") AS foo WHERE val IS NOT NULL;\n"
#
#         return sqlStatement


# mip_federation_features definition as a 3-column view (without NULL commented)
    def getCreateMipFederationFeaturesViewQuery(self,tables,columns_info):
        columns_type = [] # Final type for each column, will be used for cast
        n_tables = len(tables)
        for c in columns_info:
            coltyp = None
            for t in range(1,len(c)):
                if (c[t]!=None):
                    coltyp = c[t];
                    break;
            columns_type.append(coltyp)

        sqlStatement = 'CREATE VIEW mip_federation_features AS SELECT foo.rid,foo.colname,foo.val FROM (\n'

        for t in range(1,n_tables+1):
            tmp = "  SELECT \n    subjectcode::text AS rid,\n    unnest(array["
            for c in range(0,len(columns_type)):
                tmp += "\'%s\',"%(columns_info[c][0])
                #if (columns_info[c][t]!=None): tmp += "\'%s\',"%(columns_info[c][0])
            tmp = tmp[:-1]
            tmp += "]) as colname,\n    unnest(array["
            for c in range(0,len(columns_type)):
                if (columns_info[c][t]!=None): tmp += "\"%s\"::text,"%(columns_info[c][0])
                else: tmp += "NULL::text,"
            tmp = tmp[:-1]
            tmp += "]) as val FROM %s"%tables[t-1]
            sqlStatement += tmp
            sqlStatement += "\nUNION\n"

        sqlStatement = sqlStatement[:-7]
        sqlStatement += ") AS foo;\n"
        #sqlStatement += ") AS foo WHERE val IS NOT NULL;\n"

        return sqlStatement


if __name__ == '__main__':
    name = "foobarType"
    schema = rawListType(rawRecordType(OrderedDict([('field1', rawIntType()), ('field2', rawStringType())])))
    obj = SQLGenerator("test_table",schema)
    print obj.getCreateTableQuery()
