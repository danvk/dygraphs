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

try {    
    if (typeof(PlotKit.Base) == 'undefined')
    {
        throw ""
    }
} 
catch (e) {    
    throw "PlotKit.Layout depends on MochiKit.{Base,Color,DOM,Format} and PlotKit.Base"
}

// --------------------------------------------------------------------
// Start of Layout definition
// --------------------------------------------------------------------

if (typeof(PlotKit.Layout) == 'undefined') {
    PlotKit.Layout = {};
}

PlotKit.Layout.NAME = "PlotKit.Layout";
PlotKit.Layout.VERSION = PlotKit.VERSION;

PlotKit.Layout.__repr__ = function() {
    return "[" + this.NAME + " " + this.VERSION + "]";
};

PlotKit.Layout.toString = function() {
    return this.__repr__();
}

PlotKit.Layout.valid_styles = ["bar", "line", "pie", "point"];

// --------------------------------------------------------------------
// Start of Layout definition
// --------------------------------------------------------------------

PlotKit.Layout = function(style, options) {
  
    this.options = {
        "barWidthFillFraction": 0.75,
        "barOrientation": "vertical",
        "xOriginIsZero": true,
        "yOriginIsZero": true,
        "xAxis": null, // [xmin, xmax]
        "yAxis": null, // [ymin, ymax]
        "xTicks": null, // [{label: "somelabel", v: value}, ..] (label opt.)
        "yTicks": null, // [{label: "somelabel", v: value}, ..] (label opt.)
        "xNumberOfTicks": 10,
        "yNumberOfTicks": 5,
        "xTickPrecision": 1,
        "yTickPrecision": 1,
        "pieRadius": 0.4
    };

    // valid external options : TODO: input verification
    this.style = style; 
    MochiKit.Base.update(this.options, options ? options : {});

    // externally visible states
    // overriden if xAxis and yAxis are set in options
    if (!MochiKit.Base.isUndefinedOrNull(this.options.xAxis)) {
        this.minxval = this.options.xAxis[0];
        this.maxxval = this.options.xAxis[1];
        this.xscale = this.maxxval - this.minxval; 
    }
    else {
        this.minxval = 0;
        this.maxxval = null;
        this.xscale = null; // val -> pos factor (eg, xval * xscale = xpos)
    }

    if (!MochiKit.Base.isUndefinedOrNull(this.options.yAxis)) {
        this.minyval = this.options.yAxis[0];
        this.maxyval = this.options.yAxis[1];
        this.yscale = this.maxyval - this.minyval;
    }
    else {
        this.minyval = 0;
        this.maxyval = null;
        this.yscale = null;
    }

    this.bars = new Array();   // array of bars to plot for bar charts
    this.points = new Array(); // array of points to plot for line plots
    this.slices = new Array(); // array of slices to draw for pie charts

    this.xticks = new Array();
    this.yticks = new Array();

    // internal states
    this.datasets = new Array();
    this.minxdelta = 0;
    this.xrange = 1;
    this.yrange = 1;

    this.hitTestCache = {x2maxy: null};
    
};

// --------------------------------------------------------------------
// Dataset Manipulation
// --------------------------------------------------------------------


PlotKit.Layout.prototype.addDataset = function(setname, set_xy) {
    this.datasets[setname] = set_xy;
};

PlotKit.Layout.prototype.removeDataset = function(setname, set_xy) {
    delete this.datasets[setname];
};

PlotKit.Layout.prototype.addDatasetFromTable = function(name, tableElement, xcol, ycol,  lcol) {
	var isNil = MochiKit.Base.isUndefinedOrNull;
	var scrapeText = MochiKit.DOM.scrapeText;
	var strip = MochiKit.Format.strip;
	
	if (isNil(xcol))
		xcol = 0;
	if (isNil(ycol))
		ycol = 1;
	if (isNil(lcol))
	    lcol = -1;
        
    var rows = tableElement.tBodies[0].rows;
    var data = new Array();
    var labels = new Array();
    
    if (!isNil(rows)) {
        for (var i = 0; i < rows.length; i++) {
            data.push([parseFloat(strip(scrapeText(rows[i].cells[xcol]))),
                       parseFloat(strip(scrapeText(rows[i].cells[ycol])))]);
            if (lcol >= 0){
               labels.push({v: parseFloat(strip(scrapeText(rows[i].cells[xcol]))),
                            label:  strip(scrapeText(rows[i].cells[lcol]))});
            }
        }
        this.addDataset(name, data);
        if (lcol >= 0) {
            this.options.xTicks = labels;
        }
        return true;
    }
    return false;
};

// --------------------------------------------------------------------
// Evaluates the layout for the current data and style.
// --------------------------------------------------------------------

PlotKit.Layout.prototype.evaluate = function() {
    this._evaluateLimits();
    this._evaluateScales();
    if (this.style == "line") {
        this._evaluateLineCharts();
        this._evaluateLineTicks();
    }
};




// --------------------------------------------------------------------
// START Internal Functions
// --------------------------------------------------------------------

PlotKit.Layout.prototype._evaluateLimits = function() {
    // take all values from all datasets and find max and min
    var map = PlotKit.Base.map;
    var items = PlotKit.Base.items;
    var itemgetter = MochiKit.Base.itemgetter;
    var collapse = PlotKit.Base.collapse;
    var listMin = MochiKit.Base.listMin;
    var listMax = MochiKit.Base.listMax;
    var isNil = MochiKit.Base.isUndefinedOrNull;


    var all = collapse(map(itemgetter(1), items(this.datasets)));
    if (isNil(this.options.xAxis)) {
        if (this.options.xOriginIsZero)
            this.minxval = 0;
        else
            this.minxval = listMin(map(parseFloat, map(itemgetter(0), all)));

        this.maxxval = listMax(map(parseFloat, map(itemgetter(0), all)));
    }
    else {
        this.minxval = this.options.xAxis[0];
        this.maxxval = this.options.xAxis[1];
        this.xscale = this.maxval - this.minxval;
    }
    
    if (isNil(this.options.yAxis)) {
        if (this.options.yOriginIsZero)
            this.minyval = 0;
        else
            this.minyval = listMin(map(parseFloat, map(itemgetter(1), all)));

        this.maxyval = listMax(map(parseFloat, map(itemgetter(1), all)));
    }
    else {
        this.minyval = this.options.yAxis[0];
        this.maxyval = this.options.yAxis[1];
        this.yscale = this.maxyval - this.minyval;
    }

};

PlotKit.Layout.prototype._evaluateScales = function() {
    var isNil = MochiKit.Base.isUndefinedOrNull;

    this.xrange = this.maxxval - this.minxval;
    if (this.xrange == 0)
        this.xscale = 1.0;
    else
        this.xscale = 1/this.xrange;

    this.yrange = this.maxyval - this.minyval;
    if (this.yrange == 0)
        this.yscale = 1.0;
    else
        this.yscale = 1/this.yrange;
};

PlotKit.Layout.prototype._uniqueXValues = function() {
    var collapse = PlotKit.Base.collapse;
    var map = PlotKit.Base.map;
    var uniq = PlotKit.Base.uniq;
    var getter = MochiKit.Base.itemgetter;
    var items = PlotKit.Base.items;
    
    var xvalues = map(parseFloat, map(getter(0), collapse(map(getter(1), items(this.datasets)))));
    xvalues.sort(MochiKit.Base.compare);
    return uniq(xvalues);
};


// Create the line charts
PlotKit.Layout.prototype._evaluateLineCharts = function() {
    var items = PlotKit.Base.items;

    var setCount = items(this.datasets).length;

    // add all the rects
    this.points = new Array();
    var i = 0;
    for (var setName in this.datasets) {
        var dataset = this.datasets[setName];
        if (PlotKit.Base.isFuncLike(dataset)) continue;
        dataset.sort(function(a, b) { return compare(parseFloat(a[0]), parseFloat(b[0])); });
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
        i++;
    }
};


PlotKit.Layout.prototype._evaluateLineTicksForXAxis = function() {
    var isNil = MochiKit.Base.isUndefinedOrNull;
    
    if (this.options.xTicks) {
        // we use use specified ticks with optional labels

        this.xticks = new Array();
        var makeTicks = function(tick) {
            var label = tick.label;
            if (isNil(label))
                label = tick.v.toString();
            var pos = this.xscale * (tick.v - this.minxval);
            if ((pos >= 0.0) && (pos <= 1.0)) {
                this.xticks.push([pos, label]);
            }
        };
        MochiKit.Iter.forEach(this.options.xTicks, bind(makeTicks, this));
    }
    else if (this.options.xNumberOfTicks) {
        // we use defined number of ticks as hint to auto generate
        var xvalues = this._uniqueXValues();
        var roughSeparation = this.xrange / this.options.xNumberOfTicks;
        var tickCount = 0;

        this.xticks = new Array();
        for (var i = 0; i <= xvalues.length; i++) {
            if ((xvalues[i] - this.minxval) >= (tickCount * roughSeparation)) {
                var pos = this.xscale * (xvalues[i] - this.minxval);
                if ((pos > 1.0) || (pos < 0.0))
                    continue;
                this.xticks.push([pos, xvalues[i]]);
                tickCount++;
            }
            if (tickCount > this.options.xNumberOfTicks)
                break;
        }
    }
};

PlotKit.Layout.prototype._evaluateLineTicksForYAxis = function() {
    var isNil = MochiKit.Base.isUndefinedOrNull;


    if (this.options.yTicks) {
        this.yticks = new Array();
        var makeTicks = function(tick) {
            var label = tick.label;
            if (isNil(label))
                label = tick.v.toString();
            var pos = 1.0 - (this.yscale * (tick.v - this.minyval));
            if ((pos >= 0.0) && (pos <= 1.0)) {
                this.yticks.push([pos, label]);
            }
        };
        MochiKit.Iter.forEach(this.options.yTicks, bind(makeTicks, this));
    }
    else if (this.options.yNumberOfTicks) {
        // We use the optionally defined number of ticks as a guide        
        this.yticks = new Array();

        // if we get this separation right, we'll have good looking graphs
        var roundInt = PlotKit.Base.roundInterval;
        var prec = this.options.yTickPrecision;
        var roughSeparation = roundInt(this.yrange, 
                                       this.options.yNumberOfTicks, prec);

        // round off each value of the y-axis to the precision
        // eg. 1.3333 at precision 1 -> 1.3
        for (var i = 0; i <= this.options.yNumberOfTicks; i++) {
            var yval = this.minyval + (i * roughSeparation);
            var pos = 1.0 - ((yval - this.minyval) * this.yscale);
            if ((pos > 1.0) || (pos < 0.0))
                continue;
            this.yticks.push([pos, MochiKit.Format.roundToFixed(yval, prec)]);
        }
    }
};

PlotKit.Layout.prototype._evaluateLineTicks = function() {
    this._evaluateLineTicksForXAxis();
    this._evaluateLineTicksForYAxis();
};


// --------------------------------------------------------------------
// END Internal Functions
// --------------------------------------------------------------------


// Namespace Iniitialisation

PlotKit.LayoutModule = {};
PlotKit.LayoutModule.Layout = PlotKit.Layout;

PlotKit.LayoutModule.EXPORT = [
    "Layout"
];

PlotKit.LayoutModule.EXPORT_OK = [];

PlotKit.LayoutModule.__new__ = function() {
    var m = MochiKit.Base;
    
    m.nameFunctions(this);
    
    this.EXPORT_TAGS = {
        ":common": this.EXPORT,
        ":all": m.concat(this.EXPORT, this.EXPORT_OK)
    };
};

PlotKit.LayoutModule.__new__();
MochiKit.Base._exportSymbols(this, PlotKit.LayoutModule);


