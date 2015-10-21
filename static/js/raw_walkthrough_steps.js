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
                "action": "insert", 
                "what": "count(publication", 
                "where": 0
            }, 
            {
                "action": "suppr", 
                "what": 20, 
                "where": 18
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 18
            }
        ], 
        "expected": "count(publications)"
    }, 
    {
        "doc": "<p>QRAWL is intended to be compatible with SQL. The query below is returning\nthe authors which are professors.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "sele", 
                "where": 0
            }, 
            {
                "action": "insert", 
                "what": "t * fr", 
                "where": 5
            }, 
            {
                "action": "insert", 
                "what": "m a", 
                "where": 12
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 16
            }, 
            {
                "action": "suppr", 
                "what": 8, 
                "where": 17
            }, 
            {
                "action": "insert", 
                "what": "hors where ", 
                "where": 17
            }, 
            {
                "action": "insert", 
                "what": "tle = \"pr", 
                "where": 30
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 40
            }, 
            {
                "action": "insert", 
                "what": "fe", 
                "where": 40
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 43
            }, 
            {
                "action": "insert", 
                "what": "sor\"", 
                "where": 43
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
                "what": 3, 
                "where": 45
            }, 
            {
                "action": "insert", 
                "what": "g", 
                "where": 45
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 47
            }, 
            {
                "action": "insert", 
                "what": "oup by", 
                "where": 47
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
                "what": 2, 
                "where": 46
            }, 
            {
                "action": "insert", 
                "what": "c", 
                "where": 46
            }, 
            {
                "action": "suppr", 
                "what": 2, 
                "where": 48
            }, 
            {
                "action": "insert", 
                "what": "unt(", 
                "where": 48
            }, 
            {
                "action": "insert", 
                "what": "partition group by year) \nfrom ", 
                "where": 68
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 106
            }, 
            {
                "action": "insert", 
                "what": "\n", 
                "where": 106
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
        "doc": "<p>A slightly more complicated example. The program returns a record with\ntwo inner collections.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "m := min(select year from authors);\n    (juniors: select * from authors where year = m, seniors: ", 
                "where": 46
            }, 
            {
                "action": "insert", 
                "what": ")", 
                "where": 179
            }
        ], 
        "expected": "{\n    M := max(select year from authors);\n    m := min(select year from authors);\n    (juniors: select * from authors where year = m, seniors: select * from authors where year = M)\n}"
    }
];
