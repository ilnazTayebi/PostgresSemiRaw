
var markers = [];
var queryResults = undefined;

// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){

    //  gets url parameters
    var params_data = parse_url_params();

    if( params_data['dropbox'] && params_data['dropbox'] == 'false'){
        $('#add_data_menu').remove();
        //$('#add_dropbox').remove();
        $('#add_dropbox2').remove();
        $('#save_to_dropbox').remove();
    }
    else{
        // initializes credentials using dropbox
        ini_credentials({dropbox:true});
        document.getElementById('add_dropbox').onclick = add_from_dropbox;
        document.getElementById('add_dropbox2').onclick = add_from_dropbox;
        //save to dropbox
        document.getElementById('save_to_dropbox').onclick = function(){
            //downloadJsonObj(queryResults, "data.json");
            $("#download_dialog").modal('show');
            document.getElementById('download_json').onclick = function () {
                saveObjToDropbox(  queryResults, "results.json", "json");
                $("#download_dialog").modal('hide');
            };
            document.getElementById('download_csv').onclick = function () {
                saveObjToDropbox(  queryResults, "results.csv", "csv");
                $("#download_dialog").modal('hide');
            };
            document.getElementById('download_excel').onclick = function () {
                //saveObjToDropbox(  queryResults, "results.xls", "excel");
                //$("#download_dialog").modal('hide');
            };
        };
    }

    document.getElementById('list_schemas').onclick = function() {list_schemas()};

    //$('#download_excel').prop('disabled', true);
    $("[rel=tooltip]").tooltip({ placement: 'right'});
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
//            downloadObj( queryResults, "download", "excel");
//            $("#download_dialog").modal('hide');
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
    editor.session.setUseWrapMode(true);

    var container = document.getElementById("values");
    var options = { mode: 'view' };
    var jsonEditor = new JSONEditor(container, options);

    //function to be used when a new query changes in the editor
    function post_query(){
        var query = editor.getValue();

        // if something is still ongoing, return. We do not send another
        // request while the former one hasn't returned.
        if(ongoing == true) return;

        // from here on, the server is waiting for our query.

        // do not send if the query is empty.
        if (query == "") {
            // pretend we sent it and return.
            lastQuery = "";
            setIndicatorLabel("Ready");
            removeAllErrors(editor);
            return;
        }

        // otherwise send the query.
        setIndicatorLabel("Running...");
        console.log("sending query", query);
        send_query( query, {
                success: function(data){
                    queryResults = data.output;
                    ongoing = false;

                    // what to do with these results
                    if(editor.getValue() != lastQuery) {
                        // if the editor content changed to another query
                        // in the mean time resend
                        // instead of displaying results
                        post_query();
                    }
                    else {
                        // else update plots and data displays
                        setIndicatorLabel("Ready")
                        jsonEditor.set(data.output);
                        redraw_graph( data.output);
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
                            handleQueryError(request, error, editor);
                        }
                        else if (status == 500){
                            handleServerError(request, error, editor);
                        }
                        else{
                            throw ("Unkown error status: " + status);
                            //append_error( "Internal error, exception type: " + error.exceptionType);
                        }
                    }
                }
           }
        );
        ongoing = true;
        lastQuery = query;
    }
    
    function editor_set_autoexecute(b) {
        var btn = document.getElementById('execute_btn');
        if (b) {
            btn.style.visibility = 'hidden';
            editor.getSession().on('change', function(e) { 
                if (document.getElementById("auto_query").checked){
                    removeAllErrors(editor);
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
    demo_init(editor);
    
    if( params_data["demo"] && params_data["demo"] == 'true' ){
        demo_start();
    }
    else{
        demo_stop();
    }

    // starts listing the schemas
    list_schemas();
    $('#side_panel').BootSideMenu({side:"right"});
});

