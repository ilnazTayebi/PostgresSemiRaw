//the dropbox client
var client = undefined;
//the folder where all the queries are stored
var RawSessionFolder = "RawSession";

// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){
    $('#side_panel').BootSideMenu({side:"right"});

    $('#get_next').prop('disabled', true);
    $('#get_all').prop('disabled', true);

    // initializes credentials using dropbox
    var credentials = ini_credentials({
        dropbox:true,
        user_info: function (error, info){
            console.log('Dropbox name: ' + info.name);            
            $('<ul class="nav navbar-nav navbar-right">\
                <li><a>Hello ' + info.name.capitalize() + '!</a></li> \
             </ul>').appendTo('.navbar-collapse');
        }
    });

    client = credentials.client;
    $("#add_dropbox").on("click", function(e){ add_from_dropbox();});
    $("#add_dropbox2").on("click", function(e){ add_from_dropbox();});

    function saveQueryResults(save_function){
         //downloadJsonObj(queryResults, "data.json");
        $("#download_dialog").modal('show');
        document.getElementById('download_json').onclick = function () {
            save_function( queryResults, "results.json", "json");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_csv').onclick = function () {
            save_function( queryResults, "results.csv", "csv");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_excel').onclick = function () {
        };
    }

    //save to dropbox
    $('#save_to_dropbox').on( "click", function(e){
        saveQueryResults( saveObjToDropbox );
    });

    $("[rel=tooltip]").tooltip({ placement: 'right'});
    //download results
    $('#download_results').on("click", function(){
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

    $('#start_tutorial').on('click', function(e) {
        $("#tutorial_dialog").modal('show');
    });
    
    // starts listing the schemas
    list_schemas();
    // inits the dropbox sessions for loading queries
    init_session();

     
    tutorial();
});

function load_query(path, editor, jsonEditor){
    console.log('loading query', path);
    var options = {};
    client.readFile(path, options, function(error, content, stat){
        console.log('loaded query', content, stat);
        var saved_query = JSON.parse(content);
        set_selected_graph(saved_query.vis);
        editor.setValue(saved_query.query);
        //TODO: only do this if auto query is not selected
        if (document.getElementById("auto_query").checked == false){
            console.log("posting query after load");
            post_query(editor, jsonEditor);
        }

    });
}

function init_session(){
    var options = {readDir : true};
    // list root folder
    client.stat("/", options , function (error, file, files) {
        if (error) {
            throw 'Could not list dropbox folder, error:' + error ;
        } 

        var f = files.find( function (f,index, array){
           return  f.name == RawSessionFolder ;
        });

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
    });
}

function tutorial(){
    var steps = [
        {   header: 'Some info',
            content : 
            'If it\'s the first time you are landing on this page, \
            let me help you getting an overview <br>\
            You can close this window by clicking on the cross on the top right corner.',
            size: {width: 600, height: 300 } 
        },
        {
            header: 'Query pane',
            content: 
            '<div class="row">\
                <div class="col-lg-6">\
                    <img src="images/editor2.gif" alt="editor" style="width:100%;" />\
                </div>\
                <div class="col-lg-6">\
                    Use the editor on left to type your queries.\
                    Your commands are send to automatically to the server while you type.<br> \
                    The indicator on the top left of that pane tells you the state of the query.\
                </div>\
            <div>',
            size: {width: 1000, height: 300 }       
        },
        {
            header: 'Visualization Pane',
            content: 
            '<div class="row">\
                <div class="col-lg-6">\
                    On the panel on your right you can see the query results.\
                    Click on the buttons to select different types of visualization.\
                    They are grouped in graph types, if the data output is not compatible\
                    with a certain graph, the button will be grayed out.<br>\
                    Try it out!\
                </div>\
                <div class="col-lg-6">\
                    <img src="images/vis.gif" alt="editor" style="width:100%" />\
                </div>\
            <div>',
            size: {width: 900, height: 400 }   
        },
,
        {
            header: 'Adding data',
            content: 
            '<div class="row">\
                <div class="col-lg-3">\
                    <img src="images/dropbox.png" alt="editor" style="width:100%;" />\
                </div>\
                <div class="col-lg-9">\
                    You can register adicional files from your dropbox by clicking the\
                     "Add Data" on the menu on the top.\
                </div>\
            <div>'
            ,
            size: {width: 500, height: 300 }   
        },
        {
            header: 'Query language',
            content: 
            'We use an SQL like language that is fully hierarchical and can do some neat things.\
            You can find a tutorial on the query language <a href="demo.html">Here</a>.',
            size: {width: 500, height: 300 }   
        }
    ]
    var pos = 0;
    function load_next(pos){
        
        var data = steps[pos];
        $('#tutorial_header').text(data.header);
        $('#tutorial_content').empty();
        $('#tutorial_content').append(data.content);
        if (data.size){
            $('#tutorial_dialog .modal-dialog').width(data.size.width);
            $('#tutorial_dialog .modal-dialog').height(data.size.height);
        }
                
        $('#tutorial_dialog .btn-next').prop('disabled', false);
        $('#tutorial_dialog .btn-previous').prop('disabled', false);        
        if(pos == 0){
            $('#tutorial_dialog .btn-previous').prop('disabled', true);
        }
        else if (pos == steps.length -1){
            $('#tutorial_dialog .btn-next').prop('disabled', true);
        }
    }
    
    load_next(pos)
    $('#tutorial_dialog .btn-next').on('click', function(){        
        load_next(++pos);
    });
    $('#tutorial_dialog .btn-previous').on('click', function(){        
        load_next(--pos);
    });
    $("#tutorial_dialog").modal('show');
}
