// this is for creating a new id for each new widget

function RawDashboard(selector, options) {
    this.dirty=false;
    this.plots= {};
    this.id = options.id;
    this.name = options.name;
    this.static = options.static || false;
    this.buttons = options.buttons || {edit:true, remove:true};
    this.askSave = options.askSave || false;
    var grid = {
        widget_selector: ".query",
        widget_margins: [options.marginx,options.marginy],
        widget_base_dimensions: [options.gridsizex, options.gridsizey],
        min_cols: options.cols,
        max_cols: options.cols,
        max_rows:  options.rows
    };

    if (this.static) {
        grid.resize={ enabled: false };
        //All the gridster settings
        this.gridster = $(selector)
            .gridster(grid)
            .data('gridster')
            .disable();// this maked the dragging disabled
    } else {
        var self = this;
        grid.resize = {
            enabled: true,
            min_size: [2, 2],
            max_size: [options.cols, options.rows],
            start: function(e, ui, $widget) {
                $widget.children(".plot").hide();
            },
            resize: function(e, ui, $widget) {
                self.dirty = true;
            },
            stop: function(e, ui, $widget) {
                var id = $widget[0].id;
                RawDashboard.resize_plot($widget);
                self.plots[id].redraw();
            }
        };

        grid.draggable = {
            start: function(e, ui, $widget) { },
            drag: function(e, ui, $widget) { self.dirty = true; },
            stop: function(e, ui, $widget) { }
        };

        //All the gridster settings
        this.gridster = $(selector)
            .gridster(grid)
            .data('gridster');
    }
}

RawDashboard.resize_plot = function(widget) {
    var h = widget.height();
    var w = widget.width();
    widget.children('.plot')
        .height(h-40)
        .width(w-1)
        .show();
}

var widget_counter = 0;
RawDashboard.prototype.add_widget= function(item) {
    var id = "widget"+(++widget_counter);
    var plot_div= "p_"+id;
    this.dirty=true;
    var s = '<div class="query" data-query-name= "'+item.queryName+'" id ="'+id+'">'+
                '<div class="query-header" >'+
                    item.header +
                    '<div class="btn-toolbar pull-right" role="toolbar">'+
                        '<div class="btn-group" role="group">'+
                            '<button class="btn btn-xs edit-query"><span class="glyphicon glyphicon-pencil"></span></button>'+
                            '<button class="btn btn-xs remove-widget"><span class="glyphicon glyphicon-trash"></span></button>'+
                        '</div>'+
                    '</div>' +
            '</div>'+
                '<div class="plot" id="'+plot_div+'"></div>'+
            '</div>';

    var widget= this.gridster.add_widget(s, item.sizex, item.sizey, item.col, item.row);
    if (this.static) {
        widget.find(".edit-query,.remove-widget").hide();
    } else {
        if (!this.buttons.remove) {
            widget.find(".remove-widget").hide();
        }
        if (!this.buttons.edit) {
            widget.find(".edit-query").hide();
        }
    }

    if (item.html) {
        $("#"+plot_div).html(item.html);
        return;
    }
    var self= this;
    RawDashboard.resize_plot(widget);
    self.plots[id] = new RawPlotly(plot_div);
    // callback for the ajax call or for setting the data
    var set_data = function(data) {

        self.plots[id].set_data(data);
        if (item.plot != undefined && item.plot != "" && item.plot != null) {
            self.plots[id].draw(item.plot);
        } else {
            self.plots[id].draw(RawPlotly.getDrawFunctions()[0]);
        }
    };

    if (item.data == undefined) {
        self.plots[id].errorMsg("Error no data available for plot");
    } else {
        set_data(item.data);
    }
    //adds the callbacks to the widgets
    widget.find('.remove-widget').click(function(e) {
        self.gridster.remove_widget(widget);
        self.dirty=true;
    });

    widget.find('.edit-query').click(function(e) {
        var url= jsRoutes.controllers.Queries.queryEdit(item.queryName).url;
        self.gotoLocation(url);
    });

}

RawDashboard.prototype.serialize = function() {
    var items = [];
    var self= this;
    $('.query').each(function(index) {
        var header = $( this ).children('.query-header').text();
        var item = {
            id: index,
            dashboardId: self.id,
            header: header,
            queryName: $(this).attr("data-query-name"),
            col: Number($(this).attr("data-col")),
            row: Number($(this).attr("data-row")),
            sizex: Number($(this).attr("data-sizex")),
            sizey: Number($(this).attr("data-sizey")),
            created_at: new Date()
        }
        items.push(item);
    });
    return items;
}

RawDashboard.prototype.save = function(calbacks) {
    var self= this;
    var items = this.serialize();

    $.ajax({
        url: jsRoutes.controllers.Dashboards.doSaveDashboard(self.id).url,
        method: jsRoutes.controllers.Dashboards.doSaveDashboard(self.id).method,
        contentType: 'application/json',
        data: JSON.stringify({
            dashId:self.id,
            items:items
        }),
        dataType: 'json'
    }).done(function(request) {
        self.dirty = false;
        calbacks.done();
    }).fail(function(request) {
        console.log("failed to save dashboard", request);
        calbacks.fail();
    });
}

RawDashboard.prototype.gotoLocation = function(url) {
    if (!this.askSave || !this.dirty) {
        window.location.href =url;
        return;
    }
    var dialog =
    '<div class="modal fade" id="alert-save-dlg">'+
        '<div class="modal-dialog"> '+
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
                    '<h4 class="modal-title">Save dashboard</h4>'+
                '</div>'+
                '<div class="modal-body">'+
                    '<p>Your dashboard has unsaved changes. Do you want to save now?</p>'+
                '</div>'+
                '<div class="modal-footer">'+
                    '<button type="button" class="btn btn-default dismiss" data-dismiss="modal">Leave Page</button>'+
                    '<button type="button" class="btn btn-primary save">Save changes</button>'+
                '</div>'+
            '</div>'+
        '</div>'+
    '</div>';

    var self = this;

    var dlg=$(dialog);
    dlg.find(' .save').click(function(e) {
        self.save({
            done: function() {
                window.location.href =url;
            },
            fail: function() {
                alert("Error saving dashboard. Please try again.");
            }
        });
    });
    dlg.find(' .dismiss').click(function(e) {
        // like this it will not ask twice
        self.dirty=false;
        window.location.href = url;
    });
    dlg.modal('show');
}