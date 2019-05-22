/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview DygraphOptions is responsible for parsing and returning
 * information about options.
 */

import * as utils from './dygraph-utils';
import DEFAULT_ATTRS from './dygraph-default-attrs';
import OPTIONS_REFERENCE from './dygraph-options-reference';
import { DygraphAny } from './dygraph-types';

declare let process: any;

/*
 * Interesting member variables: (REMOVING THIS LIST AS I CLOSURIZE)
 * global_ - global attributes (common among all graphs, AIUI)
 * user - attributes set by the user
 * series_ - { seriesName -> { idx, yAxis, options }}
 */

/**
 * This parses attributes into an object that can be easily queried.
 *
 * It doesn't necessarily mean that all options are available, specifically
 * if labels are not yet available, since those drive details of the per-series
 * and per-axis options.
 */
class DygraphOptions {
  dygraph_: DygraphAny;

  /**
   * Array of axis index to { series : [ series names ] , options : { axis-specific options. }
   * @type {Array.<{series : Array.<string>, options : Object}>}
   */
  yAxes_: {series: string[]; options: object}[];

  /**
   * Contains x-axis specific options, which are stored in the options key.
   * This matches the yAxes_ object structure (by being a dictionary with an
   * options element) allowing for shared code.
   * @type {{options: Object}}
   */
  xAxis_: { options: object; };

  series_: { [seriesName: string]: any };
  global_: any;
  user_: any;

  /**
   * A list of series in columnar order.
   */
  labels_: any[];
  highlightSeries_: any;
  rollPeriod: number;
  fractions: boolean;
  dateWindow: any;
  width: boolean;
  height: boolean;
  stackedGraph: any;
  fillGraph: boolean;

  constructor(dygraph: DygraphAny) {
    this.dygraph_ = dygraph;
    this.yAxes_ = [];
    this.xAxis_ = {options: {}};
    this.series_ = {};
    // Once these two objects are initialized, you can call get();
    this.global_ = this.dygraph_.attrs_;
    this.user_ = this.dygraph_.user_attrs_ || {};
    this.labels_ = [];
    this.highlightSeries_ = this.get("highlightSeriesOpts") || {};
    this.reparseSeries();
  }

  /**
   * Reparses options that are all related to series. This typically occurs when
   * options are either updated, or source data has been made available.
   *
   * TODO(konigsberg): The method name is kind of weak; fix.
   */
  reparseSeries() {
    var labels = this.get("labels");
    if (!labels) {
      return; // -- can't do more for now, will parse after getting the labels.
    }
    this.labels_ = labels.slice(1);
    this.yAxes_ = [{ series: [], options: {} }]; // Always one axis at least.
    this.xAxis_ = { options: {} };
    this.series_ = {};
    // Series are specified in the series element:
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
    // So, if series is found, it's expected to contain per-series data, otherwise set a
    // default.
    var seriesDict = this.user_.series || {};
    for (var idx = 0; idx < this.labels_.length; idx++) {
      var seriesName = this.labels_[idx];
      var optionsForSeries = seriesDict[seriesName] || {};
      var yAxis = axisToIndex_(optionsForSeries["axis"]);
      this.series_[seriesName] = {
        idx: idx,
        yAxis: yAxis,
        options: optionsForSeries
      };
      if (!this.yAxes_[yAxis]) {
        this.yAxes_[yAxis] = { series: [seriesName], options: {} };
      }
      else {
        this.yAxes_[yAxis].series.push(seriesName);
      }
    }
    var axis_opts = this.user_["axes"] || {};
    utils.update(this.yAxes_[0].options, axis_opts["y"] || {});
    if (this.yAxes_.length > 1) {
      utils.update(this.yAxes_[1].options, axis_opts["y2"] || {});
    }
    utils.update(this.xAxis_.options, axis_opts["x"] || {});
    // For "production" code, this gets removed by uglifyjs.
    if (typeof (process) !== 'undefined') {
      if (process.env.NODE_ENV != 'production') {
        this.validateOptions_();
      }
    }
  }
  /**
   * Get a global value.
   *
   * @param name the name of the option.
   */
  get(name: string) {
    var result = this.getGlobalUser_(name);
    if (result !== null) {
      return result;
    }
    return this.getGlobalDefault_(name);
  }

  getGlobalUser_(name: string) {
    if (this.user_.hasOwnProperty(name)) {
      return this.user_[name];
    }
    return null;
  }

  getGlobalDefault_(name: string) {
    if (this.global_.hasOwnProperty(name)) {
      return this.global_[name];
    }
    if (DEFAULT_ATTRS.hasOwnProperty(name)) {
      return DEFAULT_ATTRS[name];
    }
    return null;
  }

  /**
   * Get a value for a specific axis. If there is no specific value for the axis,
   * the global value is returned.
   *
   * @param name the name of the option.
   * @param axis the axis to search. Can be the string representation
   *             ("y", "y2") or the axis number (0, 1).
   */
  getForAxis(name: string, axis: string | number) {
    var axisIdx: number;
    var axisString: string;
    // Since axis can be a number or a string, straighten everything out here.
    if (typeof (axis) == 'number') {
      axisIdx = axis;
      axisString = axisIdx === 0 ? "y" : "y2";
    }
    else {
      if (axis == "y1") {
        axis = "y";
      } // Standardize on 'y'. Is this bad? I think so.
      if (axis == "y") {
        axisIdx = 0;
      }
      else if (axis == "y2") {
        axisIdx = 1;
      }
      else if (axis == "x") {
        axisIdx = -1; // simply a placeholder for below.
      }
      else {
        throw "Unknown axis " + axis;
      }
      axisString = axis;
    }
    var userAxis = (axisIdx == -1) ? this.xAxis_ : this.yAxes_[axisIdx];
    // Search the user-specified axis option first.
    if (userAxis) { // This condition could be removed if we always set up this.yAxes_ for y2.
      var axisOptions = userAxis.options;
      if (axisOptions.hasOwnProperty(name)) {
        return axisOptions[name];
      }
    }
    // User-specified global options second.
    // But, hack, ignore globally-specified 'logscale' for 'x' axis declaration.
    if (!(axis === 'x' && name === 'logscale')) {
      var result = this.getGlobalUser_(name);
      if (result !== null) {
        return result;
      }
    }
    // Default axis options third.
    var defaultAxisOptions = DEFAULT_ATTRS.axes[axisString];
    if (defaultAxisOptions.hasOwnProperty(name)) {
      return defaultAxisOptions[name];
    }
    // Default global options last.
    return this.getGlobalDefault_(name);
  }

  /**
   * Get a value for a specific series. If there is no specific value for the series,
   * the value for the axis is returned (and afterwards, the global value.)
   *
   * @param name the name of the option.
   * @param series the series to search.
   */
  getForSeries(name: string, series: string) {
    // Honors indexes as series.
    if (series === this.dygraph_.getHighlightSeries()) {
      if (this.highlightSeries_.hasOwnProperty(name)) {
        return this.highlightSeries_[name];
      }
    }
    if (!this.series_.hasOwnProperty(series)) {
      throw new Error("Unknown series: " + series);
    }
    var seriesObj = this.series_[series];
    var seriesOptions = seriesObj["options"];
    if (seriesOptions.hasOwnProperty(name)) {
      return seriesOptions[name];
    }
    return this.getForAxis(name, seriesObj["yAxis"]);
  }

  /**
   * Returns the number of y-axes on the chart.
   */
  numAxes(): number {
    return this.yAxes_.length;
  }

  /**
   * Return the y-axis for a given series, specified by name.
   */
  axisForSeries(series: string) {
    return this.series_[series].yAxis;
  }

  /**
   * Returns the options for the specified axis.
   */
  // TODO(konigsberg): this is y-axis specific. Support the x axis.
  axisOptions(yAxis: number) {
    return this.yAxes_[yAxis].options;
  }

  /**
   * Return the series associated with an axis.
   */
  seriesForAxis(yAxis: number) {
    return this.yAxes_[yAxis].series;
  }

  /**
   * Return the list of all series, in their columnar order.
   */
  seriesNames() {
    return this.labels_;
  }

  /**
   * Validate all options.
   * This requires OPTIONS_REFERENCE, which is only available in debug builds.
   * @private
   */
  validateOptions_() {
    if (typeof OPTIONS_REFERENCE === 'undefined') {
      throw 'Called validateOptions_ in prod build.';
    }
    var validateOption = (optionName: string) => {
      if (!OPTIONS_REFERENCE[optionName]) {
        this.warnInvalidOption_(optionName);
      }
    };
    var optionsDicts = [
      this.xAxis_.options,
      this.yAxes_[0].options,
      this.yAxes_[1] && this.yAxes_[1].options,
      this.global_,
      this.user_,
      this.highlightSeries_
    ];
    var names = this.seriesNames();
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (this.series_.hasOwnProperty(name)) {
        optionsDicts.push(this.series_[name].options);
      }
    }
    for (var i = 0; i < optionsDicts.length; i++) {
      var dict = optionsDicts[i];
      if (!dict)
        continue;
      for (var optionName in dict) {
        if (dict.hasOwnProperty(optionName)) {
          validateOption(optionName);
        }
      }
    }
  }

  /**
   * Logs a warning about invalid options.
   * TODO: make this throw for testing
   * @private
   */
  warnInvalidOption_(optionName: string) {
    if (!WARNINGS[optionName]) {
      WARNINGS[optionName] = true;
      var isSeries = (this.labels_.indexOf(optionName) >= 0);
      if (isSeries) {
        console.warn('Use new-style per-series options (saw ' + optionName + ' as top-level options key). See http://bit.ly/1tceaJs');
      }
      else {
        console.warn('Unknown option ' + optionName + ' (full list of options at dygraphs.com/options.html');
      }
      throw new Error("invalid option " + optionName);
    }
  }
}


function axisToIndex_(axis: string | number) {
  if (typeof (axis) == "string") {
    if (AXIS_STRING_MAPPINGS_.hasOwnProperty(axis)) {
      return AXIS_STRING_MAPPINGS_[axis];
    }
    throw "Unknown axis : " + axis;
  }
  if (typeof (axis) == "number") {
    if (axis === 0 || axis === 1) {
      return axis;
    }
    throw "Dygraphs only supports two y-axes, indexed from 0-1.";
  }
  if (axis) {
    throw "Unknown axis : " + axis;
  }
  // No axis specification means axis 0.
  return 0;
}

// Reset list of previously-shown warnings. Used for testing.
function resetWarnings_() {
  WARNINGS = {};
}

/**
 * Not optimal, but does the trick when you're only using two axes.
 * If we move to more axes, this can just become a function.
 *
 * @private
 */
const AXIS_STRING_MAPPINGS_ = {
  'y' : 0,
  'Y' : 0,
  'y1' : 0,
  'Y1' : 0,
  'y2' : 1,
  'Y2' : 1
};

// For "production" code, this gets removed by uglifyjs.
if (typeof(process) !== 'undefined') {
  if (process.env.NODE_ENV != 'production') {
    var WARNINGS = {};  // Only show any particular warning once.
  }
}

export default DygraphOptions;
