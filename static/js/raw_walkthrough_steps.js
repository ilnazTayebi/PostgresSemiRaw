var steps = [
    {
        "doc": "<p>The user interface is about to run in demo mode. This means we're going to walk\nthrough a number of QRAWL queries which illustrate the capabilities of the language.\nIn order to effectively have the demo <em>execute</em> the queries, these two datasets\nbelow should be loaded (if you haven't loaded them already, please do so).\nOnce you see the notification both datasets were uploaded, click next.</p>\n<ul>\n<li>publications.json (<a href=\"javascript:load_dataset(&quot;publications&quot;)\">load</a>)</li>\n<li>authors.json (<a href=\"javascript:load_dataset(&quot;authors&quot;)\">load</a>)</li>\n</ul>", 
        "edits": [], 
        "expected": ""
    }, 
    {
        "doc": "<p>The query below should execute successfully and return 50 rows shown\non the right side of the screen. Have a quick look to the authors table.\nRows are plain records with three fields: name, title and year.</p>\n<p>If this doesn't work, then go back to the previous step and ensure both\ndatasets are loaded.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "select * from authors", 
                "where": 0
            }
        ], 
        "expected": "select * from authors"
    }, 
    {
        "doc": "<p>The query below should return a single number (1000, the number\nof publications). We're all set, click next to start querying the\ndata.</p>\n<p>If this doesn't work, go back and load publications.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 21, 
                "where": 0
            }, 
            {
                "action": "insert", 
                "what": "count(publications)", 
                "where": 0
            }
        ], 
        "expected": "count(publications)"
    }, 
    {
        "doc": "<p>QRAWL is intended to be compatible with SQL. The query below is returning\nthe authors which are professors.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 19, 
                "where": 0
            }, 
            {
                "action": "insert", 
                "what": "select * from authors where title = \"professor\"", 
                "where": 0
            }
        ], 
        "expected": "select * from authors where title = \"professor\""
    }, 
    {
        "doc": "<p>Typical SQL aggregation are supported. Here we report the number of\nauthor in each possible job title.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "distinct title, count(", 
                "where": 7
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 30
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 45
            }, 
            {
                "action": "insert", 
                "what": "group by", 
                "where": 45
            }, 
            {
                "action": "suppr", 
                "what": 14, 
                "where": 59
            }
        ], 
        "expected": "select distinct title, count(*) from authors group by title"
    }, 
    {
        "doc": "<p>In QRAWL, the star sign is in fact an alias to <em>the subset of authors having a certain title</em>, and the\ncount operator runs on that collection and returns the number of elements it contains. This means\nthe star sign can be handled as a collection itself. Click next to see.</p>", 
        "edits": [], 
        "expected": "select distinct title, count(*) from authors group by title"
    }, 
    {
        "doc": "<p>Here we removed the aggregation function (count), so that the query returns\nrows which contain a <em>nested list</em> of authors (the ones with the corresponding title).\nLet's do some more processing on that group collection.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 6, 
                "where": 23
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 24
            }
        ], 
        "expected": "select distinct title, * from authors group by title"
    }, 
    {
        "doc": "<p>We extract the years of the related authors.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "(select year from ", 
                "where": 23
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 42
            }
        ], 
        "expected": "select distinct title, (select year from *) from authors group by title"
    }, 
    {
        "doc": "<p>We think using the star sign in a <em>from</em> is not very readable (but it works).\nWe prefer to use the <em>partition</em> keyword instead. For now one can consider the\n<em>partition</em> keyword as an alias to the star sign for the grouped queries (there is a difference\nbetween the star and partition but we'll see later, in the examples we run now, they\nare the same). Let's use partition (click next).</p>", 
        "edits": [], 
        "expected": "select distinct title, (select year from *) from authors group by title"
    }, 
    {
        "doc": "<p>It is more readable. Let's keep doing more queries.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 41
            }, 
            {
                "action": "insert", 
                "what": "partition", 
                "where": 41
            }
        ], 
        "expected": "select distinct title, (select year from partition) from authors group by title"
    }, 
    {
        "doc": "<p>We do an inner group by on the grouped data. That query returns four rows\n(one per title) and each row contains a field <em>years</em> being a list of years\nassociated to the number of authors born that year (and having already been filtered on their\ntitle).</p>\n<p>But we can also extract the authors themselves instead of counting them (click next).</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "distinct ", 
                "where": 31
            }, 
            {
                "action": "insert", 
                "what": ",", 
                "where": 44
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 46
            }, 
            {
                "action": "insert", 
                "what": "count(", 
                "where": 46
            }, 
            {
                "action": "suppr", 
                "what": 7, 
                "where": 68
            }, 
            {
                "action": "insert", 
                "what": "partition", 
                "where": 68
            }, 
            {
                "action": "insert", 
                "what": "year) \nfrom authors\ngroup by ", 
                "where": 87
            }
        ], 
        "expected": "select distinct title, (select distinct year, count(partition) from partition group by year) \nfrom authors\ngroup by title"
    }, 
    {
        "doc": "<p>Now we find the original author rows in the inner list. As expected, the authors\nfound in the inner nested list are all of the corresponding title and year.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 6, 
                "where": 46
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 55
            }
        ], 
        "expected": "select distinct title, (select distinct year, partition from partition group by year) \nfrom authors\ngroup by title"
    }, 
    {
        "doc": "<p>This is it for nested queries. Now let's review the programming capabilities\nof QRAWL.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 114, 
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
                "what": "{\n    M := max(select year from authors);\n    select * from authors where year = M\n}", 
                "where": 0
            }
        ], 
        "expected": "{\n    M := max(select year from authors);\n    select * from authors where year = M\n}"
    }, 
    {
        "doc": "<p>A slightly more complicated example which would be a little hard\nto type in one single query. This returns a record with two collections\nof people.</p>\n<p>Let's have a look to functions now.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "m := min(select year from authors);\n    juniors := ", 
                "where": 46
            }, 
            {
                "action": "insert", 
                "what": "; // max\n    seniors := select * from authors where year = m; // min\n    (juniors, seniors)", 
                "where": 133
            }
        ], 
        "expected": "{\n    M := max(select year from authors);\n    m := min(select year from authors);\n    juniors := select * from authors where year = M; // max\n    seniors := select * from authors where year = m; // min\n    (juniors, seniors)\n}"
    }, 
    {
        "doc": "<p>Here we implement a helper function to compute some category\nfrom the authors titles.</p>", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 6
            }, 
            {
                "action": "insert", 
                "what": "category", 
                "where": 6
            }, 
            {
                "action": "suppr", 
                "what": 4, 
                "where": 18
            }, 
            {
                "action": "insert", 
                "what": "\\x -> if x.title = \"PhD\" then \"short-term\" else \"staff\";\n    ", 
                "where": 18
            }, 
            {
                "action": "suppr", 
                "what": 4, 
                "where": 86
            }, 
            {
                "action": "insert", 
                "what": "x.name, category(x) as cat", 
                "where": 86
            }, 
            {
                "action": "suppr", 
                "what": 15, 
                "where": 118
            }, 
            {
                "action": "insert", 
                "what": "x", 
                "where": 118
            }, 
            {
                "action": "suppr", 
                "what": 23, 
                "where": 120
            }, 
            {
                "action": "insert", 
                "what": "in", 
                "where": 120
            }, 
            {
                "action": "suppr", 
                "what": 145, 
                "where": 130
            }
        ], 
        "expected": "{\n    category := \\x -> if x.title = \"PhD\" then \"short-term\" else \"staff\";\n    select x.name, category(x) as cat from x in authors\n}"
    }
];
