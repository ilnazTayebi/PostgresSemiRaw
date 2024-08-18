var steps = [
    {
        "doc": "<p>The user interface is about to run in demo mode. It is going to walk\nthrough a number of RAW queries, illustrating the capabilities of the language.\nFor that we need a dataset. We'll use httplogs</p>", 
        "expected": "", 
        "section": "Query language"
    }, 
    {
        "doc": "<p>The query below should execute successfully and return a number of rows.\nHave a quick look to the httplogs table content displayed on the right side\nof the screen. Rows are plain records with information about requests\nissued to an HTTP server.</p>\n<p>If this doesn't work, then go back to the previous step and ensure the dataset is loaded.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "select * from httplogs where size > 20000", 
                "where": 0
            }
        ], 
        "expected": "select * from httplogs where size > 20000"
    }, 
    {
        "doc": "<p>RAW is intended to be compatible with SQL and can perform typical filtering operations.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": " and method = \"POST\"", 
                "where": 41
            }
        ], 
        "expected": "select * from httplogs where size > 20000 and method = \"POST\""
    }, 
    {
        "doc": "<p>Typical SQL aggregation are supported. Here we report the number of\n            requests in each possible method.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "distinct method, count(", 
                "where": 7
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 31
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 47
            }, 
            {
                "action": "insert", 
                "what": "group", 
                "where": 47
            }, 
            {
                "action": "suppr", 
                "what": 16, 
                "where": 53
            }, 
            {
                "action": "insert", 
                "what": "by", 
                "where": 53
            }, 
            {
                "action": "suppr", 
                "what": 9, 
                "where": 62
            }
        ], 
        "expected": "select distinct method, count(*) from httplogs group by method"
    }, 
    {
        "doc": "<p>In RAW, the star sign is in fact an alias to <em>the subset of httplogs having a certain method</em>, and the\ncount operator runs on that collection and returns the number of elements it contains. This means\nthe star sign can be handled as a collection itself. Click next to see.</p>", 
        "expected": "select distinct method, count(*) from httplogs group by method"
    }, 
    {
        "doc": "<p>Here we removed the aggregation function (count), so that the query returns\nrows which now contain a <em>nested list</em> of log lines (the ones with the corresponding method)\nin plae of the initial count.\nLet's do some more processing on this inner collection.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 6, 
                "where": 24
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 25
            }
        ], 
        "expected": "select distinct method, * from httplogs group by method"
    }, 
    {
        "doc": "<p>We extract the return codes form that inner collection.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "(select returned from ", 
                "where": 24
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 47
            }
        ], 
        "expected": "select distinct method, (select returned from *) from httplogs group by method"
    }, 
    {
        "doc": "<p>We think using the star sign in a <em>from</em> is not very readable (but it does work).\nWe prefer to use the <em>partition</em> keyword instead. For now one consider the\n<em>partition</em> keyword as an alias to the star sign for the grouped queries (there is a difference\nand we'll see later on other queries). Let's use partition (click next).</p>", 
        "expected": "select distinct method, (select returned from *) from httplogs group by method"
    }, 
    {
        "doc": "<p>It is more readable. Let's do more queries.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 46
            }, 
            {
                "action": "insert", 
                "what": "partition", 
                "where": 46
            }
        ], 
        "expected": "select distinct method, (select returned from partition) from httplogs group by method"
    }, 
    {
        "doc": "<p>We do an inner group by on the grouped data. That query returns one row\nper method, and each row contains a field being a list of returned codes\nassociated to the number of requests which returned that code\n(and having already been filtered on the related upper\nmethod).</p>\n<p>But we can also extract the logs themselves instead of counting them. We only need\nto use <em>partition</em> (click next).</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "distinct ", 
                "where": 32
            }, 
            {
                "action": "insert", 
                "what": ",", 
                "where": 49
            }, 
            {
                "action": "insert", 
                "what": "count(partition)\n                         ", 
                "where": 51
            }, 
            {
                "action": "suppr", 
                "what": 15, 
                "where": 107
            }, 
            {
                "action": "insert", 
                "what": "returned)\nfrom httplogs\ngroup by ", 
                "where": 117
            }
        ], 
        "expected": "select distinct method, (select distinct returned, count(partition)\n                         from partition group by returned)\nfrom httplogs\ngroup by method"
    }, 
    {
        "doc": "<p>Now we find the original log rows in the inner list. As expected, the logs\n            found in the inner nested list are all of the corresponding method and returned.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 6, 
                "where": 51
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 60
            }
        ], 
        "expected": "select distinct method, (select distinct returned, partition\n                         from partition group by returned)\nfrom httplogs\ngroup by method"
    }, 
    {
        "doc": "<p>This is it for nested queries. Now let's review the scripting capabilities\n            of RAW.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 149, 
                "where": 0
            }
        ], 
        "expected": ""
    }, 
    {
        "doc": "<p>RAW supports variable assignments to simplify the edition of queries.</p>\n<p>Below we assign an integer value to <em>x</em>, then we store results of a <em>select</em> in <em>large</em>,\nfinally the program returns the value of <em>large</em>.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    large // returned value\n}", 
                "where": 0
            }
        ], 
        "expected": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    large // returned value\n}", 
        "section": "Scripting"
    }, 
    {
        "doc": "<p>A slightly more complicated example which  returns a record with two collections\n            of requests.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "small := select * from httplogs where size < x;\n    (small, ", 
                "where": 75
            }, 
            {
                "action": "suppr", 
                "what": 18, 
                "where": 140
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 140
            }
        ], 
        "expected": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    small := select * from httplogs where size < x;\n    (small, large)\n}"
    }, 
    {
        "doc": "<p>Let's have a look to regular expressions in RAW queries now.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 143, 
                "where": 0
            }
        ], 
        "expected": "", 
        "section": "Regular expressions"
    }, 
    {
        "doc": "<p>This function using a regular expression to extract the root directory of a\nURL. This is a feature of RAW: the <em>parse as</em> operator parses the string <em>x</em> as the\ngiven regular expression and returns the string matching the group (the inner\npart between parenthesis).</p>\n<p>Therefore, if passed a URL string, <em>root</em> will return the top level directory of the file. (We will\nsee later what happens if the regular expression contains more than one group.)\nLet's use this function in a group by query.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    root(\"/logos/company_logo.png\")\n}", 
                "where": 0
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    root(\"/logos/company_logo.png\")\n}"
    }, 
    {
        "doc": "<p>We use <em>root</em> to filter requests to CGI related URLs.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "cgis := select * from httplogs where ", 
                "where": 50
            }, 
            {
                "action": "insert", 
                "what": "path) = ", 
                "where": 92
            }, 
            {
                "action": "suppr", 
                "what": 23, 
                "where": 101
            }, 
            {
                "action": "insert", 
                "what": "cgi-bin", 
                "where": 101
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 109
            }, 
            {
                "action": "insert", 
                "what": ";\n    select path from cgis", 
                "where": 109
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    cgis := select * from httplogs where root(path) = \"cgi-bin\";\n    select path from cgis\n}"
    }, 
    {
        "doc": "<p>This is a regular group by (with nested data returned) applied\n            on log lines filtered by <em>root</em>. We notice there are some\n            failures because some HTTP codes are over 400.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 4, 
                "where": 122
            }, 
            {
                "action": "insert", 
                "what": "distinct", 
                "where": 122
            }, 
            {
                "action": "insert", 
                "what": "returned, *\n    ", 
                "where": 131
            }, 
            {
                "action": "insert", 
                "what": "\n    group by returned", 
                "where": 156
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    cgis := select * from httplogs where root(path) = \"cgi-bin\";\n    select distinct returned, *\n    from cgis\n    group by returned\n}"
    }, 
    {
        "doc": "<p>We isolate failures and dig out a bit. There were several failing\n         requests, all with the same error. Let's investigate a bit more.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": ";\n    failure := \\c -> (c >= 400)", 
                "where": 44
            }, 
            {
                "action": "insert", 
                "what": "count(*), ", 
                "where": 174
            }, 
            {
                "action": "insert", 
                "what": "\n    where failure(returned)", 
                "where": 199
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    failure := \\c -> (c >= 400);\n    cgis := select * from httplogs where root(path) = \"cgi-bin\";\n    select distinct returned, count(*), *\n    from cgis\n    where failure(returned)\n    group by returned\n}"
    }, 
    {
        "doc": "<p>Here are the client host names of the failing CGI requests.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 5, 
                "where": 174
            }, 
            {
                "action": "insert", 
                "what": "select distinct host from ", 
                "where": 175
            }, 
            {
                "action": "suppr", 
                "what": 3, 
                "where": 203
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    failure := \\c -> (c >= 400);\n    cgis := select * from httplogs where root(path) = \"cgi-bin\";\n    select distinct returned, (select distinct host from *)\n    from cgis\n    where failure(returned)\n    group by returned\n}"
    }, 
    {
        "doc": "<p>In real life, server logs are found in text files where each line encodes\nan event in a custom string format. Let's see an example. Please load the file\nbefore continuing.</p>\n<ul>\n<li>log_example (<a href=\"javascript:load_dataset(&quot;log_example&quot;)\">load</a>)</li>\n</ul>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 269, 
                "where": 0
            }
        ], 
        "expected": "", 
        "section": "Text file parsing and querying"
    }, 
    {
        "doc": "<p>The HTTP requests are encoded in plain strings which have a specific format.\nIt is not a well structured CSV file.\nWe saw how RAW can apply regular expressions to strings. Let's use this to read the file and\ntokenize the string.</p>\n<p>First we need to access that string with a variable. For that we use the <em>in</em> syntax. Click next.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "select *\nfrom log_example", 
                "where": 0
            }
        ], 
        "expected": "select *\nfrom log_example"
    }, 
    {
        "doc": "<p>We will use the <em>parse as</em> keyword to apply a regular expression to each line</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 7
            }, 
            {
                "action": "insert", 
                "what": "l", 
                "where": 7
            }, 
            {
                "action": "insert", 
                "what": "l in ", 
                "where": 14
            }
        ], 
        "expected": "select l\nfrom l in log_example"
    }, 
    {
        "doc": "<p>The regular expression applied to the file so that we get records of two fields corresponding\nto the two regular expressions groups.  Let's keep adding groups in the regular expression.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": " parse as r\"\"\"([-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(.*)\\].*\"\"\"", 
                "where": 8
            }
        ], 
        "expected": "select l parse as r\"\"\"([-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(.*)\\].*\"\"\"\nfrom l in log_example"
    }, 
    {
        "doc": "<p>The records\nhave now all expected fields, with default numbered fields. We'd like instead to give them meaningful names.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "\\s*\"(\\w+)\\s+([^\\s]+) (\\w+)/([0-9.]+)\\s*\"\\s+(\\d+)\\s+(\\d+)", 
                "where": 53
            }
        ], 
        "expected": "select l parse as r\"\"\"([-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(.*)\\]\\s*\"(\\w+)\\s+([^\\s]+) (\\w+)/([0-9.]+)\\s*\"\\s+(\\d+)\\s+(\\d+).*\"\"\"\nfrom l in log_example"
    }, 
    {
        "doc": "<p>In order to name fields with custom names, we embedded names in the regular expression groups. They are assigned to the fields.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "host:", 
                "where": 23
            }, 
            {
                "action": "insert", 
                "what": "date:", 
                "where": 53
            }, 
            {
                "action": "insert", 
                "what": "method:", 
                "where": 68
            }, 
            {
                "action": "insert", 
                "what": "path:", 
                "where": 83
            }, 
            {
                "action": "insert", 
                "what": "protocol:", 
                "where": 97
            }, 
            {
                "action": "insert", 
                "what": "version:", 
                "where": 112
            }, 
            {
                "action": "insert", 
                "what": "returned:", 
                "where": 136
            }, 
            {
                "action": "insert", 
                "what": "size:", 
                "where": 153
            }
        ], 
        "expected": "select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\nfrom l in log_example"
    }, 
    {
        "doc": "<p>The query fails because <em>parse as</em> returned a record of strings. The <em>size</em> field cannot be compared to an integer.\nWe need to convert this string (as well as <em>date</em> and <em>returned</em>) to other types.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    log1 := ", 
                "where": 0
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 181
            }, 
            {
                "action": "insert", 
                "what": "\n        ", 
                "where": 181
            }, 
            {
                "action": "insert", 
                "what": ";\n    select * from log1 where size > 20000\n}", 
                "where": 211
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        from l in log_example;\n    select * from log1 where size > 20000\n}"
    }, 
    {
        "doc": "<p>By turning the record of strings into another expression, the records are processed into records with properly typed fields (size is an integer, etc.). The query\nruns successfully. Let's add a second log file.</p>\n<ul>\n<li>log_example2 (<a href=\"javascript:load_dataset(&quot;log_example2&quot;)\">load</a>)</li>\n</ul>", 
        "edits": [
            {
                "action": "insert", 
                "what": "\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))", 
                "where": 181
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    select * from log1 where size > 20000\n}"
    }, 
    {
        "doc": "<p>It is similar to the first one except the \"-\" signs after the host and the date format\nis different. Let's parse it with a second regular expression.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 2, 
                "where": 364
            }, 
            {
                "action": "insert", 
                "what": "l\n    ", 
                "where": 364
            }, 
            {
                "action": "suppr", 
                "what": 23, 
                "where": 375
            }, 
            {
                "action": "insert", 
                "what": "l in log_example2", 
                "where": 375
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    select l\n    from l in log_example2\n}"
    }, 
    {
        "doc": "<p>There is a failure. The regular expression did not apply to a specific line (see the error\nmessage). This is because certain lines do not report a size with digits, but an \"invalid size\" with\n\"-\". Let's fix the regular expression to accept \"-\" in the <em>size</em> field.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "log2 := ", 
                "where": 357
            }, 
            {
                "action": "insert", 
                "what": "\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:\\d+)\"\"\"\n        from l in log_example2;", 
                "where": 373
            }, 
            {
                "action": "insert", 
                "what": "select * ", 
                "where": 573
            }, 
            {
                "action": "suppr", 
                "what": 17, 
                "where": 587
            }, 
            {
                "action": "insert", 
                "what": "log2", 
                "where": 587
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:\\d+)\"\"\"\n        from l in log_example2;\n    select * from log2\n}"
    }, 
    {
        "doc": "<p>Now it works. But this will be a problem for parsing sizes into integers. We should be careful\nwith these special cases.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 2, 
                "where": 529
            }, 
            {
                "action": "insert", 
                "what": "[-\\d]", 
                "where": 529
            }, 
            {
                "action": "insert", 
                "what": " where size = \"-\"", 
                "where": 594
            }
        ], 
        "expected": "{\n    log1 := select l parse as r\"\"\"(host:[-\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n        into (date:to_epoch(date,\"dd/MMM/yyyy:HH:mm:ss Z\"), host, method, path,\n              returned: toInt(returned), size: toInt(size))\n        from l in log_example;\n    log2 := select l\n        parse as r\"\"\"(host:[-\\w\\._]+) \\[(date:\\d+-\\d+-\\d+ \\d+:\\d+:\\d+)\\] \"(method:\\w+) (path:[^\\s]+) (protocol:\\w+)/(version:\\d\\.\\d)\" (returned:\\d+) (size:[-\\d]+)\"\"\"\n        from l in log_example2;\n    select * from log2 where size = \"-\"\n}"
    }, 
    {
        "doc": "<p>We are now settled with our two logs in a unified format.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "// integer cleaning\n    mkSize := \\x -> if x = \"-\" then -1 else toInt(x);\n    ", 
                "where": 357
            }, 
            {
                "action": "insert", 
                "what": "\n        into (date:to_epoch(date, \"yyyy-MM-dd kk:mm:ss\"), host, method, path,\n              returned: toInt(returned), size: mkSize(size))", 
                "where": 617
            }, 
            {
                "action": "suppr", 
                "what": 3, 
                "where": 825
            }, 
            {
                "action": "insert", 
                "what": "-1", 
                "where": 825
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
        "doc": "<p>Here we filter events in the log on their timestamps.</p>", 
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
