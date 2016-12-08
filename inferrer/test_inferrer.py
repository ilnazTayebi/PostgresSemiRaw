from nose.tools import raises
import uuid
import boto
import tempfile
import io
import inferrer

def test_s3():
    url = "s3://rawlabs-data/students.csv" 
    schema, properties = inferrer.from_url(url, "csv",500)
    print "schema students" , '%s' % schema
    assert str(schema) == 'list(rec(Name:string, year:int, office:string, department:string))'
    # check just that it will not throw the TokenError-> EOF
    url = "s3://rawlabs-data/publications/publications.json" 
    schema, properties = inferrer.from_url(url, "json",1000)
    print "schema publications" , '%s' % schema
    assert str(schema) == 'list(rec(title:string, authors:list(string), affiliations:list(string), controlledterms:list(string)))'
    # tries an hjson file
    url = "s3://rawlabs-data/publications/publications.hjson" 
    schema, properties = inferrer.from_url(url, "hjson",1000)
    print "schema publications" , '%s' % schema
    assert str(schema) == 'list(rec(title:string, authors:list(string), affiliations:list(string), controlledterms:list(string)))'

def test_url():
    url = "https://s3-eu-west-1.amazonaws.com/rawlabs-data/students.csv"
    schema, properties = inferrer.from_url(url, "csv",500)
    print properties
    print schema
    assert str(schema) == 'list(rec(Name:string, year:int, office:string, department:string))'

def test_encoding_csv(): 
    encodings = ['UTF-16', 'ISO-8859-1', 'UTF-8']
    for e in encodings:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as f:
            f.write( "a,b\n1,2\n".encode( e) ) 
        schema, properties = inferrer.from_url(f.name, "csv", options={'encoding': e })    
        print schema, properties
        assert str(schema) == 'list(rec(a:int, b:int))'
        assert properties['encoding'] == e
    
def test_encoding_json():
    encodings = ['UTF-16', 'ISO-8859-1', 'UTF-8']
    for e in encodings:
        # json file in utf-16 and option encoding in higher case
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as f:
            f.write( '[{"a": 1, "b": 2}]'.encode( e ) )    
        schema, properties = inferrer.from_url(f.name, "json", options={'encoding': e })
        print schema, properties
        assert str(schema) == 'list(rec(a:int, b:int))'
        assert properties['encoding'] ==  e

# this test will have to raise an exception
@raises(UnicodeDecodeError)
def test_encoding_error():
    url = "s3://rawlabs-data/NASA_access_log_Aug95_small_utf16"
    schema, properties = inferrer.from_url(url, "text", options={'encoding':'UTF-8'})   
    
def test_basic():
    # default, not specifying the encoding
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as f:
        f.write( "a,b\n1,2\n")    
    schema, properties = inferrer.from_url(f.name, "csv")
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
    schema, properties = inferrer.from_url(f.name, "csv", n_bytes=101)
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
    schema, properties = inferrer.from_url(f.name, "csv", options={'nulls':'-'})
    print 'temp file %s' % f.name
    print schema, properties
    assert str(schema) == 'list(rec(a:int, b:option(int), c:string))'
    assert properties['nulls'] == '-'

def test_log_file():
    schema, properties = inferrer.from_url('inferrer/test_logs/axa/SE212-INT-CER-01-acl-logs.0', "text")
    print schema, properties
    assert str(schema) == 'list(rec(timestamp:string, message:string))'
    assert(properties["matched_name"] == "axa_syslogs")

