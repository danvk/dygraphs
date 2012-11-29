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
 * user - attributes set by the user
 * axes_ - array of axis index to { series : [ series names ] , options : { axis-specific options. }
 * series_ - { seriesName -> { idx, yAxis, options }}
 * labels_ - used as mapping from index to series name.
 */

/**
 * This parses attributes into an object that can be easily queried.
 *
 * It doesn't necessarily mean that all options are available, specifically
 * if labels are not yet available, since those drive details of the per-series
 * and per-axis options.
 *
 * @param {Dyraph} dygraph The chart to which these options belong.
 * @constructor
 */
var DygraphOptions = function(dygraph) {
  this.dygraph_ = dygraph;
  this.axes_ = [];
  this.series_ = {};

  // Once these two objects are initialized, you can call get();
  this.global_ = this.dygraph_.attrs_;
  this.user_ = this.dygraph_.user_attrs_ || {};

  this.highlightSeries_ = this.get("highlightSeriesOpts") || {};
  // Get a list of series names.

  var labels = this.get("labels");
  if (!labels) {
    return; // -- can't do more for now, will parse after getting the labels.
  }

  this.reparseSeries();
};

/*
 * Not optimal, but does the trick when you're only using two axes.
 * If we move to more axes, this can just become a function.
 */
DygraphOptions.AXIS_STRING_MAPPINGS_ = {
  'y' : 0,
  'Y' : 0,
  'y1' : 0,
  'Y1' : 0,
  'y2' : 1,
  'Y2' : 1
}

DygraphOptions.axisToIndex_ = function(axis) {
  if (typeof(axis) == "string") {
    if (DygraphOptions.AXIS_STRING_MAPPINGS_.hasOwnProperty(axis)) {
      return DygraphOptions.AXIS_STRING_MAPPINGS_[axis];
    }
    throw "Unknown axis : " + text;
  }
  if (typeof(axis) == "number") {
    if (axis == 0 || axis == 1) {
      return axis;
    }
    throw "Dygraphs only supports two y-axes, indexed from 0-1."
  }
  if (axis) {
    throw "Unknown axis : " + axis;
  }
  // No axis specification means axis 0.
  return 0;
};

/**
 * Reparses options that are all related to series. This typically occurs when
 * options are either updated, or source data has been made avaialble.
 *
 * TODO(konigsberg): The method name is kind of weak; fix.
 */
DygraphOptions.prototype.reparseSeries = function() {
  this.labels = this.get("labels").slice(1);

  this.axes_ = [ { series : [], options : {}} ]; // Always one axis at least.
  this.series_ = {};

  // Traditionally, per-series options were specified right up there with the options. For instance
  // {
  //   labels: [ "X", "foo", "bar" ],
  //   pointSize: 3,
  //   foo : {}, // options for foo
  //   bar : {} // options for bar
  // }
  //
  // Moving forward, series really should be specified in the series element, separating them.
  // like so:
  //
  // {
  //   labels: [ "X", "foo", "bar" ],
  //   pointSize: 3,
  //   series : {
  //     foo : {}, // options for foo
  //     bar : {} // options for bar
  //   }
  // }
  //
  // So, if series is found, it's expected to contain per-series data, otherwise we fall
  // back.
  var oldStyleSeries = !this.user_["series"];
  
  if (oldStyleSeries) {
    var axisId = 0; // 0-offset; there's always one.
    // Go through once, add all the series, and for those with {} axis options, add a new axis.
    for (var idx = 0; idx < this.labels.length; idx++) {
      var seriesName = this.labels[idx];
  
      var optionsForSeries = this.user_[seriesName] || {};
  
      var yAxis = 0;
      var axis = optionsForSeries["axis"];
      if (typeof(axis) == 'object') {
        yAxis = ++axisId;
        this.axes_[yAxis] = { series : [ seriesName ], options : axis };
      }

      // Associate series without axis options with axis 0.
      if (!axis) { // undefined
        this.axes_[0].series.push(seriesName);
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
        var yAxis = this.series_[axis].yAxis;
        this.series_[seriesName].yAxis = yAxis;
        this.axes_[yAxis].series.push(seriesName);
      }
    }
  } else {
    var maxYAxis = 0;

    for (var idx = 0; idx < this.labels.length; idx++) {
      var seriesName = this.labels[idx];
      var optionsForSeries = this.user_.series[seriesName] || {};
      var yAxis = DygraphOptions.axisToIndex_(optionsForSeries["axis"]);

      maxYAxis = Math.max(yAxis, maxYAxis);

      this.series_[seriesName] = {
        idx: idx,
        yAxis: yAxis,
        options : optionsForSeries };

      if (!this.axes_[yAxis]) {
        this.axes_[yAxis] =  { series : [ seriesName ], options : {} };
      } else {
        this.axes_[yAxis].series.push(seriesName);
      }
    }
  }

  // This doesn't support reading from the 'x' axis, only 'y' and 'y2.
  var axis_opts = this.user_["axes"] || {};
  Dygraph.update(this.axes_[0].options, axis_opts["y"] || {});
  if (this.axes_.length > 1) {
    Dygraph.update(this.axes_[1].options, axis_opts["y2"] || {});   
  }
};

/**
 * Get a global value.
 *
 * @param {String} name the name of the option.
 */
DygraphOptions.prototype.get = function(name) {
  if (this.user_.hasOwnProperty(name)) {
    return this.user_[name];
  }
  if (this.global_.hasOwnProperty(name)) {
    return this.global_[name];
  }
  return null;
};

/**
 * Get a value for a specific axis. If there is no specific value for the axis,
 * the global value is returned.
 *
 * @param {String} name the name of the option.
 * @param {String|number} axis the axis to search. Can be the string representation
 * ("y", "y2") or the axis number (0, 1).
 */
DygraphOptions.prototype.getForAxis = function(name, axis) {
  var axisIdx = 0;
  if (typeof(axis) == 'number') {
    axisIdx = axis;
  } else {
    // TODO(konigsberg): Accept only valid axis strings?
    axisIdx = (axis == "y2") ? 1 : 0;
  }

  var axisOptions = this.axes_[axisIdx].options;
  if (axisOptions.hasOwnProperty(name)) {
    return axisOptions[name];
  }
  return this.get(name);
};

/**
 * Get a value for a specific series. If there is no specific value for the series,
 * the value for the axis is returned (and afterwards, the global value.)
 *
 * @param {String} name the name of the option.
 * @param {String|number} series the series to search. Can be the string representation
 * or 0-offset series number.
 */
DygraphOptions.prototype.getForSeries = function(name, series) {
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

  return this.getForAxis(name, seriesObj["yAxis"]);
};

/**
 * Returns the number of y-axes on the chart.
 * @return {Number} the number of axes.
 */
DygraphOptions.prototype.numAxes = function() {
  return this.axes_.length;
}

/**
 * Return the y-axis for a given series, specified by name.
 */
DygraphOptions.prototype.axisForSeries = function(seriesName) {
  return this.series_[seriesName].yAxis;
}

/**
 * Returns the options for the specified axis.
 */
DygraphOptions.prototype.axisOptions = function(yAxis) {
  return this.axes_[yAxis].options;
}

/**
 * Return the series associated with an axis.
 */
DygraphOptions.prototype.seriesForAxis = function(yAxis) {
  return this.axes_[yAxis].series;
}

/**
 * Return the list of all series, in their columnar order.
 */
DygraphOptions.prototype.seriesNames = function() {
  return this.labels_;
}

/* Are we using this? */ 
/**
 * Return the index of the specified series.
 * @param {string} series the series name.
 */
DygraphOptions.prototype.indexOfSeries = function(series) {
  return this.series_[series].idx;
}
