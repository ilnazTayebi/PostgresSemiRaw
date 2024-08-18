from nose.tools import raises
import uuid
import boto
import tempfile
import io
from . import inferrer


def test_encoding_csv(): 
    encodings = ['UTF-16', 'ISO-8859-1', 'UTF-8']
    for e in encodings:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as f:
            f.write( "a,b\n1,2\n".encode( e) ) 
        schema, properties = inferrer.get_structure_from_csv_file(f.name, options={'encoding': e })    
        print schema, properties
        assert str(schema) == 'list(rec(a:int, b:int))'
        assert properties['encoding'] == e
    
def test_basic():
    # default, not specifying the encoding
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as f:
        f.write( "a,b\n1,2\n")    
    schema, properties = inferrer.get_structure_from_csv_file(f.name)
    print schema, properties
    assert str(schema) == 'list(rec(a:int, b:int))'
    
# will test inferring csv file with not complete row at the end    
def test_csv_truncated():
    # default, not specifying the encoding
    encodings = ['UTF-16', 'ISO-8859-1', 'UTF-8']
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as f:
        f.write( "a,b,c\n")    
        for n in range(100):
            f.write("%d,%d,%d\n" % (n,n*2,n*n))
    schema, properties = inferrer.get_structure_from_csv_file(f.name, n_bytes=101)
    print 'temp file %s' % f.name
    print schema, properties
    assert str(schema) == 'list(rec(a:int, b:int, c:int))'

# will test inferring csv file with not complete row at the end    
def test_csv_null_options():
    s = "a,b,c\n" + \
        "1,2,\n" + \
        "3,-,6\n"
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as f:
        f.write(s)
    schema, properties = inferrer.get_structure_from_csv_file(f.name, options={'nulls':'-'})
    print 'temp file %s' % f.name
    print schema, properties
    assert str(schema) == 'list(rec(a:int, b:option(int), c:string))'
    assert properties['nulls'] == '-'
