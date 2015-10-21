#!/usr/bin/env python
from argparse import ArgumentParser
import xml.dom.minidom
import logging
from difflib import SequenceMatcher
from json import dumps
from markdown import Markdown

logging.basicConfig(level=logging.DEBUG)
md = Markdown()
matcher = SequenceMatcher()

def make_step(doc, query, q0):
    doc = md.convert(str(doc.strip()))
    query = str(query.strip())
    q0 = q0.strip()
    matcher.set_seqs(q0, query)
    opcodes = matcher.get_opcodes()
    actions = []
    offset = 0
    for opcode,i1,i2,j1,j2 in opcodes:
        if opcode == "equal":
            continue
        elif opcode == "insert":
            actions.append({"action":"insert", "where": i1+offset, "what": query[j1:j2]})
            offset += (j2-j1)
        elif opcode == "delete":
            actions.append({"action":"suppr", "where": i1+offset, "what": i2-i1})
            offset -= (i2-i1)
        elif opcode == "replace":
            actions.append({"action":"suppr", "where": i1+offset, "what": i2-i1})
            actions.append({"action":"insert", "where": i1+offset, "what": query[j1:j2]})
            offset -= (i2-i1)
            offset += (j2-j1)
    return {"doc": doc, "edits": actions, "expected": query}
            
        

if __name__ == "__main__":

    argp = ArgumentParser(description="generate a qrawl guide")
    argp.add_argument("xmlFile")

    args = argp.parse_args()
    
    guide = xml.dom.minidom.parse(args.xmlFile)

    steps = []

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
            steps.append(make_step(doc[0].firstChild.wholeText, nextQ, initialQ))
            initialQ = nextQ

    print "var steps =", dumps(steps, sort_keys=True, indent=4) + ";"
