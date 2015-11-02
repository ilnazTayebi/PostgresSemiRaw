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
                "what": "select * from httplogs", 
                "where": 0
            }
        ], 
        "expected": "select * from httplogs"
    }, 
    {
        "doc": "<p>QRAWL is intended to be compatible with SQL and can perform typical filtering operations.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": " where method = \"POST\"", 
                "where": 22
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
                "what": "(select code from ", 
                "where": 24
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 43
            }
        ], 
        "expected": "select distinct method, (select code from *) from httplogs group by method"
    }, 
    {
        "doc": "<p>We think using the star sign in a <em>from</em> is not very readable (but it does work).\nWe prefer to use the <em>partition</em> keyword instead. For now one consider the\n<em>partition</em> keyword as an alias to the star sign for the grouped queries (there is a difference\nand we'll see later on other queries). Let's use partition (click next).</p>", 
        "edits": [], 
        "expected": "select distinct method, (select code from *) from httplogs group by method"
    }, 
    {
        "doc": "<p>It is more readable. Let's do more queries.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 42
            }, 
            {
                "action": "insert", 
                "what": "partition", 
                "where": 42
            }
        ], 
        "expected": "select distinct method, (select code from partition) from httplogs group by method"
    }, 
    {
        "doc": "<p>We do an inner group by on the grouped data. That query returns four rows\n(one per method) and each row contains a field being a list of codes\nassociated to the number of httplogs born that code (and having already been filtered on their\nmethod).</p>\n<p>But we can also extract the logs themselves instead of counting them (click next).</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "distinct ", 
                "where": 32
            }, 
            {
                "action": "insert", 
                "what": ",", 
                "where": 45
            }, 
            {
                "action": "insert", 
                "what": "count(partition)\n                         ", 
                "where": 47
            }, 
            {
                "action": "suppr", 
                "what": 15, 
                "where": 103
            }, 
            {
                "action": "insert", 
                "what": "code)\nfrom httplogs\ngroup by ", 
                "where": 113
            }
        ], 
        "expected": "select distinct method, (select distinct code, count(partition)\n                         from partition group by code)\nfrom httplogs\ngroup by method"
    }, 
    {
        "doc": "<p>Now we find the original log rows in the inner list. As expected, the logs\n            found in the inner nested list are all of the corresponding method and code.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 6, 
                "where": 47
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 56
            }
        ], 
        "expected": "select distinct method, (select distinct code, partition\n                         from partition group by code)\nfrom httplogs\ngroup by method"
    }, 
    {
        "doc": "<p>This is it for nested queries. Now let's review the programming capabilities\n            of QRAWL.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 141, 
                "where": 0
            }
        ], 
        "expected": ""
    }, 
    {
        "doc": "<p>QRAWL supports variable assignments to simplify the edition of queries.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    large // return value of the block\n}", 
                "where": 0
            }
        ], 
        "expected": "{\n    x := 32768;\n    large := select * from httplogs where size >= x;\n    large // return value of the block\n}"
    }, 
    {
        "doc": "<p>A slightly more complicated example which  returns a record with two collections\n            of queries.</p>\n<pre><code>        Let's have a look to regular expressions in QRAWL queries now.\n</code></pre>", 
        "edits": [
            {
                "action": "insert", 
                "what": "small := select * from httplogs where size < x;\n    (small, ", 
                "where": 75
            }, 
            {
                "action": "suppr", 
                "what": 29, 
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
                "what": 9, 
                "where": 50
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 57
            }, 
            {
                "action": "insert", 
                "what": "root(url) as r, url, code, size", 
                "where": 57
            }, 
            {
                "action": "suppr", 
                "what": 88, 
                "where": 102
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    select root(url) as r, url, code, size from httplogs\n}"
    }, 
    {
        "doc": "<p>We use <em>root</em> to filter requests to CGI related URLs.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "cgis := ", 
                "where": 50
            }, 
            {
                "action": "insert", 
                "what": " * from httplogs where", 
                "where": 64
            }, 
            {
                "action": "suppr", 
                "what": 2, 
                "where": 97
            }, 
            {
                "action": "insert", 
                "what": "=", 
                "where": 97
            }, 
            {
                "action": "suppr", 
                "what": 2, 
                "where": 99
            }, 
            {
                "action": "insert", 
                "what": "\"cgi-bin\";\n    select", 
                "where": 99
            }, 
            {
                "action": "suppr", 
                "what": 12, 
                "where": 124
            }, 
            {
                "action": "suppr", 
                "what": 8, 
                "where": 130
            }, 
            {
                "action": "insert", 
                "what": "cgis", 
                "where": 130
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    cgis := select * from httplogs where root(url) = \"cgi-bin\";\n    select url from cgis\n}"
    }, 
    {
        "doc": "<p>This is a regular group by (with nested data returned) applied\n            on log lines filtered by <em>root</em></p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 3, 
                "where": 121
            }, 
            {
                "action": "insert", 
                "what": "distinct code, *", 
                "where": 121
            }, 
            {
                "action": "insert", 
                "what": " group by code", 
                "where": 147
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([^/]*).*\";\n    cgis := select * from httplogs where root(url) = \"cgi-bin\";\n    select distinct code, * from cgis group by code\n}"
    }, 
    {
        "doc": "<p>Now we filter failures and group by root.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 12, 
                "where": 32
            }, 
            {
                "action": "insert", 
                "what": "\"/([-\\\\w]*).*\"", 
                "where": 32
            }, 
            {
                "action": "suppr", 
                "what": 4, 
                "where": 52
            }, 
            {
                "action": "insert", 
                "what": "failure", 
                "where": 52
            }, 
            {
                "action": "insert", 
                "what": "\\c -> c >= 400;\n    ", 
                "where": 63
            }, 
            {
                "action": "suppr", 
                "what": 21, 
                "where": 90
            }, 
            {
                "action": "insert", 
                "what": "distinct", 
                "where": 90
            }, 
            {
                "action": "insert", 
                "what": ",", 
                "where": 108
            }, 
            {
                "action": "suppr", 
                "what": 17, 
                "where": 110
            }, 
            {
                "action": "insert", 
                "what": "(", 
                "where": 110
            }, 
            {
                "action": "insert", 
                "what": "url, count(", 
                "where": 133
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 145
            }, 
            {
                "action": "insert", 
                "what": "as n\n                                       ", 
                "where": 147
            }, 
            {
                "action": "suppr", 
                "what": 4, 
                "where": 196
            }, 
            {
                "action": "insert", 
                "what": "*", 
                "where": 196
            }, 
            {
                "action": "insert", 
                "what": ", url)\n    from httplogs\n    where failure(code)\n    group by root(url)", 
                "where": 211
            }
        ], 
        "expected": "{\n    root := \\x -> x parse as r\"/([-\\\\w]*).*\";\n    failure := \\c -> c >= 400;\n    select distinct root(url), (select distinct code, url, count(*) as n\n                                       from * group by code, url)\n    from httplogs\n    where failure(code)\n    group by root(url)\n}"
    }
];
