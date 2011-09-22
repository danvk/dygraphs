/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Based on PlotKitLayout, but modified to meet the needs of
 * dygraphs.
 */

/**
 * Creates a new DygraphLayout object.
 *
 * This class contains all the data to be charted.
 * It uses data coordinates, but also records the chart range (in data
 * coordinates) and hence is able to calculate percentage positions ('In this
 * view, Point A lies 25% down the x-axis.')
 *
 * Two things that it does not do are:
 * 1. Record pixel coordinates for anything.
 * 2. (oddly) determine anything about the layout of chart elements.
 *
 * The naming is a vestige of Dygraph's original PlotKit roots.
 *
 * @constructor
 */
DygraphLayout = function(dygraph) {
  this.dygraph_ = dygraph;
  this.datasets = new Array();
  this.annotations = new Array();
  this.yAxes_ = null;

  // TODO(danvk): it's odd that xTicks_ and yTicks_ are inputs, but xticks and
  // yticks are outputs. Clean this up.
  this.xTicks_ = null;
  this.yTicks_ = null;
};

DygraphLayout.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

DygraphLayout.prototype.addDataset = function(setname, set_xy) {
  this.datasets[setname] = set_xy;
};

DygraphLayout.prototype.getPlotArea = function() {
  return this.computePlotArea_();
}

// Compute the box which the chart should be drawn in. This is the canvas's
// box, less space needed for axis and chart labels.
DygraphLayout.prototype.computePlotArea_ = function() {
  var area = {
    // TODO(danvk): per-axis setting.
    x: 0,
    y: 0
  };
  if (this.attr_('drawYAxis')) {
   area.x = this.attr_('yAxisLabelWidth') + 2 * this.attr_('axisTickSize');
  }

  area.w = this.dygraph_.width_ - area.x - this.attr_('rightGap');
  area.h = this.dygraph_.height_;
  if (this.attr_('drawXAxis')) {
    if (this.attr_('xAxisHeight')) {
      area.h -= this.attr_('xAxisHeight');
    } else {
      area.h -= this.attr_('axisLabelFontSize') + 2 * this.attr_('axisTickSize');
    }
  }

  // Shrink the drawing area to accomodate additional y-axes.
  if (this.dygraph_.numAxes() == 2) {
    // TODO(danvk): per-axis setting.
    area.w -= (this.attr_('yAxisLabelWidth') + 2 * this.attr_('axisTickSize'));
  } else if (this.dygraph_.numAxes() > 2) {
    this.dygraph_.error("Only two y-axes are supported at this time. (Trying " +
                        "to use " + this.dygraph_.numAxes() + ")");
  }

  // Add space for chart labels: title, xlabel and ylabel.
  if (this.attr_('title')) {
    area.h -= this.attr_('titleHeight');
    area.y += this.attr_('titleHeight');
  }
  if (this.attr_('xlabel')) {
    area.h -= this.attr_('xLabelHeight');
  }
  if (this.attr_('ylabel')) {
    // It would make sense to shift the chart here to make room for the y-axis
    // label, but the default yAxisLabelWidth is large enough that this results
    // in overly-padded charts. The y-axis label should fit fine. If it
    // doesn't, the yAxisLabelWidth option can be increased.
  }

  // Add space for range selector, if needed.
  if (this.attr_('showRangeSelector')) {
    area.h -= this.attr_('rangeSelectorHeight') + 4;
  }

  return area;
};

DygraphLayout.prototype.setAnnotations = function(ann) {
  // The Dygraph object's annotations aren't parsed. We parse them here and
  // save a copy. If there is no parser, then the user must be using raw format.
  this.annotations = [];
  var parse = this.attr_('xValueParser') || function(x) { return x; };
  for (var i = 0; i < ann.length; i++) {
    var a = {};
    if (!ann[i].xval && !ann[i].x) {
      this.dygraph_.error("Annotations must have an 'x' property");
      return;
    }
    if (ann[i].icon &&
        !(ann[i].hasOwnProperty('width') &&
          ann[i].hasOwnProperty('height'))) {
      this.dygraph_.error("Must set width and height when setting " +
                          "annotation.icon property");
      return;
    }
    Dygraph.update(a, ann[i]);
    if (!a.xval) a.xval = parse(a.x);
    this.annotations.push(a);
  }
};

DygraphLayout.prototype.setXTicks = function(xTicks) {
  this.xTicks_ = xTicks;
};

// TODO(danvk): add this to the Dygraph object's API or move it into Layout.
DygraphLayout.prototype.setYAxes = function (yAxes) {
  this.yAxes_ = yAxes;
};

DygraphLayout.prototype.setDateWindow = function(dateWindow) {
  this.dateWindow_ = dateWindow;
};

DygraphLayout.prototype.evaluate = function() {
  this._evaluateLimits();
  this._evaluateLineCharts();
  this._evaluateLineTicks();
  this._evaluateAnnotations();
};

DygraphLayout.prototype._evaluateLimits = function() {
  this.minxval = this.maxxval = null;
  if (this.dateWindow_) {
    this.minxval = this.dateWindow_[0];
    this.maxxval = this.dateWindow_[1];
  } else {
    for (var name in this.datasets) {
      if (!this.datasets.hasOwnProperty(name)) continue;
      var series = this.datasets[name];
      if (series.length > 1) {
        var x1 = series[0][0];
        if (!this.minxval || x1 < this.minxval) this.minxval = x1;

        var x2 = series[series.length - 1][0];
        if (!this.maxxval || x2 > this.maxxval) this.maxxval = x2;
      }
    }
  }
  this.xrange = this.maxxval - this.minxval;
  this.xscale = (this.xrange != 0 ? 1/this.xrange : 1.0);

  for (var i = 0; i < this.yAxes_.length; i++) {
    var axis = this.yAxes_[i];
    axis.minyval = axis.computedValueRange[0];
    axis.maxyval = axis.computedValueRange[1];
    axis.yrange = axis.maxyval - axis.minyval;
    axis.yscale = (axis.yrange != 0 ? 1.0 / axis.yrange : 1.0);

    if (axis.g.attr_("logscale")) {
      axis.ylogrange = Dygraph.log10(axis.maxyval) - Dygraph.log10(axis.minyval);
      axis.ylogscale = (axis.ylogrange != 0 ? 1.0 / axis.ylogrange : 1.0);
      if (!isFinite(axis.ylogrange) || isNaN(axis.ylogrange)) {
        axis.g.error('axis ' + i + ' of graph at ' + axis.g +
            ' can\'t be displayed in log scale for range [' +
            axis.minyval + ' - ' + axis.maxyval + ']');
      }
    }
  }
};

DygraphLayout._calcYNormal = function(axis, value) {
  if (axis.logscale) {
    return 1.0 - ((Dygraph.log10(value) - Dygraph.log10(axis.minyval)) * axis.ylogscale);
  } else {
    return 1.0 - ((value - axis.minyval) * axis.yscale);
  }
};

DygraphLayout.prototype._evaluateLineCharts = function() {
  // add all the rects
  this.points = new Array();
  // An array to keep track of how many points will be drawn for each set.
  // This will allow for the canvas renderer to not have to check every point
  // for every data set since the points are added in order of the sets in
  // datasets.
  this.setPointsLengths = new Array();

  for (var setName in this.datasets) {
    if (!this.datasets.hasOwnProperty(setName)) continue;

    var dataset = this.datasets[setName];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);

    var setPointsLength = 0;

    for (var j = 0; j < dataset.length; j++) {
      var item = dataset[j];
      var xValue = parseFloat(dataset[j][0]);
      var yValue = parseFloat(dataset[j][1]);

      // Range from 0-1 where 0 represents left and 1 represents right.
      var xNormal = (xValue - this.minxval) * this.xscale;
      // Range from 0-1 where 0 represents top and 1 represents bottom
      var yNormal = DygraphLayout._calcYNormal(axis, yValue);

      var point = {
        // TODO(danvk): here
        x: xNormal,
        y: yNormal,
        xval: xValue,
        yval: yValue,
        name: setName
      };
      this.points.push(point);
      setPointsLength += 1;
    }
    this.setPointsLengths.push(setPointsLength);
  }
};

DygraphLayout.prototype._evaluateLineTicks = function() {
  this.xticks = new Array();
  for (var i = 0; i < this.xTicks_.length; i++) {
    var tick = this.xTicks_[i];
    var label = tick.label;
    var pos = this.xscale * (tick.v - this.minxval);
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.xticks.push([pos, label]);
    }
  }

  this.yticks = new Array();
  for (var i = 0; i < this.yAxes_.length; i++ ) {
    var axis = this.yAxes_[i];
    for (var j = 0; j < axis.ticks.length; j++) {
      var tick = axis.ticks[j];
      var label = tick.label;
      var pos = this.dygraph_.toPercentYCoord(tick.v, i);
      if ((pos >= 0.0) && (pos <= 1.0)) {
        this.yticks.push([i, pos, label]);
      }
    }
  }
};


/**
 * Behaves the same way as PlotKit.Layout, but also copies the errors
 * @private
 */
DygraphLayout.prototype.evaluateWithError = function() {
  this.evaluate();
  if (!(this.attr_('errorBars') || this.attr_('customBars'))) return;

  // Copy over the error terms
  var i = 0; // index in this.points
  for (var setName in this.datasets) {
    if (!this.datasets.hasOwnProperty(setName)) continue;
    var j = 0;
    var dataset = this.datasets[setName];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);
    for (var j = 0; j < dataset.length; j++, i++) {
      var item = dataset[j];
      var xv = parseFloat(item[0]);
      var yv = parseFloat(item[1]);

      if (xv == this.points[i].xval &&
          yv == this.points[i].yval) {
        var errorMinus = parseFloat(item[2]);
        var errorPlus = parseFloat(item[3]);

        var yv_minus = yv - errorMinus;
        var yv_plus = yv + errorPlus;
        this.points[i].y_top = DygraphLayout._calcYNormal(axis, yv_minus);
        this.points[i].y_bottom = DygraphLayout._calcYNormal(axis, yv_plus);
      }
    }
  }
};

DygraphLayout.prototype._evaluateAnnotations = function() {
  // Add the annotations to the point to which they belong.
  // Make a map from (setName, xval) to annotation for quick lookups.
  var annotations = {};
  for (var i = 0; i < this.annotations.length; i++) {
    var a = this.annotations[i];
    annotations[a.xval + "," + a.series] = a;
  }

  this.annotated_points = [];

  // Exit the function early if there are no annotations.
  if (!this.annotations || !this.annotations.length) {
    return;
  }

  // TODO(antrob): loop through annotations not points.
  for (var i = 0; i < this.points.length; i++) {
    var p = this.points[i];
    var k = p.xval + "," + p.name;
    if (k in annotations) {
      p.annotation = annotations[k];
      this.annotated_points.push(p);
    }
  }
};

/**
 * Convenience function to remove all the data sets from a graph
 */
DygraphLayout.prototype.removeAllDatasets = function() {
  delete this.datasets;
  this.datasets = new Array();
};

/**
 * Return a copy of the point at the indicated index, with its yval unstacked.
 * @param int index of point in layout_.points
 */
DygraphLayout.prototype.unstackPointAtIndex = function(idx) {
  var point = this.points[idx];

  // Clone the point since we modify it
  var unstackedPoint = {};
  for (var i in point) {
    unstackedPoint[i] = point[i];
  }

  if (!this.attr_("stackedGraph")) {
    return unstackedPoint;
  }

  // The unstacked yval is equal to the current yval minus the yval of the
  // next point at the same xval.
  for (var i = idx+1; i < this.points.length; i++) {
    if (this.points[i].xval == point.xval) {
      unstackedPoint.yval -= this.points[i].yval;
      break;
    }
  }

  return unstackedPoint;
}
