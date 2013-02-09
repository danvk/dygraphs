/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Based on PlotKitLayout, but modified to meet the needs of
 * dygraphs.
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

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
var DygraphLayout = function(dygraph) {
  this.dygraph_ = dygraph;
  this.datasets = [];
  this.setNames = [];
  this.annotations = [];
  this.yAxes_ = null;
  this.points = null;

  // TODO(danvk): it's odd that xTicks_ and yTicks_ are inputs, but xticks and
  // yticks are outputs. Clean this up.
  this.xTicks_ = null;
  this.yTicks_ = null;
};

DygraphLayout.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

DygraphLayout.prototype.addDataset = function(setname, set_xy) {
  this.datasets.push(set_xy);
  this.setNames.push(setname);
};

DygraphLayout.prototype.getPlotArea = function() {
  return this.area_;
};

// Compute the box which the chart should be drawn in. This is the canvas's
// box, less space needed for axis and chart labels.
// NOTE: This should only be called by Dygraph.predraw_().
DygraphLayout.prototype.computePlotArea = function() {
  var area = {
    // TODO(danvk): per-axis setting.
    x: 0,
    y: 0
  };

  area.w = this.dygraph_.width_ - area.x - this.attr_('rightGap');
  area.h = this.dygraph_.height_;

  // Let plugins reserve space.
  var e = {
    chart_div: this.dygraph_.graphDiv,
    reserveSpaceLeft: function(px) {
      var r = {
        x: area.x,
        y: area.y,
        w: px,
        h: area.h
      };
      area.x += px;
      area.w -= px;
      return r;
    },
    reserveSpaceRight: function(px) {
      var r = {
        x: area.x + area.w - px,
        y: area.y,
        w: px,
        h: area.h
      };
      area.w -= px;
      return r;
    },
    reserveSpaceTop: function(px) {
      var r = {
        x: area.x,
        y: area.y,
        w: area.w,
        h: px
      };
      area.y += px;
      area.h -= px;
      return r;
    },
    reserveSpaceBottom: function(px) {
      var r = {
        x: area.x,
        y: area.y + area.h - px,
        w: area.w,
        h: px
      };
      area.h -= px;
      return r;
    },
    chartRect: function() {
      return {x:area.x, y:area.y, w:area.w, h:area.h};
    }
  };
  this.dygraph_.cascadeEvents_('layout', e);

  this.area_ = area;
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
  var xlimits = this.dygraph_.xAxisRange();
  this.minxval = xlimits[0];
  this.maxxval = xlimits[1];
  var xrange = xlimits[1] - xlimits[0];
  this.xscale = (xrange !== 0 ? 1 / xrange : 1.0);

  for (var i = 0; i < this.yAxes_.length; i++) {
    var axis = this.yAxes_[i];
    axis.minyval = axis.computedValueRange[0];
    axis.maxyval = axis.computedValueRange[1];
    axis.yrange = axis.maxyval - axis.minyval;
    axis.yscale = (axis.yrange !== 0 ? 1.0 / axis.yrange : 1.0);

    if (axis.g.attr_("logscale")) {
      axis.ylogrange = Dygraph.log10(axis.maxyval) - Dygraph.log10(axis.minyval);
      axis.ylogscale = (axis.ylogrange !== 0 ? 1.0 / axis.ylogrange : 1.0);
      if (!isFinite(axis.ylogrange) || isNaN(axis.ylogrange)) {
        axis.g.error('axis ' + i + ' of graph at ' + axis.g +
            ' can\'t be displayed in log scale for range [' +
            axis.minyval + ' - ' + axis.maxyval + ']');
      }
    }
  }
};

DygraphLayout._calcYNormal = function(axis, value, logscale) {
  if (logscale) {
    return 1.0 - ((Dygraph.log10(value) - Dygraph.log10(axis.minyval)) * axis.ylogscale);
  } else {
    return 1.0 - ((value - axis.minyval) * axis.yscale);
  }
};

DygraphLayout.prototype._evaluateLineCharts = function() {
  var connectSeparated = this.attr_('connectSeparatedPoints');

  // series index -> point index in series -> |point| structure
  this.points = new Array(this.datasets.length);

  // TODO(bhs): these loops are a hot-spot for high-point-count charts. In fact,
  // on chrome+linux, they are 6 times more expensive than iterating through the
  // points and drawing the lines. The brunt of the cost comes from allocating
  // the |point| structures.
  for (var setIdx = 0; setIdx < this.datasets.length; setIdx++) {
    var dataset = this.datasets[setIdx];
    var setName = this.setNames[setIdx];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);
    // TODO (konigsberg): use optionsForAxis instead.
    var logscale = this.dygraph_.attributes_.getForSeries("logscale", setName);

    // Preallocating the size of points reduces reallocations, and therefore,
    // calls to collect garbage.
    var seriesPoints = new Array(dataset.length);

    for (var j = 0; j < dataset.length; j++) {
      var item = dataset[j];
      var xValue = DygraphLayout.parseFloat_(item[0]);
      var yValue = DygraphLayout.parseFloat_(item[1]);

      // Range from 0-1 where 0 represents left and 1 represents right.
      var xNormal = (xValue - this.minxval) * this.xscale;
      // Range from 0-1 where 0 represents top and 1 represents bottom
      var yNormal = DygraphLayout._calcYNormal(axis, yValue, logscale);

      // TODO(danvk): drop the point in this case, don't null it.
      // The nulls create complexity in DygraphCanvasRenderer._drawSeries.
      if (connectSeparated && item[1] === null) {
        yValue = null;
      }
      seriesPoints[j] = {
        x: xNormal,
        y: yNormal,
        xval: xValue,
        yval: yValue,
        name: setName  // TODO(danvk): is this really necessary?
      };
    }

    this.points[setIdx] = seriesPoints;
  }
};

/**
 * Optimized replacement for parseFloat, which was way too slow when almost
 * all values were type number, with few edge cases, none of which were strings.
 */
DygraphLayout.parseFloat_ = function(val) {
  // parseFloat(null) is NaN
  if (val === null) {
    return NaN;
  }

  // Assume it's a number or NaN. If it's something else, I'll be shocked.
  return val;
};

DygraphLayout.prototype._evaluateLineTicks = function() {
  var i, tick, label, pos;
  this.xticks = [];
  for (i = 0; i < this.xTicks_.length; i++) {
    tick = this.xTicks_[i];
    label = tick.label;
    pos = this.xscale * (tick.v - this.minxval);
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.xticks.push([pos, label]);
    }
  }

  this.yticks = [];
  for (i = 0; i < this.yAxes_.length; i++ ) {
    var axis = this.yAxes_[i];
    for (var j = 0; j < axis.ticks.length; j++) {
      tick = axis.ticks[j];
      label = tick.label;
      pos = this.dygraph_.toPercentYCoord(tick.v, i);
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
  var i = 0;  // index in this.points
  for (var setIdx = 0; setIdx < this.datasets.length; ++setIdx) {
    var points = this.points[setIdx];
    var j = 0;
    var dataset = this.datasets[setIdx];
    var setName = this.setNames[setIdx];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);
    // TODO (konigsberg): use optionsForAxis instead.
    var logscale = this.dygraph_.attributes_.getForSeries("logscale", setName);

    for (j = 0; j < dataset.length; j++, i++) {
      var item = dataset[j];
      var xv = DygraphLayout.parseFloat_(item[0]);
      var yv = DygraphLayout.parseFloat_(item[1]);

      if (xv == points[j].xval &&
          yv == points[j].yval) {
        var errorMinus = DygraphLayout.parseFloat_(item[2]);
        var errorPlus = DygraphLayout.parseFloat_(item[3]);

        var yv_minus = yv - errorMinus;
        var yv_plus = yv + errorPlus;
        points[j].y_top = DygraphLayout._calcYNormal(axis, yv_minus, logscale);
        points[j].y_bottom = DygraphLayout._calcYNormal(axis, yv_plus, logscale);
      }
    }
  }
};

DygraphLayout.prototype._evaluateAnnotations = function() {
  // Add the annotations to the point to which they belong.
  // Make a map from (setName, xval) to annotation for quick lookups.
  var i;
  var annotations = {};
  for (i = 0; i < this.annotations.length; i++) {
    var a = this.annotations[i];
    annotations[a.xval + "," + a.series] = a;
  }

  this.annotated_points = [];

  // Exit the function early if there are no annotations.
  if (!this.annotations || !this.annotations.length) {
    return;
  }

  // TODO(antrob): loop through annotations not points.
  for (var setIdx = 0; setIdx < this.points.length; setIdx++) {
    var points = this.points[setIdx];
    for (i = 0; i < points.length; i++) {
      var p = points[i];
      var k = p.xval + "," + p.name;
      if (k in annotations) {
        p.annotation = annotations[k];
        this.annotated_points.push(p);
      }
    }
  }
};

/**
 * Convenience function to remove all the data sets from a graph
 */
DygraphLayout.prototype.removeAllDatasets = function() {
  delete this.datasets;
  delete this.setNames;
  delete this.setPointsLengths;
  delete this.setPointsOffsets;
  this.datasets = [];
  this.setNames = [];
  this.setPointsLengths = [];
  this.setPointsOffsets = [];
};

/**
 * Return a copy of the point at the indicated index, with its yval unstacked.
 * @param int index of point in layout_.points
 */
DygraphLayout.prototype.unstackPointAtIndex = function(setIdx, row) {
  var point = this.points[setIdx][row];
  // If the point is missing, no unstacking is necessary
  if (!point.yval) {
    return point;
  }

  // Clone the point since we modify it
  var unstackedPoint = {};
  for (var pt in point) {
    unstackedPoint[pt] = point[pt];
  }

  if (!this.attr_("stackedGraph")) {
    return unstackedPoint;
  }

  // The unstacked yval is equal to the current yval minus the yval of the
  // next point at the same xval.
  if (setIdx == this.points.length - 1) {
    // We're the last series, so no unstacking is necessary.
    return unstackedPoint;
  }

  var points = this.points[setIdx + 1];
  if (points[row].xval == point.xval &&  // should always be true?
      points[row].yval) {
    unstackedPoint.yval -= points[row].yval;
  }

  return unstackedPoint;
};
