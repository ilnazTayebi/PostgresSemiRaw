import logging
import types
import json

from .common import *
from raw_types import *
from json_inferrer import JSONInferrer
from csv_inferrer import CSVInferrer


def assert_max(t1,t2, expected):
    # cleans the expected type, anything with unknown is unknown
    if '<???>' in str(expected):
        expected = rawUnknownType()
    print "max %s, %s = %s" % (t1, t2, t1.max_of(t2))
    if str(t1.max_of(t2)) != str(expected):
        raise Exception ("max %s, %s: expected %s got %s" %(t1, t2, expected, t1.max_of(t2)))
    print "max %s, %s = %s" % (t2, t1, t2.max_of(t1))
    if str(t2.max_of(t1)) != str(expected):
        raise Exception ("max %s, %s: expected %s got %s" %(t2, t1, expected, t2.max_of(t1)))

    
def assert_compatible(t1,t2, expected):  
    print  "%s compatible with %s = %s" % (t1, t2, t1.compatible_with(t2))
    if t1.compatible_with(t2) != expected:
        raise Exception ("%s compatible with %s:  expected %s got %s" %(t1, t2, expected, t1.compatible_with(t2)))
    print  "%s compatible with %s = %s" % (t2, t1, t2.compatible_with(t1))
    if t2.compatible_with(t1) != expected:
        raise Exception ("%s compatible with %s:  expected %s got %s" %(t2, t1, expected, t2.compatible_with(t1)))

# types that are going to be tested in a combinatory way
tipes = [rawIntType(), 
        rawFloatType(), 
        rawStringType(), 
        rawRecordType(dict(a=rawIntType(),b=rawStringType()))]

# adds one listType for each basic type
tipes.extend( [rawListType(t) for t in tipes])

def test_option_max():
    """ test all the option max_of """
    for t1 in tipes :
        o1= rawOptionType(t1)
        assert_max(t1, rawSomeType(), t1)
        assert_max(o1, rawSomeType(), o1)
        for t2 in tipes:
            o2 = rawOptionType(t2)
            assert_max(o1,t2, rawOptionType( t1.max_of(t2)))
            assert_max(o1,o2, rawOptionType( t1.max_of(t2)))
    

def test_option_compatible():
    """ Test all the option compatible with """
    for t1 in tipes :
        o1= rawOptionType(t1) 
        assert_compatible(o1, rawSomeType(), True)
        for t2 in tipes:
            o2 = rawOptionType(t2)
            assert_compatible(o1, t2, t1.compatible_with(t2))
            assert_compatible(o1, o2, t1.compatible_with(t2))

def test_string():
    """ Basic tests for string types """
    t1 = rawStringType()
    tipes = [rawIntType(), rawFloatType(), rawStringType()]
    for t2 in tipes:
        assert_compatible(t1, t2, True)
        assert_max(t1, t2, rawStringType())

def test_int():
    """ Basic tests for int types """
    t1 = rawIntType()
    assert_max(t1, rawIntType(), rawIntType())
    assert_compatible(t1, rawIntType(), True)
    assert_max(t1, rawFloatType(), rawFloatType())  
    assert_compatible(t1, rawFloatType(), True)
    assert_max(t1, rawStringType(), rawStringType())  
    assert_compatible(t1, rawStringType(), True)

def test_float():
    """ Basic tests for float types """
    t1 = rawFloatType()
    assert_max(t1, rawIntType(), rawFloatType())
    assert_compatible(t1, rawIntType(), True)
    assert_max(t1, rawFloatType(), rawFloatType())  
    assert_compatible(t1, rawFloatType(), True)
    assert_max(t1, rawStringType(), rawStringType())  
    assert_compatible(t1, rawStringType(), True)


def test_composed_types():
    """ Will test list and record types """
    tipes = [rawIntType(),rawFloatType(), rawStringType()]
    for t1 in tipes:
        for t2 in [rawRecordType(dict(a=t1)), rawListType(t1)]:
            assert_compatible(t1, t2, False)
            assert_max(t1, t2, rawUnknownType())

    for t1 in tipes:
        for t2 in tipes:
            assert_compatible( rawListType(t1), rawListType(t2), t1.compatible_with(t2))
            assert_max( rawListType(t1), rawListType(t2), rawListType(t1.max_of(t2)) )

            assert_compatible( rawRecordType(dict(a=t1)), rawRecordType(dict(a=t2)), t1.compatible_with(t2))
            assert_max( rawRecordType(dict(a=t1)), rawRecordType(dict(a=t2)), rawRecordType(dict(a=t1.max_of(t2))))

            assert_compatible( rawRecordType(dict(a=t1)), rawListType(t2), False )
            assert_max( rawRecordType(dict(a=t1)), rawListType(t2), rawUnknownType() )


    


