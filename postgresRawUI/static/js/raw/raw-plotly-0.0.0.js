google.load("visualization", "1", {packages:["corechart", "table", "geochart", "map"]});

function RawPlotly(div_id, options) {
    this.data = undefined;
    this.div = document.getElementById(div_id);
    this.last_draw = "";
    this.last_draw = RawPlotly.getDrawFunctions()[0];
}

RawPlotly.prototype.set_data = function(data) {
    this.data = data;
    this.redraw();
}

RawPlotly.prototype.draw = function(plot) {
    if (!(plot in RawPlotly.draw_functions) ){
        this.errorMsg("plot " + plot + " is not supported");
        return;
    }

    this.last_draw = plot;
    this.redraw();
}

RawPlotly.prototype.redraw = function() {

    if (this.data === undefined){
        console.log("Data is undefined not drawing");
        this.errorMsg("No data available");
        return;
    }

    this.div.innerHTML= '';
    RawPlotly.draw_functions[this.last_draw](this.div, this.data);
}

RawPlotly.prototype.errorMsg = function(msg) {
    var style = 'background-color: red; color: white;'+
                'margin-top:10px; margin-left:10px';

    this.div.innerHTML= '<span style="'+style+'">'+
                            '<span class="glyphicon glyphicon-remove"></span>'+
                            msg+
                        '</span>';
}

RawPlotly.prototype.WarningMsg = function(msg) {
    var style = 'background-color: yellow; color: black;'+
                'margin-top:10px; margin-left:10px';

    this.div.innerHTML= '<span style="'+style+'">'+
                            '<span class="glyphicon glyphicon-warning-sign"></span> '+
                            msg+
                        '</span>';
}

RawPlotly.getDrawFunctions = function (){
    return Object.keys( RawPlotly.draw_functions);
}

// structure keeping all the draw_functions
RawPlotly.draw_functions =  {
    jsonEditor: function(div, data) {
        var options = {mode: 'view' };
        var jsonEditor = new JSONEditor(div, options);
        jsonEditor.set(data);
    },
    table: function(div, data) {
        var t = RawPlotly.dataToTable(data);
        var visualization = new google.visualization.Table(div);
        visualization.draw(t,
            {showRowNumber: true, width: '100%'}
        );
    },
    pieChart: function(div, data) {
        var d = RawPlotly.getLabelsValues(data);
        RawPlotly.assign(d, 'type', 'pie');
        Plotly.newPlot(div, d);
    },
    barChart: function(div, data) {
        var d = RawPlotly.getXY(data);
        RawPlotly.assign(d, 'type', "bar");
        Plotly.newPlot(div, d);
    },
    lineChart: function(div, data) {
        var d = RawPlotly.getXY(data);
        RawPlotly.assign(d, 'type', "scatter");
        Plotly.newPlot(div, d);
    },
    bubbleChart: function(div, data) {
        var d = RawPlotly.getXYMarkers(data);
        RawPlotly.assign(d, 'mode', "markers");
        Plotly.newPlot(div, d);
    },
    sunburst: function(div, data) {
        var d = RawPlotly.dataToHierarchy(data);
        draw_sunburst(d, div);
    },
    tree: function(div, data) {
        var d = RawPlotly.dataToHierarchy(data);
        draw_tree(d, div);
    },
    circlePack: function(div, data) {
        var d = RawPlotly.dataToHierarchy(data);
        draw_circle_packing(d, div);
    },
    geoWorld: function(div, data) {
        // this is because google maps screws the css
        // by inserting a div just for drawing at least does not screw up other graphs
        div.innerHTML = '<div class="map-canvas" style="height: 100%; width: 100%;"></div>';
        var div = $('#'+div.id+' .map-canvas')[0];
        var chart = new google.visualization.Map(div);
        options = {
            mapType: 'normal',
            showTip: true
        }
        var t = RawPlotly.dataToTable(data);
        chart.draw(t, options);
    },
    surface: function(div, data) {
        var d = RawPlotly.getMatrix(data);
        RawPlotly.assign(d, 'type', 'surface');
        Plotly.newPlot(div, d);
    },
    scatter3d: function(div, data) {
        var d=RawPlotly.getXYZ(data);
        RawPlotly.assign(d, 'type', 'scatter3d');
        RawPlotly.assign(d, 'mode', 'markers');
        Plotly.newPlot(div, d);
    },
    heatmap: function(div, data) {
        var d = RawPlotly.getMatrix(data);
        RawPlotly.assign(d, 'type', 'heatmap');
        Plotly.newPlot(div, d);
    }
};

RawPlotly.assign= function(traces, key, value) {
    for(var n = 0 ; n < traces.length ; n++){
        traces[n][key]= value;
    }
}

// returns which plots are compatible with the data
RawPlotly.isCompatible = function(data) {

    var type = RawPlotly.getType(data);
    // the jsonEditor  and table are compatible with everything
    var to_enable= ['jsonEditor', 'table'];

    function all_numeric(data, start) {
        var types = [];
        for (var k in data) {
            types.push(RawPlotly.getType(data[k]))
        }
        for (var n = start; n < types.length ; n++) {
            if (types[n] != "number") return false;
        }
        return true;
    }

    if (type === "array") {
        type = RawPlotly.getType(data[0]);
        if (type === "object" ) {
            to_enable.push ('sunburst',
                'tree',
                'circlePack');
            keys = Object.keys(data[0]);
        // at least one non numeric value
            if (all_numeric(data[0], 0) == false) {
                to_enable.push('geoWorld');
            }
            if (keys.length >= 2 && all_numeric(data[0], 1)) {
                to_enable.push('barChart',
                            'lineChart',
                            'geoWorld');
                if (all_numeric(data[0], 0) == false) {
                    to_enable.push('pieChart');
                }
            }
            if (keys.length >= 3 && all_numeric(data[0], 1)) {
                to_enable.push('bubbleChart',
                                'scatter3d',
                                "surface",
                                "heatmap");
            }
        }
        else if (type === "string") {
            to_enable.push('geoWorld');
        }
        else if (type === "array") {
            to_enable.push("surface", "heatmap");
        }
    }
    else if (type == "string") {
        to_enable.push('geoWorld');
    }
    else if (type === "object") {
        to_enable.push ('sunburst',
            'tree',
            'circlePack');
    }

    // to get unique arrays
    function getUnique(ary) {
       var u = {}, a = [];
       for(var i = 0, l = ary.length; i < l; ++i){
          if(u.hasOwnProperty(ary[i])) {
             continue;
          }
          a.push(ary[i]);
          u[ary[i]] = 1;
       }
       return a;
    }

    return getUnique(to_enable);
}

RawPlotly.getMatrix = function(data) {
    var type = RawPlotly.getType(data);
    switch(type) {
        case "array":
            return [{
                z: RawPlotly.getMatrixFromArray(data)
            }]
        default:
            throw("cannot get matrix from " + type);
    }
}

RawPlotly.getMatrixFromArray= function(data) {
    var type = RawPlotly.getType(data[0]);
    switch(type) {
        case "array":
            return data;
        case "object":
            var keys = Object.keys(data[0]);
            // builds an dictionary [x,y]-> z
            var aux = {};
            for (var n = 0 ; n < data.length ; n++){
                var x = data[n][keys[0]];
                var y = data[n][keys[1]];
                var z = data[n][keys[2]];
                if (! (x in aux) ){
                    aux[x]={};
                }
                if (! (y in aux[x]) ){
                    aux[x][y]={};
                }
                aux[x][y]=z;
            }
            // transforms dictionary in a double dimension array
            var x = Object.keys(aux);
            x.sort();
            var out = [];
            for(var n = 0 ; n < x.length; n ++){
                out.push([]);
                var y = Object.keys(x);
                y.sort();
                for(var i = 0 ; i < y.length ; i++){
                    out[n].push(aux[x[n]][y[i]]);
                }
            }
            return out;
        default:
            throw ("cannot get matrix from array of" + type);
    }
}

RawPlotly.getLabelsValues = function (data) {
    var type = RawPlotly.getType(data);
    switch(type) {
        case "array":
            return RawPlotly.getLvFromArray(data);
        case "object":
            //return RawPlotly.getLvFromObj(data);
        default:
            throw("cannot get labels/values from " + type);
    }
}

RawPlotly.getXYZ = function(data) {
    var type = RawPlotly.getType(data);
    switch(type) {
        case "array":
            return RawPlotly.getXYZFromArray(data);
        case "object":
            //return RawPlotly.getLvFromObj(data);
        default:
            throw("cannot get labels/values from " + type);
    }
}

RawPlotly.getXYZFromArray = function(data) {
    var type = RawPlotly.getType(data[0]);
    switch (type) {
        case "object":
            var x = [];
            var trace = {
                x: [],
                y: [],
                z: []
            };
            var keys = Object.keys(data[0]);
            for(var n = 0 ; n < data.length ; n++){
                trace.x.push(data[n][keys[0]]);
                trace.y.push(data[n][keys[1]]);
                trace.z.push(data[n][keys[2]]);

            }
            return [trace];
        case "array":
            throw ("Arrays of arrays not implemented yet");
        default:
            throw("cannot get labels/values from array of " + type);
    }
}

RawPlotly.getXY = function(data) {
    var type = RawPlotly.getType(data);
    switch(type) {
        case "array":
            return RawPlotly.getXYFromArray(data, -1);
        case "object":
            //return RawPlotly.getLvFromObj(data);
        default:
            throw("cannot get labels/values from " + type);
    }
}

RawPlotly.getXYFromArray = function(data, until) {
    var type = RawPlotly.getType(data[0]);
    switch (type){
        case "object":
            var x = [];
            var traces= [];
            var keys = Object.keys(data[0]);
            var n_keys = until || -1;

            // like this -1 will make it go through all keys
            if (n_keys < 0){
                n_keys = keys.length +1 + n_keys;
            }
            console.log("going through keys", n_keys);
            for (var n = 1 ; n < n_keys ; n ++) {
                traces.push({
                    name: keys[n],
                    y: []
                });
            }
            for (var n = 0 ; n < data.length ; n++) {
                var x_value = data[n][keys[0]];
                x.push( RawPlotly.objToValue(x_value) );
                for (var i = 1 ; i < n_keys ; i++) {
                    var y_value = data[n][keys[i]];
                    traces[i-1].y.push( RawPlotly.objToValue(y_value) );
                }
            }
            // assigns the x axis
            for(var n = 1 ; n < n_keys ; n++){
                traces[n-1].x = x;
            }

            return traces;
        case "array":
            throw ("Arrays of arrays not implemented yet");
        default:
            throw("cannot get labels/values from array of " + type);
    }
}


RawPlotly.scale= function(a, max_value){
    // sets the scale , maximum to 100
    var m = Math.max.apply(null, a);

    for (var n = 0 ; n < a.length ; n ++) {
        a[n] = max_value*a[n]/m;
    };
}


RawPlotly.getXYMarkers = function(data) {
    var type = RawPlotly.getType(data);
    switch(type){
        case "array":
            var traces =  RawPlotly.getXYFromArray(data, -2);
            console.log(traces);
            var keys = Object.keys(data[0]);
            var markers = [];
            // marker size will be the last one
            for (var n = 0 ; n < data.length ; n ++) {
                var m = data[n][keys[keys.length -1]];
                markers.push(m);
            }
            // scales markers to 50
            RawPlotly.scale(markers, 50)
            for (var n = 0 ; n < traces.length ; n ++) {
                traces[n].marker = {
                    size: markers
                }
            }
            return traces;
        case "object":
            throw ("Not implemented xy markers of object");
        default:
            throw("cannot get labels/values from " + type);
    }
}

RawPlotly.objToLabel= function(obj) {
    switch(RawPlotly.getType(obj)) {
        case "date":
        case "string":
            return obj;
        default:
            return JSON.stringify(obj);
    }
}

RawPlotly.objToValue = function(obj) {
    switch(RawPlotly.getType(obj)){
        case "date":
        case "string":
        case "number":
            return obj;
        default:
            return JSON.stringify(obj);
    }
}

RawPlotly.getLvFromArray = function(data) {
    var type = RawPlotly.getType(data[0]);
    switch (type){
        case "object":
            var labels = [];
            var traces= [];
            var keys = Object.keys(data[0]);
            for (var n = 1 ; n < keys.length ; n ++) {
                traces.push({
                    name: keys[n],
                    values: []
                });
            }
            for (var n = 0 ; n < data.length ; n++) {
                labels.push(data[n][keys[0]]);
                for (var i = 1 ; i < keys.length ; i++){
                    traces[i-1].values.push(data[n][keys[i]]);
                }
            }
            // assigns the x axis
            for (var n = 1 ; n < keys.length ; n++) {
                traces[n-1].labels = labels;
            }
            return traces;
        case "array":
            return {labels: data[0], values: data[1] };
        default:
            throw("cannot get labels/values from array of " + type);
    }
}

RawPlotly.getType = function(obj) {
    if (typeof obj == "undefined") {
        return "undefined";
    }
    if (obj == null) {
        return "null";
    }
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((obj).constructor.toString());
    var type =  (results && results.length > 1) ? results[1] : "";
    return type.toLowerCase();
}

//creates a visualization table from the data
RawPlotly.dataToTable = function(data){
    var table = new google.visualization.DataTable();

    switch(RawPlotly.getType(data)) {
        case "array":
            return RawPlotly.arrayToTable(data);
        case 'object':
            var row = [];
            for (var name in data) {
                table.addColumn( RawPlotly.getRowType(data[name]) , name);
                row.push(RawPlotly.objToValue(data[name]))
            }
            table.addRow(row);
            return table;
        case "undefined":
            throw("ERROR: data is undefined, visualization table is empty")
        default:
            table.addColumn(RawPlotly.getRowType(data), RawPlotly.getType(data));
            table.addRow([data]);
            return table;
    }
}
//function that converts arrays to visualization tables
RawPlotly.arrayToTable = function(data) {
    var outputArray = []
    switch(RawPlotly.getType(data[0])) {
        case "object":

            var header = [];
            for (var name in data[0]) {
                header.push(name);
            }
            outputArray.push(header);
            for (var i= 0;i < data.length;i++) {
                var row = [];
                for(var name in data[i]){
                    row.push(RawPlotly.objToValue(data[i][name]))
                }
                outputArray.push(row);
            }

            break;
            //TODO: find way of drawing 2d Arrays (check the min of the lenghts and stringify the rest)
            //case "array":
        case "undefined":
            throw("could not draw empty array " , data)
            // if it is not an array or object supposes it is a builtin type and just adds rows like that
        default:
            outputArray.push(["value"])
            for (var i= 0;i < data.length;i++) {
                var row = [RawPlotly.objToValue(data[i])];
                outputArray.push(row);
            }
    }
    return google.visualization.arrayToDataTable(outputArray);
}
// gets the value to insert in a visualization table
RawPlotly.getRowType = function(obj) {
    var type = RawPlotly.getType(obj);
    switch(type){
        case "number":
        case "date":
            return type;
        default:
            return "string";
    }
}

//converts n data to a hierarchy that can be drawn using a sunburst, a tree view etc..
RawPlotly.dataToHierarchy = function(data) {
    var root= {name: "root", children:[]};
    RawPlotly.getChildren(data, root);
    return root;
}

// generates hierarchies from objects
RawPlotly.getChildrenFromObj = function(data, root ) {
    for (var name in data){
        switch(RawPlotly.getType(data[name])) {
            case 'string':
                root.children.push({name: data[name], size: 1});
                break;
            case 'number':
                root.children.push({name: name, size: data[name]});
                break;
            default:
                node = {name: name, children: [] };
                root.children.push(node)
                RawPlotly.getChildren(data[name], node, name);
        }
    }
}

// Creates an hierarchy from data and inserts it in "root"
// default name is
RawPlotly.getChildren = function(data,root, defaultName) {

    // if it does not find a string to assign to a name defaults to 'number'
    defaultName = typeof defaultName !== 'undefined' ? defaultName : "value";

    switch(RawPlotly.getType(data)){
        case "object":
            RawPlotly.getChildrenFromObj(data, root );
            break;
        case "array":
            if (data.length == 1){
                RawPlotly.getChildrenFromObj(data[0], root);
            }
            else{
                for(var i = 0 ; i < data.length ; i ++){
                    RawPlotly.getChildrenArray(data[i], root, defaultName +":"+String(i));
                }
            }
            break;
        case "number":
            root.children.push({name: defaultName, size: data});
            break;
        case "string":
            root.children.push({name: data, size: 1});
            break;
        case "null":
            //Should we ignore the name ?
            root.children.push({name: defaultName, size: 0});
            break;
        default:
            throw("ERROR: could not draw array", data);
            break;
    }
}
//generates hierarchies from arrays
// on arrays of objects it will try to group-by (we might have to review this thing )
// see getChildrenFromObjArray function
RawPlotly.getChildrenArray = function(data, root, defaultName ) {
    switch(RawPlotly.getType(data)){
        // cases number and string are the same as
        case "number":
            root.children.push({name: defaultName, size: data});
            break;
        case "string":
            root.children.push({name: data, size: 1});
            break;
        case "object":
            for (var name in data ){
                // here it will try to create an hierarchy
                RawPlotly.getChildrenFromObjArray(data, root, name);
            }
            break;
        default:
            node= {name: defaultName, children: [] };
            root.children.push(node)
            RawPlotly.getChildren(data, node, defaultName);
            break;
    }
}

//finds object in the tree and inserts it if it is not found
RawPlotly.getObjNode = function(name, root){

    // recursive function that finds a object in the tree with a certain name
    var transverse = function(obj , name) {
        if ( obj.name == name ){
            return obj;
        }
        for(var i in obj.children){
            var p = transverse(obj.children[i], name ) ;
            if (p != undefined) return p;
       }
       return undefined;
    }

    var node = transverse(root, name);
    if (node == undefined)
    {
        node = {name: name, size:0};
        if (!root.children) root.children = [];
        root.children.push(node)
    }
    return node;
}


// special case of arrays of objects
// this will build an hierarchy by doing a "group by" starting from the end
RawPlotly.getChildrenFromObjArray = function(data, root, defaultName ){

    var types = [];
    var names = [];

    for (var name in data){
        types.push( RawPlotly.getType(data[name]));
        names.push(name);
    }

    var curr_root = root;
    // this object accumulates integers and children to be added to the last node
    var acc = {name: undefined, size: 0 , children: []}

    if (names.length <= 0){
        console.log("why the hell this obj does not have properties?!");
        return;
    }
    for (var n = names.length -1; n >= 0 ; n-- ){
        if(types[n] == 'string'){
            // finds if this node exists
            var name = data[names[n]];
            var node = RawPlotly.getObjNode(name, curr_root);
            // next item will be inserted at the level of the current node
            curr_root = node;
            acc.name = name;
        }
        else if (types[n] == 'number')
        {
            acc.size += data[names[n]];
        }
        else {
            node= {name: names[n], children: [] };
            acc.children.push(node)
            RawPlotly.getChildren(data[names[n]], node, names[n]);
        }
    }
    // if there were no strings
    if (acc.name == undefined ){
        acc.name = defaultName;
    }
    if (acc.size == 0){
        acc.size = 1;
    }
    //gets the last node and sets the new children and the accumulated counter
    var last_node = RawPlotly.getObjNode(acc.name, curr_root);
    if(acc.children.length){
        last_node['children'] = acc.children;
    }
    last_node.size = acc.size;
}
