import random
import json
import random
import uuid

from cStringIO import StringIO
from json_inferrer import json_sample


counter = 0
def createJsonObj():
    # creates json obj string with weird formatting
    r_str = str(uuid.uuid4()) 
    r_int = random.randrange(100000)
    global counter
    s =  """ {
        "n" : %d,
        "r_int" : %d,
        "r_str" : "%s { \\" ",
        "nested" : {
            "r_float" : %0.2f,
            "r_str" : "%s" 
            }
        }
    """ % (counter , r_int, r_str, r_int/1000.0, r_str)
    counter += 1
    return s 

def test_json_sample_simple_array():
    # case array of atomic types
    a1 = [1,2,3,5,6]
    f =  StringIO(json.dumps(a1)) 
    a2 = json.loads(json_sample(f, 2))
    # in this case it will have to get the full array
    print "a2", a2
    assert a2 == [1,2]
    
    a1=[ [1],[2],[3],[5],[6] ]
    f = StringIO(json.dumps(a1))
    a2 = json.loads(json_sample(f, 2))
    assert a2 == [[1],[2]]

def test_json_sample():
    random.seed()
    n_objs= 1000
    # creates a temp file with n_objs

    #adds some white space before just to be sure
    s = '      \n \n              [\n'
    objs =[]
    for n in range(n_objs):
        o  = createJsonObj()
        objs.append(json.loads(o))
        s += o
        if n < n_objs -1:
            s +=','
    s +='\n]'

    n_sample = 100
    f = StringIO(s)
    s_objs = json.loads(json_sample(f, n_sample))
    assert ( len(s_objs) == n_sample )
    for n in range(n_sample):
        for s in objs[n]:
            assert (objs[n][s] == s_objs[n][s])

def test_sample_nulls():
    s = """ 
        [
            null,
            {"a" : [ 1.1, 1.2, 1.3] , "b" : 1},
            {"a" : [ null, 1.5, 1.6] , "b" : null},
            null,
            {"a" : [ 1.7, 1.8, 1.9] , "b" : 2},
            null
        ] """
    
    f = StringIO(s)
    objs = json.loads(json_sample(f, 4, file_format="json"))
    assert len(objs) == 4
    assert objs[0] is None
    assert objs[2]['b'] is None
    assert objs[2]['a'][0] is None

def test_json_obj():
    s = createJsonObj()
    f=StringIO(s)
    obj = json.loads(json_sample(f, 1, file_format="json"))
    assert obj == json.loads(s)

def test_hjson_sample():
    random.seed()
    n_objs= 1000
    # creates a StringIO with n_objs
    s = ""
    objs =[]
    for n in range(n_objs):
        o  = createJsonObj()
        objs.append(json.loads(o))
        s += o

    n_sample = 100
    f=StringIO(s)
    s_objs = json.loads(json_sample(f, n_sample, file_format="hjson"))
    assert ( len(s_objs) == n_sample )
    for n in range(n_sample):
        for s in objs[n]:
            assert (objs[n][s] == s_objs[n][s])

def test_hjson_sample2():
    s = """ 
        [1, 2, 3]
        [3, 2, 1]
        [64, 128, 256]
    """    
    f=StringIO(s)
    out = json_sample(f, 4, file_format="hjson")

    print "sample" , out
    objs = json.loads(out)
    assert len(objs) == 3
    assert objs == [[1,2,3],
                    [3,2,1],
                    [64,128, 256]]
    s = """ 
         ["1" ]
         ["1", "2"]
         ["64", "128", "256"]
    """    
    f=StringIO(s)
    out = json_sample(f, 4, file_format="hjson")
    print "sample" , out
    objs = json.loads(out)
    assert objs == [["1" ],
                    ["1", "2"],
                    ["64", "128", "256"]]

    s = """
         [
          {"a":1}
         ] 
         +
         [
          {"a":2}
         ]
         [
          {"a":3}
         ]
    """
    f=StringIO(s)
    out = json_sample(f, 4, file_format="hjson")
    print "sample" , out
    objs = json.loads(out)
    assert objs == [[{"a":1} ],
                    [{"a":2}],
                    [{"a":3} ]]

def test_hjson_sample_array():
    # case array of atomic types
    a1 = [1,2,3,5,6]
    s = ""
    for n in range(10):
        s += "%s\n" % json.dumps(a1)
    print "str:"
    print s
    f=StringIO(s)
    a2 = json.loads(json_sample(f, 2, file_format="hjson"))
    # in this case it will have to get the full array
    print a2
    assert a2 == [a1,a1]
    
    a1=[ [1],[2],[3],[5],[6] ]
    # case array of arrays   
    s =""
    for n in range(10):
        s += json.dumps(a1)
    f=StringIO(s)
    a2 = json.loads(json_sample(f, 2, file_format="hjson"))
    assert a2 == [a1,a1]


