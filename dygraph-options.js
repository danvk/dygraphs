/**
 * @fileoverview DygraphOptions is responsible for parsing and returning information about options.
 *
 * Still tightly coupled to Dygraphs, we could remove some of that, you know.
 */

"use strict";

/*
 * Interesting member variables:
 * dygraph_ - the graph.
 * global - global attributes (common among all graphs, AIUI)
 * global_user - attributes set by the user
 * axes
 * series - { seriesName -> { idx, yAxis, options }
 * labels - used as mapping from index to series name.
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
  this.axes = [];
  this.series = {};

  // Once these two objects are initialized, you can call find();
  this.global = this.dygraph_.attrs_;
  this.global_user = this.dygraph_.user_attrs_ || {};

  // Get a list of series names.
  this.labels = this.find("labels").slice(1);

  var axisId = 0; // 0-offset; there's always one.
  // Go through once, add all the series, and for those with {} axis options, add a new axis.
  for (var idx = 0; idx < this.labels.length; idx++) {
    var seriesName = this.labels[idx];

    var optionsForSeries = this.global_user[seriesName] || {};
    var yAxis = 0;

    var axis = optionsForSeries["axis"];
    if (typeof(axis) == 'object') {
      yAxis = ++axisId;
    }
    this.series[seriesName] = { idx: idx, yAxis: yAxis, options : optionsForSeries };
  }

  // Go through one more time and assign series to an axis defined by another
  // series, e.g. { 'Y1: { axis: {} }, 'Y2': { axis: 'Y1' } }
  for (var idx = 0; idx < this.labels.length; idx++) {
    var seriesName = this.labels[idx];
    var optionsForSeries = this.series[seriesName]["options"]; 
    var axis = optionsForSeries["axis"];

    if (typeof(axis) == 'string') {
      if (!this.series.hasOwnProperty(axis)) {
        this.dygraph_.error("Series " + seriesName + " wants to share a y-axis with " +
                   "series " + axis + ", which does not define its own axis.");
        return null;
      }
      this.series[seriesName].yAxis = this.series[axis].yAxis;
    }
  }

  // This doesn't support reading from the 'x' axis, only 'y' and 'y2.
  // Read from the global "axes" option.
  if (this.global_user.hasOwnProperty("axes")) {
    var axis_opts = this.global_user.axes;

    this.axes.push(axis_opts["y"] || {}); 
    this.axes.push(axis_opts["y2"] || {}); 
  } else {
    this.axes.push(axis_opts["y"] || {});  // There has to be at least one axis.
  }
};

DygraphOptions.prototype.find = function(name) {
  if (this.global_user.hasOwnProperty(name)) {
    return this.global_user[name];
  }
  if (this.global.hasOwnProperty(name)) {
    return this.global[name];
  }
  return null;
}

DygraphOptions.prototype.findForAxis = function(name, axis) {

  var axisIdx = (axis == "y2" || axis == 1) ? 1 : 0;

  var axisOptions = this.axes[axisIdx];
  if (axisOptions.hasOwnProperty(name)) {
    return axisOptions[name];
  }
  return this.find(name);
}

DygraphOptions.prototype.findForSeries = function(name, series) {
  // Honors indexes as series.
  var seriesName = (typeof(series) == "number") ? this.labels[series] : series;

  if (!this.series.hasOwnProperty(seriesName)) {
    throw "Unknown series: " + series;
  }

  var seriesObj = this.series[seriesName];
  var seriesOptions = seriesObj["options"];
  if (seriesOptions.hasOwnProperty(name)) {
    return seriesOptions[name];
  }
  return this.findForAxis(name, seriesObj["yAxis"]);
}

