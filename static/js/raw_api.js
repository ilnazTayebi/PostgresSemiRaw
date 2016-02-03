// raw dropbox key
var dropbox_key = "f64lfu3jyw86z4t";
//the token will be passed in the authorization header in the requests (GET, POST ...)
var credentials= undefined;

function ini_credentials(options){
    if ( options && options['dropbox'] == true){
        //TODO: check options for dropbox
        var client = new Dropbox.Client({ key: dropbox_key  });
        console.log("authenticating using dropbox");
        // Try to finish OAuth authorization.
        client.authenticate({interactive: true}, function (error) {
            if( error ) console.log(error);
        });
        if (client.isAuthenticated()) {
            // Client is authenticated. Display UI.
            credentials = client._credentials;
            credentials.type = 'dropbox';
        }
        if (options['user_info']){
            client.getAccountInfo(options['user_info']);
        }

        credentials.client = client;
    }
    else if ( options && options['basic_auth'] == true){
        credentials = {
            type : 'basic auth',
            user : options.user,
            password : options.password
        }
    }
    console.log("initallized credentials", credentials)
    return credentials;
}

function query_start(query, n_results, callbacks){
    var data = {
        query : query,
        resultsPerPage: n_results
    };
    http_json_request('POST', '/query-start' , data , callbacks);
}

function query_next(token, n_results, callbacks){
    var data = {
        token : token,
        resultsPerPage: n_results
    };

    http_json_request('POST', '/query-next' , data , callbacks);
}

//function to send a query to the query service
// arg: query, the query string
// arg: callbacks, callbacks from when the post finishes, (see jquery ajax post)
//     success: the sucess callback function, prototype:  function(data)
//     error, the error callback function, prototype:  function(request, status, error) 
function send_query(query, callbacks){
    var data = {
        query : query
    };
    http_json_request('POST', '/query' , data , callbacks);
}

//registers file for querying 
function register_file(options, callbacks){
    http_json_request("POST", '/register-file', options, callbacks);
}

//sends the request to list the schemas
function get_schema_list( callbacks){
    var data = { };

    http_json_request("GET", "/schemas", data, callbacks);
}

// sends json request using XMLHttpRequest
function http_json_request(method, url, data, callbacks){
    console.log("sending", method, url);
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    if ( credentials == undefined ){
        console.log("Sending request without credentials");
    }
    else if (credentials.type == 'basic auth'){
        console.log("sending request with basic auth");
        request.withCredentials = true;
        request.setRequestHeader ("Authorization", 
            "Basic " + btoa(credentials.user + ":" + credentials.password));
    }
    else{
        console.log("Sending request with credentials", credentials);
        request.withCredentials = true;
        request.setRequestHeader('Authorization','Bearer ' + credentials.token);
    }

    //Send the proper header information along with the request
    request.setRequestHeader("Content-type", "application/json;charset=UTF-8");

    request.onreadystatechange=function(){
        if (request.readyState==4) {
            if (request.status==200){
                // here the response is empty
                var response_data=undefined;
                if (request.response){
                    response_data = JSON.parse( request.response );
                }                
                callbacks.success(response_data);
            }
            else{
                callbacks.error( request, request.status, request.responseText);
            }
       }
    }
    if (data) {
        request.send(JSON.stringify(data));
    }
    else{
        console.log("sending without data");
        request.send();
    }
    
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
                callbacks.error( request, request.status, request.responseText);
            }
       }
    }
    request.send(params);
}

//Saves an object to dropbox
function saveObjToDropbox( obj, filename, format){
    var client = new Dropbox.Client({ key: dropbox_key });
    // Try to finish OAuth authorization.
    client.authenticate({interactive: true}, function (error) {
        if(error){
            console.log(error);
            return error;
       }
        
    });
    client.writeFile(filename, formatResults( obj, format) , function (error) {
        if (error) {
            console.log('Could not save ' + filename  + ' , error:' + error);
        } else {
            console.log('File ' + filename  + ' saved in your dropbox');

        }
    });
}

function parse_url_params(){
    //parses the parameters from the url
    var parts= decodeURIComponent(location.href).split('?');
    var params= [];
    if (parts.length > 1){
        params = parts[1].split('&');
    }
    var params_data = {};
    for (x in params)
     {
        params_data[ params[x].split('=')[0] ] = params[x].split('=')[1];
     }
    return params_data;
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

