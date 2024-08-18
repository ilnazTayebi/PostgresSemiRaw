_uniqueId = 0

class rawType(object):
    def __cmp__(self, other):
        if isinstance(other, self.__class__):
            return 0
        else:
            return -1

    def compatible_with(self, other):
        if isinstance(other, rawOptionType):
            return self.compatible_with(other.desc)
        if isinstance(other, self.__class__) or isinstance(self, rawSomeType) \
                or isinstance(other, rawSomeType):
            return True
        if isinstance(self, rawStringType) and not (isinstance(other, rawListType) or isinstance(other, rawRecordType)):
            return True
        if isinstance(other, rawStringType) and not (isinstance(self, rawListType) or isinstance(self, rawRecordType)):
            return True
        return False
        
    def max_of(self, other):
        if isinstance(other, self.__class__):
            return self
        if isinstance(self, rawSomeType):
           return other
        if isinstance(other, rawSomeType):
            return self
        if isinstance(other, rawOptionType):
            r = self.max_of(other.desc)
            # is option(rawUnknownType) allowed ?
            if isinstance(r, rawUnknownType):
                return r
            else:
                return rawOptionType(r)
        if isinstance(self, rawStringType) and \
                not (isinstance(other, rawListType) or isinstance(other, rawRecordType)):
            return self
        if isinstance(other, rawStringType) and \
                not (isinstance(other, rawListType) or isinstance(other, rawRecordType)):
            return other
        return rawUnknownType()

class rawSomeType(rawType):
    def __str__(self):
        return "*"

    def compatible_with(self, other):
        return True

class rawUnknownType(rawType):
    def __str__(self):
        return "<???>"

    def compatible_with(self, other):
        return False

class rawOptionType(rawType):
    """Option types for nullable types"""
    def __str__(self):
        return "option(%s)" % self.desc

    def __init__(self, desc=rawUnknownType):
       self.desc = desc

    def max_of(self, other):
        if isinstance(other, rawSomeType):
            return self
        # in the case of optionTypes we are not calling the base class max
        if isinstance(other, rawOptionType):
            # unwraps the other to not have an option(option()) 
            r =  self.desc.max_of( other.desc )
        else:
            r =  self.desc.max_of( other )
        # is option(unknownType) allowed?
        return r if isinstance(r, rawUnknownType) else rawOptionType(r)

    def compatible_with(self, other):
        if isinstance(other, rawOptionType):
            return  self.desc.compatible_with( other.desc )
        else:
            return self.desc.compatible_with( other)

    def __cmp__(self, other):
        if not isinstance(other, self.__class__):
            return 1
        if not isinstance( other.desc, self.desc.__class__ ):
            return 1
        return 0

class rawIntType(rawType):
    def __str__(self):
        return "int"

    def compatible_with(self, other):
        r = super(rawIntType, self).compatible_with(other)
        if not r and isinstance(other, rawFloatType):
            return True
        return r

    def max_of(self, other):
        r = super(rawIntType, self).max_of(other)
        if r == rawUnknownType():
           if isinstance(other, rawFloatType):
               return rawFloatType()
        return r

class rawFloatType(rawType):
    def __str__(self):
        return "float"

    def compatible_with(self, other):
        r = super(rawFloatType, self).compatible_with(other)
        if not r and isinstance(other, rawIntType):
            return True
        return r

    def max_of(self, other):
        r = super(rawFloatType, self).max_of(other)
        if r == rawUnknownType():
           if isinstance(other, rawIntType):
               return rawFloatType()
        return r

class rawBooleanType(rawType):
    def __str__(self):
        return "bool"

class rawStringType(rawType):
    def __str__(self):
        return "string"

class rawRecordType(rawType):
    def __str__(self):
        return "rec(" + ", ".join("%s:%s" % x for x in self.desc.items()) + ")"

    def __init__(self, desc):
        global _uniqueId
        _uniqueId += 1
        self.desc = desc

    def compatible_with(self, other):
        if not super(rawRecordType, self).compatible_with(other):
            return False
        # Records are compatible even if they have different keys
        #if set(other.desc.keys()) != set(self.desc.keys()):
        #    return False
        if isinstance(other, rawSomeType):
           return True
        if isinstance(other, rawOptionType):
            return self.compatible_with( other.desc)

        # here other ia RecordType
        for key in other.desc.keys():
            if key not in self.desc:
                continue
            if not self.desc[key].compatible_with(other.desc[key]):
                return False
        return True

    def __cmp__(self, other):
        if not isinstance(other, self.__class__):
            return 1
        if set(other.desc.keys()) != set(self.desc.keys()):
            return 1
        for key in other.desc.keys():
            if not (self.desc[key] == other.desc[key]):
                return 1
        return 0

    def max_of(self, other):
        if not self.compatible_with(other):
            return rawUnknownType()
        if isinstance(other, rawSomeType):
            return self
        if isinstance(other, rawOptionType):
            return rawOptionType ( self.max_of( other.desc ))

        newDict = self.desc.copy()
        for key, tipe in other.desc.items():
            if key not in self.desc:
                newDict[key] = tipe
            else:
                newDict[key] = tipe.max_of(self.desc[key])

        if isinstance(other, rawOptionType):
            return rawOptionType(rawRecordType(newDict))
        else:
            return rawRecordType(newDict)

class rawListType(rawType):
    def __str__(self):
        return "list(%s)" % self.desc

    def __init__(self, desc=rawUnknownType):
        self.desc = desc

    def max_of(self, other):
        if not self.compatible_with(other):
            return rawUnknownType()
        if isinstance(other, rawOptionType):
            return rawOptionType(rawListType(self.desc.max_of(other.desc.desc)))
        if isinstance(other, rawListType):
            return rawListType(self.desc.max_of(other.desc))
        if isinstance(other, rawSomeType):
            return self

        return rawUnknownType()

    def compatible_with(self, other):
        if isinstance(other, rawSomeType):
            return True
        elif isinstance(other, self.__class__):
            return self.desc.compatible_with(other.desc)
        elif isinstance(other, rawOptionType) and isinstance(other.desc, self.__class__):
            return self.desc.compatible_with(other.desc.desc)
        else:
            return False

    def __cmp__(self, other):
        if not isinstance(other, self.__class__):
            return 1
        if not (self.desc == other.desc):
            return 1
        return 0

