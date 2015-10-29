#!/usr/bin/env python
from argparse import ArgumentParser
import xml.dom.minidom
import logging
from difflib import SequenceMatcher
from json import dumps
from markdown import Markdown
from xml.dom.minidom import getDOMImplementation

logging.basicConfig(level=logging.DEBUG)
md = Markdown()
matcher = SequenceMatcher()

def tokenize(x):
    return x

def make_step(doc, query, q0):
    doc = md.convert(str(doc.strip()))
    query = str(query.strip())
    q0 = q0.strip()
    matcher.set_seqs(tokenize(q0), tokenize(query))
    opcodes = matcher.get_opcodes()
    actions = []
    offset = 0
    for opcode,i1,i2,j1,j2 in opcodes:
        if opcode == "equal":
            continue
        elif opcode == "insert":
            toput = query[j1:j2]
            actions.append({"action":"insert", "where": i1+offset, "what": toput})
            offset += len(toput)
        elif opcode == "delete":
            n = i2 - i1
            actions.append({"action":"suppr", "where": i1+offset, "what": n})
            offset -= n
        elif opcode == "replace":
            n = i2 - i1
            toput = query[j1:j2]
            actions.append({"action":"suppr", "where": i1+offset, "what": n})
            actions.append({"action":"insert", "where": i1+offset, "what": toput})
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
