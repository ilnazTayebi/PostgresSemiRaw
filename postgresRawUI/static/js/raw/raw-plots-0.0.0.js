/* Class to draw plots in a selected div
    this depends on :
    google charts
        src="https://www.google.com/jsapi"
    Json editor:
        js/jsoneditor/dist/jsoneditor.min.js
    in house:
        js/draw_functions.js -> for our d3.js graphs
        css/d3_graphs.css -> css for our d3.js graphs

    this has to be added to the html or we have create a script to load this 
 */

google.load("visualization", "1", {packages:["corechart", "table", "geochart", "map"]});

function RawPlots(div_id, options){
    this.data = undefined;
    // defaults to the first drawing option
    var plots = RawPlots.getDrawFunctions();
    this.last_draw = plots[0];
    this.div = document.getElementById(div_id);
}

RawPlots.prototype.set_data = function(data){
    this.data = data;
    this.redraw();
}

RawPlots.prototype.draw = function(plot){

    if (!(plot in RawPlots.draw_functions) ){
        throw "plot " + plot + " is not supported";
    }

    this.last_draw = plot;
    this.redraw();
}

RawPlots.prototype.redraw = function(){
    this.div.innerHTML= '';
    RawPlots.draw_functions[this.last_draw](this.div, this.data);
}

// structure keeping all the draw_functions
RawPlots.draw_functions =  {
    jsonEditor : function( div, data){
        var options = { mode: 'view' };
        var jsonEditor = new JSONEditor(div, options);
        jsonEditor.set(data);
    },
    table : function( div, data){	    
        var t = RawPlots.dataToTable(data);
        var visualization = new google.visualization.Table(div);
        visualization.draw(t,
            {showRowNumber: true, width: '100%', height: '100%'}
        );
    },
    barChart : function( div, data){
        var t = RawPlots.dataToTable(data);
        var visualization = new google.visualization.ColumnChart(div);
        visualization.draw(t);
    },
    columnChart : function( div, data){
        var t = RawPlots.dataToTable(data);
        var visualization = new google.visualization.BarChart(div);
        visualization.draw(t);
    },    
    pieChart : function( div, data){ 
        var t = RawPlots.dataToTable(data);
        var visualization = new google.visualization.PieChart(div);
        visualization.draw(t);
    },
    scatterChart : function( div, data){
        var t = RawPlots.dataToTable(data);
        var visualization = new google.visualization.ScatterChart(div);
        visualization.draw(t);
    },
    areaChart : function( div, data){ 
        var t = RawPlots.dataToTable(data);
        var visualization = new google.visualization.AreaChart(div);
        visualization.draw(t);
    },
    histogram: function( div, data){
        var t = RawPlots.dataToTable(data);
        var chart = new google.visualization.Histogram(div);
        chart.draw(t);
    },
    lineChart: function( div, data){
        var chart = new google.visualization.LineChart(div);
        var t = RawPlots.dataToTable(data);
        chart.draw(t);
    },
    geoWorld: function( div, data){
        // this is because google maps screws the css
        // by inserting a div just for drawing at least does not screw up other graphs
        div.innerHTML = '<div id="map_canvas" style="height: 100%; width: 100%;"></div>';
        var chart = new google.visualization.Map(document.getElementById('map_canvas'));
        options = {
            mapType : 'normal',
            showTip : true
        }
        var t = RawPlots.dataToTable(data);
        chart.draw(t, options);

    },
    sunburst: function( div, data){
        var d = RawPlots.dataToHierarchy(data);
        draw_sunburst(d, div);
    },
    tree: function( div, data){
        var d = RawPlots.dataToHierarchy(data);
        draw_tree(d, div);
    },
    circlePack: function( div, data){
        var d = RawPlots.dataToHierarchy(data);
        draw_circle_packing(d, div);
    },
    treemap: function( div, data){
        var d = RawPlots.dataToHierarchy(data);
        draw_treemap(d, div);
    },
    bubbleChart: function( div, data){
        var d = RawPlots.dataToHierarchy(data);
        draw_bubblechart(d, div);
    },
    surface3d : function( div, data){
        var t = RawPlots.dataToPointTable(data);
        var options = { 
            style: "surface",
            width: ""+div.offsetWidth -10+ "px",
            height: ""+div.offsetHeight -10+ "px"
        };
        var chart = new links.Graph3d(div);
        chart.draw(t, options);
    },
    bars3d : function( div, data){
        var t = RawPlots.dataToPointTable(data);
        var options = { 
            style: "bar",
            width: ""+div.offsetWidth -10+ "px",
            height: ""+div.offsetHeight -10+ "px"
        };
        var chart = new links.Graph3d(div);
        chart.draw(t, options);
    },
    heatmap : function( div, data){
        var d = RawPlots.dataToMatrix(data);
        draw_heatmap(d, div, {colors :["#002","#88f","#4f4","#ff4","#f80" ,"#f00"]});
    }
};

RawPlots.getDrawFunctions = function (){
    return Object.keys( RawPlots.draw_functions);
}

// to get unique arrays
function getUnique(ary){
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
// returns which plots are compatible with the data
RawPlots.isCompatible = function (data) {
    var type = RawPlots.getType(data);
    // the jsonEditor  and table are compatible with everything
    var to_enable= ['jsonEditor', 'table'];

    function all_numeric (data, start){
        var types = [];
        for (var k in data){
            types.push(RawPlots.getType(data[k]))
        }
        for (var n = start; n < types.length ; n++){
            if (types[n] != "number") return false;
        }
        return true;
    }
    console.log("type1 " + type)

    if (type == "array"){
        type = RawPlots.getType(data[0]);
        console.log("type2 " + type)

        if (type == "object" ){
            to_enable.push ('sunburst',
                        'tree',
                        'circlePack',
                        'treemap',
                        'bubbleChart');
            keys = Object.keys(data[0]);
            // at least one non numeric value
            if (all_numeric(data[0], 0) == false){
                to_enable.push('geoWorld');
            }
            if (keys.length >= 2 && all_numeric(data[0], 1) ){
                to_enable.push('barChart',
                            'columnChart',
                            'histogram',
                            'scatterChart',
                            'lineChart',
                            'geoWorld');                
                if (all_numeric(data[0], 0) == false) {
                    to_enable.push('pieChart');
                }
            }
            if (keys.length >= 3 && all_numeric(data[0], 0)){
                to_enable.push( 'surface3d', 'bars3d', 'heatmap');
                
            }
        }
        else if (type == "number" ){
            to_enable.push('histogram');
        }
        else if (type == "string"){
            to_enable.push('geoWorld');
        }
        else if (type == "array"){
            to_enable.push('heatmap',
                           'surface3d', 
                           'bars3d');
        }
    }
    else if (type == "object"){
        to_enable.push ('sunburst',
                    'tree',
                    'circlePack',
                    'treemap',
                    'bubbleChart');
    }
    return getUnique(to_enable);
}

/***** Bellow are all the data transformation functions *********/

// this function was adapted from :
//http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
// like this I can get arrays types and all of that
RawPlots.getType = function(obj)  {
	if (typeof obj == "undefined") return "undefined";
    if (obj == null) {
        return "null";
   }
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((obj).constructor.toString());
	var type =  (results && results.length > 1) ? results[1] : "";
	return type.toLowerCase();
};

// gets the value to insert in a visualization table
RawPlots.getRowType = function(obj){
	var type = RawPlots.getType(obj);
	switch(type){
		case "number":
		case "date":
			return type;
		default:
			return "string";
	}    
}

// function to convert a object so that it can drawn
//for the time being converts everything to a json string except few basic values
RawPlots.getObjValue = function(obj){
	switch(RawPlots.getType(obj)){
		case "number":
		case "date":
		case "string":
			return obj;
        case "null":
             console.log("null value!");
            return 0;
		default:
			return RawPlots.objToString(obj);
	}
}

//transform an object to the string representation
//improve this later for fancier string repsentations
RawPlots.objToString = function(obj){
    return JSON.stringify(obj);
}

//function that converts arrays to visualization tables
RawPlots.arrayToTable = function(data){
	var table = new google.visualization.DataTable();

	switch(RawPlots.getType(data[0])){
		case "object":
			for (var name in data[0]){
				table.addColumn( RawPlots.getRowType(data[0][name]) , name);
			}
			for(var i= 0;i < data.length;i++){        
				var row = [];
				for(var name in data[i]){
					row.push(RawPlots.getObjValue(data[i][name]))
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
			table.addColumn( RawPlots.getRowType(data[0]) , RawPlots.getType(data[0]));
			for(var i= 0;i < data.length;i++){
				var row = [RawPlots.getObjValue(data[i])];
				table.addRow(row);
			}
	}
	return table;
}

RawPlots.dataToPointTable = function(data){
    var type = RawPlots.getType(data[0]);
    switch(type){
        case "object":
            return  RawPlots.arrayToTable(data);
        case "array":
            var table = new google.visualization.DataTable();
            table.addColumn( "number", "x");
            table.addColumn( "number", "y");
            table.addColumn( "number", "z");
            
            for (var x = 0; x < data.length; x++ ){
                for (var y = 0 ;  y < data[x].length ; y++){
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
RawPlots.dataToMatrix = function(data){
    var matrix = [];
    var type = RawPlots.getType(data[0]);
    switch(type){
        case "object":
            throw("Object array to matrix not implemented")
            break;
        case "array":
            return data;
        case "undefined":
            console.log("ERROR: could not draw empty array " , data)
            break;
            // if it is not an array or object supposes it is a builtin type and just adds rows like that
        default:
            throw ("Array of type: " + type + ", cannot be converted to matrix");
    }
    return matrix;
}

//creates a visualization table from the data
RawPlots.dataToTable = function(data){    
    var table = new google.visualization.DataTable();

    switch( RawPlots.getType(data) ){
        case "array":
            return RawPlots.arrayToTable(data);
        case 'object':
            var row = [];
            for(var name in data){
                table.addColumn( RawPlots.getRowType(data[name]) , name);
                row.push(RawPlots.getObjValue(data[name]))
            }
            table.addRow(row);
            return table;
        case "undefined":
            console.log("ERROR: data is undefined, visualization table is empty")
            return table;
        default:
            table.addColumn(RawPlots.getRowType(data), RawPlots.getType(data));
            table.addRow([data]);
            return table;
    }
}

// recursive function that finds a object in the tree with a certain name
RawPlots.transverse = function(obj , name) {
    if ( obj.name == name ){ 
        return obj;
    }
    for(var i in obj.children){
        var p = RawPlots.transverse(obj.children[i], name ) ;
        if (p != undefined) return p;
   }
   return undefined;
}

//finds object in the tree and inserts it if it is not found
RawPlots.getObjNode = function(name, root){
    var node = RawPlots.transverse(root, name);
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
RawPlots.getChildrenFromObjArray = function(data, root, defaultName ){

    var types = [];
    var names = [];
    
    for (var name in data){
        types.push( RawPlots.getType(data[name]));
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
            var node = RawPlots.getObjNode(name, curr_root);
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
            RawPlots.getChildren(data[names[n]], node, names[n]);
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
    var last_node = RawPlots.getObjNode(acc.name, curr_root);
    if(acc.children.length){
        last_node['children'] = acc.children; 
    }
    last_node.size = acc.size;
}

//generates hierarchies from arrays
// on arrays of objects it will try to group-by (we might have to review this thing )
// see getChildrenFromObjArray function
RawPlots.getChildrenArray = function(data, root, defaultName ){
    switch(RawPlots.getType(data)){
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
                RawPlots.getChildrenFromObjArray(data, root, name);
            }
            break;
        default:
            node= { name : defaultName, children : [] };
            root.children.push(node)
            RawPlots.getChildren(data, node, defaultName);
            break;
    }
}
// generates hierarchies from objects 
RawPlots.getChildrenFromObj = function(data, root ){
    for (var name in data){
        switch(RawPlots.getType(data[name])){
            case 'string':
                root.children.push({ name : data[name], size : 1});
                break;
            case 'number':
                root.children.push({ name : name, size : data[name]});
                break;
            default:
                node= { name : name, children : [] };
                root.children.push(node)
                RawPlots.getChildren(data[name], node, name);
        }
    }
}

// Creates an hierarchy from data and inserts it in "root"
// default name is 
RawPlots.getChildren = function(data,root, defaultName){

    // if it does not find a string to assign to a name defaults to 'number'
    defaultName = typeof defaultName !== 'undefined' ? defaultName : "value";

    switch(RawPlots.getType(data)){
        case "object":
            RawPlots.getChildrenFromObj(data, root );
            break;
        case "array":
            if (data.length == 1){
                RawPlots.getChildrenFromObj(data[0], root);
            }
            else{
                for(var i = 0 ; i < data.length ; i ++){
                    RawPlots.getChildrenArray(data[i], root, defaultName +":"+String(i));
                }
            }   
            break;        
        case "number":
            root.children.push({ name : defaultName, size : data});
            break;
        case "string":
            root.children.push({ name : data, size : 1});
            break;
        case "undefined":
            console.log("ERROR: could not create hierarchy from undefined data");
            break;
        default:
            console.log("ERROR: could not draw array", data);
            break;
    }
}

//converts n data to a hierarchy that can be drawn using a sunburst, a tree view etc..
RawPlots.dataToHierarchy = function(data){
    var root= {name: "root", children:[]};
    RawPlots.getChildren(data, root);
    return root;
}

RawPlots.arrayToMatrix = function(data){
	var out = [];
	switch(RawPlots.getType(data[0])){
		case "object":
		    var header = [];
			for (var name in data[0]){
				header.push(name);
			}
            out.push(header);
			for(var i= 0;i < data.length;i++){        
				var row = [];
				for(var name in data[i]){
					row.push(getCsvValue(data[i][name]))
				}            
				out.push(row);
			}   
			break;
			//TODO: find way of drawing 2d Arrays (check the min of the lenghts and stringify the rest)
			//case "array":
		case "undefined":
			console.log("could not draw empty array " , data)
			break;
			// if it is not an array or object supposes it is a builtin type and just adds rows like that
		default:
			out.push( [ RawPlots.getType(data[0]) ] );
			for(var i= 0;i < data.length;i++){        
				out.push( [ RawPlots.getObjValue(data[i]) ] );
			} 
	}
	return out;
}

RawPlots.objToMatrix = function(obj){
    var out= [];

    switch( RawPlots.getType(obj) ){
        case "array":
            return arrayToMatrix(obj);
        case 'object':
            out.push([]);
            for(var name in obj){
                out[0].push(name);
            }
            out.push([]);
            for(var name in obj){
                out[1].push( getCsvValue(obj[name]) );
            }
            return out;
        case "undefined":
            console.log("ERROR: data is undefined, visualization table is empty")
            return out;
        default:
            out[0] = [RawPlots.getType(obj)]; 
            out[1]= [getCsvValue(obj)];
            return out;
    }
}


//Function to draw a 2d heatmap matrix as seen in
//http://bl.ocks.org/mbostock/3074470
function draw_heatmap(data, div, options){

    div.innerHTML = '<div id="heatmap_chart" ></div>';

  var width = div.offsetWidth ,
    height = div.offsetHeight ;

  console.log("dimentions", width, height)
  var dx = data[0].length,
      dy = data.length;

  // Fix the aspect ratio.
  // var ka = dy / dx, kb = height / width;
  // if (ka < kb) height = width * ka;
  // else width = height / ka;

  var x = d3.scale.linear()
      .domain([0, dx])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, dy])
      .range([height, 0]);

/*  var color = d3.scale.linear()
      .domain([95, 115, 135, 155, 175, 195])
      .range(["#0a0", "#6c0", "#ee0", "#eb4", "#eb9", "#fff"]);
*/

    var vmax= data.reduce( function(max, arr){
      return Math.max( max,  Math.max.apply( Math, arr ))
    }, -Infinity);

    var vmin = data.reduce( function(max, arr){
      return Math.min( max,  Math.min.apply( Math, arr ))
    }, +Infinity);

    var domain = [vmin, vmax];
    var colors = ["#002", "#fff"]
    
    if(options && options.colors){
        colors = options.colors
        domain = [vmin];
        
        for (var i = 1 ; i < colors.length ; i ++){
            domain.push(vmin + i*(vmax-vmin)/(colors.length-1));
        }

    }
    console.log("colors" ,colors);
    console.log("domain" , domain);
    console.log("min/max", vmin, vmax);
    var color = d3.scale.linear()
      .domain(domain)
      .range(colors);


    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top")
      .ticks(20);

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("right");

    d3.select("#heatmap_chart").append("canvas")
      .attr("width", dx)
      .attr("height", dy)
      .style("width", width + "px")
      .style("height", height + "px")
      .call(drawImage);

    var svg = d3.select("#heatmap_chart").append("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .call(removeZero);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call(removeZero);

    // Compute the pixel colors; scaled by CSS.
    function drawImage(canvas) {
    var context = canvas.node().getContext("2d"),
        image = context.createImageData(dx, dy);

    for (var y = 0, p = -1; y < dy; ++y) {
      for (var x = 0; x < dx; ++x) {
        var c = d3.rgb(color(data[y][x]));
        image.data[++p] = c.r;
        image.data[++p] = c.g;
        image.data[++p] = c.b;
        image.data[++p] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    }

    function removeZero(axis) {
        axis.selectAll("g").filter(function(d) { return !d; }).remove();
    }
}

// Function to draw a sunburst sequence as seen in 
//http://bl.ocks.org/kerryrodden/7090426
function draw_sunburst(data, div) {
    console.log("drawing sunburst");
    var width = div.offsetWidth -20;
    if (width < 0) {
        console.log("div width not big enough,",width," defaulting to 600")
        width = 600;
    }
    var height = div.offsetHeight -70;
    if (height < 0){
        console.log("div height not big enough,",height," defaulting to 600")    
         height = 600;
     }

    // this is a bit of a hack, adds the divs to draw
    // check how to add divs with D3.js or jquery
    div.innerHTML = '\
    <div id="sunburst_chart"  style="width: '+ div.offsetWidth + 'px;height:'+div.offsetHeight+';">\
        <div id="sequence" style="width: '+ div.offsetWidth  + 'px; height:50px;"></div>\
        <div id="chart"></div>\
    </div>';

    // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
    var b = {
      w: 170, h: 30, s: 3, t: 10
    };

    // Total size of all segments; we set this later, after loading the data.
    var totalSize = 0; 

    var color = d3.scale.category20c();
    
    var radius = Math.min(width, height) / 2;

    // this does not work, check howto to get the size of the div
    //width=div.width;
    //height=div.heigth;    
    var vis = d3.select("#chart").append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("id", "container")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // add labels at the middle with the explanation
    // the div, like in the original example  was not working 
    var midlabel1 = vis.append("svg:text")
                        .attr("y", -10)
                        .attr("id", "midlabel1")
                        .attr("visibility", "hidden")
                        .attr("text-anchor", "middle");
    
    var midlabel2 = vis.append("svg:text")
                        .attr("y", +20)
                        .attr("id", "midlabel2")
                        .attr("visibility", "hidden")
                        .attr("text-anchor", "middle");


    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return d.size; });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

    // Basic setup of page elements.
    initializeBreadcrumbTrail();

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

    // function to get the colors of the nodes
    //var get_color = function(d) { return color((d.children ? d : d.parent).name); };
    var get_color = function(d) { return color(d.name); };

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition.nodes(data)
      .filter(function(d) {
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
      });

    var path = vis.data([data]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill",get_color)
      .style("opacity", 1)
      .on("mouseover", mouseover);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.node().__data__.value;


    // Fade all but the current sequence, and show it in the breadcrumb trail.
    function mouseover(d) {

      var percentage = (100 * d.value / totalSize).toPrecision(3);
      var percentageString = percentage + "%";
      //as the name can be long we add only a substring
      var percentageTotal = percentageString + 
                            " (" + d.value + "/" + totalSize + ")";

      if (percentage < 0.1) {
        percentageString = "< 0.1%";
      }

      //var name = d.name.substring(0,30);
      var name = d.name.substring(0,30);
      midlabel1.text(name)      
            .attr("visibility", "");
      midlabel2.text(percentageTotal)
            .attr("visibility", "");
      
      var sequenceArray = getAncestors(d);
      updateBreadcrumbs(sequenceArray, percentageString);

      // Fade all the segments.
      d3.selectAll("path")
          .style("opacity", 0.3);

      // Then highlight only those that are an ancestor of the current segment.
      vis.selectAll("path")
          .filter(function(node) {
                    return (sequenceArray.indexOf(node) >= 0);
                  })
          .style("opacity", 1);

    }

    // Restore everything to full opacity when moving off the visualization.
    function mouseleave(d) {

      // Hide the breadcrumb trail
      d3.select("#trail")
          .style("visibility", "hidden");
          
      midlabel1.attr("visibility", "hidden");
      midlabel2.attr("visibility", "hidden");
      // Deactivate all segments during transition.
      d3.selectAll("path").on("mouseover", null);

      // Transition each segment to full opacity and then reactivate it.
      d3.selectAll("path")
          .transition()
          .duration(1000)
          .style("opacity", 1)
          .each("end", function() {
                  d3.select(this).on("mouseover", mouseover);
                });
    }

    // Given a node in a partition layout, return an array of all of its ancestor
    // nodes, highest first, but excluding the root.
    function getAncestors(node) {
      var path = [];
      var current = node;
      while (current.parent) {
        path.unshift(current);
        current = current.parent;
      }
      return path;
    }

    function initializeBreadcrumbTrail() {
      // Add the svg area.
      var trail = d3.select("#sequence").append("svg:svg")
          .attr("width", width ) 
          .attr("height", 50)
          .attr("id", "trail");
      // Add the label at the end, for the percentage.
      trail.append("svg:text")
        .attr("id", "endlabel");
        //.style("fill", "#000");
    }

    // Generate a string that describes the points of a breadcrumb polygon.
    function breadcrumbPoints(d, i) {
      var points = [];
      points.push("0,0");
      points.push(b.w + ",0");
      points.push(b.w + b.t + "," + (b.h / 2));
      points.push(b.w + "," + b.h);
      points.push("0," + b.h);
      if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
      }
      return points.join(" ");
    }

    // Update the breadcrumb trail to show the current sequence and percentage.
    function updateBreadcrumbs(nodeArray, percentageString) {

      // Data join; key function combines name and depth (= position in sequence).
      var g = d3.select("#trail")
          .selectAll("g")
          .data(nodeArray, function(d) { return d.name + d.depth; });

      // Add breadcrumb and label for entering nodes.
      var entering = g.enter().append("svg:g");

      entering.append("svg:polygon")
          .attr("points", breadcrumbPoints)
          .style("fill", get_color);

      entering.append("svg:text")
          .attr("x", (b.w + b.t) / 2)
          .attr("y", b.h / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function(d) { 
                var maxl = 24;
                if (d.name.length > maxl){
                    return d.name.substring(0,maxl);
                }
                return d.name; 
          });

      // Set position for entering and updating nodes.
      g.attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
      });

      // Remove exiting nodes.
      g.exit().remove();

      // Now move and update the percentage at the end.
      d3.select("#trail").select("#endlabel")
          .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
          .attr("y", b.h / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(percentageString);

      // Make the breadcrumb trail visible, if it's hidden.
      d3.select("#trail")
          .style("visibility", "");
    }
 };

// draws a Interactive d3.js tree diagram as see in 
//http://bl.ocks.org/d3noob/8375092
function draw_tree(source, div){
    console.log("drawing tree");
    var margin = {top: 20, right: 20, bottom: 20, left: 60};
    var width;
    var height ;
    var i = 0, duration = 750, root;
    var svg, diagnonal, tree;
    
    width = div.offsetWidth - margin.right - margin.left;
    height= div.offsetHeight - margin.top - margin.bottom;

    tree = d3.layout.tree()
	    .size([height, width]);

    diagonal = d3.svg.diagonal()
	    .projection(function(d) { return [d.y, d.x]; });

    div.innerHTML ='<div id="tree_chart"></div>';
    svg = d3.select("#tree_chart").append("svg")
	    .attr("width", width + margin.right + margin.left)
	    .attr("height", height + margin.top + margin.bottom)
      .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    root = source;
    root.x0 = height / 2;
    root.y0 = 0;
      
    draw_node(source);
    
    //d3.select(self.frameElement).style("height", "500px");
    function draw_node(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
	      links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.depth * 100; });

      // Update the nodes…
      var node = svg.selectAll("g.node")
	      .data(nodes, function(d) { return d.id || (d.id = ++i); });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
	      .attr("class", "node")
	      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
	      .on("click", click);

      nodeEnter.append("circle")
	      .attr("r", 1e-6)
	      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeEnter.append("text")
	      .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
	      .attr("dy", ".35em")
	      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
	      .text(function(d) { return d.name; })
	      .style("fill-opacity", 1e-6);

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
	      .duration(duration)
	      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select("circle")
	      .attr("r", 10)
	      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeUpdate.select("text")
	      .style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
	      .duration(duration)
	      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
	      .remove();

      nodeExit.select("circle")
	      .attr("r", 1e-6);

      nodeExit.select("text")
	      .style("fill-opacity", 1e-6);

      // Update the links…
      var link = svg.selectAll("path.link")
	      .data(links, function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
	      .attr("class", "link")
	      .attr("d", function(d) {
		    var o = {x: source.x0, y: source.y0};
		    return diagonal({source: o, target: o});
	      });

      // Transition links to their new position.
      link.transition()
	      .duration(duration)
	      .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
	      .duration(duration)
	      .attr("d", function(d) {
		    var o = {x: source.x, y: source.y};
		    return diagonal({source: o, target: o});
	      })
	      .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
	    d.x0 = d.x;
	    d.y0 = d.y;
      });
    }
    
    // Toggle children on click.
    function click(d) {
      if (d.children) {
	    d._children = d.children;
	    d.children = null;
      } else {
	    d.children = d._children;
	    d._children = null;
      }
      draw_node(d);
    }

}

//Zoomable Circle Packing
//http://bl.ocks.org/mbostock/7607535
function draw_circle_packing(data, div) {
    console.log("drawing circle packing");
    div.innerHTML ='<div id="circle_chart"></div>';

    var width =  div.offsetWidth ;
    var height = div.offsetHeight;

    var margin = 10;
    var r = Math.min(width, height) -margin;
    var x = d3.scale.linear().range([0, r]);
    var y = d3.scale.linear().range([0, r]);

    var pack = d3.layout.pack()
        .size([r, r])
        .value(function(d) { return d.size; });

    var vis = d3.select("#circle_chart").insert("svg:svg", "h2")
        .attr("width", width)
        .attr("height", height)
      .append("svg:g")
        .attr("transform", "translate(" + (width - r) / 2 + "," + (height - r) / 2 + ")");

  var node = data = data;

  var nodes = pack.nodes(data);

  var zoom = function(d, i) {
      var k = r / d.r / 2;
      x.domain([d.x - d.r, d.x + d.r]);
      y.domain([d.y - d.r, d.y + d.r]);

      var t = vis.transition()
          .duration(d3.event.altKey ? 7500 : 750);

      t.selectAll("circle")
          .attr("cx", function(d) { return x(d.x); })
          .attr("cy", function(d) { return y(d.y); })
          .attr("r", function(d) { return k * d.r; });

      t.selectAll("text")
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y); })
          .style("opacity", function(d) { return k * d.r > 20 ? 1 : 0; });

      node = d;
      d3.event.stopPropagation();
    };

  vis.selectAll("circle")
      .data(nodes)
    .enter().append("svg:circle")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; })
      .on("click", function(d) { return zoom(node == d ? data : d); });

  vis.selectAll("text")
      .data(nodes)
    .enter().append("svg:text")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("opacity", function(d) { return d.r > 20 ? 1 : 0; })
      .text(function(d) { return d.name; });

  d3.select(window).on("click", function() { zoom(data); });
  
};

//Zoomable treemap as seen in 
//http://mbostock.github.io/d3/talk/20111018/treemap.html
function draw_treemap(data, div){
    console.log("drawing treemap");
    div.innerHTML ='\
        <form>\
            <label><input type="radio" name="mode" value="size" checked> Size</label>\
            <label><input type="radio" name="mode" value="count"> Count</label>\
        </form>\
        <div id="treemap_chart"></div>';

    var margin = {top: 40, right: 10, bottom: 30, left: 10},
        w = div.offsetWidth - margin.left - margin.right,
        h = div.offsetHeight - margin.top - margin.bottom;

    var color = d3.scale.category20c();

    var x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]),
        color = d3.scale.category20c(),
        root,
        node;

    var treemap = d3.layout.treemap()
        .round(false)
        .size([w, h])
        .sticky(true)
        .value(function(d) { return d.size; });

    var svg = d3.select("#treemap_chart").append("div")
        .attr("class", "chart")
        .style("width", w + "px")
        .style("height", h + "px")
      .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
      .append("svg:g")
        .attr("transform", "translate(.5,.5)");

      node = root = data;

      var nodes = treemap.nodes(root)
          .filter(function(d) { return !d.children; });

      var cell = svg.selectAll("g")
          .data(nodes)
        .enter().append("svg:g")
          .attr("class", "cell")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
          .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

      cell.append("svg:rect")
          .attr("width", function(d) { return d.dx - 1; })
          .attr("height", function(d) { return d.dy - 1; })
          .style("fill", function(d) { return color(d.parent.name); });

      cell.append("svg:text")
          .attr("x", function(d) { return d.dx / 2; })
          .attr("y", function(d) { return d.dy / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .text(function(d) { return d.name; })
          .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

      d3.select(window).on("click", function() { zoom(root); });

      d3.selectAll("input").on("change", function() {
          var value = this.value === "count"
            ? function() { return 1; }
            : function(d) { return d.size; };
        treemap.value(value).nodes(root);
        zoom(node);
      });

    function zoom(d) {
      var kx = w / d.dx, ky = h / d.dy;
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      var t = svg.selectAll("g.cell").transition()
          .duration(d3.event.altKey ? 7500 : 750)
          .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

      t.select("rect")
          .attr("width", function(d) { return kx * d.dx - 1; })
          .attr("height", function(d) { return ky * d.dy - 1; })

      t.select("text")
          .attr("x", function(d) { return kx * d.dx / 2; })
          .attr("y", function(d) { return ky * d.dy / 2; })
          .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

      node = d;
      d3.event.stopPropagation();
    }
}

function draw_bubblechart(data, div){
    console.log("drawing bubble chart");
    div.innerHTML ='<div id="bubble_chart"></div>';
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
        w = div.offsetWidth - margin.left - margin.right,
        h = div.offsetHeight - margin.top - margin.bottom;
    
    var diameter = Math.min(w,h),
        format = d3.format(",d"),
        color = d3.scale.category20c();

    var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(1.5);

    var svg = d3.select("#bubble_chart").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

    

    var node = svg.selectAll(".node")
        .data(bubble.nodes(classes(data))
        .filter(function(d) { return !d.children; }))
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("title")
        .text(function(d) { return d.className + ": " + format(d.value); });

    node.append("circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return color(d.packageName); });

    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.className.substring(0, d.r / 3); });

    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function classes(data) {
        var classes = [];

        function recurse(name, node) {
            if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
            else classes.push({packageName: name, className: node.name, value: node.size});
        }

        recurse(null, data);
        return {children: classes};
    }
}

