var steps = [
    {
        "doc": "<p>The user interface is about to run in demo mode. It is going to walk\nthrough a number of QRAWL queries, illustrating the capabilities of the language.\nFor that we need a dataset. We'll use (<a href=\"javascript:load_dataset(&quot;httplogs&quot;)\">httplogs</a>) (please click the name\nto load it, and wait until there is a success notification at the bottom of the screen).</p>", 
        "edits": [], 
        "expected": ""
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
        "doc": "<p>QRAWL is intended to be compatible with SQL and can perform typical filtering operations.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 4, 
                "where": 29
            }, 
            {
                "action": "insert", 
                "what": "method", 
                "where": 29
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 36
            }, 
            {
                "action": "insert", 
                "what": "=", 
                "where": 36
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 38
            }, 
            {
                "action": "insert", 
                "what": "\"POST\"", 
                "where": 38
            }
        ], 
        "expected": "select * from httplogs where method = \"POST\""
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
                "what": "group by", 
                "where": 47
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
        "doc": "<p>In QRAWL, the star sign is in fact an alias to <em>the subset of httplogs having a certain method</em>, and the\ncount operator runs on that collection and returns the number of elements it contains. This means\nthe star sign can be handled as a collection itself. Click next to see.</p>", 
        "edits": [], 
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
        "edits": [], 
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
        "doc": "<p>We do an inner group by on the grouped data. That query returns four rows\n(one per method) and each row contains a field being a list of codes\nassociated to the number of httplogs born that returned (and having already been filtered on their\nmethod).</p>\n<p>But we can also extract the logs themselves instead of counting them (click next).</p>", 
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
        "doc": "<p>This is it for nested queries. Now let's review the scripting capabilities\n            of QRAWL.</p>", 
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
        "doc": "<p>QRAWL supports variable assignments to simplify the edition of queries.</p>\n<p>Below we assign an integer value to <em>x</em>, then we store results of a <em>select</em> in <em>large</em>,\nfinally the program returns the value of <em>large</em>.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    large // returned value\n}", 
                "where": 0
            }
        ], 
        "expected": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    large // returned value\n}"
    }, 
    {
        "doc": "<p>A slightly more complicated example which  returns a record with two collections\n            of requests.</p>\n<p>Let's have a look to regular expressions in QRAWL queries now.</p>", 
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
        "doc": "<p>This function using a regular expression to extract the root directory of a\nURL. This is a feature of QRAWL: the <em>as</em> operator parses the string <em>x</em> as the\ngiven regular expression and returns the string matching the group (the inner\npart between parenthesis).</p>\n<p>Therefore, if passed a URL string, <em>root</em> will return the top level directory of the file. (We will\nsee later what happens if the regular expression contains more than one group.)\nLet's use this function in a group by query.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 6
            }, 
            {
                "action": "insert", 
                "what": "root", 
                "where": 6
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 14
            }, 
            {
                "action": "insert", 
                "what": "\\x -> x parse as r\"/([^/]*).*\"", 
                "where": 14
            }, 
            {
                "action": "suppr", 
                "what": 105, 
                "where": 50
            }, 
            {
                "action": "insert", 
                "what": "root", 
                "where": 50
            }, 
            {
                "action": "suppr", 
                "what": 12, 
                "where": 55
            }, 
            {
                "action": "insert", 
                "what": "\"/logos/company_logo.png\"", 
                "where": 55
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
                "action": "suppr", 
                "what": 25, 
                "where": 92
            }, 
            {
                "action": "insert", 
                "what": "path", 
                "where": 92
            }, 
            {
                "action": "insert", 
                "what": " = \"cgi-bin\";\n    select path from cgis", 
                "where": 97
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
        "doc": "<p>Here are the client host names of the failing requests. Let's\n        see if the HTTP method is a discriminant</p>", 
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
        "doc": "<p>Here are the client host names of the failing requests. Let's\n        see if the HTTP method is a discriminant</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "method, ", 
                "where": 164
            }, 
            {
                "action": "insert", 
                "what": "method, ", 
                "where": 267
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    failure := \\c -> (c >= 400);\n    cgis := select * from httplogs where root(path) = \"cgi-bin\";\n    select distinct method, returned, (select distinct host from *)\n    from cgis\n    where failure(returned)\n    group by method, returned\n}"
    }, 
    {
        "doc": "<p>In real life, server logs are found in text files where each line encodes\nan event in a custom format. Let's see an example.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 285, 
                "where": 0
            }
        ], 
        "expected": ""
    }, 
    {
        "doc": "<p>The HTTP requests are encoding in plain strings which have a specific format.\nQRAWL can apply regular expressions to strings. Let's use this to read the file and\ntokenize the string.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "select * from log_example", 
                "where": 0
            }
        ], 
        "expected": "select * from log_example"
    }, 
    {
        "doc": "<p>See how the regular expression applied to the file now returns a record of fields</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "row parse as r\"\"\"(host:[\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s", 
                "where": 7
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 132
            }, 
            {
                "action": "insert", 
                "what": "\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n", 
                "where": 132
            }, 
            {
                "action": "insert", 
                "what": "row in ", 
                "where": 174
            }
        ], 
        "expected": "select row parse as r\"\"\"(host:[\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\nfrom row in log_example"
    }, 
    {
        "doc": "<p>Now the records are processed into typed records (size is an integer, etc.). Let's run\n    a simple filtering.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "into (date, host, method, path, returned: toInt(returned), size: toInt(size))\n", 
                "where": 169
            }
        ], 
        "expected": "select row parse as r\"\"\"(host:[\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\ninto (date, host, method, path, returned: toInt(returned), size: toInt(size))\nfrom row in log_example"
    }, 
    {
        "doc": "<p>The integer comparison over the <em>returned</em> field works.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    log1 := ", 
                "where": 0
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 182
            }, 
            {
                "action": "insert", 
                "what": "\n            ", 
                "where": 182
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 272
            }, 
            {
                "action": "insert", 
                "what": "\n            ", 
                "where": 272
            }, 
            {
                "action": "insert", 
                "what": ";\n    select * from log1 where returned >= 400\n}", 
                "where": 308
            }
        ], 
        "expected": "{\n    log1 := select row parse as r\"\"\"(host:[\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n            into (date, host, method, path, returned: toInt(returned), size: toInt(size))\n            from row in log_example;\n    select * from log1 where returned >= 400\n}"
    }, 
    {
        "doc": "<p>Here we reuse our former <em>root</em> function and perform a similar grouping as we saw earlier.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "root := \\x -> x parse as r\"/([^/]*).*\";\n    ", 
                "where": 314
            }, 
            {
                "action": "insert", 
                "what": "distinct root(path), count(", 
                "where": 365
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 393
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 405
            }, 
            {
                "action": "insert", 
                "what": "group", 
                "where": 405
            }, 
            {
                "action": "suppr", 
                "what": 8, 
                "where": 411
            }, 
            {
                "action": "insert", 
                "what": "by", 
                "where": 411
            }, 
            {
                "action": "suppr", 
                "what": 6, 
                "where": 414
            }, 
            {
                "action": "insert", 
                "what": "root(path)", 
                "where": 414
            }
        ], 
        "expected": "{\n    log1 := select row parse as r\"\"\"(host:[\\w\\.\\d]+)\\s+-\\s+-\\s+\\[(date:.*)\\]\\s*\"(method:\\w+)\\s+(path:[^\\s]+) (protocol:\\w+)/(version:[0-9.]+)\\s*\"\\s+(returned:\\d+)\\s+(size:\\d+).*\"\"\"\n            into (date, host, method, path, returned: toInt(returned), size: toInt(size))\n            from row in log_example;\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    select distinct root(path), count(*) from log1 group by root(path)\n}"
    }
];
