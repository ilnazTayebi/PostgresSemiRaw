// TODO auto_query should be reset and execute button should enable/disable
// too.

var editor;
var editor_bytes;
var auto_query = null;
var comments;
var idx;
var animation_ongoing = null;

function demo_init(aceEditor) {
    editor = aceEditor;
    $('#prev').click(demo_prev);
    $('#next').click(demo_next);
    demo_stop();
}

function demo_start() {
    // save auto_query setting for later
    auto_query = $("#auto_query").attr('checked');
    $("#auto_query").prop('checked', false);
    $('#demo_mode').addClass("active");
//    $('#demoBox').css('height', '150px');
//    $('#demoBox').css('line-height', '150px');
//    $('#editor').css('height', '550px');
    $('#demoNavigation').css('visibility', 'visible');
    $('#demo_mode').click(demo_stop);
    comments = $("#demoComments");
    demo_editor_reset("");
    idx = -1;
    demo_next();
}

function demo_stop() {
    // reset auto query
    if (auto_query) {
        $("#auto_query").prop('checked', auto_query);
    }
    $('#demo_mode').click(demo_start);
    $('#demoBox').height(0);
    $('#demoComments').empty();
    $('#editor').height(700);
    $('#demo_mode').removeClass("active");
    $('#demoNavigation').css('visibility', 'hidden');
}


function demo_editor_reset(content) {
    editor.setValue(content);
    editor.navigateFileEnd();
    editor.updateSelectionMarkers();
    editor_bytes = content.split("");
}

function demo_next() {
    editor.focus();
    // disable animation if it is going on
    // reset the editor with the current step query
    if (idx == -1 || !steps[idx].expected)
        demo_editor_reset("");
    else
        demo_editor_reset(steps[idx].expected);
    // start animation of next query
    idx++;
    if (steps[idx].edits) {
        animate(steps[idx].edits);
    }
    else
        demo_comments(steps[idx].doc);
}

function demo_prev() {
}


// string processing for animation

function demo_autotype_insert(where, s) {
    var i = 0;
    var todo = [];
    for (i=0; i<s.length; i++) {
        todo.push({'action':'insert', 'where': where+i, 'what':s[i]});
    }
    return todo;
}

function demo_autotype_suppr(where, n) {
    var i = 0;
    var todo = [];
    for (i=0; i<n; i++) {
        todo.push({'action':'suppr', 'where': where});
    }
    return todo;
}

// given a list of edits to perform, split each one into single
// character operations (that part is done here in javascript) and
// build a datastructure to hold each single step (called 'todos') and
// then start the animation.

function animate(edits) {
    var todos = [];
    for (i=0; i<edits.length;i++) {
        if (edits[i].action == "insert")
            todos = todos.concat(demo_autotype_insert(edits[i].where, edits[i].what));
        else if (edits[i].action == "suppr")
            todos = todos.concat(demo_autotype_suppr(edits[i].where, edits[i].what));
    }
    var i;
    var index;
    var sleep = 50;
    function _cb() {
        // if animation was interrupted, return (typing stops)
        if (!animation_ongoing) return;
        // else perform next type
        todo = todos.shift();
        if (todo != undefined) {
            // some typing to do
            if (todo["action"] == "insert") {
                editor_bytes.splice(todo["where"], 0, todo["what"]);
                index = todo["where"]+1;
            } else if (todo["action"] == "suppr") {
                editor_bytes.splice(todo["where"], 1);
                index = todo["where"];
            } else if (todo["action"] == "pause") {
                sleep = 300;
            }
            // print on the editor and move cursor to 'index'
            editor.setValue(editor_bytes.join(""), index);
            // we have to do this to avoid some area to be selected
            editor.moveCursorToPosition(editor_cursor_pos(index));
            editor.updateSelectionMarkers();
            // schedule another call for continuing typing
            setTimeout(_cb, sleep);
        } else {
            // typing finished, print comments.
            demo_comments(steps[idx].doc);
            animation_ongoing = false;
        }
    }
    animation_ongoing = true;
    _cb();
}

function editor_cursor_pos(index) {
    var x = 0;
    var y = 0;
    var i;
    for (i=0; i<index; i++) {
        if (editor_bytes[i] == '\n') { y++; x=0; }
        else x++;
    }
    return {"column":x, "row":y}
}

function demo_comments(content) {
  $("#demoComments").fadeOut(function () {
    //$("#demoComments").text( content).fadeIn(600);
    console.log("adding content", content);
    $("#demoComments").html(  content ).fadeIn(600);
  });
}

/*
function demo_comments(content) {
  $("#demoComments").fadeOut().next().text(content).fadeIn();
}
*/
function demo_clear_comments() {
  $("#demoComments").finish().empty().fadeOut();
}


var steps = [
    {
        "doc": "<p>We're going to walk through a number of queries to illustrate \
                the syntax of Qrawl and show its capabilities. \
                The code is going to be inserted \
                in the editor below, feel free to edit it yourself to try things out. \
                Let's start with a regular SQL like select statement (click next)</p>", 
        "edits": [], 
        "expected": ""
    }, 
    {
        "doc": "<p>This is listing the various fields of the records stored in the people table.\
                Since people are described by their year of birth, name and job, \
                we'd like to perform now a couple of regular SQL aggregations.</p>", 
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
        "doc": "<p>Here we group people by year and count the number of people in each group.</p>", 
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
        "doc": "<p>Here we group people by job and report the maximum year of each group.\
                 All this is regular SQL. In Qrawl however, it is possible to process \
                the grouped data as a collection, without explicitly performing\na numeric aggregation on it.</p>", 
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
        "doc": "<p>By removing the aggregator, we have now the actual \
                collection of people matching the job nested in each row.</p>", 
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
        "doc": "<p>In Qrawl, this statement permits to split a collection in groups.</p>", 
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
        "doc": "<p>If willing to operate on that collection, one should use the keyword partition\
             in a from. The keyword partition refers to the group of people which matched \
            the job. From there on, one can perform arbitrary queries on the subset, \
            including splitting it in groups.</p>", 
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
        "doc": "<p>If willing to operate on that collection, \
                one should use the keyword partition in a from. \
                The keyword partition refers to the group of people \
                which matched the job.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "t year, * // * is the subset of people having tha", 
                "where": 17
            }, 
            {
                "action": "insert", 
                "what": " // partition = the people with that job\n            group by year", 
                "where": 99
            }
        ], 
        "expected": "select job, select year, * // * is the subset of people having that year\n            from partition // partition = the people with that job\n            group by year\nfrom people\ngroup by job"
    }, 
    {
        "doc": "<p>Here we do a couple more aggregations.</p>", 
        "edits": [
            {
                "action": "insert", 
                "what": "(select name from partition) as names,\n                   count(", 
                "where": 25
            }, 
            {
                "action": "insert", 
                "what": ") as size\n            from partition group by year,\n            count(*) as all", 
                "where": 90
            }, 
            {
                "action": "suppr", 
                "what": 5, 
                "where": 173
            }, 
            {
                "action": "suppr", 
                "what": 17, 
                "where": 177
            }, 
            {
                "action": "insert", 
                "what": "number of people wit", 
                "where": 177
            }, 
            {
                "action": "suppr", 
                "what": 4, 
                "where": 198
            }, 
            {
                "action": "insert", 
                "what": " that job\nfrom people\n", 
                "where": 198
            }, 
            {
                "action": "suppr", 
                "what": 73, 
                "where": 221
            }, 
            {
                "action": "insert", 
                "what": "roup by", 
                "where": 221
            }, 
            {
                "action": "suppr", 
                "what": 51, 
                "where": 232
            }
        ], 
        "expected": "select job, select year, (select name from partition) as names,\n                   count(*) as size\n            from partition group by year,\n            count(*) as all // the number of people with that job\nfrom people\ngroup by job"
    }
]
;


