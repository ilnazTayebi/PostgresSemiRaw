
// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){

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

    editor.setTheme("ace/theme/ambiance");
    editor.getSession().setMode("ace/mode/qrawl");
    //Syntax checker in ace uses same setAnnotations api, and clears old anotations.
    // check http://stackoverflow.com/questions/25903709/ace-editors-setannotations-wont-stay-permanent
    editor.session.setOption("useWorker", false);
    editor.session.setUseWrapMode(true);

    var container = document.getElementById("values");
    var options = { mode: 'view' };
    var jsonEditor = new JSONEditor(container, options);

    function editor_set_autoexecute(b) {
        var btn = document.getElementById('execute_btn');
        if (b) {
            btn.style.visibility = 'hidden';
            editor.getSession().on('change', function(e) { 
                if (document.getElementById("auto_query").checked){
                    removeAllErrors(editor);
                    post_query(editor, jsonEditor);
                }
            });
        } else {
            editor.getSession().on('change', function(e) {});
            btn.style.visibility = 'visible';
        }
    }

    editor_set_autoexecute(true);

    document.getElementById('execute_btn').onclick = function(){ 
        console.log("editor", editor);
        post_query(editor, jsonEditor);
    };

    document.getElementById('auto_query').onchange = function(){
        if (document.getElementById("auto_query").checked){
            editor_set_autoexecute(true);
        }
        else{
            editor_set_autoexecute(false);
        }
    }

    // starts listing the schemas
    list_schemas();
    $('#side_panel').BootSideMenu({side:"right"});
});

