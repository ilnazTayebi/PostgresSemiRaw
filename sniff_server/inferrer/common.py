
class InferrerException(Exception):
    def __init__(self, msg):
        super(InferrerException, self).__init__("[Inferrer] %s" % msg)


class ParseException(InferrerException):
    def __init__(self):
        super(ParseException, self).__init__("Could not parse file")


class TypeInferenceException(InferrerException):
    def __init__(self, msg):
        super(TypeInferenceException, self).__init__("Could not infer type: %s" % msg)

# This function is currently not used
#def check_types(rawType):
#     """ Check if all t# ypes are defined """
#     if isinstance(rawType, rawIntType) \
#         or isinstance(rawType, rawStringType) \
#         or isinstance(rawType, rawFloatType) \
#         or isinstance(rawType, rawBooleanType):
#         return True
#     elif isinstance(rawType, rawListType):
#         return check_types(rawType.desc)
#     elif isinstance(rawType, rawRecordType):
#         for (k, v) in rawType.desc.items():
#             check_types(v)
#     else:
#         # ValueException is unknown, I switched it to ValueError
#         raise ValueError("Unknown type: %s" % rawType)

def sample_lines(f, n_lines = 100):
    """Returns n_lines from an csv file"""
    s = ""
    for n in range(n_lines):
        s += f.readline()
    return s
