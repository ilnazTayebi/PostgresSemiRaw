import json_inferrer
from raw_types import *

def test_json():
    i = json_inferrer.JSONInferrer( """[{"a": 1, "b": [1,2,3]}, {"a": 2, "b": [4,5,6]}]""")
    tipe, options = i.infer_type()
    print "type %s" % tipe.desc
    assert(isinstance(tipe, rawListType))
    assert(isinstance(tipe.desc, rawRecordType))


def test_option():
    i = json_inferrer.JSONInferrer( """[ {"a": 2, "b": [4,5,6]}, null]""")
    tipe, options = i.infer_type()
    print "type %s" % tipe
    assert(isinstance(tipe, rawListType))
    assert(isinstance(tipe.desc, rawOptionType))
    assert(isinstance(tipe.desc.desc, rawRecordType))

    i = json_inferrer.JSONInferrer( """[ 1, null, "Hello world"]""")
    tipe, options = i.infer_type()
    print "type %s" % tipe
    assert(isinstance(tipe, rawListType))
    assert(isinstance(tipe.desc, rawOptionType))
    assert(isinstance(tipe.desc.desc, rawStringType))
    
def test_options():
    pass

