/**
 * @fileoverview DygraphOptions is responsible for parsing and returning information about options.
 *
 * Still tightly coupled to Dygraphs, we could remove some of that, you know.
 */

"use strict";

/*
 * Interesting member variables:
 * dygraph_ - the graph.
 * global_ - global attributes (common among all graphs, AIUI)
 * user_ - attributes set by the user
 * axes_ - array of axis index to axis-specific options.
 * series_ - { seriesName -> { idx, yAxis, options }
 * labels_ - used as mapping from index to series name.
 */

/**
 * @constructor
 *
 * This parses attributes into an object that can be easily queried.
 *
 * @param {Dyraph} dygraph The chart to which these options belong.
 */
var DygraphOptions = function(dygraph) {
  this.dygraph_ = dygraph;
  this.axes_ = [];
  this.series_ = {};

  // Once these two objects are initialized, you can call find();
  this.global_ = this.dygraph_.attrs_;
  this.user_ = this.dygraph_.user_attrs_ || {};

  this.highlightSeries_ = this.find("highlightSeriesOpts") || {};
  // Get a list of series names.

  var labels = this.find("labels");
  if (!labels) {
    return; // -- can't do more for now, will parse after getting the labels.
  };

  this.reparseSeries();
}

DygraphOptions.prototype.reparseSeries = function() {
  this.labels = this.find("labels").slice(1);

  this.axes_ = [ {} ]; // Always one axis at least.
  this.series_ = {};

  var axisId = 0; // 0-offset; there's always one.
  // Go through once, add all the series, and for those with {} axis options, add a new axis.
  for (var idx = 0; idx < this.labels.length; idx++) {
    var seriesName = this.labels[idx];

    var optionsForSeries = this.user_[seriesName] || {};
    var yAxis = 0;

    var axis = optionsForSeries["axis"];
    if (typeof(axis) == 'object') {
      yAxis = ++axisId;
      this.axes_[yAxis] = axis;
    }
    this.series_[seriesName] = { idx: idx, yAxis: yAxis, options : optionsForSeries };
  }

  // Go through one more time and assign series to an axis defined by another
  // series, e.g. { 'Y1: { axis: {} }, 'Y2': { axis: 'Y1' } }
  for (var idx = 0; idx < this.labels.length; idx++) {
    var seriesName = this.labels[idx];
    var optionsForSeries = this.series_[seriesName]["options"]; 
    var axis = optionsForSeries["axis"];

    if (typeof(axis) == 'string') {
      if (!this.series_.hasOwnProperty(axis)) {
        this.dygraph_.error("Series " + seriesName + " wants to share a y-axis with " +
                   "series " + axis + ", which does not define its own axis.");
        return null;
      }
      this.series_[seriesName].yAxis = this.series_[axis].yAxis;
    }
  }

  // This doesn't support reading from the 'x' axis, only 'y' and 'y2.
  // Read from the global "axes" option.
  if (this.user_.hasOwnProperty("axes")) {
    var axis_opts = this.user_.axes;

    if (axis_opts.hasOwnProperty("y")) {
      Dygraph.update(this.axes_[0], axis_opts.y);
    }

    if (axis_opts.hasOwnProperty("y2")) {
      this.axes_[1] = this.axes_[1] || {};
      Dygraph.update(this.axes_[1], axis_opts.y2);
    }
  }
};

DygraphOptions.prototype.find = function(name) {
  if (this.user_.hasOwnProperty(name)) {
    return this.user_[name];
  }
  if (this.global_.hasOwnProperty(name)) {
    return this.global_[name];
  }
  return null;
}

DygraphOptions.prototype.findForAxis = function(name, axis) {
  var axisIdx = (axis == "y2" || axis == "y2" || axis == 1) ? 1 : 0;

  var axisOptions = this.axes_[axisIdx];
  if (axisOptions.hasOwnProperty(name)) {
    return axisOptions[name];
  }
  return this.find(name);
}

DygraphOptions.prototype.findForSeries = function(name, series) {
  // Honors indexes as series.
  var seriesName = (typeof(series) == "number") ? this.labels[series] : series;

  if (seriesName === this.dygraph_.highlightSet_) {
    if (this.highlightSeries_.hasOwnProperty(name)) {
      return this.highlightSeries_[name];
    }
  }

  if (!this.series_.hasOwnProperty(seriesName)) {
    throw "Unknown series: " + series;
  }

  var seriesObj = this.series_[seriesName];
  var seriesOptions = seriesObj["options"];
  if (seriesOptions.hasOwnProperty(name)) {
    return seriesOptions[name];
  }

  return this.findForAxis(name, seriesObj["yAxis"]);
}

/**
 * Returns the number of y-axes on the chart.
 * @return {Number} the number of axes.
 */
DygraphOptions.prototype.numAxes = function() {
  return this.axes_.length;
}
