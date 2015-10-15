var steps = [
    {
        "doc": "This is the demo mode.\nWe're going to walk through a number of queries to illustrate\nthe syntax of Qrawl and show its capabilities. The code is going to be\ninserted in the editor below, feel free to edit it yourself to try things\nout. Let's start with a regular SQL like select statement (click next)", 
        "edits": [], 
        "expected": ""
    }, 
    {
        "doc": "This is listing the various fields of the records stored in the\npeople table. Since people are described by their year of birth, name\nand job, we'd like to perform now a couple of regular SQL aggregations.", 
        "edits": [
            {
                "action": "insert", 
                "what": "select * from people", 
                "where": 0
            }
        ], 
        "expected": "select * from people"
    }, 
    {
        "doc": "Here we group people by year and count the number of people in each\ngroup.", 
        "edits": [
            {
                "action": "insert", 
                "what": "year, count(", 
                "where": 7
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 20
            }, 
            {
                "action": "insert", 
                "what": ")\n", 
                "where": 20
            }, 
            {
                "action": "insert", 
                "what": "\ngroup by year", 
                "where": 33
            }
        ], 
        "expected": "select year, count(*)\nfrom people\ngroup by year"
    }, 
    {
        "doc": "Here we group people by job and report the maximum year of each\ngroup. All this is regular SQL. In Qrawl however, it is possible to\nprocess the grouped data as a collection, without explicitly performing\na numeric aggregation on it.", 
        "edits": [
            {
                "action": "suppr", 
                "what": 4, 
                "where": 7
            }, 
            {
                "action": "insert", 
                "what": "job", 
                "where": 7
            }, 
            {
                "action": "suppr", 
                "what": 4, 
                "where": 42
            }, 
            {
                "action": "insert", 
                "what": "job", 
                "where": 42
            }
        ], 
        "expected": "select job, count(*)\nfrom people\ngroup by job"
    }, 
    {
        "doc": "By removing the aggregator, we have now the actual collection of\npeople matching the job nested in each row.", 
        "edits": [
            {
                "action": "suppr", 
                "what": 6, 
                "where": 12
            }, 
            {
                "action": "suppr", 
                "what": 1, 
                "where": 13
            }
        ], 
        "expected": "select job, *\nfrom people\ngroup by job"
    }, 
    {
        "doc": "In Qrawl, this statement permits to split a collection in groups.", 
        "edits": [
            {
                "action": "suppr", 
                "what": 5, 
                "where": 6
            }
        ], 
        "expected": "select *\nfrom people\ngroup by job"
    }, 
    {
        "doc": "If willing to operate on that collection, one should use the keyword\npartition in a from. The keyword partition refers to the group of people\nwhich matched the job. From there on, one can perform arbitrary queries\non the subset, including splitting it in groups.", 
        "edits": [
            {
                "action": "suppr", 
                "what": 1, 
                "where": 7
            }, 
            {
                "action": "insert", 
                "what": "job, select year\n            from partition", 
                "where": 7
            }
        ], 
        "expected": "select job, select year\n            from partition\nfrom people\ngroup by job"
    }, 
    {
        "doc": "If willing to operate on that collection, one should use the keyword\npartition in a from. The keyword partition refers to the group of people\nwhich matched the job.", 
        "edits": [
            {
                "action": "insert", 
                "what": ", *", 
                "where": 23
            }, 
            {
                "action": "insert", 
                "what": " // partition = the people with that job\n            group by year  // '*' is the subset of people having that year", 
                "where": 53
            }
        ], 
        "expected": "select job, select year, *\n            from partition // partition = the people with that job\n            group by year  // '*' is the subset of people having that year\nfrom people\ngroup by job"
    }, 
    {
        "doc": "Here we do a couple more aggregations.", 
        "edits": [
            {
                "action": "insert", 
                "what": "(select name from partition) as names,\n                   count(", 
                "where": 25
            }, 
            {
                "action": "suppr", 
                "what": 27, 
                "where": 90
            }, 
            {
                "action": "insert", 
                "what": ") as size\n            from partition group by year,\n            count(*) as all", 
                "where": 90
            }, 
            {
                "action": "suppr", 
                "what": 12, 
                "where": 173
            }, 
            {
                "action": "insert", 
                "what": "'count' of ", 
                "where": 177
            }, 
            {
                "action": "suppr", 
                "what": 12, 
                "where": 209
            }, 
            {
                "action": "insert", 
                "what": "from people\n", 
                "where": 209
            }, 
            {
                "action": "suppr", 
                "what": 75, 
                "where": 230
            }
        ], 
        "expected": "select job, select year, (select name from partition) as names,\n                   count(*) as size\n            from partition group by year,\n            count(*) as all // the 'count' of people with that job\nfrom people\ngroup by job"
    }
];
