import logging
import types
import json
from collections import OrderedDict
import tokenize
from .common import *
from raw_types import *


class JSONInferrer(object):
    def __init__(self, content , options={}):
        self._json = json.loads(content, object_pairs_hook=OrderedDict)
        self._options = options

    def infer_type(self):
        return (self.__infer_type(self._json), self._options)

    def __infer_type(self, j):
        if j is None:
            return rawOptionType(rawSomeType())
        if isinstance(j, types.BooleanType):
            # Boolean must be checked first, as types.BooleanType is also of types.IntType
            return rawBooleanType()
        if isinstance(j, types.IntType):
            return rawIntType()
        if isinstance(j, types.FloatType):
            return rawFloatType()
        if isinstance(j, types.StringType) or isinstance(j, unicode):
            return rawStringType()
        if isinstance(j, OrderedDict):
            inner_type = OrderedDict((k, self.__infer_type(j[k])) for k in j)
            return rawRecordType(inner_type)
        if isinstance(j, types.ListType):
            # With optionTypes we cannot start with someType
            #Check if SomeType for empty arrays is correct
            if len(j) > 0:
                inner_type = self.__infer_type(j[0])
            else:
                inner_type=rawSomeType()
            for item in j:
                t = self.__infer_type(item)
                if inner_type.compatible_with(t):
                    inner_type = inner_type.max_of(t)
                else:
                    logging.error("%s incompatible with %s" % (inner_type, t))
                    raise TypeInferenceException(j)
            return rawListType(inner_type)

        raise TypeInferenceException(json.dumps(j, indent=4))


def json_gen( tokens, f , first=None):
    """Generator of json objects"""
    # check if it is ok to have nested functions
    def get_block(tokens, start, end):
        """"Fetches the full string until the end of the block"""
        level = 1
        out = start
        while level > 0:
            try:
                t = tokens.next()
                out +=  t[1]
                if t[1] == start:
                    level +=1
                elif t[1] == end:
                    level -=1
            # This might happen if I get to the end of the cursor (in case of urls only)
            except tokenize.TokenError as e:
                logging.error("%s::%s" % (type(e),e ));
                #HACK: this will throw a StopIteration if eof
                # but at least we are sure if we are at the end of the file or not
                s = f.read(1)
                if s:
                    raise e
                else:
                    raise StopIteration ("reached EOF")
        return out

    def get_next(t, tokens):
        """Gets the next complete object"""
        if t is None:
            # check if this really only happens if there is white space at the end
            raise StopIteration
        elif t[1] == "{":
            return get_block(tokens, "{", "}")
        elif t[1] == "[":
            return get_block(tokens, "[", "]")
        elif t[0] is tokenize.NUMBER or \
                t[0] is tokenize.STRING or \
                t[0] is tokenize.NAME:
            return t[1]
        else:
            return get_next( get_first(tokens,f ), tokens)
            
    if first:
        yield get_next(first, tokens)
    for t in tokens:
        yield get_next(t, tokens)           
                
def get_first(tokens, f):
    try:
        for t in tokens:
            if t[1] == "{" or \
                    t[1] == "[" or \
                    t[0] is tokenize.NUMBER or \
                    t[0] is tokenize.STRING or \
                    t[0] is tokenize.NAME:
                return t
    # This might happen if I get to the end of the cursor (in case of urls only)
    except tokenize.TokenError as e:
        logging.error("%s::%s" % (type(e),e ));
        #HACK: this will throw a StopIteration if eof
        # but at least we are sure if we are at the end of the file or not
        s = f.read(1)
        if s:
            raise e
        else:
            raise StopIteration ("reached EOF")

def json_sample(f, n_objs = 10, file_format="json"):
    """ Tries to get n_objs objects from a json or an hjson file
        Returns json string with sample (array of objects)"""
    tokens = tokenize.generate_tokens(f.next)
    #gets first token to check if it is an array or not
    first = get_first(tokens, f)
    if file_format == "json" and first[1] == "[":
        # skips the first "[" token
        logging.debug( "skipping first element")
        gen = json_gen(tokens, f ,first=None)
    else :
        gen = json_gen(tokens, f ,  first=first)
                            
    objs = []
    for n in range(n_objs):
        try:
            sample = next(gen)
            objs.append(sample)
        except StopIteration:
            if n < 1:
                raise ValueError("Empty json Array or could not parse objects")
            break

    if file_format=="json" and first[1] != "[":
        return"\n".join(objs) 
    #any other case transforms this in an array of objs so that the inferrer can get it
    else:
       return "[\n%s\n]" % "\n,".join(objs) 

