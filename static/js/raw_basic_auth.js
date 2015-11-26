
// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){
    $('#side_panel').BootSideMenu({side:"right"});
    
    $('#get_next').prop('disabled', true);
    $('#get_all').prop('disabled', true);

    var params = parse_url_params();
    //for test purpose we use dropbox authentication 
    if (params['dropbox'] && params['dropbox'] == 'true'){
        // initializes credentials using dropbox
        ini_credentials({dropbox:true});
    }
    else if ( params['user'] && params['password']){
        console.log("initializing basic auth credentials");
        ini_credentials({
            basic_auth : true,
            user: params.user,
            password : params.password
            
        });
    }

    //document.getElementById('add_data').onclick = add_from_local;
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
});

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        console.log(i,"file" ,f);
    }

    var options = get_dropbox_options(files);
    var inputs = add_files_to_dialog(options);
    document.getElementById("register_button").onclick = function(){
        var ok = true;
        var files = [];
        for(n in options){
            var f = options[n];
            f.name = $("#"+inputs[n].name).val();
            f.type = $("#"+inputs[n].type).val();
            //if (f.type == null) ok = false;
            files.push(f)
        }
        if(ok){
            for (n in files){
                console.log("registering file ", files[n]);
                register_file(files[n], upload_alerts);
            }
            //closes the dialog
            $("#register_dialog").modal('hide');
       }
        
    }

    $("#register_dialog").modal('show');
}

function append_alert(msg, level){

	var m = $('<div class="col-lg-12 alert ">'+
            msg + '</div>')
            .appendTo("#alerts");

	m.addClass(level);
}

setInterval(refresh_info, 3000);
function refresh_info(){
    http_json_request("GET", "/sniff/last_status", undefined, {
        success: function(data){

            var status = data.status;
            if (status.length > 0) console.log("got new data", status);
            for (var n = 0 ; n <  status.length ; n++){
                msg =  status[n].msg
				switch( data.status[n].type){
					case 'error':
						append_alert(msg, 'alert-danger')
						break; 
					case 'response-error':
					    msg = '<p>' + msg.msg + '</p>'+ msg.response.message ;
					    console.log("response-error", msg);
						append_alert(msg, 'alert-danger')
						break; 
					case 'warning':
						append_alert(msg, 'alert-warning')
							break;
						append_alert(msg, 'alert-danger')
							break;
					case 'success':
						append_alert(msg, 'alert-success')
							break;
					case 'info':
						append_alert(msg, 'alert-info')
							break;
				}
            }
            $('.alert').stop().fadeOut(5000);
            list_schemas();
        },
        error: function(request, status, error){
            append_error(error);
            console.log(error);
            $('.alert').stop().fadeOut(5000);
        }
    })

}


