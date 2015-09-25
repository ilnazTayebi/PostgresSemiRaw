
// this function was adapted from :
//http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
// like this I can get arrays types and all of that
function getType(obj)  { 
	if (typeof obj == "undefined") return "undefined";
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((obj).constructor.toString());
	var type =  (results && results.length > 1) ? results[1] : "";
	return type.toLowerCase();

};

// gets the value to insert in a visualization table
function getRowType(obj){
	var type = getType(obj);
	switch(getType(obj)){
		case "number":
		case "date":
			return type;
		default:
			return "string";
	}    
}

// function to convert a object so that it can drawn
//for the time being converts everything to a json string except few basic values
function getObjValue(obj){
	switch(getType(obj)){
		case "number":
		case "date":
		case "string":
			return obj;
		default:
			return objToString(obj);
	}
}

//transform an object to the string representation
//improve this later for fancier string repsentations
function objToString(obj){
    return JSON.stringify(obj);
}

//function that converts arrays to visualization tables
function arrayToTable(data){
	var table = new google.visualization.DataTable();

	switch(getType(data[0])){
		case "object":
			for (var name in data[0]){
				table.addColumn( getRowType(data[0][name]) , name);
			}
			for(var i= 0;i < data.length;i++){        
				var row = [];
				for(var name in data[i]){
					row.push(getObjValue(data[i][name]))
				}
				table.addRow(row);
			}

			break;
			//TODO: find way of drawing 2d Arrays (check the min of the lenghts and stringify the rest)
			//case "array":
		case "undefined":
			console.log("could not draw empty array " , data)
			break;
			// if it is not an array or object supposes it is a builtin type and just adds rows like that
		default:
			table.addColumn( getRowType(data[0]) , getType(data[0]));
			for(var i= 0;i < data.length;i++){
				var row = [getObjValue(data[i])];
				table.addRow(row);
			}
	}
	return table;
}

function dataToPointTable(data){

    var type = getType(data[0]);
    switch(type){
        case "object":
            return arrayToTable(data);
        case "array":
            console.log("matrix to points");
            var table = new google.visualization.DataTable();
            table.addColumn( "number", "x");
            table.addColumn( "number", "y");
            table.addColumn( "number", "z");
            
            for (x in data){
                for (y in data[x]){
                    var z = parseFloat(data[x][y]);
                    table.addRow([x,y,z]);
                }
            }
            return table;
        case "undefined":
            console.log("could not draw undefined " , data);
            throw ("could not draw undefined ");
            break;
            // if it is not an array or object supposes it is a builtin type and just adds rows like that
        default:
            throw ("Array of type: " + type + ", cannot be converted to matrix");
    }
    return matrix;
}

//function that transforms data to a matrix (for heatmap)
function dataToMatrix(data){
    var matrix = [];
    var type = getType(data[0]);
    switch(type){
        case "object":
            throw("Object array to matrix not implemented")
            break;
        case "array":
            return data;
        case "undefined":
            console.log("could not draw empty array " , data)
            break;
            // if it is not an array or object supposes it is a builtin type and just adds rows like that
        default:
            throw ("Array of type: " + type + ", cannot be converted to matrix");
    }
    return matrix;
}

//creates a visualization table from the data
function dataToTable(data){    
    var table = new google.visualization.DataTable();

    switch( getType(data) ){
        case "array":
            return arrayToTable(data);
        case 'object':
            var row = [];
            for(var name in data){
                table.addColumn( getRowType(data[name]) , name);
                row.push(getObjValue(data[name]))
            }
            table.addRow(row);
            return table;
        case "undefined":
            console.log("ERROR: data is undefined, visualization table is empty")
            return table;
        default:
            table.addColumn(getRowType(data), getType(data));	                    
            table.addRow([data]);
            return table;
    }
}

// recursive function that finds a object in the tree with a certain name
function transverse(obj , name) {
    if ( obj.name == name ){ 
        return obj;
    }
    for(var i in obj.children){
        var p = transverse(obj.children[i], name ) ;
        if (p != undefined) return p;
   }

   return undefined;
}

//finds object in the tree and inserts it if it is not found
function getObjNode(name, root){
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
function getChildrenFromObjArray(data, root, defaultName ){

    var types = [];
    var names = [];
    
    for (var name in data){
        types.push( getType(data[name]));
        names.push(name);
    }

    var curr_root = root;
    // this object accumulates integers and children to be added to the last node
    var acc = {name: undefined, size: 0 , children : []}

    if (names.length <= 0){
        console.log("why the hell this obj does not have properties?!");
        return;
    }
    for (var n = names.length -1; n >= 0 ; n-- ){
        if(types[n] == 'string'){
            // finds if this node exists 
            var name = data[names[n]];
            var node = getObjNode(name, curr_root);
            // next item will be inserted at the level of the current node
            curr_root = node;
            acc.name = name;
        }
        else if (types[n] == 'number')
        {
            acc.size += data[names[n]];
        }
        else {
            node= { name : names[n], children : [] };
            acc.children.push(node)
            getChildren(data[names[n]], node, names[n]);
        }
    }
    // if there were no strings
    if (acc.name == undefined ){
        console.log("node does not have a name, defaulting to ", defaultName);
        acc.name = defaultName;
    }
    if (acc.size == 0){
        console.log("node does not have a size, defaulting to ", 1);
        acc.size = 1;
    }
    //gets the last node and sets the new children and the accumulated counter
    var last_node = getObjNode(acc.name, curr_root);
    if(acc.children.length){
        last_node['children'] = acc.children; 
    }
    last_node.size = acc.size;
}

//generates hierarchies from arrays
// on arrays of objects it will try to group-by (we might have to review this thing )
// see getChildrenFromObjArray function
function getChildrenArray(data, root, defaultName ){
    switch(getType(data)){
        // cases number and string are the same as 
        case "number":
            root.children.push({ name : defaultName, size : data});
            break;
        case "string":
            root.children.push({ name : data, size : 1});
            break;
        case "object":
            for (var name in data ){
                // here it will try to create an hierarchy
                getChildrenFromObjArray(data, root, name);
            }
            break;
        default:
            node= { name : defaultName, children : [] };
            root.children.push(node)
            getChildren(data, node, defaultName);
            break;
    }
}
// generates hierarchies from objects 
function getChildrenFromOb(data, root ){
    for (var name in data){
        switch(getType(data[name])){
            case 'string':
                root.children.push({ name : data[name], size : 1});
                break;
            case 'number':
                root.children.push({ name : name, size : data[name]});
                break;
            default:
                node= { name : name, children : [] };
                root.children.push(node)
                getChildren(data[name], node, name);
        }
    }
}

// Creates an hierarchy from data and inserts it in "root"
// default name is 
function getChildren(data,root, defaultName){

    // if it does not find a string to assign to a name defaults to 'number'
    defaultName = typeof defaultName !== 'undefined' ? defaultName : "value";

    switch(getType(data)){
        case "object":
            getChildrenFromOb(data, root );
            break;
        case "array":
            for(var i in data){
                getChildrenArray(data[i], root, defaultName +":"+String(i));
            }
            break;        
        case "number":
            root.children.push({ name : defaultName, size : data});
            break;
        case "string":
            root.children.push({ name : data, size : 1});
            break;
        case "undefined":
            console.log("could not create hierarchy from undefined data");
            break;
        default:
            console.log("could not draw array", data);
            break;
    }
}

//converts n data to a hierarchy that can be drawn using a sunburst, a tree view etc..
function dataToHierarchy(data){

    var root= {name: "root", children:[]};
    getChildren(data, root);
    console.log(root);
    return root;
}
