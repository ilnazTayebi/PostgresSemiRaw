google.load("visualization", "1", {packages:["corechart", "table", "geochart", "map"]});

// the div used in all the drawing functions
var graph_div = document.getElementById('graph');

// global variable that holds the data to be plotted
var draw_data = {
    data: undefined,
    last_draw : ""
}

//data structure with functions to visualize the data
var draw_functions  = {
    table : function(){
	    draw_data.last_draw = "table";
	    //graph_div.empty();
	    var t = dataToTable(draw_data.data);
	    var visualization = new google.visualization.Table(graph_div);
	    visualization.draw(t,
            {showRowNumber: true, width: '70%', height: '100%'}
        );
    },
    columnChart : function(){ 
        draw_data.last_draw = "columnChart";
        var t = dataToTable(draw_data.data);
        var visualization = new google.visualization.ColumnChart(graph_div);
        visualization.draw(t);
    },
    barChart : function(){ 
        draw_data.last_draw = "barChart";
        var t = dataToTable(draw_data.data);
        var visualization = new google.visualization.BarChart(graph_div);
        visualization.draw(t);
    },    
    pieChart : function(){ 
        draw_data.last_draw = "pieChart"
        var t = dataToTable(draw_data.data);
        var visualization = new google.visualization.PieChart(graph_div);
        visualization.draw(t);
    },
    scatterChart : function(){
        draw_data.last_draw = "scatterChart"
        var t = dataToTable(draw_data.data);
        var visualization = new google.visualization.ScatterChart(graph_div);
        visualization.draw(t);
    },
    areaChart : function (){ 
        draw_data.last_draw = "areaChart";
        var t = dataToTable(draw_data.data);
        var visualization = new google.visualization.AreaChart(graph_div);
        visualization.draw(t);
    },
    histogram: function(){
        draw_data.last_draw = "histogram";
        var t = dataToTable(draw_data.data);
        var chart = new google.visualization.Histogram(graph_div);
        chart.draw(t);
    },
    line_chart: function(){
        draw_data.last_draw = "line_chart";
        var chart = new google.visualization.LineChart(graph_div);
        var t = dataToTable(draw_data.data);
        chart.draw(t);
    },
    geo_world: function(){
        // this is because google maps screws the css
        // by inserting a div just for drawing at least does not screw up other graphs
        graph_div.innerHTML = '<div id="map_canvas" style="height: 100%; width: 100%;"></div>';
        draw_data.last_draw = "geo_world";
        var chart = new google.visualization.Map(document.getElementById('map_canvas'));
        options = {
            mapType : 'normal',
            showTip : true
        }
        var t = dataToTable(draw_data.data);
        chart.draw(t, options);
    },
    sunburts: function(){
        draw_data.last_draw = "sunburts";
        d = dataToHierarchy(draw_data.data);
        draw_sunburst(d, graph_div);
    },
    tree: function(){
        draw_data.last_draw = "tree";
        d = dataToHierarchy(draw_data.data);
        draw_tree(d, graph_div);
    },
    circle_pack: function(){
        draw_data.last_draw = "circle_pack";
        d = dataToHierarchy(draw_data.data);
        draw_circle_packing(d, graph_div);
    },
    treemap: function(){
        draw_data.last_draw = "treemap";
        d = dataToHierarchy(draw_data.data);
        draw_treemap(d, graph_div);
    },
    bubble_chart: function(){
        draw_data.last_draw = "bubble_chart";
        d = dataToHierarchy(draw_data.data);
        draw_bubblechart(d, graph_div);
    },
    surface_3d : function(){
        draw_data.last_draw = "surface_3d";
        var t = dataToPointTable(draw_data.data);
        var options = { 
            style: "surface",
            width: ""+graph_div.offsetWidth -10+ "px",
            height: ""+graph_div.offsetHeight -10+ "px"
        };
        var chart = new links.Graph3d(graph_div);
        chart.draw(t, options);
    },
    bars_3d : function(){
        draw_data.last_draw = "bars_3d";
        var t = dataToPointTable(draw_data.data);
        var options = { 
            style: "bar",
            width: ""+graph_div.offsetWidth -10+ "px",
            height: ""+graph_div.offsetHeight -10+ "px"
        };
        var chart = new links.Graph3d(graph_div);
        chart.draw(t, options);
    },
    heatmap : function(){
        draw_data.last_draw = "heatmap";
        d = dataToMatrix(draw_data.data);
        //["#f00", "#f80", "#ff0", "#fff", "#002"]
        //["#002","#fff" ,"#ff0", "#fa0", "#f00"]
        //["#0a0", "#6c0", "#ee0", "#eb4", "#eb9", "#fff"]
        draw_heatmap(d, graph_div, {colors :["#002","#88f","#4f4","#ff4","#f80" ,"#f00"]});
    }
}


// There is a bug with when drawing tables, so if the tab is not selected it takes the full height, 
//like this it will only draw when the graph tab is selected
var tab_selected = "";
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		//show selected tab / active
		tab_selected =  $(e.target).attr('id');

		if (tab_selected == "graph_li" ) redraw_graph(draw_data.data);

		});

// function that redraws the graph
function redraw_graph(new_data){
	draw_data.data=new_data;
    check_compatible_graphs(new_data);
	if (tab_selected != "graph_li" ) return;

	if (draw_data.last_draw != ""){
		console.log("redrawing " + draw_data.last_draw);
		draw_functions[draw_data.last_draw]();
	}
	else{
		console.log("last_draw empty");
	}

}

// checks if all keys are numeric starting from start
// This is useful to check the compatibility of certain graphs
function all_numeric(data, start){
    var types = [];
    for (var k in data){
        types.push(getType(data[k]))
    }
    for (var n = start; n < types.length ; n++){
        if (types[n] != "number") return false;
    }
    return true;
}

function check_compatible_graphs(data){
    console.log("checking compatible graphs") ;
    var enable = function(enabled ) {
        elements = ['draw_table_btn',
                    'draw_pie',
                    'draw_bar',
                    'draw_histogram',
                    'draw_scatter',
                    'draw_line',
                    'draw_geo',
                    'draw_sunburst',
                    'draw_tree',
                    'draw_circle_pack',
                    'draw_treemap',
                    'draw_bubblechart',
                    'draw_3dsurface',
                    'draw_3dbars',
                    'draw_heatmap',
                    '2d_dropdown',
                    '3d_dropdown',
                    'hierarchy_dropdown'];

        console.log('enabling', enabled);
        for(var n in elements){
            $('#'+elements[n]).addClass('disabled');
        }
        for(var n in enabled){
            $('#'+enabled[n]).removeClass('disabled');
        }
    };

    var type = getType(data);
    var to_enable= [];
    console.log('type', type);
    // hierarchical stuff 
    if (type != "undefined" || ( type == "array" && data.length >= 0)){
        console.log('enabling hierarchy graphs');
        to_enable.push ('draw_sunburst',
                        'draw_tree',
                        'draw_circle_pack',
                        'draw_treemap',
                        'draw_bubblechart',
                        'draw_table_btn',
                        'hierarchy_dropdown');

    }
    if (type == "array"){
        type = getType(data[0]);
        console.log("sub type", type)
        console.log("all_numeric 0" , all_numeric(data[0], 0));
        console.log("all_numeric 1" , all_numeric(data[0], 1));

        if (type == "object" ){
            keys = Object.keys(data[0]);
            // at least one non numeric value
            if (all_numeric(data[0], 0) == false){
                to_enable.push('draw_geo');
            }
            if (keys.length >= 2 && all_numeric(data[0], 1) ){
                to_enable.push('draw_bar',
                            'draw_histogram',
                            'draw_scatter',
                            'draw_line',
                            '2d_dropdown');
                to_enable.push('draw_geo');
                if (all_numeric(data[0], 0) == false) {
                    to_enable.push('draw_pie');
                }
            }
            if (keys.length >= 3 && all_numeric(data[0], 0)){
                to_enable.push('3d_dropdown', 'draw_3dsurface', 'draw_3dbars');
                
            }
        }
        else if (type == "number" ){
            to_enable.push('draw_histogram',
                          '2d_dropdown');
        }
        else if (type == "string"){
            to_enable.push('draw_geo');
        }
        else if (type == "array"){
            console.log('enabling heatmap');
            to_enable.push('3d_dropdown', 'draw_heatmap');
        }

    }

    enable(to_enable)
}

// assigns the callbacks to all the elements
document.getElementById('draw_table_btn').onclick = draw_functions['table'];
// 2d graphs
document.getElementById('draw_pie').onclick = draw_functions['pieChart'];
document.getElementById('draw_bar').onclick = draw_functions['columnChart'];
document.getElementById('draw_histogram').onclick = draw_functions['histogram'];
document.getElementById('draw_scatter').onclick = draw_functions['scatterChart'];
document.getElementById('draw_line').onclick = draw_functions['line_chart'];
//geo graphs
document.getElementById('draw_geo').onclick = draw_functions['geo_world'];
// hierarchy graphs
document.getElementById('draw_sunburst').onclick =  draw_functions['sunburts'];
document.getElementById('draw_tree').onclick =  draw_functions['tree'];
document.getElementById('draw_circle_pack').onclick =  draw_functions['circle_pack'];
document.getElementById('draw_treemap').onclick =  draw_functions['treemap'];
document.getElementById('draw_bubblechart').onclick =  draw_functions['bubble_chart'];

document.getElementById('draw_3dsurface').onclick =  draw_functions['surface_3d'];
document.getElementById('draw_3dbars').onclick =  draw_functions['bars_3d'];
document.getElementById('draw_heatmap').onclick =  draw_functions['heatmap'];
