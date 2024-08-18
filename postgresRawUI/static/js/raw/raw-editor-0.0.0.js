// State Machine:
//                                                      ----------[play]-----------------------------------
//        ---------onChange----------                   |                          -------[next]-------   |
//        |                         |                   |                          |                  |   |
//       \/                     INVALID(*)             \/                         \/                PARTIALLY_DONE
//   VALIDATING ---response---> VALIDATED --[play]--> EXECUTING ---response---> POLLING ---data---> DONE/STOPPED(*) |
//     ^^^^^|                       |                    |  ^                    ^| |                | |    |
//     ||||--                       |                    |  |                    -- |                | |    |
//     |||---------onChange----------                    |  ------[play]------------|----------------- |    |
//     ||----------onChange-------------------------------                          |                  |    |
//     ||----------onChange----------------------------------------------------------                  |    |
//     |-----------onChange-----------------------------------------------------------------------------    |
//     ------------onChange----------------------------------------------------------------------------------
//
// Every state transition increments a counter: the counter is used in the closure of async calls to know if the response
// should trigger a state transition, i.e. if it corresponds to the last issued request, or whether it should be ignored,
// i.e. if it is a response from an expired request and should be ignored.
//
// (*) States DONE and INVALID have two variations: one that corresponds to a "successful" request, and one that
//     corresponds to a server error.
//
function RawEditor(element, content, options) {
    var mode = "ace/mode/qrawl";
    var theme = "ace/theme/github";
    this.url = "http://localhost:54321"
    this.numberResults = 1000;
    this.token = undefined;
    this.sources = undefined;
    if (options) {
        mode = options.mode || mode;
        theme = options.theme || theme;
        this.url = options.url || this.url;
        this.numberResults = options.numberResults || this.numberResults;
        this.token = options.token || this.token;
        this.sources = options.sources || undefined;
    }

    this.endpoints = {
        query_start: this.url + "/async-query-start",
        query_next: this.url + "/async-query-next",
        query_close: this.url + "/async-query-close",
        query_validate: this.url + "/query-validate"
    };

    this.editor = ace.edit(element);
    this.editor.setTheme(theme);
    this.editor.getSession().setMode(mode);
    this.editor.$blockScrolling = Infinity;

    this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        });

    // Syntax checker in ACE uses same setAnnotations API, and clears old anotations.
    // (Refer to http://stackoverflow.com/questions/25903709/ace-editors-setannotations-wont-stay-permanent)
    this.editor.session.setOption("useWorker", false);

    this.editor.session.setUseWrapMode(true);

    if (this.sources) {
        var langTools = ace.require("ace/ext/language_tools");
        var wordList = this.sources
        var staticSourceCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
                callback(null, wordList.map(function(word) {
                    return {
                        caption: word,
                        value: word,
                        meta: "source"
                    };
                }));

            }
        }
        langTools.addCompleter(staticSourceCompleter);
    }

    // CSS
    var sheet = window.document.styleSheets[0]
    sheet.insertRule(".queryError { position: absolute; }", sheet.cssRules.length);
    sheet.insertRule(".queryError::before { position: absolute; content: '^^'; top: +80%; color: red; font-size: 60%; }", sheet.cssRules.length);

    // Set content
    this.editor.setValue(content, 1);

    // State-specific variables
    this.pollId = options.pollId;   // Poll ID used in poll()
    this.markers = [];              // Used to remember the markers added to ACE
}

//
// User-defined input functions
//
RawEditor.prototype.onEditorChange = function() {};

//
// User-defined callback functions
//
RawEditor.prototype.onValidateSend = function() {};
RawEditor.prototype.onValidateReceive = function(success) {};
RawEditor.prototype.onValidateError = function(error) {};
RawEditor.prototype.onQuerySend = function(first) {};
RawEditor.prototype.onQuerySent = function() {};
RawEditor.prototype.onQueryReceive = function(data) {};
RawEditor.prototype.onQueryError = function(error) {};
RawEditor.prototype.onQueryDone = function(data) {};
//
// Public Interface
//

RawEditor.prototype.start = function(state) {
    this.state = state;

    // Start state machine
    this.stateCounter = 0;
    this.state = state;
    if (state === "VALIDATING") {
        this.validateQuery();
    } else if (state === "INVALID") {
        this.validateQuery();      // Since we don't store the markers, we must re-validate the query
    } else if (state === "EXECUTING") {
        this.play();
    } else if (state === "POLLING") {
        if (typeof this.pollId === 'undefined') {
            //If error occurred in getting next result, go back to VALIDATED
            this.validateQuery();
        }
        this.poll();
    }

    var obj = this;
    this.editor.getSession().on('change',function(e) {
        // Call the client's on('change') callback
        obj.onEditorChange();
        // Now implement our own on('change') behaviour
        obj.validateQuery();
    });
}

RawEditor.prototype.disable = function() {
    // TODO
}

RawEditor.prototype.enable = function() {
    // TODO
}

RawEditor.prototype.getValue = function() {
    return this.editor.getValue();
}

RawEditor.prototype.getState = function() {
    return {
        url: this.url,
        sql: this.editor.getValue(),
        state: this.state,
        pollId: this.pollId};
}

RawEditor.prototype.play = function() {
    // Close the previous query to prevent thread-leaks at the server.
    if (typeof this.pollId !== 'undefined' && this.pollId !== null) {
        this.close(this.pollId)
        this.pollId = null
    }
    this.onQuerySend(true);
    this.setState("EXECUTING");
    var myStateCounter = this.stateCounter;
    var data = {
        query: this.editor.getValue()
    };
    var obj = this;
    var callbacks = {
        success: function(response) {
            if (obj.stateCounter === myStateCounter) {
                obj.pollId = response.queryId;
                obj.poll();
            } else {
                // This is an answer for an old query, close it at the server
                obj.close(response.queryId)
            }
        },
        error: function(request, status, response) {
            if (obj.stateCounter === myStateCounter) {
                if (request.status == 400) {
                    obj.onQueryError("Query is invalid");
                    var error = JSON.parse(response);
                    obj.handleError(request, error);
                } else if (request.status == 401) {
                    obj.onQueryError("Unauthorized; please login again");
                } else if (request.status == 500) {
                    obj.onQueryError("Internal error");
                } else if (request.status == 0 || request.status == 502) {
                    obj.onQueryError("Could not reach RAW server; try again later");
                } else {
                    throw new Error("Unhandled status: " + request.status)
                }
                obj.setState("DONE");
            }
        }
    };
    this.doRequest("POST", this.endpoints.query_start, data, callbacks);
}

RawEditor.prototype.stop = function() {
    if (typeof this.pollId !== 'undefined' && this.pollId !== null) {
        this.close(this.pollId)
        this.pollId = null
    }
    this.setState("STOPPED");
}


RawEditor.prototype.next = function() {
    if (this.state !== "PARTIALLY_DONE") {
        throw new Error("Cannot next if not PARTIALLY_DONE");
    }
    this.poll();
}

//
// Private Methods
//

RawEditor.prototype.close = function(pollId) {
    console.log("Closing query: " + pollId)
    var data = {
        queryId: pollId,
    };
    // Fire and forget
    var callbacks = {
        success: function(response) {},
        error: function(request, status, response) {}
    };
    this.doRequest("POST", this.endpoints.query_close, data, callbacks);
}

RawEditor.prototype.poll = function() {
    this.onQuerySent();
    if (this.state !== "EXECUTING" && this.state !== "POLLING" && this.state !== "PARTIALLY_DONE" ) {
        // the query was stopped by the user.
        console.log("Skipping poll. State: " + this.state)
        return
    }
    this.setState("POLLING");
    var myStateCounter = this.stateCounter;
    var data = {
        queryId: this.pollId,
        numberResults: this.numberResults
    };
    var obj = this;
    var callbacks = {
        success: function(response) {
            if (obj.stateCounter === myStateCounter) {
                if (response.size > 0 || !response.hasMore) {
                    obj.onQueryReceive(response);
                    if (response.hasMore) {
                        obj.setState("PARTIALLY_DONE");
                    } else {
                        obj.pollId = null
                        obj.setState("DONE");
                        obj.onQueryDone(response);
                    }
                } else {
                    setTimeout(function() { obj.poll(); }, 10);
                }
            }
        },
        error: function(request, status, response) {
            if (obj.stateCounter === myStateCounter) {
                if (request.status == 400) {
                    obj.onQueryError("Query is invalid");
                    var error = JSON.parse(response);
                    obj.handleError(request, error);
                } else if (request.status == 401) {
                    obj.onQueryError("Unauthorized; please login again");
                } else if (request.status == 500) {
                    obj.onQueryError("Internal error");
                } else if (request.status == 0 || request.status == 502) {
                    obj.onQueryError("Could not reach RAW server; try again later");
                } else {
                    throw new Error("Unhandled status: " + request.status)
                }
                obj.pollId = null
                obj.setState("DONE");
            }
        }
    };
    this.doRequest("POST", this.endpoints.query_next, data, callbacks);
}

RawEditor.prototype.setState = function(newState) {
    if (this.state === "VALIDATING") {
        if (newState === "VALIDATING") {
            ;
        } else if (newState === "VALIDATED") {
            ;
        } else if (newState === "INVALID") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "VALIDATED") {
        if (newState === "VALIDATING") {
            ;
        } else if (newState === "EXECUTING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "INVALID") {
        if (newState === "VALIDATING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "EXECUTING") {
        if (newState === "POLLING") {
            ;
        } else if (newState === "VALIDATING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "POLLING") {
        if (newState === "POLLING") {
            ;
        } else if (newState === "DONE") {
            ;
        } else if (newState === "STOPPED") {
            ;
        } else if (newState === "PARTIALLY_DONE") {
            ;
        } else if (newState === "VALIDATING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "DONE") {
        if (newState === "VALIDATING") {
            ;
        } else if (newState === "EXECUTING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "STOPPED") {
        if (newState === "VALIDATING") {
            ;
        } else if (newState === "EXECUTING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else if (this.state === "PARTIALLY_DONE") {
        if (newState === "VALIDATING") {
            ;
        } else if (newState === "EXECUTING") {
            ;
        } else if (newState === "POLLING") {
            ;
        } else {
            throw new Error("Invalid state transition from " + this.state + " to " + newState)
        }
    } else {
        throw new Error("Invalid state " + this.state)
    }
    this.state = newState;
    this.stateCounter += 1;
}

RawEditor.prototype.validateQuery = function() {
    this.onValidateSend();
    this.setState("VALIDATING");
    this.removeAllErrors();
    var myStateCounter = this.stateCounter;
    var data = { query: this.editor.getValue() };
    // An empty query always validates to true
    if (data.query.trim().length == 0) {
        this.onValidateReceive(true);
        this.setState("VALIDATED");
        return;
    }
    var obj = this;
    var callbacks = {
        success: function(response) {
            if (obj.stateCounter === myStateCounter) {
                obj.onValidateReceive(true);
                obj.setState("VALIDATED");
            }
        },
        error: function(request, status, response) {
            if (obj.stateCounter === myStateCounter) {
                if (request.status == 400) {
                    var error = JSON.parse(response);
                    obj.onValidateReceive(false);
                    obj.handleError(request, error);
                } else if (request.status == 401) {
                  obj.onValidateError("Unauthorized; please login again");
                } else if (request.status == 500) {
                    obj.onValidateError("Internal error");
                } else if (request.status == 0 || request.status == 502) {
                    obj.onValidateError("Could not reach RAW server; try again later");
                } else {
                    throw new Error("Unhandled status: " + request.status)
                }
                obj.setState("INVALID");
            }
        }
    };
    this.doRequest("POST", this.endpoints.query_validate, data, callbacks);
}

// Adds list of markers and annotations to the ACE editor
RawEditor.prototype.addErrorMarkers = function(errors) {
    var annotations = [];
    for (var n = 0; n < errors.length; n++) {
        for(var i = 0; i < errors[n].positions.length; i++) {
            var pos = errors[n].positions[i];
            this.addSquiglylines(pos, errors[n].message, annotations)
        }
    }
    this.editor.session.setAnnotations(annotations);
}

// Removes all markers
RawEditor.prototype.removeAllErrors = function() {
    for (n = 0; n < this.markers.length; n++) {
        this.editor.session.removeMarker(this.markers[n]);
    }
    this.editor.session.setAnnotations([]);
}

// Adds a squigly lines, from a position and a message,
// TODO: Check if there is a better way of adding squigly lines in the ACE editor.
//       The following is a HACK, but the Ace editor doesn't seem to support an alternative method.
RawEditor.prototype.addSquiglylines = function(pos, msg, annotations) {
    var obj = this;
    var addmarker = function(p, type) {
        if(pos.begin.line == p.end.line && 
                pos.begin.column == p.end.column) {
            pos.end.column ++;
        }
        var Range = ace.require('ace/range').Range;
        var range = new Range(p.begin.line - 1, p.begin.column - 1,
                                p.end.line - 1, p.end.column - 1);

        var m1 = obj.editor.session.addMarker(range, type, "text");
        obj.markers.push(m1);
        var a = {
            row: pos.begin.line-1,
            column: 0,
            text: msg,
            type: "error" // also warning and information
        }
        annotations.push(a);
    };

    var mark = function(line, start, end) {
        if (end == start) end++;
        for (var n = start ; n < end ; n++) {
            addmarker({
                begin: {line: line, column: n},
                end: {line: line, column: n+1}
                },
                "queryError");
        }
    };

    if (pos.begin.line == pos.end.line) {
        mark(pos.begin.line, pos.begin.column, pos.end.column);
    } else {
        var lines = obj.editor.getValue().split('\n');
        // first line marks till the end
        var text = lines[pos.begin.line];
        mark(pos.begin.line, pos.begin.column, text.length);
        for(var n = pos.begin.line ; n < pos.end.line-1 ; n++) {
            mark(n, 1, lines[n].length+1);
        }
        mark(pos.end.line, 0, pos.end.column);
    }
    //addmarker(pos,  "errorHighlight");
}

RawEditor.prototype.handleError = function(request, error) {
    var markers = [];
    switch (error.errorType) {
        case "raw.model.SemanticErrors":
            var errorDescription = JSON.parse(error.errorDescription);
            var errorList = errorDescription.errors;
            for (var n = 0; n < errorList.length; n ++) {
                var marker = {
                    positions: errorList[n].positions,
                    message: errorList[n].message
                }
                markers.push(marker);
            }
            break;
        case "raw.model.ParserError":
            var errorDescription = JSON.parse(error.errorDescription);
            var lines = this.editor.getValue().split('\n');
            var pos = {
                begin: errorDescription.position.begin,
                end: {
                    line: lines.length,
                    column: lines[lines.length-1].length + 1
                }
            }
            var marker = {
                positions: [pos],
                message: errorDescription.message
            }
            markers.push(marker);
            break;
        case "raw.runtime.RegexRuntimeError":
            var errorDescription = JSON.parse(error.errorDescription);
            var lines = this.editor.getValue().split("\n");
            for (var row = 0 ; row < lines.length; row++) {
                var column = lines[row].indexOf(errorDescription.regex);
                if (column != -1) {
                    var marker = {
                        positions: [{
                            begin: {line: row + 1, column: column + 1},
                            end: { line: row + 1, column: column + 1 + errorDescription.regex.length } }],
                        message: "Incompatible input: " + errorDescription.input
                    }
                    markers.push(marker);
                }
            }
            break;
        default:
            throw new Error("Unhandled error type: " + error.errorType);
    }
    this.addErrorMarkers(markers);
}

RawEditor.prototype.doRequest = function(method, url, data, callbacks) {
    RawUtils.doRequest(method, url, data, callbacks, this.token);
}
