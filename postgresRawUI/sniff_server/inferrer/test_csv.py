from StringIO import StringIO

import csv_inferrer
from raw_types import *
from common import sample_lines

def test_csv():
    i = csv_inferrer.CSVInferrer( "a,b\n1,2\n")
    tipe, properties = i.infer_type()
    print properties
    print tipe
    assert(isinstance(tipe, rawListType))
    assert(isinstance(tipe.desc, rawRecordType))
    assert(tipe.desc.desc.keys() == ['a', 'b'])
    assert(isinstance(tipe.desc.desc['a'], rawIntType))
    assert(isinstance(tipe.desc.desc['b'], rawIntType))
    #assert(properties['field_names'] == ['a', 'b'])
    assert(properties['has_header'] == True)

def test_csv_sample():
    s = """ a, b, c 
        1, 2, 3
        4, 5, 6
        7, 8, 9"""
    f = StringIO(s)
    sample = sample_lines(f, 2)
    print "sample", sample
    assert sample == """ a, b, c 
        1, 2, 3
"""

def test_csv_options():
    s = """a, b;c ,d
        1, 2; 3, 4"""
    i = csv_inferrer.CSVInferrer( s, {'delimiter' : ';'})
    tipe, properties = i.infer_type()
    assert properties['delimiter'] == ';'
    assert(isinstance(tipe, rawListType)) 
    assert(isinstance(tipe.desc, rawRecordType))
    assert( tipe.desc.desc.keys() == ['a, b', 'c ,d'] )

    s = """1#2#3\n4#5#6"""
    i = csv_inferrer.CSVInferrer( s, { 'header': ['a','b','c'], 'delimiter' : '#'})
    tipe, properties = i.infer_type()
    print properties
    assert(tipe.desc.desc.keys() == ['a', 'b', 'c'])
    print tipe
    for k in tipe.desc.desc:
        assert(isinstance(tipe.desc.desc[k], rawIntType))

def test_csv_nulls():
    s = "a,b,c\n" + \
        "1,2,3\n" + \
        "4,,6\n"
    i = csv_inferrer.CSVInferrer(s, {'nulls': ''})
    tipe, properties = i.infer_type()
    
    print 'properties', properties
    print 'type',tipe
    assert(str(tipe) == 'list(rec(a:int, b:option(int), c:int))')
    assert(properties['has_header'] == True)

