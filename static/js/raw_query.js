//dropbox credentials
var credentials = undefined;
var markers = [];
var queryResults = undefined;

// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){
    $('#side_panel').BootSideMenu({side:"right"});

    // will authenticate with dropbox
    var client = new Dropbox.Client({ key: "f64lfu3jyw86z4t" });

    // Try to finish OAuth authorization.
    client.authenticate({interactive: true}, function (error) {
        if (error) {
            append_error( 'Authentication error: ' + error);
        }
    });

    //alert(client.isAuthenticated());

    if (client.isAuthenticated()) {
        // Client is authenticated. Display UI.
        credentials = client._credentials;
        console.log(credentials);
    }

    document.getElementById('add_dropbox').onclick = add_from_dropbox;
    document.getElementById('add_dropbox2').onclick = add_from_dropbox;
    document.getElementById('list_schemas').onclick = function() {list_schemas()};

    //download results
    document.getElementById('download_results').onclick = function(){
        //downloadJsonObj(queryResults, "data.json");
        $("#download_dialog").modal('show');
        document.getElementById('download_json').onclick = function () {
            downloadObj( queryResults, "results.json", "json");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_csv').onclick = function () {
            downloadObj( queryResults, "results.csv", "csv");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_excel').onclick = function () {
            downloadObj( queryResults, "download", "excel");
            $("#download_dialog").modal('hide');
        };
    };

    //save to dropbox
    document.getElementById('save_to_dropbox').onclick = function(){
        //downloadJsonObj(queryResults, "data.json");
        $("#download_dialog").modal('show');
        document.getElementById('download_json').onclick = function () {
            saveObjToDropbox( client , queryResults, "results.json", "json");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_csv').onclick = function () {
            saveObjToDropbox( client , queryResults, "results.csv", "csv");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_excel').onclick = function () {
            saveObjToDropbox( client, queryResults, "results.xls", "excel");
            $("#download_dialog").modal('hide');
        };
    };


    var editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;

    var lastQuery = "";
    var ongoing = false;

    editor.setTheme("ace/theme/ambiance");
    editor.getSession().setMode("ace/mode/qrawl");
    //Syntax checker in ace uses same setAnnotations api, and clears old anotations.
    // check http://stackoverflow.com/questions/25903709/ace-editors-setannotations-wont-stay-permanent
    editor.session.setOption("useWorker", false);

    var container = document.getElementById("values");
    var options = { mode: 'view' };
    var jsonEditor = new JSONEditor(container, options);

    //function to be used when a new query changes in the editor
    function post_query(){
        // if something is still ongoing returns
        if(ongoing == true) return;
        ongoing = true;
        setIndicatorLabel("Running...");

        var query = editor.getValue();
        console.log("sending query", query);
        send_query( query, {
                success: function(data){
                    queryResults = data.output;
                    ongoing = false;
                    setIndicatorLabel("Ready")
                    jsonEditor.set(data.output);

                    // here refreshes the graphs
                    redraw_graph( data.output);
                    //jsonEditor.expandAll();
                    //if the query changed in the mean time resend
                    if(editor.getValue() != lastQuery){
                        post_query();
                    }
                    else{
                        removeAllErrors(editor);
                    }
                },
                error : function(request, status, error) {
                    
                    console.log("request", request);
                    console.log("Error", error);
                    console.log("status", status);
                    ongoing = false;
                    setIndicatorLabel("Error");

                    //if the query changed in the mean time resend
                    if(editor.getValue() != lastQuery){
                        post_query();
                    }
                    else{
                        removeAllErrors(editor);
                        error = JSON.parse(error);
                        if (status == 400) {
                            handleQueryError(request, error, editor)
                        }
                        else{
                            append_error( "Internal error, exception type: " + error.exceptionType);
                        }
                    }
                }
           }
        );
        lastQuery = query;
    }
    
    
    function editor_set_autoexecute(b) {
        var btn = document.getElementById('execute_btn');
        if (b) {
            btn.style.visibility = 'hidden';
            editor.getSession().on('change', function(e) { 
                if (document.getElementById("auto_query").checked){
                    post_query(); 
                }
            });
        } else {
            editor.getSession().on('change', function(e) {});
            btn.style.visibility = 'visible';
        }
    }

    editor_set_autoexecute(true);

    document.getElementById('execute_btn').onclick =  post_query;

    document.getElementById('auto_query').onchange = function(){
        if (document.getElementById("auto_query").checked){
            editor_set_autoexecute(true);
        }
        else{
            editor_set_autoexecute(false);
        }
    }

    // init demo stuff, pointing it to the editor
    demo_init(editor, post_query, editor_set_autoexecute);

    // starts listing the schemas
    list_schemas();
});

function saveObjToDropbox(client, obj, filename, format){
    client.writeFile(filename, formatResults( obj, format) , function (error) {
        if (error) {
            append_error('Could not save ' + filename  + ' , erro:' + error);
        } else {
            append_alert('File ' + filename  + ' saved in your dropbox');
        }
    });
}

// transforms an obj to json, csv or html-table (excel)
function formatResults(obj, format){
    switch (format){
        case "json":
            var ident = 2;
            return JSON.stringify(obj, null, ident);
        case "csv":
            return objToCSV(obj);
        case "excel":
            // no header for the time being
            return objToHtmlTable(obj, true);
    }
}

// function to download result from a query 
function downloadObj(obj, filename, format){ 
    //TODO: check if there are limits in the size of data for encodeURIComponent
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent( formatResults( obj, format));
    var dlElem = document.getElementById('downloadAnchorElem');
    dlElem.setAttribute("href", dataStr);
    dlElem.setAttribute("download", filename);
    dlElem.click();
}

//Will handle query errors (status 400 from scala server)
// and update the UI elements (ace editor etc)
function handleQueryError(request, error, editor){
    console.log("Got status 400");
    // will store all error markers here 
    var e = [];
    console.log("Error type", error.errorType);
    switch (error.errorType){
        case "SemanticErrors":
            var errorList = error.error.errors;
            for (var n in errorList){
                var marker = {
                    errorType : errorList[n].errorType,
                    line : errorList[n].position.line,
                    column : errorList[n].position.column,
                    source : errorList[n].position.source,
                    message : errorList[n].prettyMessage
                }
                e.push(marker);
            }
            break;
        case "ParserError":
            var marker = {
                errorType : error.errorType,
                line : error.error.position.line,
                column : error.error.position.column,
                source : error.error.position.source,
                message : error.error.prettyMessage
            }
            e.push(marker);
            break;
        default:
            throw ("Unknown Error error type " + error.errorType);
    }
    addErrorMarkers(editor, e);
}



// will add a list of markers and annotations for errors in ACE editor
function addErrorMarkers(editor, errors){

    var annotations = [];
    for (var n in errors){
        // this is because there is some sort of bug in the error reporting
        // so UnexpectedType start in (0,0) and everythign else starts at (1,1)
        if (errors[n].errorType == "UnexpectedType"){
            errors[n].line += 1;
            errors[n].column += 1;
        }
        var Range = ace.require('ace/range').Range;
        var e = errors[n];
        console.log("Adding error", e);
        var range = new Range(e.line -1 , e.column-1, e.line-1,  e.column);
        //check "ace_selected_word" instead of "text"
        var m1 = editor.session.addMarker(range, "queryError", "text");
        markers.push(m1);
        //var m2 = editor.session.addMarker(range, "errorHighlight", "fullLine");
        //markers.push(m2);

        var  a =  {
            row: e.line -1,
            column: 0,
            text: e.message,
            type: "error" // also warning and information
        }

        annotations.push(a)
    }

    editor.session.setAnnotations( annotations );
}

// removes all errors and markers added by addErrorMarkers
function removeAllErrors(editor){
    for (n in markers){
        editor.session.removeMarker(markers[n]);
    }
    //checked tha API and could not find remove annotation function
    editor.session.setAnnotations( [] );
}

// sets the label on the top of the query
function setIndicatorLabel(label){
    $("#indicator").removeClass("label-success");
    $("#indicator").removeClass("label-danger");
    $("#indicator").removeClass("label-info");

    switch(label){
        case "Ready":
            $("#indicator").addClass("label-success");
            $("#indicator").text("Ready");
            break;
        case "Error":
            $("#indicator").addClass("label-danger");
            $("#indicator").text("Error");
            break;
        case "Running...":
            $("#indicator").addClass("label-info");
            $("#indicator").text("Running...");
            break;
        default:
            throw ("wrong indicator label");
    }
    
}

//helper function that transforms an object returned from the dropbox chooser
// to something that we can register in our server
function get_dropbox_options(selection){

    var option_list = [];
    for(n in selection){
        var options = {protocol : 'url'};
        // removes everything after the ?
        // and adds the dl=1 option
        options.url = selection[n].link.split('?')[0];
        options.url +='?dl=1'
        
        console.log(selection);
        options.filename = selection[n].name;
        var extension =selection[n].name.split('.').pop();
        options.name = selection[n].name.split('.')[0];
        //cleans the not permited characters 
        options.name = options.name.replace(/[ \.~-]/g,'_')
        switch(extension){
            case 'json':
                options.type = 'json';
                break;
            case 'csv' :
                options.type = 'csv';
                break;
            default:
                options.type = 'select';
                //throw " unsuported file type " + extension ;
        }
        option_list.push(options);
    }
    return option_list;
}

// will start the dropbox chooser and register files from dropbox
function add_from_dropbox(){
    var options = {
        // Required. Called when a user selects an item in the Chooser.
        success: function (files){
            var options = get_dropbox_options(files);
            var inputs = add_files_to_dialog(options);

            document.getElementById("register_button").onclick = function(){
                for(n in options){
                    var f = options[n];

                    f.name = $("#"+inputs[n].name).val();
                    f.type = $("#"+inputs[n].type).val();
                    register_file(f, {
                        success: function(data) {
                           console.log(data);
                           append_alert('File ' + data.name  + ' registered');
                            // list the schemas again 
                           list_schemas();
                        },
                        error : function(request, status, error) {
                            var response = JSON.parse(request.responseText);
                            append_error("Error registering file '" + response.name + "' : "+ response.output);
                        }
                     });
                    //closes the dialog
                    $("#register_dialog").modal('hide');
               }
            }

            $("#register_dialog").modal('show');
        },
        cancel: function() { },
        multiselect: true //selection of multiple files
    };

    Dropbox.choose(options);
}

//will add items to select name and file type for the files selected in the dialog
// returns an array of objects with the ids of the inputs added {name, type}
function add_files_to_dialog(files){
    
    $("#modal_body").empty();
    $('<label>Write here the name you\'d like to use</label>').appendTo("#modal_body");
    var inputs = [];
    for( n in files){
        var f = files[n];
        var id = f.filename.replace(/[ \.~-]/g,'_');
        var i = {name : 'n_'+id, type : 't_'+id};
        inputs.push(i);
        console.log('adding file', f);
        $('<div class="form-group">\
            <div class="input-append">\
              <input type="text" class="form-control" id="' + i.name + '" placeholder="file name" style="float:left;width:80%;">\
              <div class="btn-group" style=style="float:right;">\
                <select class="form-control" id="'+ i.type +'">\
	                <option value="csv">CSV</option>\
	                <option value="json">JSON</option>\
                </select>\
              </div>\
            </div>\
        </div>').appendTo("#modal_body");

        $("#"+i.name).val(f.name);
        $("#"+i.type).val(f.type);
   }

    // adds the button at the end
    $('<button type="submit" class="btn btn btn-success" id = "register_button">\
        <span class="glyphicon glyphicon-ok-sign"></span>  Go !</button>').appendTo("#modal_body");
    return inputs;
}

//function to append success message to the alert pane
function append_alert(msg){
    $('<div class="alert alert-success alert-dismissable">'+
            '<button type="button" class="close" ' + 
                    'data-dismiss="alert" aria-hidden="true">' + 
                '&times;' + 
            '</button>' +  
            msg + 
         '</div>').appendTo("#alerts");

    $('.alert').fadeOut(5000);
}

//function to append error message to the alert pane
function append_error(msg){
    $('<div class="alert alert-danger">'+
            '<button type="button" class="close" ' + 
                    'data-dismiss="alert" aria-hidden="true">' + 
                '&times;' + 
            '</button>' +  
            msg + 
         '</div>').appendTo("#alerts");
}

//TODO: make the post connect json instead of url encoded (check server.py also)
//function to send a query to the query service
// arg: query, the query string
// arg: callbacks, callbacks from when the post finishes, (see jquery ajax post)
//     success: the sucess callback function, prototype:  function(data)
//     error, the error callback function, prototype:  function(request, status, error) 
function send_query(query, callbacks){
    var data = {
        query : query,
        token : credentials.token
    }

    http_json_request('POST', '/query' , data , callbacks)
}

//registers file for querying 
function register_file(options, callbacks){
    // adds the token to the data to send
    options.token = credentials.token;
    http_json_request("POST", '/register-file', options, callbacks)
}

//sends the request to list the schemas
function get_schema_list(module, callbacks){
    var data = {
        module : module,
        token : credentials.token
    }

    http_json_request("POST", "/schemas", data, callbacks);
}

// sends url enconded request using XMLHttpRequest (ajax did not work with redirects with all browsers)
function http_url_encoded(method, url, data, callbacks){
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    var params ="";
    for(name in data){
         params += name + '=' +escape(data[name]) + '&'
    }
    //Send the proper header information along with the request
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.onreadystatechange=function(){
        if (request.readyState==4) {
            if (request.status==200){
                var data = JSON.parse( request.response )
                callbacks.success(data);
            }
            else{
                callbacks.error( request, request.status, request.responseText)
            }
       }
    }
    request.send(params);
}

// sends json request using XMLHttpRequest
function http_json_request(method, url, data, callbacks){
    var request = new XMLHttpRequest();
    request.open(method, url, true);
   
    //Send the proper header information along with the request
    request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    request.onreadystatechange=function(){
        if (request.readyState==4) {
            if (request.status==200){

                var data = JSON.parse( request.response )
                callbacks.success(data);
            }
            else{
                callbacks.error( request, request.status, request.responseText)
            }
       }
    }
    request.send(JSON.stringify(data));
}

//Will get the schemas and update the UI
function list_schemas(){
    get_schema_list( "User", {
        success: function(data) {
            $("#schemas").empty();
            var tree =[];
            function get_parent(name){
                for (n in tree){
                    if (name == tree[n].text){
                        if (! tree[n].nodes)tree[n].nodes = [];
                        return tree[n];
                   }
                }
                var node ={text: name , nodes : []} ; 
                tree.push(node);
                return node
            }

            function node_exists(name){
                for (n in tree){
                    if (name == tree[n].text) return true;
                }
                return false;
            }

            for(n in data.schemas){
         
                var node = {text : data.schemas[n] };
                var items = node.text.split("_");
                //TODO: check for a better way to find out if it is an internal extent 
                if (items.length >= 3 && items[0] == "s"){
                    // We will not insert these items for the moment
                    // then tries to find the parent
                    //var parent = get_parent(items[1]);
                    //parent.nodes.push(node);
                }
                else if (! node_exists(node.text)){
                    tree.push(node);
                }
            }
            $('#schema_tree').treeview({data: tree });
        },
        error : function(response, status, error) {
            console.log(response);
            append_error(response.responseText);
        }
     });
}
