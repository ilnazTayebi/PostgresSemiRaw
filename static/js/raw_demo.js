
// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){

    $('#side_panel').BootSideMenu({side:"right"});

    var params = parse_url_params();
    if (params['dropbox'] && params['dropbox'] == 'true'){
        // initializes credentials using dropbox
        ini_credentials({dropbox:true});
    }
    else if ( params['user'] && params['password']){
        ini_credentials({
            basic_auth : true,
            user: params.user,
            password : params.password
        });
    }

    $('#get_next').prop('disabled', true);
    $('#get_all').prop('disabled', true);

    $('#list_schemas').on('click', function(e){ list_schemas()});

    $("[rel=tooltip]").tooltip({ placement: 'right'});
    //download results
    $('#download_results').on("click", function(e){
        //downloadJsonObj(queryResults, "data.json");
        $("#download_dialog").modal('show');
        $('#download_json').on( "click", function (e) {
            downloadObj( queryResults, "results.json", "json");
            $("#download_dialog").modal('hide');
        });
        $('#download_csv').on( 'click', function (e) {
            downloadObj( queryResults, "results.csv", "csv");
            $("#download_dialog").modal('hide');
        });
        $('#download_excel').on( 'click', function (e) {
//            downloadObj( queryResults, "download", "excel");
//            $("#download_dialog").modal('hide');
        });
    });

    var editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;

    editor.setTheme("ace/theme/ambiance");
    editor.getSession().setMode("ace/mode/qrawl");
    //Syntax checker in ace uses same setAnnotations api, and clears old anotations.
    // check http://stackoverflow.com/questions/25903709/ace-editors-setannotations-wont-stay-permanent
    editor.session.setOption("useWorker", false);
    editor.session.setUseWrapMode(true);

    var container = document.getElementById("json_editor");
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

    $('#execute_btn').on('click', function(e){ 
        console.log("editor", editor);
        post_query(editor, jsonEditor);
    });

    $('#auto_query').on( "change", function(e){
        if (document.getElementById("auto_query").checked){
            editor_set_autoexecute(true);
        }
        else{
            editor_set_autoexecute(false);
        }
    });

    // init demo stuff, pointing it to the editor
    demo_init(editor);
    demo_start(params["section"]);

    // starts listing the schemas
    list_schemas();

});

