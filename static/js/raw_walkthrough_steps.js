var steps = [
    {
        "doc": "<p>We are now settled with our two logs in a unified format.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    select * from log2 where size = -1\n}", 
                "where": 0
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    select * from log2 where size = -1\n}"
    }, 
    {
        "doc": "<p>The two logs are merged. Let's do some queries.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 13, 
                "where": 793
            }, 
            {
                "action": "insert", 
                "what": "log3 := log1 bag_union", 
                "where": 793
            }, 
            {
                "action": "suppr", 
                "what": 16, 
                "where": 820
            }, 
            {
                "action": "insert", 
                "what": ";\n    log3", 
                "where": 820
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    log3 := log1 bag_union log2;\n    log3\n}"
    }, 
    {
        "doc": "<p>Here we filter evengs in the log on their timestamps.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "t1 := to_epoch(\"2015-07-01 06:10:00\", \"yyyy-MM-dd kk:mm:ss\");\n    t2 := to_epoch(\"2015-07-01 06:30:00\", \"yyyy-MM-dd kk:mm:ss\");\n    isolate := \\log -> select i from i in log where i.date > t1 and i.date < t2;\n    isolate(", 
                "where": 826
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 1051
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    log3 := log1 bag_union log2;\n    t1 := to_epoch(\"2015-07-01 06:10:00\", \"yyyy-MM-dd kk:mm:ss\");\n    t2 := to_epoch(\"2015-07-01 06:30:00\", \"yyyy-MM-dd kk:mm:ss\");\n    isolate := \\log -> select i from i in log where i.date > t1 and i.date < t2;\n    isolate(log3)\n}"
    }, 
    {
        "doc": "<p>Since we picked an overlapping interval, one can see <em>log3</em> is indeed a merge of <em>log1</em> and <em>log2</em>.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "(log1: ", 
                "where": 1039
            }, 
            {
                "action": "insert", 
                "what": "log1), log2: isolate(log2), ", 
                "where": 1054
            }, 
            {
                "action": "insert", 
                "what": ": isolate(log3)", 
                "where": 1086
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    log3 := log1 bag_union log2;\n    t1 := to_epoch(\"2015-07-01 06:10:00\", \"yyyy-MM-dd kk:mm:ss\");\n    t2 := to_epoch(\"2015-07-01 06:30:00\", \"yyyy-MM-dd kk:mm:ss\");\n    isolate := \\log -> select i from i in log where i.date > t1 and i.date < t2;\n    (log1: isolate(log1), log2: isolate(log2), log3: isolate(log3))\n}"
    }, 
    {
        "doc": "<p>Maybe a simpler way to figure out by identifying roots of paths which are found in <em>log3</em>.</p>\n<p><em>Thanks for your attention</em>.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "roots := \\log -> select distinct x.path parse as r\"/([^/]*).*\" from x in log;\n    ", 
                "where": 1039
            }, 
            {
                "action": "insert", 
                "what": "roots(", 
                "where": 1128
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 1147
            }, 
            {
                "action": "insert", 
                "what": "roots(", 
                "where": 1156
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 1175
            }, 
            {
                "action": "insert", 
                "what": "roots(", 
                "where": 1184
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 1202
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    log3 := log1 bag_union log2;\n    t1 := to_epoch(\"2015-07-01 06:10:00\", \"yyyy-MM-dd kk:mm:ss\");\n    t2 := to_epoch(\"2015-07-01 06:30:00\", \"yyyy-MM-dd kk:mm:ss\");\n    isolate := \\log -> select i from i in log where i.date > t1 and i.date < t2;\n    roots := \\log -> select distinct x.path parse as r\"/([^/]*).*\" from x in log;\n    (log1: roots(isolate(log1)), log2: roots(isolate(log2)), log3: roots(isolate(log3)))\n}"
    }, 
    {
        "doc": "<p>The two logs are merged.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 149, 
                "where": 826
            }, 
            {
                "action": "insert", 
                "what": "select * from log3 where returned ", 
                "where": 826
            }, 
            {
                "action": "suppr", 
                "what": 229, 
                "where": 861
            }, 
            {
                "action": "insert", 
                "what": "= 400", 
                "where": 861
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    log3 := log1 bag_union log2;\n    select * from log3 where returned >= 400\n}"
    }, 
    {
        "doc": "<p>Another example query.</p>\n<p><em>Thanks for your attention.</em></p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "roots := \\log -> ", 
                "where": 826
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 850
            }, 
            {
                "action": "insert", 
                "what": "distinct x.path parse as r\"/([^/]*).*\"", 
                "where": 850
            }, 
            {
                "action": "insert", 
                "what": "x in log;\n    roots(log1), roots(log2), roots(", 
                "where": 894
            }, 
            {
                "action": "suppr", 
                "what": 22, 
                "where": 944
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 944
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    // integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))\n        from l in log_example2;\n    log3 := log1 bag_union log2;\n    roots := \\log -> select distinct x.path parse as r\"/([^/]*).*\" from x in log;\n    roots(log1), roots(log2), roots(log3)\n}"
    }
];
