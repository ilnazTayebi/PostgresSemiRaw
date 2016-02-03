//the dropbox client
var client = undefined;
//the folder where all the queries are stored
var RawSessionFolder = "RawSession";
var SessionInfoFile = '.raw_session';

// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){
    $('#side_panel').BootSideMenu({side:"right"});

    $('#get_next').prop('disabled', true);
    $('#get_all').prop('disabled', true);

    // initializes credentials using dropbox
    var credentials = ini_credentials({dropbox:true });

    client = credentials.client;
    // adds the drobox user name to the nav bar
    client.getAccountInfo(function (error, info){
        console.log('Dropbox name: ' + info.name);
        $('#user_name').text('Hello '+info.name.capitalize()+'!');

        $('#sign_out').on('click', function(e){
            console.log('signing out from dropbox');
            var options = {};
            client.signOut(options, function(error){
                if (error){
                    throw("error signing out from dropbox " + error);
                }
                window.location.replace('signin.html');

            });
        });
    });


    $("#add_dropbox , #add_dropbox2").on("click", function(e){ add_from_dropbox();});

    function saveQueryResults(save_function){
        $("#download_dialog").modal('show');
        document.getElementById('download_json').onclick = function () {
            save_function( queryResults,  $("#download_name").val() + ".json", "json");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_csv').onclick = function () {
            save_function( queryResults,  $("#download_name").val() + ".csv", "csv");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_excel').onclick = function () {
            // for the time being downloading excel files is not supported
        };
    }

    //save to dropbox
    $('.query-save, #save_side').on( "click", function(e){
        $("#download_name").val('results');
        saveQueryResults( saveObjToDropbox );
    });

    $("[rel=tooltip]").tooltip({ placement: 'right'});
    //download results
    $('.query-download, #download_side').on("click", function(){
        $("#download_name").val('results');
        saveQueryResults( downloadObj );
    });

    $('#list_schemas').on("click", function(e) {list_schemas()});

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
                    console.log("posting query after change of text");
                    post_query(editor, jsonEditor);
                }
            });
        } else {
            editor.getSession().off('change');
            btn.style.visibility = 'visible';
        }
    }

    editor_set_autoexecute(true);

    $('#execute_btn').on('click', function(e){ 
        console.log("posting query after button press");
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

    function save_query_modal(){
        console.log("selected graph", get_selected_graph());
        var query = {
            query : editor.getValue() ,
            vis : get_selected_graph()
        } 
        var path = RawSessionFolder + "/" + $("#query_name").val();
        saveObjToDropbox(query, path, "json");
        $("#save_query_dialog").modal('hide');
    };

    $("#query_save_button").on("click", function(e) {
        // this is because the default for  btn-success will reload the page
        e.preventDefault();
        save_query_modal();
    });

    $("#query_name").on("keypress", function(e){
       if(e.which == 13) {
            save_query_modal();
        }
    });

    $('#save_query').on("click", function(e){    
        $("#save_query_dialog").modal('show');
    });

    $("#query_load_button").on("click", function(e) {
        e.preventDefault();
        var q = $('#load_query_sel').val();
        load_query(RawSessionFolder + "/" + q[0], editor, jsonEditor);
        $("#load_query_dialog").modal('hide');
    });

    $('#load_query').on( "click", function(e){
        var dialog = $("#load_query_dialog");

        client.stat( RawSessionFolder, {readDir : true} , function (error, file, files) {
            $('#load_query_sel').empty();
            for (var n = 0 ; n < files.length ; n++){
                var option = $('<option>' + files[n].name +' </option>');
                // add the double click to the option
                option.on('dblclick', function(e){
                    load_query(RawSessionFolder + "/" +$(this).val(), editor, jsonEditor);
                    $("#load_query_dialog").modal('hide');
                } );
                option.appendTo('#load_query_sel');
            }
        
        });
        dialog.modal('show');
    });

    // starts listing the schemas
    list_schemas();
    // inits the dropbox sessions for loading queries
    init_session();    
});

//will load a query from dropbox
function load_query(path, editor, jsonEditor){
    console.log('loading query', path);
    var options = {};
    client.readFile(path, options, function(error, content, stat){
        console.log('loaded query', content, stat);
        var saved_query = JSON.parse(content);
        set_selected_graph(saved_query.vis);
        editor.setValue(saved_query.query);
        //if auto query is not selected then we have to send the query manually
        if (document.getElementById("auto_query").checked == false){
            console.log("posting query after load");
            post_query(editor, jsonEditor);
        }

    });
}

//initializes a session
function init_session(){
    var options = {readDir : true};
    // list root folder
    client.stat("/", options , function (error, file, files) {
        if (error) {
            throw 'Could not list dropbox folder, error:' + error ;
        } 

        function find_file(filename){
            return files.find( function (f,index, array){
               return  f.name == filename ;
            });
        }
        
        var f = find_file(RawSessionFolder);
        if( f && f.isFolder == false){
            // TODO: this is conflict and we have to do something about it
        }
        else if( f && f.isFolder ){
            console.log("Folder already exists, not doing anything");
        }
        else{
            console.log("creating session folder");
            client.mkdir(RawSessionFolder);
        }
        // will check the session file
        f = find_file(SessionInfoFile);
        if (!f){
            console.log("initializing session file");
            var options={
                welcome_pane:true
            }
            write_session_info(options);
            welcome_pane();
        }
        else{
            read_session_info(function(info){
                if( info.welcome_pane){
                    welcome_pane();
                }
            });
        }
    });
}

function read_session_info(callback){
    var options = {};
    client.readFile(SessionInfoFile, options, function(error, content, stat){
        if (error) {
            throw 'Could not read session file, error:' + error ;
        }
        console.log('session info', content, stat);
        var session_info = JSON.parse(content);
        callback(session_info);
    });
}

function write_session_info(obj){
    saveObjToDropbox(obj, SessionInfoFile, "json");
}

function welcome_pane(){
    var steps = [
        {   header: 'Welcome to RAW!',
            text : 
            'As it\'s the first time you are landing on this page, \
            let\'s go through a quick overview.<br>\
            (You can skip this by clicking on the cross on the top right corner.)',
            size: {width: 600, height: 300 } 
        },
        {
            header: 'Writing Queries',
            text: 
                'Use the editor on left-hand side to type your queries.\
                Your queries are send to automatically to the server while you type.<br> \
                The indicator on the top left of the pane tells you the state of the query.',
            image:{ 
                src:"images/editor2.gif", 
                style:"width:100%;",
                col_size: 6                    
            },            
            size: {width: 1000, height: 300 }       
        },
        {
            header: 'Viewing Query Results',
            text: 
                'On the panel to your right, you can see the query results.\
                Click on the buttons to choose different types of visualizations.\
                These are grouped per type. If the output is not compatible\
                with a certain plot, the button will be grayed out.<br>\
                There are hierarchical and 3D graphs, try them out!',
            image:{ 
                src:"images/vis.gif", 
                position:"right", 
                style:"width:100%;",
                col_size: 6                    
            },
            size: {width: 850, height: 400 }   
        },
        {
            header: 'Querying Your Data',
            image:{ 
                src:"images/dropbox.png", 
                position:"left", 
                style:"width:100%;",
                col_size: 3
            },
            text: 
                'You can choose files to query directly from your Dropbox account by\
                clicking "Add Data" on the menu at the top.',
            size: {width: 550, height: 300 }   
        },
        {
            header: 'The RAW Query Language',
            image:{ 
                src:"images/tree.png", 
                position:"left", 
                style:"width:180px;",
                col_size: 6
            },            
            text:
                'We use a richer SQL language that is fully hierarchical and can do some neat things.<br>\
                 You can find a tutorial on the query language <a href="demo.html">here</a>.',
            size: {width: 550, height: 300 }   
        }
    ]

    function load_next(pos){
        var data = steps[pos];
        $('#tutorial_header').text(data.header);
        if (data.size){
            $('#tutorial_dialog .modal-dialog').width(data.size.width);
            $('#tutorial_dialog .modal-dialog').height(data.size.height);
        }
        
        $('#tutorial_content').empty();
        if(data.image){
            var img= data.image;
            $('<div id="welcome_img"/>').appendTo('#tutorial_content'); 
            // sets the col size
            $('#welcome_img').addClass('col-lg-'+img.col_size);                      
            if(img.position == 'right') $('#welcome_img').addClass('pull-right');          
            $('#welcome_img').append('<img src="'+img.src+'" style="'+img.style+'"/>');            
            $('<div id="welcome_text"/>').appendTo('#tutorial_content');
            $('#welcome_text').addClass('col-lg-'+(12-img.col_size));
            $('#welcome_text').html(data.text);
        }
        else{
            $('#tutorial_content').html(data.text);               
        }

        if(pos == 0){
            $('#tutorial_dialog .btn-previous').prop('disabled', true);
        }
        else{
            $('#tutorial_dialog .btn-previous').prop('disabled', false);
        }

        if (pos == steps.length -1){
            $('#tutorial_dialog .btn-next').html(
                'Close <span class="glyphicon glyphicon-ok"></span>'
            );
            // remove this to not change the color to orange
            $('#tutorial_dialog .btn-next').addClass('btn-warning');
        }
        else{
            $('#tutorial_dialog .btn-next').removeClass('btn-warning');
            $('#tutorial_dialog .btn-next').html(
                'Next <span class="glyphicon glyphicon-chevron-right"></span>'
            );        
        }
    }

    $("#do_not_show").on( "change", function(e){
        read_session_info(function(info){
            var val = document.getElementById("do_not_show").checked;
            console.log("do not show again ", val);
            info.welcome_pane = !val;
            write_session_info(info);
        });
    });

    var pos = 0;
    load_next(pos)
    $('#tutorial_dialog .btn-next').on('click', function(e){
        if(pos == steps.length-1){
            $('#tutorial_dialog').modal('hide');
        }
        else {
            load_next(++pos);
        }
    });
    $('#tutorial_dialog .btn-previous').on('click', function(){
        load_next(--pos);
    });
    $("#tutorial_dialog").modal('show');
}
