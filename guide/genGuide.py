#!/usr/bin/env python
from argparse import ArgumentParser
import xml.dom.minidom
import logging
from difflib import SequenceMatcher
from json import dumps
from markdown import Markdown
from xml.dom.minidom import getDOMImplementation
import re

logging.basicConfig(level=logging.DEBUG)
md = Markdown()
matcher = SequenceMatcher()

def tokenize(x):
    reg = re.compile("""(\w+|\d*\.\d+|\d+|"[^"]*"|\s+|.)""")
    return [m.group(0) for m in reg.finditer(x)]

def cleantext(s):
    return str(s).strip()

def cleanquery(q):
    e = re.compile("^\s*$")
    lines = filter(lambda(l): not e.match(l), q.splitlines())
    if lines == []:
        return ""
    iRe = re.compile("^\s*")
    indentation = min(map(lambda x: len(iRe.search(x).group(0)), lines))
    return "\n".join(map(lambda x: x[indentation:], lines)).strip()

def make_step(doc, query, q0):
    doc = md.convert(cleantext(doc))
    query = str(cleanquery(query))
    q0 = str(cleanquery(q0))
    tokens1 = tokenize(q0)
    tokens2 = tokenize(query)
    matcher.set_seqs(tokens1, tokens2)
    opcodes = matcher.get_opcodes()
    actions = []
    offset = 0
    for opcode,i1,i2,j1,j2 in opcodes:
        if opcode == "equal":
            continue
        elif opcode == "insert":
            pos = len("".join(tokens1[:i1]))
            toput = "".join(tokens2[j1:j2])
            actions.append({"action":"insert", "where": pos+offset, "what": toput})
            offset += len(toput)
        elif opcode == "delete":
            pos = len("".join(tokens1[:i1]))
            n = len("".join(tokens1[i1:i2]))
            actions.append({"action":"suppr", "where": pos+offset, "what": n})
            offset -= n
        elif opcode == "replace":
            pos = len("".join(tokens1[:i1]))
            n = len("".join(tokens1[i1:i2]))
            toput = "".join(tokens2[j1:j2])
            actions.append({"action":"suppr", "where": pos+offset, "what": n})
            actions.append({"action":"insert", "where": pos+offset, "what": toput})
            offset -= n
            offset += len(toput)
    return {"doc": doc, "edits": actions, "expected": query}
            
        

if __name__ == "__main__":

    argp = ArgumentParser(description="generate a qrawl guide")
    argp.add_argument("xmlFile")

    argp.add_argument("--xmltest", action="store_true", help="generate Nuno's XML test file instead of javascript stuff")

    args = argp.parse_args()
    
    guide = xml.dom.minidom.parse(args.xmlFile)

    steps = []
    queries = []

    for g in guide.getElementsByTagName("guide"):
        initialQ = ""
        for step in g.getElementsByTagName("step"):
            doc   = step.getElementsByTagName("doc")
            query = step.getElementsByTagName("query")
            assert len(doc) == 1
            assert len(query) <= 1
            if query == []:
                nextQ = ""
            else:
                logging.debug(query[0].firstChild.wholeText)
                nextQ = query[0].firstChild.wholeText
            # queries to be exported to test (we skip empty strings)
            if nextQ.strip() != '':
                queries.append(nextQ)
            desc = doc[0].firstChild.wholeText
            # we skip entries about failing queries (they are there for test purpose)
            if desc.find("failing query #") != -1:
                continue
            steps.append(make_step(doc[0].firstChild.wholeText, nextQ, initialQ))
            initialQ = nextQ

    if args.xmltest:
        impl = getDOMImplementation()
        newdoc = impl.createDocument(None, "queries", None)
        xmlTests = newdoc.documentElement
        xmlTests.setAttribute("dataset", "publications")
        for query in queries:
                t = newdoc.createElement("query")
                c = newdoc.createElement("qrawl")
                c.appendChild(newdoc.createCDATASection(query))
                t.appendChild(c)
                xmlTests.appendChild(t)
        print xmlTests.toprettyxml(indent="   ", newl="\n")

 
    else:
        print "var steps =", dumps(steps, sort_keys=True, indent=4) + ";"
