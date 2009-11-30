/* 
    PlotKit Layout
    ==============
    
    Handles laying out data on to a virtual canvas square canvas between 0.0 
    and 1.0. If you want to add new chart/plot types such as point plots,
    you need to add them here.
    
    Copyright
    ---------
    Copyright 2005,2006 (c) Alastair Tse <alastair^liquidx.net>
    For use under the BSD license. <http://www.liquidx.net/plotkit>
    
*/

// --------------------------------------------------------------------
// Start of Layout definition
// --------------------------------------------------------------------

if (typeof(PlotKit.Layout) == 'undefined') {
    PlotKit.Layout = {};
}

// --------------------------------------------------------------------
// Start of Layout definition
// --------------------------------------------------------------------

PlotKit.Layout = function(style, options) {
    this.options = { };

    // valid external options : TODO: input verification
    MochiKit.Base.update(this.options, options ? options : {});

    // internal states
    this.datasets = new Array();
};

// --------------------------------------------------------------------
// Dataset Manipulation
// --------------------------------------------------------------------


PlotKit.Layout.prototype.addDataset = function(setname, set_xy) {
    this.datasets[setname] = set_xy;
};

// --------------------------------------------------------------------
// Evaluates the layout for the current data and style.
// --------------------------------------------------------------------

PlotKit.Layout.prototype.evaluate = function() {
    this._evaluateLimits();
    this._evaluateLineCharts();
    this._evaluateLineTicks();
};


// --------------------------------------------------------------------
// START Internal Functions
// --------------------------------------------------------------------

PlotKit.Layout.prototype._evaluateLimits = function() {
    this.minxval = this.maxxval = null;
    for (var name in this.datasets) {
      var series = this.datasets[name];
      var x1 = series[0][0];
      if (!this.minxval || x1 < this.minxval) this.minxval = x1;

      var x2 = series[series.length - 1][0];
      if (!this.maxxval || x2 > this.maxxval) this.maxxval = x2;
    }
    this.xrange = this.maxxval - this.minxval;
    this.xscale = (this.xrange != 0 ? 1/this.xrange : 1.0);

    this.minyval = this.options.yAxis[0];
    this.maxyval = this.options.yAxis[1];
    this.yrange = this.maxyval - this.minyval;
    this.yscale = (this.yrange != 0 ? 1/this.yrange : 1.0);
};

// Create the line charts
PlotKit.Layout.prototype._evaluateLineCharts = function() {
    var items = PlotKit.Base.items;

    var setCount = items(this.datasets).length;

    // add all the rects
    this.points = new Array();
    for (var setName in this.datasets) {
        var dataset = this.datasets[setName];
        for (var j = 0; j < dataset.length; j++) {
            var item = dataset[j];
            var point = {
                x: ((parseFloat(item[0]) - this.minxval) * this.xscale),
                y: 1.0 - ((parseFloat(item[1]) - this.minyval) * this.yscale),
                xval: parseFloat(item[0]),
                yval: parseFloat(item[1]),
                name: setName
            };

            // limit the x, y values so they do not overdraw
            if (point.y <= 0.0) {
                point.y = 0.0;
            }
            if (point.y >= 1.0) {
                point.y = 1.0;
            }
            if ((point.x >= 0.0) && (point.x <= 1.0)) {
                this.points.push(point);
            }
        }
    }
};

PlotKit.Layout.prototype._evaluateLineTicks = function() {
  this.xticks = new Array();
  for (var i = 0; i < this.options.xTicks.length; i++) {
    var tick = this.options.xTicks[i];
    var label = tick.label;
    var pos = this.xscale * (tick.v - this.minxval);
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.xticks.push([pos, label]);
    }
  }

  this.yticks = new Array();
  for (var i = 0; i < this.options.yTicks.length; i++) {
    var tick = this.options.yTicks[i];
    var label = tick.label;
    var pos = 1.0 - (this.yscale * (tick.v - this.minyval));
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.yticks.push([pos, label]);
    }
  }
};

