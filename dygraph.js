/**
 * @license
 * Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Creates an interactive, zoomable graph based on a CSV file or
 * string. Dygraph can handle multiple series with or without error bars. The
 * date/value ranges will be automatically set. Dygraph uses the
 * &lt;canvas&gt; tag, so it only works in FF1.5+.
 * @author danvdk@gmail.com (Dan Vanderkam)

  Usage:
   <div id="graphdiv" style="width:800px; height:500px;"></div>
   <script type="text/javascript">
     new Dygraph(document.getElementById("graphdiv"),
                 "datafile.csv",  // CSV file with headers
                 { }); // options
   </script>

 The CSV file is of the form

   Date,SeriesA,SeriesB,SeriesC
   YYYYMMDD,A1,B1,C1
   YYYYMMDD,A2,B2,C2

 If the 'errorBars' option is set in the constructor, the input should be of
 the form
   Date,SeriesA,SeriesB,...
   YYYYMMDD,A1,sigmaA1,B1,sigmaB1,...
   YYYYMMDD,A2,sigmaA2,B2,sigmaB2,...

 If the 'fractions' option is set, the input should be of the form:

   Date,SeriesA,SeriesB,...
   YYYYMMDD,A1/B1,A2/B2,...
   YYYYMMDD,A1/B1,A2/B2,...

 And error bars will be calculated automatically using a binomial distribution.

 For further documentation and examples, see http://dygraphs.com/

 */

/*jshint globalstrict: true */
/*global DygraphRangeSelector:false, DygraphLayout:false, DygraphCanvasRenderer:false, G_vmlCanvasManager:false */
"use strict";

/**
 * Creates an interactive, zoomable chart.
 *
 * @constructor
 * @param {div | String} div A div or the id of a div into which to construct
 * the chart.
 * @param {String | Function} file A file containing CSV data or a function
 * that returns this data. The most basic expected format for each line is
 * "YYYY/MM/DD,val1,val2,...". For more information, see
 * http://dygraphs.com/data.html.
 * @param {Object} attrs Various other attributes, e.g. errorBars determines
 * whether the input data contains error ranges. For a complete list of
 * options, see http://dygraphs.com/options.html.
 */
var Dygraph = function(div, data, opts, opt_fourth_param) {
  if (opt_fourth_param !== undefined) {
    // Old versions of dygraphs took in the series labels as a constructor
    // parameter. This doesn't make sense anymore, but it's easy to continue
    // to support this usage.
    this.warn("Using deprecated four-argument dygraph constructor");
    this.__old_init__(div, data, opts, opt_fourth_param);
  } else {
    this.__init__(div, data, opts);
  }
};

Dygraph.NAME = "Dygraph";
Dygraph.VERSION = "1.2";
Dygraph.__repr__ = function() {
  return "[" + this.NAME + " " + this.VERSION + "]";
};

/**
 * Returns information about the Dygraph class.
 */
Dygraph.toString = function() {
  return this.__repr__();
};

// Various default values
Dygraph.DEFAULT_ROLL_PERIOD = 1;
Dygraph.DEFAULT_WIDTH = 480;
Dygraph.DEFAULT_HEIGHT = 320;

Dygraph.ANIMATION_STEPS = 10;
Dygraph.ANIMATION_DURATION = 200;

// These are defined before DEFAULT_ATTRS so that it can refer to them.
/**
 * @private
 * Return a string version of a number. This respects the digitsAfterDecimal
 * and maxNumberWidth options.
 * @param {Number} x The number to be formatted
 * @param {Dygraph} opts An options view
 * @param {String} name The name of the point's data series
 * @param {Dygraph} g The dygraph object
 */
Dygraph.numberValueFormatter = function(x, opts, pt, g) {
  var sigFigs = opts('sigFigs');

  if (sigFigs !== null) {
    // User has opted for a fixed number of significant figures.
    return Dygraph.floatFormat(x, sigFigs);
  }

  var digits = opts('digitsAfterDecimal');
  var maxNumberWidth = opts('maxNumberWidth');

  // switch to scientific notation if we underflow or overflow fixed display.
  if (x !== 0.0 &&
      (Math.abs(x) >= Math.pow(10, maxNumberWidth) ||
       Math.abs(x) < Math.pow(10, -digits))) {
    return x.toExponential(digits);
  } else {
    return '' + Dygraph.round_(x, digits);
  }
};

/**
 * variant for use as an axisLabelFormatter.
 * @private
 */
Dygraph.numberAxisLabelFormatter = function(x, granularity, opts, g) {
  return Dygraph.numberValueFormatter(x, opts, g);
};

/**
 * Convert a JS date (millis since epoch) to YYYY/MM/DD
 * @param {Number} date The JavaScript date (ms since epoch)
 * @return {String} A date of the form "YYYY/MM/DD"
 * @private
 */
Dygraph.dateString_ = function(date) {
  var zeropad = Dygraph.zeropad;
  var d = new Date(date);

  // Get the year:
  var year = "" + d.getFullYear();
  // Get a 0 padded month string
  var month = zeropad(d.getMonth() + 1);  //months are 0-offset, sigh
  // Get a 0 padded day string
  var day = zeropad(d.getDate());

  var ret = "";
  var frac = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  if (frac) ret = " " + Dygraph.hmsString_(date);

  return year + "/" + month + "/" + day + ret;
};

/**
 * Convert a JS date to a string appropriate to display on an axis that
 * is displaying values at the stated granularity.
 * @param {Date} date The date to format
 * @param {Number} granularity One of the Dygraph granularity constants
 * @return {String} The formatted date
 * @private
 */
Dygraph.dateAxisFormatter = function(date, granularity) {
  if (granularity >= Dygraph.DECADAL) {
    return date.strftime('%Y');
  } else if (granularity >= Dygraph.MONTHLY) {
    return date.strftime('%b %y');
  } else {
    var frac = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds();
    if (frac === 0 || granularity >= Dygraph.DAILY) {
      return new Date(date.getTime() + 3600*1000).strftime('%d%b');
    } else {
      return Dygraph.hmsString_(date.getTime());
    }
  }
};

/**
 * Standard plotters. These may be used by clients.
 * Available plotters are:
 * - Dygraph.Plotters.linePlotter: draws central lines (most common)
 * - Dygraph.Plotters.errorPlotter: draws error bars
 * - Dygraph.Plotters.fillPlotter: draws fills under lines (used with fillGraph)
 *
 * By default, the plotter is [fillPlotter, errorPlotter, linePlotter].
 * This causes all the lines to be drawn over all the fills/error bars.
 */
Dygraph.Plotters = DygraphCanvasRenderer._Plotters;


// Default attribute values.
Dygraph.DEFAULT_ATTRS = {
  highlightCircleSize: 3,
  highlightSeriesOpts: null,
  highlightSeriesBackgroundAlpha: 0.5,

  labelsDivWidth: 250,
  labelsDivStyles: {
    // TODO(danvk): move defaults from createStatusMessage_ here.
  },
  labelsSeparateLines: false,
  labelsShowZeroValues: true,
  labelsKMB: false,
  labelsKMG2: false,
  showLabelsOnHighlight: true,

  digitsAfterDecimal: 2,
  maxNumberWidth: 6,
  sigFigs: null,

  strokeWidth: 1.0,
  strokeBorderWidth: 0,
  strokeBorderColor: "white",

  axisTickSize: 3,
  axisLabelFontSize: 14,
  xAxisLabelWidth: 50,
  yAxisLabelWidth: 50,
  rightGap: 5,

  showRoller: false,
  xValueParser: Dygraph.dateParser,

  delimiter: ',',

  sigma: 2.0,
  errorBars: false,
  fractions: false,
  wilsonInterval: true,  // only relevant if fractions is true
  customBars: false,
  fillGraph: false,
  fillAlpha: 0.15,
  connectSeparatedPoints: false,

  stackedGraph: false,
  hideOverlayOnMouseOut: true,

  // TODO(danvk): support 'onmouseover' and 'never', and remove synonyms.
  legend: 'onmouseover',  // the only relevant value at the moment is 'always'.

  stepPlot: false,
  avoidMinZero: false,
  drawAxesAtZero: false,

  // Sizes of the various chart labels.
  titleHeight: 28,
  xLabelHeight: 18,
  yLabelWidth: 18,

  drawXAxis: true,
  drawYAxis: true,
  axisLineColor: "black",
  axisLineWidth: 0.3,
  gridLineWidth: 0.3,
  axisLabelColor: "black",
  axisLabelFont: "Arial",  // TODO(danvk): is this implemented?
  axisLabelWidth: 50,
  drawYGrid: true,
  drawXGrid: true,
  gridLineColor: "rgb(128,128,128)",

  interactionModel: null,  // will be set to Dygraph.Interaction.defaultModel
  animatedZooms: false,  // (for now)

  // Range selector options
  showRangeSelector: false,
  rangeSelectorHeight: 40,
  rangeSelectorPlotStrokeColor: "#808FAB",
  rangeSelectorPlotFillColor: "#A7B1C4",

  // The ordering here ensures that central lines always appear above any
  // fill bars/error bars.
  plotter: [
    Dygraph.Plotters.fillPlotter,
    Dygraph.Plotters.errorPlotter,
    Dygraph.Plotters.linePlotter
  ],

  // per-axis options
  axes: {
    x: {
      pixelsPerLabel: 60,
      axisLabelFormatter: Dygraph.dateAxisFormatter,
      valueFormatter: Dygraph.dateString_,
      ticker: null  // will be set in dygraph-tickers.js
    },
    y: {
      pixelsPerLabel: 30,
      valueFormatter: Dygraph.numberValueFormatter,
      axisLabelFormatter: Dygraph.numberAxisLabelFormatter,
      ticker: null  // will be set in dygraph-tickers.js
    },
    y2: {
      pixelsPerLabel: 30,
      valueFormatter: Dygraph.numberValueFormatter,
      axisLabelFormatter: Dygraph.numberAxisLabelFormatter,
      ticker: null  // will be set in dygraph-tickers.js
    }
  }
};

// Directions for panning and zooming. Use bit operations when combined
// values are possible.
Dygraph.HORIZONTAL = 1;
Dygraph.VERTICAL = 2;

// Installed plugins, in order of precedence (most-general to most-specific).
// Plugins are installed after they are defined, in plugins/install.js.
Dygraph.PLUGINS = [
];

// Used for initializing annotation CSS rules only once.
Dygraph.addedAnnotationCSS = false;

Dygraph.prototype.__old_init__ = function(div, file, labels, attrs) {
  // Labels is no longer a constructor parameter, since it's typically set
  // directly from the data source. It also conains a name for the x-axis,
  // which the previous constructor form did not.
  if (labels !== null) {
    var new_labels = ["Date"];
    for (var i = 0; i < labels.length; i++) new_labels.push(labels[i]);
    Dygraph.update(attrs, { 'labels': new_labels });
  }
  this.__init__(div, file, attrs);
};

/**
 * Initializes the Dygraph. This creates a new DIV and constructs the PlotKit
 * and context &lt;canvas&gt; inside of it. See the constructor for details.
 * on the parameters.
 * @param {Element} div the Element to render the graph into.
 * @param {String | Function} file Source data
 * @param {Object} attrs Miscellaneous other options
 * @private
 */
Dygraph.prototype.__init__ = function(div, file, attrs) {
  // Hack for IE: if we're using excanvas and the document hasn't finished
  // loading yet (and hence may not have initialized whatever it needs to
  // initialize), then keep calling this routine periodically until it has.
  if (/MSIE/.test(navigator.userAgent) && !window.opera &&
      typeof(G_vmlCanvasManager) != 'undefined' &&
      document.readyState != 'complete') {
    var self = this;
    setTimeout(function() { self.__init__(div, file, attrs); }, 100);
    return;
  }

  // Support two-argument constructor
  if (attrs === null || attrs === undefined) { attrs = {}; }

  attrs = Dygraph.mapLegacyOptions_(attrs);

  if (!div) {
    Dygraph.error("Constructing dygraph with a non-existent div!");
    return;
  }

  this.isUsingExcanvas_ = typeof(G_vmlCanvasManager) != 'undefined';

  // Copy the important bits into the object
  // TODO(danvk): most of these should just stay in the attrs_ dictionary.
  this.maindiv_ = div;
  this.file_ = file;
  this.rollPeriod_ = attrs.rollPeriod || Dygraph.DEFAULT_ROLL_PERIOD;
  this.previousVerticalX_ = -1;
  this.fractions_ = attrs.fractions || false;
  this.dateWindow_ = attrs.dateWindow || null;

  this.is_initial_draw_ = true;
  this.annotations_ = [];

  // Zoomed indicators - These indicate when the graph has been zoomed and on what axis.
  this.zoomed_x_ = false;
  this.zoomed_y_ = false;

  // Clear the div. This ensure that, if multiple dygraphs are passed the same
  // div, then only one will be drawn.
  div.innerHTML = "";

  // For historical reasons, the 'width' and 'height' options trump all CSS
  // rules _except_ for an explicit 'width' or 'height' on the div.
  // As an added convenience, if the div has zero height (like <div></div> does
  // without any styles), then we use a default height/width.
  if (div.style.width === '' && attrs.width) {
    div.style.width = attrs.width + "px";
  }
  if (div.style.height === '' && attrs.height) {
    div.style.height = attrs.height + "px";
  }
  if (div.style.height === '' && div.clientHeight === 0) {
    div.style.height = Dygraph.DEFAULT_HEIGHT + "px";
    if (div.style.width === '') {
      div.style.width = Dygraph.DEFAULT_WIDTH + "px";
    }
  }
  // these will be zero if the dygraph's div is hidden.
  this.width_ = div.clientWidth;
  this.height_ = div.clientHeight;

  // TODO(danvk): set fillGraph to be part of attrs_ here, not user_attrs_.
  if (attrs.stackedGraph) {
    attrs.fillGraph = true;
    // TODO(nikhilk): Add any other stackedGraph checks here.
  }

  // These two options have a bad interaction. See issue 359.
  if (attrs.showRangeSelector && attrs.animatedZooms) {
    this.warn('You should not set animatedZooms=true when using the range selector.');
    attrs.animatedZooms = false;
  }

  // Dygraphs has many options, some of which interact with one another.
  // To keep track of everything, we maintain two sets of options:
  //
  //  this.user_attrs_   only options explicitly set by the user.
  //  this.attrs_        defaults, options derived from user_attrs_, data.
  //
  // Options are then accessed this.attr_('attr'), which first looks at
  // user_attrs_ and then computed attrs_. This way Dygraphs can set intelligent
  // defaults without overriding behavior that the user specifically asks for.
  this.user_attrs_ = {};
  Dygraph.update(this.user_attrs_, attrs);

  // This sequence ensures that Dygraph.DEFAULT_ATTRS is never modified.
  this.attrs_ = {};
  Dygraph.updateDeep(this.attrs_, Dygraph.DEFAULT_ATTRS);

  this.boundaryIds_ = [];
  this.setIndexByName_ = {};
  this.datasetIndex_ = [];

  this.registeredEvents_ = [];
  this.eventListeners_ = {};

  // Create the containing DIV and other interactive elements
  this.createInterface_();

  // Activate plugins.
  this.plugins_ = [];
  for (var i = 0; i < Dygraph.PLUGINS.length; i++) {
    var Plugin = Dygraph.PLUGINS[i];
    var pluginInstance = new Plugin();
    var pluginDict = {
      plugin: pluginInstance,
      events: {},
      options: {},
      pluginOptions: {}
    };

    var handlers = pluginInstance.activate(this);
    for (var eventName in handlers) {
      // TODO(danvk): validate eventName.
      pluginDict.events[eventName] = handlers[eventName];
    }

    this.plugins_.push(pluginDict);
  }

  // At this point, plugins can no longer register event handlers.
  // Construct a map from event -> ordered list of [callback, plugin].
  for (var i = 0; i < this.plugins_.length; i++) {
    var plugin_dict = this.plugins_[i];
    for (var eventName in plugin_dict.events) {
      if (!plugin_dict.events.hasOwnProperty(eventName)) continue;
      var callback = plugin_dict.events[eventName];

      var pair = [plugin_dict.plugin, callback];
      if (!(eventName in this.eventListeners_)) {
        this.eventListeners_[eventName] = [pair];
      } else {
        this.eventListeners_[eventName].push(pair);
      }
    }
  }

  this.start_();
};

/**
 * Triggers a cascade of events to the various plugins which are interested in them.
 * Returns true if the "default behavior" should be performed, i.e. if none of
 * the event listeners called event.preventDefault().
 * @private
 */
Dygraph.prototype.cascadeEvents_ = function(name, extra_props) {
  if (!(name in this.eventListeners_)) return true;

  // QUESTION: can we use objects & prototypes to speed this up?
  var e = {
    dygraph: this,
    cancelable: false,
    defaultPrevented: false,
    preventDefault: function() {
      if (!e.cancelable) throw "Cannot call preventDefault on non-cancelable event.";
      e.defaultPrevented = true;
    },
    propagationStopped: false,
    stopPropagation: function() {
      e.propagationStopped = true;
    }
  };
  Dygraph.update(e, extra_props);

  var callback_plugin_pairs = this.eventListeners_[name];
  if (callback_plugin_pairs) {
    for (var i = callback_plugin_pairs.length - 1; i >= 0; i--) {
      var plugin = callback_plugin_pairs[i][0];
      var callback = callback_plugin_pairs[i][1];
      callback.call(plugin, e);
      if (e.propagationStopped) break;
    }
  }
  return e.defaultPrevented;
};

/**
 * Returns the zoomed status of the chart for one or both axes.
 *
 * Axis is an optional parameter. Can be set to 'x' or 'y'.
 *
 * The zoomed status for an axis is set whenever a user zooms using the mouse
 * or when the dateWindow or valueRange are updated (unless the
 * isZoomedIgnoreProgrammaticZoom option is also specified).
 */
Dygraph.prototype.isZoomed = function(axis) {
  if (axis === null || axis === undefined) {
    return this.zoomed_x_ || this.zoomed_y_;
  }
  if (axis === 'x') return this.zoomed_x_;
  if (axis === 'y') return this.zoomed_y_;
  throw "axis parameter is [" + axis + "] must be null, 'x' or 'y'.";
};

/**
 * Returns information about the Dygraph object, including its containing ID.
 */
Dygraph.prototype.toString = function() {
  var maindiv = this.maindiv_;
  var id = (maindiv && maindiv.id) ? maindiv.id : maindiv;
  return "[Dygraph " + id + "]";
};

/**
 * @private
 * Returns the value of an option. This may be set by the user (either in the
 * constructor or by calling updateOptions) or by dygraphs, and may be set to a
 * per-series value.
 * @param { String } name The name of the option, e.g. 'rollPeriod'.
 * @param { String } [seriesName] The name of the series to which the option
 * will be applied. If no per-series value of this option is available, then
 * the global value is returned. This is optional.
 * @return { ... } The value of the option.
 */
Dygraph.prototype.attr_ = function(name, seriesName) {
// <REMOVE_FOR_COMBINED>
  if (typeof(Dygraph.OPTIONS_REFERENCE) === 'undefined') {
    this.error('Must include options reference JS for testing');
  } else if (!Dygraph.OPTIONS_REFERENCE.hasOwnProperty(name)) {
    this.error('Dygraphs is using property ' + name + ', which has no entry ' +
               'in the Dygraphs.OPTIONS_REFERENCE listing.');
    // Only log this error once.
    Dygraph.OPTIONS_REFERENCE[name] = true;
  }
// </REMOVE_FOR_COMBINED>

  var sources = [];
  sources.push(this.attrs_);
  if (this.user_attrs_) {
    sources.push(this.user_attrs_);
    if (seriesName) {
      if (this.user_attrs_.hasOwnProperty(seriesName)) {
        sources.push(this.user_attrs_[seriesName]);
      }
      if (seriesName === this.highlightSet_ &&
          this.user_attrs_.hasOwnProperty('highlightSeriesOpts')) {
        sources.push(this.user_attrs_.highlightSeriesOpts);
      }
    }
  }

  var ret = null;
  for (var i = sources.length - 1; i >= 0; --i) {
    var source = sources[i];
    if (source.hasOwnProperty(name)) {
      ret = source[name];
      break;
    }
  }
  return ret;
};

/**
 * Returns the current value for an option, as set in the constructor or via
 * updateOptions. You may pass in an (optional) series name to get per-series
 * values for the option.
 *
 * All values returned by this method should be considered immutable. If you
 * modify them, there is no guarantee that the changes will be honored or that
 * dygraphs will remain in a consistent state. If you want to modify an option,
 * use updateOptions() instead.
 *
 * @param { String } name The name of the option (e.g. 'strokeWidth')
 * @param { String } [opt_seriesName] Series name to get per-series values.
 * @return { ... } The value of the option.
 */
Dygraph.prototype.getOption = function(name, opt_seriesName) {
  return this.attr_(name, opt_seriesName);
};

/**
 * @private
 * @param  String} axis The name of the axis (i.e. 'x', 'y' or 'y2')
 * @return { ... } A function mapping string -> option value
 */
Dygraph.prototype.optionsViewForAxis_ = function(axis) {
  var self = this;
  return function(opt) {
    var axis_opts = self.user_attrs_.axes;
    if (axis_opts && axis_opts[axis] && axis_opts[axis][opt]) {
      return axis_opts[axis][opt];
    }
    // user-specified attributes always trump defaults, even if they're less
    // specific.
    if (typeof(self.user_attrs_[opt]) != 'undefined') {
      return self.user_attrs_[opt];
    }

    axis_opts = self.attrs_.axes;
    if (axis_opts && axis_opts[axis] && axis_opts[axis][opt]) {
      return axis_opts[axis][opt];
    }
    // check old-style axis options
    // TODO(danvk): add a deprecation warning if either of these match.
    if (axis == 'y' && self.axes_[0].hasOwnProperty(opt)) {
      return self.axes_[0][opt];
    } else if (axis == 'y2' && self.axes_[1].hasOwnProperty(opt)) {
      return self.axes_[1][opt];
    }
    return self.attr_(opt);
  };
};

/**
 * Returns the current rolling period, as set by the user or an option.
 * @return {Number} The number of points in the rolling window
 */
Dygraph.prototype.rollPeriod = function() {
  return this.rollPeriod_;
};

/**
 * Returns the currently-visible x-range. This can be affected by zooming,
 * panning or a call to updateOptions.
 * Returns a two-element array: [left, right].
 * If the Dygraph has dates on the x-axis, these will be millis since epoch.
 */
Dygraph.prototype.xAxisRange = function() {
  return this.dateWindow_ ? this.dateWindow_ : this.xAxisExtremes();
};

/**
 * Returns the lower- and upper-bound x-axis values of the
 * data set.
 */
Dygraph.prototype.xAxisExtremes = function() {
  var left = this.rawData_[0][0];
  var right = this.rawData_[this.rawData_.length - 1][0];
  return [left, right];
};

/**
 * Returns the currently-visible y-range for an axis. This can be affected by
 * zooming, panning or a call to updateOptions. Axis indices are zero-based. If
 * called with no arguments, returns the range of the first axis.
 * Returns a two-element array: [bottom, top].
 */
Dygraph.prototype.yAxisRange = function(idx) {
  if (typeof(idx) == "undefined") idx = 0;
  if (idx < 0 || idx >= this.axes_.length) {
    return null;
  }
  var axis = this.axes_[idx];
  return [ axis.computedValueRange[0], axis.computedValueRange[1] ];
};

/**
 * Returns the currently-visible y-ranges for each axis. This can be affected by
 * zooming, panning, calls to updateOptions, etc.
 * Returns an array of [bottom, top] pairs, one for each y-axis.
 */
Dygraph.prototype.yAxisRanges = function() {
  var ret = [];
  for (var i = 0; i < this.axes_.length; i++) {
    ret.push(this.yAxisRange(i));
  }
  return ret;
};

// TODO(danvk): use these functions throughout dygraphs.
/**
 * Convert from data coordinates to canvas/div X/Y coordinates.
 * If specified, do this conversion for the coordinate system of a particular
 * axis. Uses the first axis by default.
 * Returns a two-element array: [X, Y]
 *
 * Note: use toDomXCoord instead of toDomCoords(x, null) and use toDomYCoord
 * instead of toDomCoords(null, y, axis).
 */
Dygraph.prototype.toDomCoords = function(x, y, axis) {
  return [ this.toDomXCoord(x), this.toDomYCoord(y, axis) ];
};

/**
 * Convert from data x coordinates to canvas/div X coordinate.
 * If specified, do this conversion for the coordinate system of a particular
 * axis.
 * Returns a single value or null if x is null.
 */
Dygraph.prototype.toDomXCoord = function(x) {
  if (x === null) {
    return null;
  }

  var area = this.plotter_.area;
  var xRange = this.xAxisRange();
  return area.x + (x - xRange[0]) / (xRange[1] - xRange[0]) * area.w;
};

/**
 * Convert from data x coordinates to canvas/div Y coordinate and optional
 * axis. Uses the first axis by default.
 *
 * returns a single value or null if y is null.
 */
Dygraph.prototype.toDomYCoord = function(y, axis) {
  var pct = this.toPercentYCoord(y, axis);

  if (pct === null) {
    return null;
  }
  var area = this.plotter_.area;
  return area.y + pct * area.h;
};

/**
 * Convert from canvas/div coords to data coordinates.
 * If specified, do this conversion for the coordinate system of a particular
 * axis. Uses the first axis by default.
 * Returns a two-element array: [X, Y].
 *
 * Note: use toDataXCoord instead of toDataCoords(x, null) and use toDataYCoord
 * instead of toDataCoords(null, y, axis).
 */
Dygraph.prototype.toDataCoords = function(x, y, axis) {
  return [ this.toDataXCoord(x), this.toDataYCoord(y, axis) ];
};

/**
 * Convert from canvas/div x coordinate to data coordinate.
 *
 * If x is null, this returns null.
 */
Dygraph.prototype.toDataXCoord = function(x) {
  if (x === null) {
    return null;
  }

  var area = this.plotter_.area;
  var xRange = this.xAxisRange();
  return xRange[0] + (x - area.x) / area.w * (xRange[1] - xRange[0]);
};

/**
 * Convert from canvas/div y coord to value.
 *
 * If y is null, this returns null.
 * if axis is null, this uses the first axis.
 */
Dygraph.prototype.toDataYCoord = function(y, axis) {
  if (y === null) {
    return null;
  }

  var area = this.plotter_.area;
  var yRange = this.yAxisRange(axis);

  if (typeof(axis) == "undefined") axis = 0;
  if (!this.axes_[axis].logscale) {
    return yRange[0] + (area.y + area.h - y) / area.h * (yRange[1] - yRange[0]);
  } else {
    // Computing the inverse of toDomCoord.
    var pct = (y - area.y) / area.h;

    // Computing the inverse of toPercentYCoord. The function was arrived at with
    // the following steps:
    //
    // Original calcuation:
    // pct = (logr1 - Dygraph.log10(y)) / (logr1 - Dygraph.log10(yRange[0]));
    //
    // Move denominator to both sides:
    // pct * (logr1 - Dygraph.log10(yRange[0])) = logr1 - Dygraph.log10(y);
    //
    // subtract logr1, and take the negative value.
    // logr1 - (pct * (logr1 - Dygraph.log10(yRange[0]))) = Dygraph.log10(y);
    //
    // Swap both sides of the equation, and we can compute the log of the
    // return value. Which means we just need to use that as the exponent in
    // e^exponent.
    // Dygraph.log10(y) = logr1 - (pct * (logr1 - Dygraph.log10(yRange[0])));

    var logr1 = Dygraph.log10(yRange[1]);
    var exponent = logr1 - (pct * (logr1 - Dygraph.log10(yRange[0])));
    var value = Math.pow(Dygraph.LOG_SCALE, exponent);
    return value;
  }
};

/**
 * Converts a y for an axis to a percentage from the top to the
 * bottom of the drawing area.
 *
 * If the coordinate represents a value visible on the canvas, then
 * the value will be between 0 and 1, where 0 is the top of the canvas.
 * However, this method will return values outside the range, as
 * values can fall outside the canvas.
 *
 * If y is null, this returns null.
 * if axis is null, this uses the first axis.
 *
 * @param { Number } y The data y-coordinate.
 * @param { Number } [axis] The axis number on which the data coordinate lives.
 * @return { Number } A fraction in [0, 1] where 0 = the top edge.
 */
Dygraph.prototype.toPercentYCoord = function(y, axis) {
  if (y === null) {
    return null;
  }
  if (typeof(axis) == "undefined") axis = 0;

  var yRange = this.yAxisRange(axis);

  var pct;
  if (!this.axes_[axis].logscale) {
    // yRange[1] - y is unit distance from the bottom.
    // yRange[1] - yRange[0] is the scale of the range.
    // (yRange[1] - y) / (yRange[1] - yRange[0]) is the % from the bottom.
    pct = (yRange[1] - y) / (yRange[1] - yRange[0]);
  } else {
    var logr1 = Dygraph.log10(yRange[1]);
    pct = (logr1 - Dygraph.log10(y)) / (logr1 - Dygraph.log10(yRange[0]));
  }
  return pct;
};

/**
 * Converts an x value to a percentage from the left to the right of
 * the drawing area.
 *
 * If the coordinate represents a value visible on the canvas, then
 * the value will be between 0 and 1, where 0 is the left of the canvas.
 * However, this method will return values outside the range, as
 * values can fall outside the canvas.
 *
 * If x is null, this returns null.
 * @param { Number } x The data x-coordinate.
 * @return { Number } A fraction in [0, 1] where 0 = the left edge.
 */
Dygraph.prototype.toPercentXCoord = function(x) {
  if (x === null) {
    return null;
  }

  var xRange = this.xAxisRange();
  return (x - xRange[0]) / (xRange[1] - xRange[0]);
};

/**
 * Returns the number of columns (including the independent variable).
 * @return { Integer } The number of columns.
 */
Dygraph.prototype.numColumns = function() {
  return this.rawData_[0] ? this.rawData_[0].length : this.attr_("labels").length;
};

/**
 * Returns the number of rows (excluding any header/label row).
 * @return { Integer } The number of rows, less any header.
 */
Dygraph.prototype.numRows = function() {
  return this.rawData_.length;
};

/**
 * Returns the full range of the x-axis, as determined by the most extreme
 * values in the data set. Not affected by zooming, visibility, etc.
 * TODO(danvk): merge w/ xAxisExtremes
 * @return { Array<Number> } A [low, high] pair
 * @private
 */
Dygraph.prototype.fullXRange_ = function() {
  if (this.numRows() > 0) {
    return [this.rawData_[0][0], this.rawData_[this.numRows() - 1][0]];
  } else {
    return [0, 1];
  }
};

/**
 * Returns the value in the given row and column. If the row and column exceed
 * the bounds on the data, returns null. Also returns null if the value is
 * missing.
 * @param { Number} row The row number of the data (0-based). Row 0 is the
 * first row of data, not a header row.
 * @param { Number} col The column number of the data (0-based)
 * @return { Number } The value in the specified cell or null if the row/col
 * were out of range.
 */
Dygraph.prototype.getValue = function(row, col) {
  if (row < 0 || row > this.rawData_.length) return null;
  if (col < 0 || col > this.rawData_[row].length) return null;

  return this.rawData_[row][col];
};

/**
 * Generates interface elements for the Dygraph: a containing div, a div to
 * display the current point, and a textbox to adjust the rolling average
 * period. Also creates the Renderer/Layout elements.
 * @private
 */
Dygraph.prototype.createInterface_ = function() {
  // Create the all-enclosing graph div
  var enclosing = this.maindiv_;

  this.graphDiv = document.createElement("div");
  this.graphDiv.style.width = this.width_ + "px";
  this.graphDiv.style.height = this.height_ + "px";
  enclosing.appendChild(this.graphDiv);

  // Create the canvas for interactive parts of the chart.
  this.canvas_ = Dygraph.createCanvas();
  this.canvas_.style.position = "absolute";
  this.canvas_.width = this.width_;
  this.canvas_.height = this.height_;
  this.canvas_.style.width = this.width_ + "px";    // for IE
  this.canvas_.style.height = this.height_ + "px";  // for IE

  this.canvas_ctx_ = Dygraph.getContext(this.canvas_);

  // ... and for static parts of the chart.
  this.hidden_ = this.createPlotKitCanvas_(this.canvas_);
  this.hidden_ctx_ = Dygraph.getContext(this.hidden_);

  if (this.attr_('showRangeSelector')) {
    // The range selector must be created here so that its canvases and contexts get created here.
    // For some reason, if the canvases and contexts don't get created here, things don't work in IE.
    this.rangeSelector_ = new DygraphRangeSelector(this);
  }

  // The interactive parts of the graph are drawn on top of the chart.
  this.graphDiv.appendChild(this.hidden_);
  this.graphDiv.appendChild(this.canvas_);
  this.mouseEventElement_ = this.createMouseEventElement_();

  // Create the grapher
  this.layout_ = new DygraphLayout(this);

  if (this.rangeSelector_) {
    // This needs to happen after the graph canvases are added to the div and the layout object is created.
    this.rangeSelector_.addToGraph(this.graphDiv, this.layout_);
  }

  var dygraph = this;

  this.mouseMoveHandler = function(e) {
    dygraph.mouseMove_(e);
  };
  this.addEvent(this.mouseEventElement_, 'mousemove', this.mouseMoveHandler);

  this.mouseOutHandler = function(e) {
    dygraph.mouseOut_(e);
  };
  this.addEvent(this.mouseEventElement_, 'mouseout', this.mouseOutHandler);

  this.createDragInterface_();

  this.resizeHandler = function(e) {
    dygraph.resize();
  };

  // Update when the window is resized.
  // TODO(danvk): drop frames depending on complexity of the chart.
  this.addEvent(window, 'resize', this.resizeHandler);
};

/**
 * Detach DOM elements in the dygraph and null out all data references.
 * Calling this when you're done with a dygraph can dramatically reduce memory
 * usage. See, e.g., the tests/perf.html example.
 */
Dygraph.prototype.destroy = function() {
  var removeRecursive = function(node) {
    while (node.hasChildNodes()) {
      removeRecursive(node.firstChild);
      node.removeChild(node.firstChild);
    }
  };

  for (var idx = 0; idx < this.registeredEvents_.length; idx++) {
    var reg = this.registeredEvents_[idx];
    Dygraph.removeEvent(reg.elem, reg.type, reg.fn);
  }
  this.registeredEvents_ = [];

  // remove mouse event handlers (This may not be necessary anymore)
  Dygraph.removeEvent(this.mouseEventElement_, 'mouseout', this.mouseOutHandler);
  Dygraph.removeEvent(this.mouseEventElement_, 'mousemove', this.mouseMoveHandler);
  Dygraph.removeEvent(this.mouseEventElement_, 'mousemove', this.mouseUpHandler_);
  removeRecursive(this.maindiv_);

  var nullOut = function(obj) {
    for (var n in obj) {
      if (typeof(obj[n]) === 'object') {
        obj[n] = null;
      }
    }
  };
  // remove event handlers
  Dygraph.removeEvent(window,'resize',this.resizeHandler);
  this.resizeHandler = null;
  // These may not all be necessary, but it can't hurt...
  nullOut(this.layout_);
  nullOut(this.plotter_);
  nullOut(this);
};

/**
 * Creates the canvas on which the chart will be drawn. Only the Renderer ever
 * draws on this particular canvas. All Dygraph work (i.e. drawing hover dots
 * or the zoom rectangles) is done on this.canvas_.
 * @param {Object} canvas The Dygraph canvas over which to overlay the plot
 * @return {Object} The newly-created canvas
 * @private
 */
Dygraph.prototype.createPlotKitCanvas_ = function(canvas) {
  var h = Dygraph.createCanvas();
  h.style.position = "absolute";
  // TODO(danvk): h should be offset from canvas. canvas needs to include
  // some extra area to make it easier to zoom in on the far left and far
  // right. h needs to be precisely the plot area, so that clipping occurs.
  h.style.top = canvas.style.top;
  h.style.left = canvas.style.left;
  h.width = this.width_;
  h.height = this.height_;
  h.style.width = this.width_ + "px";    // for IE
  h.style.height = this.height_ + "px";  // for IE
  return h;
};

/**
 * Creates an overlay element used to handle mouse events.
 * @return {Object} The mouse event element.
 * @private
 */
Dygraph.prototype.createMouseEventElement_ = function() {
  if (this.isUsingExcanvas_) {
    var elem = document.createElement("div");
    elem.style.position = 'absolute';
    elem.style.backgroundColor = 'white';
    elem.style.filter = 'alpha(opacity=0)';
    elem.style.width = this.width_ + "px";
    elem.style.height = this.height_ + "px";
    this.graphDiv.appendChild(elem);
    return elem;
  } else {
    return this.canvas_;
  }
};

/**
 * Generate a set of distinct colors for the data series. This is done with a
 * color wheel. Saturation/Value are customizable, and the hue is
 * equally-spaced around the color wheel. If a custom set of colors is
 * specified, that is used instead.
 * @private
 */
Dygraph.prototype.setColors_ = function() {
  var labels = this.getLabels();
  var num = labels.length - 1;
  this.colors_ = [];
  this.colorsMap_ = {};
  var colors = this.attr_('colors');
  var i;
  if (!colors) {
    var sat = this.attr_('colorSaturation') || 1.0;
    var val = this.attr_('colorValue') || 0.5;
    var half = Math.ceil(num / 2);
    for (i = 1; i <= num; i++) {
      if (!this.visibility()[i-1]) continue;
      // alternate colors for high contrast.
      var idx = i % 2 ? Math.ceil(i / 2) : (half + i / 2);
      var hue = (1.0 * idx/ (1 + num));
      var colorStr = Dygraph.hsvToRGB(hue, sat, val);
      this.colors_.push(colorStr);
      this.colorsMap_[labels[i]] = colorStr;
    }
  } else {
    for (i = 0; i < num; i++) {
      if (!this.visibility()[i]) continue;
      var colorStr = colors[i % colors.length];
      this.colors_.push(colorStr);
      this.colorsMap_[labels[1 + i]] = colorStr;
    }
  }
};

/**
 * Return the list of colors. This is either the list of colors passed in the
 * attributes or the autogenerated list of rgb(r,g,b) strings.
 * This does not return colors for invisible series.
 * @return {Array<string>} The list of colors.
 */
Dygraph.prototype.getColors = function() {
  return this.colors_;
};

/**
 * Returns a few attributes of a series, i.e. its color, its visibility, which
 * axis it's assigned to, and its column in the original data.
 * Returns null if the series does not exist.
 * Otherwise, returns an object with column, visibility, color and axis properties.
 * The "axis" property will be set to 1 for y1 and 2 for y2.
 * The "column" property can be fed back into getValue(row, column) to get
 * values for this series.
 */
Dygraph.prototype.getPropertiesForSeries = function(series_name) {
  var idx = -1;
  var labels = this.getLabels();
  for (var i = 1; i < labels.length; i++) {
    if (labels[i] == series_name) {
      idx = i;
      break;
    }
  }
  if (idx == -1) return null;

  return {
    name: series_name,
    column: idx,
    visible: this.visibility()[idx - 1],
    color: this.colorsMap_[series_name],
    axis: 1 + this.seriesToAxisMap_[series_name]
  };
};

/**
 * Create the text box to adjust the averaging period
 * @private
 */
Dygraph.prototype.createRollInterface_ = function() {
  // Create a roller if one doesn't exist already.
  if (!this.roller_) {
    this.roller_ = document.createElement("input");
    this.roller_.type = "text";
    this.roller_.style.display = "none";
    this.graphDiv.appendChild(this.roller_);
  }

  var display = this.attr_('showRoller') ? 'block' : 'none';

  var area = this.plotter_.area;
  var textAttr = { "position": "absolute",
                   "zIndex": 10,
                   "top": (area.y + area.h - 25) + "px",
                   "left": (area.x + 1) + "px",
                   "display": display
                  };
  this.roller_.size = "2";
  this.roller_.value = this.rollPeriod_;
  for (var name in textAttr) {
    if (textAttr.hasOwnProperty(name)) {
      this.roller_.style[name] = textAttr[name];
    }
  }

  var dygraph = this;
  this.roller_.onchange = function() { dygraph.adjustRoll(dygraph.roller_.value); };
};

/**
 * @private
 * Converts page the x-coordinate of the event to pixel x-coordinates on the
 * canvas (i.e. DOM Coords).
 */
Dygraph.prototype.dragGetX_ = function(e, context) {
  return Dygraph.pageX(e) - context.px;
};

/**
 * @private
 * Converts page the y-coordinate of the event to pixel y-coordinates on the
 * canvas (i.e. DOM Coords).
 */
Dygraph.prototype.dragGetY_ = function(e, context) {
  return Dygraph.pageY(e) - context.py;
};

/**
 * Set up all the mouse handlers needed to capture dragging behavior for zoom
 * events.
 * @private
 */
Dygraph.prototype.createDragInterface_ = function() {
  var context = {
    // Tracks whether the mouse is down right now
    isZooming: false,
    isPanning: false,  // is this drag part of a pan?
    is2DPan: false,    // if so, is that pan 1- or 2-dimensional?
    dragStartX: null, // pixel coordinates
    dragStartY: null, // pixel coordinates
    dragEndX: null, // pixel coordinates
    dragEndY: null, // pixel coordinates
    dragDirection: null,
    prevEndX: null, // pixel coordinates
    prevEndY: null, // pixel coordinates
    prevDragDirection: null,
    cancelNextDblclick: false,  // see comment in dygraph-interaction-model.js

    // The value on the left side of the graph when a pan operation starts.
    initialLeftmostDate: null,

    // The number of units each pixel spans. (This won't be valid for log
    // scales)
    xUnitsPerPixel: null,

    // TODO(danvk): update this comment
    // The range in second/value units that the viewport encompasses during a
    // panning operation.
    dateRange: null,

    // Top-left corner of the canvas, in DOM coords
    // TODO(konigsberg): Rename topLeftCanvasX, topLeftCanvasY.
    px: 0,
    py: 0,

    // Values for use with panEdgeFraction, which limit how far outside the
    // graph's data boundaries it can be panned.
    boundedDates: null, // [minDate, maxDate]
    boundedValues: null, // [[minValue, maxValue] ...]

    // We cover iframes during mouse interactions. See comments in
    // dygraph-utils.js for more info on why this is a good idea.
    tarp: new Dygraph.IFrameTarp(),

    // contextB is the same thing as this context object but renamed.
    initializeMouseDown: function(event, g, contextB) {
      // prevents mouse drags from selecting page text.
      if (event.preventDefault) {
        event.preventDefault();  // Firefox, Chrome, etc.
      } else {
        event.returnValue = false;  // IE
        event.cancelBubble = true;
      }

      contextB.px = Dygraph.findPosX(g.canvas_);
      contextB.py = Dygraph.findPosY(g.canvas_);
      contextB.dragStartX = g.dragGetX_(event, contextB);
      contextB.dragStartY = g.dragGetY_(event, contextB);
      contextB.cancelNextDblclick = false;
      contextB.tarp.cover();
    }
  };

  var interactionModel = this.attr_("interactionModel");

  // Self is the graph.
  var self = this;

  // Function that binds the graph and context to the handler.
  var bindHandler = function(handler) {
    return function(event) {
      handler(event, self, context);
    };
  };

  for (var eventName in interactionModel) {
    if (!interactionModel.hasOwnProperty(eventName)) continue;
    this.addEvent(this.mouseEventElement_, eventName,
        bindHandler(interactionModel[eventName]));
  }

  // If the user releases the mouse button during a drag, but not over the
  // canvas, then it doesn't count as a zooming action.
  this.mouseUpHandler_ = function(event) {
    if (context.isZooming || context.isPanning) {
      context.isZooming = false;
      context.dragStartX = null;
      context.dragStartY = null;
    }

    if (context.isPanning) {
      context.isPanning = false;
      context.draggingDate = null;
      context.dateRange = null;
      for (var i = 0; i < self.axes_.length; i++) {
        delete self.axes_[i].draggingValue;
        delete self.axes_[i].dragValueRange;
      }
    }

    context.tarp.uncover();
  };

  this.addEvent(document, 'mouseup', this.mouseUpHandler_);
};

/**
 * Draw a gray zoom rectangle over the desired area of the canvas. Also clears
 * up any previous zoom rectangles that were drawn. This could be optimized to
 * avoid extra redrawing, but it's tricky to avoid interactions with the status
 * dots.
 *
 * @param {Number} direction the direction of the zoom rectangle. Acceptable
 * values are Dygraph.HORIZONTAL and Dygraph.VERTICAL.
 * @param {Number} startX The X position where the drag started, in canvas
 * coordinates.
 * @param {Number} endX The current X position of the drag, in canvas coords.
 * @param {Number} startY The Y position where the drag started, in canvas
 * coordinates.
 * @param {Number} endY The current Y position of the drag, in canvas coords.
 * @param {Number} prevDirection the value of direction on the previous call to
 * this function. Used to avoid excess redrawing
 * @param {Number} prevEndX The value of endX on the previous call to this
 * function. Used to avoid excess redrawing
 * @param {Number} prevEndY The value of endY on the previous call to this
 * function. Used to avoid excess redrawing
 * @private
 */
Dygraph.prototype.drawZoomRect_ = function(direction, startX, endX, startY,
                                           endY, prevDirection, prevEndX,
                                           prevEndY) {
  var ctx = this.canvas_ctx_;

  // Clean up from the previous rect if necessary
  if (prevDirection == Dygraph.HORIZONTAL) {
    ctx.clearRect(Math.min(startX, prevEndX), this.layout_.getPlotArea().y,
                  Math.abs(startX - prevEndX), this.layout_.getPlotArea().h);
  } else if (prevDirection == Dygraph.VERTICAL){
    ctx.clearRect(this.layout_.getPlotArea().x, Math.min(startY, prevEndY),
                  this.layout_.getPlotArea().w, Math.abs(startY - prevEndY));
  }

  // Draw a light-grey rectangle to show the new viewing area
  if (direction == Dygraph.HORIZONTAL) {
    if (endX && startX) {
      ctx.fillStyle = "rgba(128,128,128,0.33)";
      ctx.fillRect(Math.min(startX, endX), this.layout_.getPlotArea().y,
                   Math.abs(endX - startX), this.layout_.getPlotArea().h);
    }
  } else if (direction == Dygraph.VERTICAL) {
    if (endY && startY) {
      ctx.fillStyle = "rgba(128,128,128,0.33)";
      ctx.fillRect(this.layout_.getPlotArea().x, Math.min(startY, endY),
                   this.layout_.getPlotArea().w, Math.abs(endY - startY));
    }
  }

  if (this.isUsingExcanvas_) {
    this.currentZoomRectArgs_ = [direction, startX, endX, startY, endY, 0, 0, 0];
  }
};

/**
 * Clear the zoom rectangle (and perform no zoom).
 * @private
 */
Dygraph.prototype.clearZoomRect_ = function() {
  this.currentZoomRectArgs_ = null;
  this.canvas_ctx_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
};

/**
 * Zoom to something containing [lowX, highX]. These are pixel coordinates in
 * the canvas. The exact zoom window may be slightly larger if there are no data
 * points near lowX or highX. Don't confuse this function with doZoomXDates,
 * which accepts dates that match the raw data. This function redraws the graph.
 *
 * @param {Number} lowX The leftmost pixel value that should be visible.
 * @param {Number} highX The rightmost pixel value that should be visible.
 * @private
 */
Dygraph.prototype.doZoomX_ = function(lowX, highX) {
  this.currentZoomRectArgs_ = null;
  // Find the earliest and latest dates contained in this canvasx range.
  // Convert the call to date ranges of the raw data.
  var minDate = this.toDataXCoord(lowX);
  var maxDate = this.toDataXCoord(highX);
  this.doZoomXDates_(minDate, maxDate);
};

/**
 * Transition function to use in animations. Returns values between 0.0
 * (totally old values) and 1.0 (totally new values) for each frame.
 * @private
 */
Dygraph.zoomAnimationFunction = function(frame, numFrames) {
  var k = 1.5;
  return (1.0 - Math.pow(k, -frame)) / (1.0 - Math.pow(k, -numFrames));
};

/**
 * Zoom to something containing [minDate, maxDate] values. Don't confuse this
 * method with doZoomX which accepts pixel coordinates. This function redraws
 * the graph.
 *
 * @param {Number} minDate The minimum date that should be visible.
 * @param {Number} maxDate The maximum date that should be visible.
 * @private
 */
Dygraph.prototype.doZoomXDates_ = function(minDate, maxDate) {
  // TODO(danvk): when yAxisRange is null (i.e. "fit to data", the animation
  // can produce strange effects. Rather than the y-axis transitioning slowly
  // between values, it can jerk around.)
  var old_window = this.xAxisRange();
  var new_window = [minDate, maxDate];
  this.zoomed_x_ = true;
  var that = this;
  this.doAnimatedZoom(old_window, new_window, null, null, function() {
    if (that.attr_("zoomCallback")) {
      that.attr_("zoomCallback")(minDate, maxDate, that.yAxisRanges());
    }
  });
};

/**
 * Zoom to something containing [lowY, highY]. These are pixel coordinates in
 * the canvas. This function redraws the graph.
 *
 * @param {Number} lowY The topmost pixel value that should be visible.
 * @param {Number} highY The lowest pixel value that should be visible.
 * @private
 */
Dygraph.prototype.doZoomY_ = function(lowY, highY) {
  this.currentZoomRectArgs_ = null;
  // Find the highest and lowest values in pixel range for each axis.
  // Note that lowY (in pixels) corresponds to the max Value (in data coords).
  // This is because pixels increase as you go down on the screen, whereas data
  // coordinates increase as you go up the screen.
  var oldValueRanges = this.yAxisRanges();
  var newValueRanges = [];
  for (var i = 0; i < this.axes_.length; i++) {
    var hi = this.toDataYCoord(lowY, i);
    var low = this.toDataYCoord(highY, i);
    newValueRanges.push([low, hi]);
  }

  this.zoomed_y_ = true;
  var that = this;
  this.doAnimatedZoom(null, null, oldValueRanges, newValueRanges, function() {
    if (that.attr_("zoomCallback")) {
      var xRange = that.xAxisRange();
      that.attr_("zoomCallback")(xRange[0], xRange[1], that.yAxisRanges());
    }
  });
};

/**
 * Reset the zoom to the original view coordinates. This is the same as
 * double-clicking on the graph.
 *
 * @private
 */
Dygraph.prototype.doUnzoom_ = function() {
  var dirty = false, dirtyX = false, dirtyY = false;
  if (this.dateWindow_ !== null) {
    dirty = true;
    dirtyX = true;
  }

  for (var i = 0; i < this.axes_.length; i++) {
    if (typeof(this.axes_[i].valueWindow) !== 'undefined' && this.axes_[i].valueWindow !== null) {
      dirty = true;
      dirtyY = true;
    }
  }

  // Clear any selection, since it's likely to be drawn in the wrong place.
  this.clearSelection();

  if (dirty) {
    this.zoomed_x_ = false;
    this.zoomed_y_ = false;

    var minDate = this.rawData_[0][0];
    var maxDate = this.rawData_[this.rawData_.length - 1][0];

    // With only one frame, don't bother calculating extreme ranges.
    // TODO(danvk): merge this block w/ the code below.
    if (!this.attr_("animatedZooms")) {
      this.dateWindow_ = null;
      for (i = 0; i < this.axes_.length; i++) {
        if (this.axes_[i].valueWindow !== null) {
          delete this.axes_[i].valueWindow;
        }
      }
      this.drawGraph_();
      if (this.attr_("zoomCallback")) {
        this.attr_("zoomCallback")(minDate, maxDate, this.yAxisRanges());
      }
      return;
    }

    var oldWindow=null, newWindow=null, oldValueRanges=null, newValueRanges=null;
    if (dirtyX) {
      oldWindow = this.xAxisRange();
      newWindow = [minDate, maxDate];
    }

    if (dirtyY) {
      oldValueRanges = this.yAxisRanges();
      // TODO(danvk): this is pretty inefficient
      var packed = this.gatherDatasets_(this.rolledSeries_, null);
      var extremes = packed[1];

      // this has the side-effect of modifying this.axes_.
      // this doesn't make much sense in this context, but it's convenient (we
      // need this.axes_[*].extremeValues) and not harmful since we'll be
      // calling drawGraph_ shortly, which clobbers these values.
      this.computeYAxisRanges_(extremes);

      newValueRanges = [];
      for (i = 0; i < this.axes_.length; i++) {
        var axis = this.axes_[i];
        newValueRanges.push(axis.valueRange !== null ?
                            axis.valueRange : axis.extremeRange);
      }
    }

    var that = this;
    this.doAnimatedZoom(oldWindow, newWindow, oldValueRanges, newValueRanges,
        function() {
          that.dateWindow_ = null;
          for (var i = 0; i < that.axes_.length; i++) {
            if (that.axes_[i].valueWindow !== null) {
              delete that.axes_[i].valueWindow;
            }
          }
          if (that.attr_("zoomCallback")) {
            that.attr_("zoomCallback")(minDate, maxDate, that.yAxisRanges());
          }
        });
  }
};

/**
 * Combined animation logic for all zoom functions.
 * either the x parameters or y parameters may be null.
 * @private
 */
Dygraph.prototype.doAnimatedZoom = function(oldXRange, newXRange, oldYRanges, newYRanges, callback) {
  var steps = this.attr_("animatedZooms") ? Dygraph.ANIMATION_STEPS : 1;

  var windows = [];
  var valueRanges = [];
  var step, frac;

  if (oldXRange !== null && newXRange !== null) {
    for (step = 1; step <= steps; step++) {
      frac = Dygraph.zoomAnimationFunction(step, steps);
      windows[step-1] = [oldXRange[0]*(1-frac) + frac*newXRange[0],
                         oldXRange[1]*(1-frac) + frac*newXRange[1]];
    }
  }

  if (oldYRanges !== null && newYRanges !== null) {
    for (step = 1; step <= steps; step++) {
      frac = Dygraph.zoomAnimationFunction(step, steps);
      var thisRange = [];
      for (var j = 0; j < this.axes_.length; j++) {
        thisRange.push([oldYRanges[j][0]*(1-frac) + frac*newYRanges[j][0],
                        oldYRanges[j][1]*(1-frac) + frac*newYRanges[j][1]]);
      }
      valueRanges[step-1] = thisRange;
    }
  }

  var that = this;
  Dygraph.repeatAndCleanup(function(step) {
    if (valueRanges.length) {
      for (var i = 0; i < that.axes_.length; i++) {
        var w = valueRanges[step][i];
        that.axes_[i].valueWindow = [w[0], w[1]];
      }
    }
    if (windows.length) {
      that.dateWindow_ = windows[step];
    }
    that.drawGraph_();
  }, steps, Dygraph.ANIMATION_DURATION / steps, callback);
};

/**
 * Get the current graph's area object.
 *
 * Returns: {x, y, w, h}
 */
Dygraph.prototype.getArea = function() {
  return this.plotter_.area;
};

/**
 * Convert a mouse event to DOM coordinates relative to the graph origin.
 *
 * Returns a two-element array: [X, Y].
 */
Dygraph.prototype.eventToDomCoords = function(event) {
  var canvasx = Dygraph.pageX(event) - Dygraph.findPosX(this.mouseEventElement_);
  var canvasy = Dygraph.pageY(event) - Dygraph.findPosY(this.mouseEventElement_);
  return [canvasx, canvasy];
};

/**
 * Given a canvas X coordinate, find the closest row.
 * @param {Number} domX graph-relative DOM X coordinate
 * Returns: row number, integer
 * @private
 */
Dygraph.prototype.findClosestRow = function(domX) {
  var minDistX = Infinity;
  var pointIdx = -1, setIdx = -1;
  var sets = this.layout_.points;
  for (var i = 0; i < sets.length; i++) {
    var points = sets[i];
    var len = points.length;
    for (var j = 0; j < len; j++) {
      var point = points[j];
      if (!Dygraph.isValidPoint(point, true)) continue;
      var dist = Math.abs(point.canvasx - domX);
      if (dist < minDistX) {
        minDistX = dist;
        setIdx = i;
        pointIdx = j;
      }
    }
  }

  // TODO(danvk): remove this function; it's trivial and has only one use.
  return this.idxToRow_(setIdx, pointIdx);
};

/**
 * Given canvas X,Y coordinates, find the closest point.
 *
 * This finds the individual data point across all visible series
 * that's closest to the supplied DOM coordinates using the standard
 * Euclidean X,Y distance.
 *
 * @param {Number} domX graph-relative DOM X coordinate
 * @param {Number} domY graph-relative DOM Y coordinate
 * Returns: {row, seriesName, point}
 * @private
 */
Dygraph.prototype.findClosestPoint = function(domX, domY) {
  var minDist = Infinity;
  var idx = -1;
  var dist, dx, dy, point, closestPoint, closestSeries;
  for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
    var points = this.layout_.points[setIdx];
    for (var i = 0; i < points.length; ++i) {
      var point = points[i];
      if (!Dygraph.isValidPoint(point)) continue;
      dx = point.canvasx - domX;
      dy = point.canvasy - domY;
      dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
        closestSeries = setIdx;
        idx = i;
      }
    }
  }
  var name = this.layout_.setNames[closestSeries];
  return {
    row: idx + this.getLeftBoundary_(),
    seriesName: name,
    point: closestPoint
  };
};

/**
 * Given canvas X,Y coordinates, find the touched area in a stacked graph.
 *
 * This first finds the X data point closest to the supplied DOM X coordinate,
 * then finds the series which puts the Y coordinate on top of its filled area,
 * using linear interpolation between adjacent point pairs.
 *
 * @param {Number} domX graph-relative DOM X coordinate
 * @param {Number} domY graph-relative DOM Y coordinate
 * Returns: {row, seriesName, point}
 * @private
 */
Dygraph.prototype.findStackedPoint = function(domX, domY) {
  var row = this.findClosestRow(domX);
  var boundary = this.getLeftBoundary_();
  var rowIdx = row - boundary;
  var sets = this.layout_.points;
  var closestPoint, closestSeries;
  for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
    var points = this.layout_.points[setIdx];
    if (rowIdx >= points.length) continue;
    var p1 = points[rowIdx];
    if (!Dygraph.isValidPoint(p1)) continue;
    var py = p1.canvasy;
    if (domX > p1.canvasx && rowIdx + 1 < points.length) {
      // interpolate series Y value using next point
      var p2 = points[rowIdx + 1];
      if (Dygraph.isValidPoint(p2)) {
        var dx = p2.canvasx - p1.canvasx;
        if (dx > 0) {
          var r = (domX - p1.canvasx) / dx;
          py += r * (p2.canvasy - p1.canvasy);
        }
      }
    } else if (domX < p1.canvasx && rowIdx > 0) {
      // interpolate series Y value using previous point
      var p0 = points[rowIdx - 1];
      if (Dygraph.isValidPoint(p0)) {
        var dx = p1.canvasx - p0.canvasx;
        if (dx > 0) {
          var r = (p1.canvasx - domX) / dx;
          py += r * (p0.canvasy - p1.canvasy);
        }
      }
    }
    // Stop if the point (domX, py) is above this series' upper edge
    if (setIdx === 0 || py < domY) {
      closestPoint = p1;
      closestSeries = setIdx;
    }
  }
  var name = this.layout_.setNames[closestSeries];
  return {
    row: row,
    seriesName: name,
    point: closestPoint
  };
};

/**
 * When the mouse moves in the canvas, display information about a nearby data
 * point and draw dots over those points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @param {Object} event The mousemove event from the browser.
 * @private
 */
Dygraph.prototype.mouseMove_ = function(event) {
  // This prevents JS errors when mousing over the canvas before data loads.
  var points = this.layout_.points;
  if (points === undefined || points === null) return;

  var canvasCoords = this.eventToDomCoords(event);
  var canvasx = canvasCoords[0];
  var canvasy = canvasCoords[1];

  var highlightSeriesOpts = this.attr_("highlightSeriesOpts");
  var selectionChanged = false;
  if (highlightSeriesOpts && !this.lockedSet_) {
    var closest;
    if (this.attr_("stackedGraph")) {
      closest = this.findStackedPoint(canvasx, canvasy);
    } else {
      closest = this.findClosestPoint(canvasx, canvasy);
    }
    selectionChanged = this.setSelection(closest.row, closest.seriesName);
  } else {
    var idx = this.findClosestRow(canvasx);
    selectionChanged = this.setSelection(idx);
  }

  var callback = this.attr_("highlightCallback");
  if (callback && selectionChanged) {
    callback(event, this.lastx_, this.selPoints_, this.lastRow_, this.highlightSet_);
  }
};

/**
 * Fetch left offset from first defined boundaryIds record (see bug #236).
 * @private
 */
Dygraph.prototype.getLeftBoundary_ = function() {
  for (var i = 0; i < this.boundaryIds_.length; i++) {
    if (this.boundaryIds_[i] !== undefined) {
      return this.boundaryIds_[i][0];
    }
  }
  return 0;
};

/**
 * Transforms layout_.points index into data row number.
 * @param int layout_.points index
 * @return int row number, or -1 if none could be found.
 * @private
 */
Dygraph.prototype.idxToRow_ = function(setIdx, rowIdx) {
  if (rowIdx < 0) return -1;

  var boundary = this.getLeftBoundary_();
  return boundary + rowIdx;
  // for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
  //   var set = this.layout_.datasets[setIdx];
  //   if (idx < set.length) {
  //     return boundary + idx;
  //   }
  //   idx -= set.length;
  // }
  // return -1;
};

Dygraph.prototype.animateSelection_ = function(direction) {
  var totalSteps = 10;
  var millis = 30;
  if (this.fadeLevel === undefined) this.fadeLevel = 0;
  if (this.animateId === undefined) this.animateId = 0;
  var start = this.fadeLevel;
  var steps = direction < 0 ? start : totalSteps - start;
  if (steps <= 0) {
    if (this.fadeLevel) {
      this.updateSelection_(1.0);
    }
    return;
  }

  var thisId = ++this.animateId;
  var that = this;
  Dygraph.repeatAndCleanup(
    function(n) {
      // ignore simultaneous animations
      if (that.animateId != thisId) return;

      that.fadeLevel += direction;
      if (that.fadeLevel === 0) {
        that.clearSelection();
      } else {
        that.updateSelection_(that.fadeLevel / totalSteps);
      }
    },
    steps, millis, function() {});
};

/**
 * Draw dots over the selectied points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @private
 */
Dygraph.prototype.updateSelection_ = function(opt_animFraction) {
  var defaultPrevented = this.cascadeEvents_('select', {
    selectedX: this.lastx_,
    selectedPoints: this.selPoints_
  });
  // TODO(danvk): use defaultPrevented here?

  // Clear the previously drawn vertical, if there is one
  var i;
  var ctx = this.canvas_ctx_;
  if (this.attr_('highlightSeriesOpts')) {
    ctx.clearRect(0, 0, this.width_, this.height_);
    var alpha = 1.0 - this.attr_('highlightSeriesBackgroundAlpha');
    if (alpha) {
      // Activating background fade includes an animation effect for a gradual
      // fade. TODO(klausw): make this independently configurable if it causes
      // issues? Use a shared preference to control animations?
      var animateBackgroundFade = true;
      if (animateBackgroundFade) {
        if (opt_animFraction === undefined) {
          // start a new animation
          this.animateSelection_(1);
          return;
        }
        alpha *= opt_animFraction;
      }
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fillRect(0, 0, this.width_, this.height_);
    }

    // Redraw only the highlighted series in the interactive canvas (not the
    // static plot canvas, which is where series are usually drawn).
    this.plotter_._renderLineChart(this.highlightSet_, ctx);
  } else if (this.previousVerticalX_ >= 0) {
    // Determine the maximum highlight circle size.
    var maxCircleSize = 0;
    var labels = this.attr_('labels');
    for (i = 1; i < labels.length; i++) {
      var r = this.attr_('highlightCircleSize', labels[i]);
      if (r > maxCircleSize) maxCircleSize = r;
    }
    var px = this.previousVerticalX_;
    ctx.clearRect(px - maxCircleSize - 1, 0,
                  2 * maxCircleSize + 2, this.height_);
  }

  if (this.isUsingExcanvas_ && this.currentZoomRectArgs_) {
    Dygraph.prototype.drawZoomRect_.apply(this, this.currentZoomRectArgs_);
  }

  if (this.selPoints_.length > 0) {
    // Draw colored circles over the center of each selected point
    var canvasx = this.selPoints_[0].canvasx;
    ctx.save();
    for (i = 0; i < this.selPoints_.length; i++) {
      var pt = this.selPoints_[i];
      if (!Dygraph.isOK(pt.canvasy)) continue;

      var circleSize = this.attr_('highlightCircleSize', pt.name);
      var callback = this.attr_("drawHighlightPointCallback", pt.name);
      var color = this.plotter_.colors[pt.name];
      if (!callback) {
        callback = Dygraph.Circles.DEFAULT;
      }
      ctx.lineWidth = this.attr_('strokeWidth', pt.name);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      callback(this.g, pt.name, ctx, canvasx, pt.canvasy,
          color, circleSize);
    }
    ctx.restore();

    this.previousVerticalX_ = canvasx;
  }
};

/**
 * Manually set the selected points and display information about them in the
 * legend. The selection can be cleared using clearSelection() and queried
 * using getSelection().
 * @param { Integer } row number that should be highlighted (i.e. appear with
 * hover dots on the chart). Set to false to clear any selection.
 * @param { seriesName } optional series name to highlight that series with the
 * the highlightSeriesOpts setting.
 * @param { locked } optional If true, keep seriesName selected when mousing
 * over the graph, disabling closest-series highlighting. Call clearSelection()
 * to unlock it.
 */
Dygraph.prototype.setSelection = function(row, opt_seriesName, opt_locked) {
  // Extract the points we've selected
  this.selPoints_ = [];

  if (row !== false) {
    row -= this.getLeftBoundary_();
  }

  var changed = false;
  if (row !== false && row >= 0) {
    if (row != this.lastRow_) changed = true;
    this.lastRow_ = row;
    for (var setIdx = 0; setIdx < this.layout_.datasets.length; ++setIdx) {
      var set = this.layout_.datasets[setIdx];
      if (row < set.length) {
        var point = this.layout_.points[setIdx][row];

        if (this.attr_("stackedGraph")) {
          point = this.layout_.unstackPointAtIndex(setIdx, row);
        }

        if (point.yval !== null) this.selPoints_.push(point);
      }
    }
  } else {
    if (this.lastRow_ >= 0) changed = true;
    this.lastRow_ = -1;
  }

  if (this.selPoints_.length) {
    this.lastx_ = this.selPoints_[0].xval;
  } else {
    this.lastx_ = -1;
  }

  if (opt_seriesName !== undefined) {
    if (this.highlightSet_ !== opt_seriesName) changed = true;
    this.highlightSet_ = opt_seriesName;
  }

  if (opt_locked !== undefined) {
    this.lockedSet_ = opt_locked;
  }

  if (changed) {
    this.updateSelection_(undefined);
  }
  return changed;
};

/**
 * The mouse has left the canvas. Clear out whatever artifacts remain
 * @param {Object} event the mouseout event from the browser.
 * @private
 */
Dygraph.prototype.mouseOut_ = function(event) {
  if (this.attr_("unhighlightCallback")) {
    this.attr_("unhighlightCallback")(event);
  }

  if (this.attr_("hideOverlayOnMouseOut") && !this.lockedSet_) {
    this.clearSelection();
  }
};

/**
 * Clears the current selection (i.e. points that were highlighted by moving
 * the mouse over the chart).
 */
Dygraph.prototype.clearSelection = function() {
  this.cascadeEvents_('deselect', {});

  this.lockedSet_ = false;
  // Get rid of the overlay data
  if (this.fadeLevel) {
    this.animateSelection_(-1);
    return;
  }
  this.canvas_ctx_.clearRect(0, 0, this.width_, this.height_);
  this.fadeLevel = 0;
  this.selPoints_ = [];
  this.lastx_ = -1;
  this.lastRow_ = -1;
  this.highlightSet_ = null;
};

/**
 * Returns the number of the currently selected row. To get data for this row,
 * you can use the getValue method.
 * @return { Integer } row number, or -1 if nothing is selected
 */
Dygraph.prototype.getSelection = function() {
  if (!this.selPoints_ || this.selPoints_.length < 1) {
    return -1;
  }

  for (var setIdx = 0; setIdx < this.layout_.points.length; setIdx++) {
    var points = this.layout_.points[setIdx];
    for (var row = 0; row < points.length; row++) {
      if (points[row].x == this.selPoints_[0].x) {
        return row + this.getLeftBoundary_();
      }
    }
  }
  return -1;
};

/**
 * Returns the name of the currently-highlighted series.
 * Only available when the highlightSeriesOpts option is in use.
 */
Dygraph.prototype.getHighlightSeries = function() {
  return this.highlightSet_;
};

/**
 * Fires when there's data available to be graphed.
 * @param {String} data Raw CSV data to be plotted
 * @private
 */
Dygraph.prototype.loadedEvent_ = function(data) {
  this.rawData_ = this.parseCSV_(data);
  this.predraw_();
};

/**
 * Add ticks on the x-axis representing years, months, quarters, weeks, or days
 * @private
 */
Dygraph.prototype.addXTicks_ = function() {
  // Determine the correct ticks scale on the x-axis: quarterly, monthly, ...
  var range;
  if (this.dateWindow_) {
    range = [this.dateWindow_[0], this.dateWindow_[1]];
  } else {
    range = this.fullXRange_();
  }

  var xAxisOptionsView = this.optionsViewForAxis_('x');
  var xTicks = xAxisOptionsView('ticker')(
      range[0],
      range[1],
      this.width_,  // TODO(danvk): should be area.width
      xAxisOptionsView,
      this);
  // var msg = 'ticker(' + range[0] + ', ' + range[1] + ', ' + this.width_ + ', ' + this.attr_('pixelsPerXLabel') + ') -> ' + JSON.stringify(xTicks);
  // console.log(msg);
  this.layout_.setXTicks(xTicks);
};

/**
 * @private
 * Computes the range of the data series (including confidence intervals).
 * @param { [Array] } series either [ [x1, y1], [x2, y2], ... ] or
 * [ [x1, [y1, dev_low, dev_high]], [x2, [y2, dev_low, dev_high]], ...
 * @return [low, high]
 */
Dygraph.prototype.extremeValues_ = function(series) {
  var minY = null, maxY = null, j, y;

  var bars = this.attr_("errorBars") || this.attr_("customBars");
  if (bars) {
    // With custom bars, maxY is the max of the high values.
    for (j = 0; j < series.length; j++) {
      y = series[j][1][0];
      if (y === null || isNaN(y)) continue;
      var low = y - series[j][1][1];
      var high = y + series[j][1][2];
      if (low > y) low = y;    // this can happen with custom bars,
      if (high < y) high = y;  // e.g. in tests/custom-bars.html
      if (maxY === null || high > maxY) {
        maxY = high;
      }
      if (minY === null || low < minY) {
        minY = low;
      }
    }
  } else {
    for (j = 0; j < series.length; j++) {
      y = series[j][1];
      if (y === null || isNaN(y)) continue;
      if (maxY === null || y > maxY) {
        maxY = y;
      }
      if (minY === null || y < minY) {
        minY = y;
      }
    }
  }

  return [minY, maxY];
};

/**
 * @private
 * This function is called once when the chart's data is changed or the options
 * dictionary is updated. It is _not_ called when the user pans or zooms. The
 * idea is that values derived from the chart's data can be computed here,
 * rather than every time the chart is drawn. This includes things like the
 * number of axes, rolling averages, etc.
 */
Dygraph.prototype.predraw_ = function() {
  var start = new Date();

  // TODO(danvk): move more computations out of drawGraph_ and into here.
  this.computeYAxes_();

  // Create a new plotter.
  if (this.plotter_) {
    this.cascadeEvents_('clearChart');
    this.plotter_.clear();
  }
  this.plotter_ = new DygraphCanvasRenderer(this,
                                            this.hidden_,
                                            this.hidden_ctx_,
                                            this.layout_);

  // The roller sits in the bottom left corner of the chart. We don't know where
  // this will be until the options are available, so it's positioned here.
  this.createRollInterface_();

  this.cascadeEvents_('predraw');

  if (this.rangeSelector_) {
    this.rangeSelector_.renderStaticLayer();
  }

  // Convert the raw data (a 2D array) into the internal format and compute
  // rolling averages.
  this.rolledSeries_ = [null];  // x-axis is the first series and it's special
  for (var i = 1; i < this.numColumns(); i++) {
    var logScale = this.attr_('logscale', i); // TODO(klausw): this looks wrong
    var series = this.extractSeries_(this.rawData_, i, logScale);
    series = this.rollingAverage(series, this.rollPeriod_);
    this.rolledSeries_.push(series);
  }

  // If the data or options have changed, then we'd better redraw.
  this.drawGraph_();

  // This is used to determine whether to do various animations.
  var end = new Date();
  this.drawingTimeMs_ = (end - start);
};

/**
 * Loop over all fields and create datasets, calculating extreme y-values for
 * each series and extreme x-indices as we go.
 *
 * dateWindow is passed in as an explicit parameter so that we can compute
 * extreme values "speculatively", i.e. without actually setting state on the
 * dygraph.
 *
 * TODO(danvk): make this more of a true function
 * @return [ datasets, seriesExtremes, boundaryIds ]
 * @private
 */
Dygraph.prototype.gatherDatasets_ = function(rolledSeries, dateWindow) {
  var boundaryIds = [];
  var cumulative_y = [];  // For stacked series.
  var datasets = [];
  var extremes = {};  // series name -> [low, high]
  var i, j, k;

  // Loop over the fields (series).  Go from the last to the first,
  // because if they're stacked that's how we accumulate the values.
  var num_series = rolledSeries.length - 1;
  for (i = num_series; i >= 1; i--) {
    if (!this.visibility()[i - 1]) continue;

    // Note: this copy _is_ necessary at the moment.
    // If you remove it, it breaks zooming with error bars on.
    // TODO(danvk): investigate further & write a test for this.
    var series = [];
    for (j = 0; j < rolledSeries[i].length; j++) {
      series.push(rolledSeries[i][j]);
    }

    // Prune down to the desired range, if necessary (for zooming)
    // Because there can be lines going to points outside of the visible area,
    // we actually prune to visible points, plus one on either side.
    var bars = this.attr_("errorBars") || this.attr_("customBars");
    if (dateWindow) {
      var low = dateWindow[0];
      var high = dateWindow[1];
      var pruned = [];
      // TODO(danvk): do binary search instead of linear search.
      // TODO(danvk): pass firstIdx and lastIdx directly to the renderer.
      var firstIdx = null, lastIdx = null;
      for (k = 0; k < series.length; k++) {
        if (series[k][0] >= low && firstIdx === null) {
          firstIdx = k;
        }
        if (series[k][0] <= high) {
          lastIdx = k;
        }
      }
      if (firstIdx === null) firstIdx = 0;
      if (firstIdx > 0) firstIdx--;
      if (lastIdx === null) lastIdx = series.length - 1;
      if (lastIdx < series.length - 1) lastIdx++;
      boundaryIds[i-1] = [firstIdx, lastIdx];
      for (k = firstIdx; k <= lastIdx; k++) {
        pruned.push(series[k]);
      }
      series = pruned;
    } else {
      boundaryIds[i-1] = [0, series.length-1];
    }

    var seriesExtremes = this.extremeValues_(series);

    if (bars) {
      for (j=0; j<series.length; j++) {
        series[j] = [series[j][0],
                     series[j][1][0],
                     series[j][1][1],
                     series[j][1][2]];
      }
    } else if (this.attr_("stackedGraph")) {
      var l = series.length;
      var actual_y;
      for (j = 0; j < l; j++) {
        // If one data set has a NaN, let all subsequent stacked
        // sets inherit the NaN -- only start at 0 for the first set.
        var x = series[j][0];
        if (cumulative_y[x] === undefined) {
          cumulative_y[x] = 0;
        }

        actual_y = series[j][1];
        if (actual_y === null) {
          series[j] = [x, null];
          continue;
        }

        cumulative_y[x] += actual_y;

        series[j] = [x, cumulative_y[x]];

        if (cumulative_y[x] > seriesExtremes[1]) {
          seriesExtremes[1] = cumulative_y[x];
        }
        if (cumulative_y[x] < seriesExtremes[0]) {
          seriesExtremes[0] = cumulative_y[x];
        }
      }
    }

    var seriesName = this.attr_("labels")[i];
    extremes[seriesName] = seriesExtremes;
    datasets[i] = series;
  }

  // For stacked graphs, a NaN value for any point in the sum should create a
  // clean gap in the graph. Back-propagate NaNs to all points at this X value.
  if (this.attr_("stackedGraph")) {
    for (k = datasets.length - 1; k >= 0; --k) {
      // Use the first nonempty dataset to get X values.
      if (!datasets[k]) continue;
      for (j = 0; j < datasets[k].length; j++) {
        var x = datasets[k][j][0];
        if (isNaN(cumulative_y[x])) {
          // Set all Y values to NaN at that X value.
          for (i = datasets.length - 1; i >= 0; i--) {
            if (!datasets[i]) continue;
            datasets[i][j][1] = NaN;
          }
        }
      }
      break;
    }
  }

  return [ datasets, extremes, boundaryIds ];
};

/**
 * Update the graph with new data. This method is called when the viewing area
 * has changed. If the underlying data or options have changed, predraw_ will
 * be called before drawGraph_ is called.
 *
 * @private
 */
Dygraph.prototype.drawGraph_ = function() {
  var start = new Date();

  // This is used to set the second parameter to drawCallback, below.
  var is_initial_draw = this.is_initial_draw_;
  this.is_initial_draw_ = false;

  this.layout_.removeAllDatasets();
  this.setColors_();
  this.attrs_.pointSize = 0.5 * this.attr_('highlightCircleSize');

  var packed = this.gatherDatasets_(this.rolledSeries_, this.dateWindow_);
  var datasets = packed[0];
  var extremes = packed[1];
  this.boundaryIds_ = packed[2];

  this.setIndexByName_ = {};
  var labels = this.attr_("labels");
  if (labels.length > 0) {
    this.setIndexByName_[labels[0]] = 0;
  }
  var dataIdx = 0;
  for (var i = 1; i < datasets.length; i++) {
    this.setIndexByName_[labels[i]] = i;
    if (!this.visibility()[i - 1]) continue;
    this.layout_.addDataset(labels[i], datasets[i]);
    this.datasetIndex_[i] = dataIdx++;
  }

  this.computeYAxisRanges_(extremes);
  this.layout_.setYAxes(this.axes_);

  this.addXTicks_();

  // Save the X axis zoomed status as the updateOptions call will tend to set it erroneously
  var tmp_zoomed_x = this.zoomed_x_;
  // Tell PlotKit to use this new data and render itself
  this.layout_.setDateWindow(this.dateWindow_);
  this.zoomed_x_ = tmp_zoomed_x;
  this.layout_.evaluateWithError();
  this.renderGraph_(is_initial_draw);

  if (this.attr_("timingName")) {
    var end = new Date();
    if (console) {
      console.log(this.attr_("timingName") + " - drawGraph: " + (end - start) + "ms");
    }
  }
};

/**
 * This does the work of drawing the chart. It assumes that the layout and axis
 * scales have already been set (e.g. by predraw_).
 *
 * @private
 */
Dygraph.prototype.renderGraph_ = function(is_initial_draw) {
  this.cascadeEvents_('clearChart');
  this.plotter_.clear();

  if (this.attr_('underlayCallback')) {
    // NOTE: we pass the dygraph object to this callback twice to avoid breaking
    // users who expect a deprecated form of this callback.
    this.attr_('underlayCallback')(
        this.hidden_ctx_, this.layout_.getPlotArea(), this, this);
  }

  var e = {
    canvas: this.hidden_,
    drawingContext: this.hidden_ctx_
  };
  this.cascadeEvents_('willDrawChart', e);
  this.plotter_.render();
  this.cascadeEvents_('didDrawChart', e);

  // TODO(danvk): is this a performance bottleneck when panning?
  // The interaction canvas should already be empty in that situation.
  this.canvas_.getContext('2d').clearRect(0, 0, this.canvas_.width,
                                          this.canvas_.height);

  // Generate a static legend before any particular point is selected.

  if (this.rangeSelector_) {
    this.rangeSelector_.renderInteractiveLayer();
  }
  if (this.attr_("drawCallback") !== null) {
    this.attr_("drawCallback")(this, is_initial_draw);
  }
};

/**
 * @private
 * Determine properties of the y-axes which are independent of the data
 * currently being displayed. This includes things like the number of axes and
 * the style of the axes. It does not include the range of each axis and its
 * tick marks.
 * This fills in this.axes_ and this.seriesToAxisMap_.
 * axes_ = [ { options } ]
 * seriesToAxisMap_ = { seriesName: 0, seriesName2: 1, ... }
 *   indices are into the axes_ array.
 */
Dygraph.prototype.computeYAxes_ = function() {
  // Preserve valueWindow settings if they exist, and if the user hasn't
  // specified a new valueRange.
  var i, valueWindows, seriesName, axis, index, opts, v;
  if (this.axes_ !== undefined && this.user_attrs_.hasOwnProperty("valueRange") === false) {
    valueWindows = [];
    for (index = 0; index < this.axes_.length; index++) {
      valueWindows.push(this.axes_[index].valueWindow);
    }
  }

  this.axes_ = [{ yAxisId : 0, g : this }];  // always have at least one y-axis.
  this.seriesToAxisMap_ = {};

  // Get a list of series names.
  var labels = this.attr_("labels");
  var series = {};
  for (i = 1; i < labels.length; i++) series[labels[i]] = (i - 1);

  // all options which could be applied per-axis:
  var axisOptions = [
    'includeZero',
    'valueRange',
    'labelsKMB',
    'labelsKMG2',
    'pixelsPerYLabel',
    'yAxisLabelWidth',
    'axisLabelFontSize',
    'axisTickSize',
    'logscale'
  ];

  // Copy global axis options over to the first axis.
  for (i = 0; i < axisOptions.length; i++) {
    var k = axisOptions[i];
    v = this.attr_(k);
    if (v) this.axes_[0][k] = v;
  }

  // Go through once and add all the axes.
  for (seriesName in series) {
    if (!series.hasOwnProperty(seriesName)) continue;
    axis = this.attr_("axis", seriesName);
    if (axis === null) {
      this.seriesToAxisMap_[seriesName] = 0;
      continue;
    }
    if (typeof(axis) == 'object') {
      // Add a new axis, making a copy of its per-axis options.
      opts = {};
      Dygraph.update(opts, this.axes_[0]);
      Dygraph.update(opts, { valueRange: null });  // shouldn't inherit this.
      var yAxisId = this.axes_.length;
      opts.yAxisId = yAxisId;
      opts.g = this;
      Dygraph.update(opts, axis);
      this.axes_.push(opts);
      this.seriesToAxisMap_[seriesName] = yAxisId;
    }
  }

  // Go through one more time and assign series to an axis defined by another
  // series, e.g. { 'Y1: { axis: {} }, 'Y2': { axis: 'Y1' } }
  for (seriesName in series) {
    if (!series.hasOwnProperty(seriesName)) continue;
    axis = this.attr_("axis", seriesName);
    if (typeof(axis) == 'string') {
      if (!this.seriesToAxisMap_.hasOwnProperty(axis)) {
        this.error("Series " + seriesName + " wants to share a y-axis with " +
                   "series " + axis + ", which does not define its own axis.");
        return null;
      }
      var idx = this.seriesToAxisMap_[axis];
      this.seriesToAxisMap_[seriesName] = idx;
    }
  }

  if (valueWindows !== undefined) {
    // Restore valueWindow settings.
    for (index = 0; index < valueWindows.length; index++) {
      this.axes_[index].valueWindow = valueWindows[index];
    }
  }

  // New axes options
  for (axis = 0; axis < this.axes_.length; axis++) {
    if (axis === 0) {
      opts = this.optionsViewForAxis_('y' + (axis ? '2' : ''));
      v = opts("valueRange");
      if (v) this.axes_[axis].valueRange = v;
    } else {  // To keep old behavior
      var axes = this.user_attrs_.axes;
      if (axes && axes.y2) {
        v = axes.y2.valueRange;
        if (v) this.axes_[axis].valueRange = v;
      }
    }
  }

};

/**
 * Returns the number of y-axes on the chart.
 * @return {Number} the number of axes.
 */
Dygraph.prototype.numAxes = function() {
  var last_axis = 0;
  for (var series in this.seriesToAxisMap_) {
    if (!this.seriesToAxisMap_.hasOwnProperty(series)) continue;
    var idx = this.seriesToAxisMap_[series];
    if (idx > last_axis) last_axis = idx;
  }
  return 1 + last_axis;
};

/**
 * @private
 * Returns axis properties for the given series.
 * @param { String } setName The name of the series for which to get axis
 * properties, e.g. 'Y1'.
 * @return { Object } The axis properties.
 */
Dygraph.prototype.axisPropertiesForSeries = function(series) {
  // TODO(danvk): handle errors.
  return this.axes_[this.seriesToAxisMap_[series]];
};

/**
 * @private
 * Determine the value range and tick marks for each axis.
 * @param {Object} extremes A mapping from seriesName -> [low, high]
 * This fills in the valueRange and ticks fields in each entry of this.axes_.
 */
Dygraph.prototype.computeYAxisRanges_ = function(extremes) {
  // Build a map from axis number -> [list of series names]
  var seriesForAxis = [], series;
  for (series in this.seriesToAxisMap_) {
    if (!this.seriesToAxisMap_.hasOwnProperty(series)) continue;
    var idx = this.seriesToAxisMap_[series];
    while (seriesForAxis.length <= idx) seriesForAxis.push([]);
    seriesForAxis[idx].push(series);
  }

  // Compute extreme values, a span and tick marks for each axis.
  for (var i = 0; i < this.axes_.length; i++) {
    var axis = this.axes_[i];

    if (!seriesForAxis[i]) {
      // If no series are defined or visible then use a reasonable default
      axis.extremeRange = [0, 1];
    } else {
      // Calculate the extremes of extremes.
      series = seriesForAxis[i];
      var minY = Infinity;  // extremes[series[0]][0];
      var maxY = -Infinity;  // extremes[series[0]][1];
      var extremeMinY, extremeMaxY;

      for (var j = 0; j < series.length; j++) {
        // this skips invisible series
        if (!extremes.hasOwnProperty(series[j])) continue;

        // Only use valid extremes to stop null data series' from corrupting the scale.
        extremeMinY = extremes[series[j]][0];
        if (extremeMinY !== null) {
          minY = Math.min(extremeMinY, minY);
        }
        extremeMaxY = extremes[series[j]][1];
        if (extremeMaxY !== null) {
          maxY = Math.max(extremeMaxY, maxY);
        }
      }
      if (axis.includeZero && minY > 0) minY = 0;

      // Ensure we have a valid scale, otherwise default to [0, 1] for safety.
      if (minY == Infinity) minY = 0;
      if (maxY == -Infinity) maxY = 1;

      // Add some padding and round up to an integer to be human-friendly.
      var span = maxY - minY;
      // special case: if we have no sense of scale, use +/-10% of the sole value.
      if (span === 0) { span = maxY; }

      var maxAxisY, minAxisY;
      if (axis.logscale) {
        maxAxisY = maxY + 0.1 * span;
        minAxisY = minY;
      } else {
        maxAxisY = maxY + 0.1 * span;
        minAxisY = minY - 0.1 * span;

        // Try to include zero and make it minAxisY (or maxAxisY) if it makes sense.
        if (!this.attr_("avoidMinZero")) {
          if (minAxisY < 0 && minY >= 0) minAxisY = 0;
          if (maxAxisY > 0 && maxY <= 0) maxAxisY = 0;
        }

        if (this.attr_("includeZero")) {
          if (maxY < 0) maxAxisY = 0;
          if (minY > 0) minAxisY = 0;
        }
      }
      axis.extremeRange = [minAxisY, maxAxisY];
    }
    if (axis.valueWindow) {
      // This is only set if the user has zoomed on the y-axis. It is never set
      // by a user. It takes precedence over axis.valueRange because, if you set
      // valueRange, you'd still expect to be able to pan.
      axis.computedValueRange = [axis.valueWindow[0], axis.valueWindow[1]];
    } else if (axis.valueRange) {
      // This is a user-set value range for this axis.
      axis.computedValueRange = [axis.valueRange[0], axis.valueRange[1]];
    } else {
      axis.computedValueRange = axis.extremeRange;
    }

    // Add ticks. By default, all axes inherit the tick positions of the
    // primary axis. However, if an axis is specifically marked as having
    // independent ticks, then that is permissible as well.
    var opts = this.optionsViewForAxis_('y' + (i ? '2' : ''));
    var ticker = opts('ticker');
    if (i === 0 || axis.independentTicks) {
      axis.ticks = ticker(axis.computedValueRange[0],
                          axis.computedValueRange[1],
                          this.height_,  // TODO(danvk): should be area.height
                          opts,
                          this);
    } else {
      var p_axis = this.axes_[0];
      var p_ticks = p_axis.ticks;
      var p_scale = p_axis.computedValueRange[1] - p_axis.computedValueRange[0];
      var scale = axis.computedValueRange[1] - axis.computedValueRange[0];
      var tick_values = [];
      for (var k = 0; k < p_ticks.length; k++) {
        var y_frac = (p_ticks[k].v - p_axis.computedValueRange[0]) / p_scale;
        var y_val = axis.computedValueRange[0] + y_frac * scale;
        tick_values.push(y_val);
      }

      axis.ticks = ticker(axis.computedValueRange[0],
                          axis.computedValueRange[1],
                          this.height_,  // TODO(danvk): should be area.height
                          opts,
                          this,
                          tick_values);
    }
  }
};

/**
 * Extracts one series from the raw data (a 2D array) into an array of (date,
 * value) tuples.
 *
 * This is where undesirable points (i.e. negative values on log scales and
 * missing values through which we wish to connect lines) are dropped.
 * TODO(danvk): the "missing values" bit above doesn't seem right.
 *
 * @private
 */
Dygraph.prototype.extractSeries_ = function(rawData, i, logScale) {
  // TODO(danvk): pre-allocate series here.
  var series = [];
  for (var j = 0; j < rawData.length; j++) {
    var x = rawData[j][0];
    var point = rawData[j][i];
    if (logScale) {
      // On the log scale, points less than zero do not exist.
      // This will create a gap in the chart.
      if (point <= 0) {
        point = null;
      }
    }
    series.push([x, point]);
  }
  return series;
};

/**
 * @private
 * Calculates the rolling average of a data set.
 * If originalData is [label, val], rolls the average of those.
 * If originalData is [label, [, it's interpreted as [value, stddev]
 *   and the roll is returned in the same form, with appropriately reduced
 *   stddev for each value.
 * Note that this is where fractional input (i.e. '5/10') is converted into
 *   decimal values.
 * @param {Array} originalData The data in the appropriate format (see above)
 * @param {Number} rollPeriod The number of points over which to average the
 *                            data
 */
Dygraph.prototype.rollingAverage = function(originalData, rollPeriod) {
  if (originalData.length < 2)
    return originalData;
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];
  var sigma = this.attr_("sigma");

  var low, high, i, j, y, sum, num_ok, stddev;
  if (this.fractions_) {
    var num = 0;
    var den = 0;  // numerator/denominator
    var mult = 100.0;
    for (i = 0; i < originalData.length; i++) {
      num += originalData[i][1][0];
      den += originalData[i][1][1];
      if (i - rollPeriod >= 0) {
        num -= originalData[i - rollPeriod][1][0];
        den -= originalData[i - rollPeriod][1][1];
      }

      var date = originalData[i][0];
      var value = den ? num / den : 0.0;
      if (this.attr_("errorBars")) {
        if (this.attr_("wilsonInterval")) {
          // For more details on this confidence interval, see:
          // http://en.wikipedia.org/wiki/Binomial_confidence_interval
          if (den) {
            var p = value < 0 ? 0 : value, n = den;
            var pm = sigma * Math.sqrt(p*(1-p)/n + sigma*sigma/(4*n*n));
            var denom = 1 + sigma * sigma / den;
            low  = (p + sigma * sigma / (2 * den) - pm) / denom;
            high = (p + sigma * sigma / (2 * den) + pm) / denom;
            rollingData[i] = [date,
                              [p * mult, (p - low) * mult, (high - p) * mult]];
          } else {
            rollingData[i] = [date, [0, 0, 0]];
          }
        } else {
          stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
          rollingData[i] = [date, [mult * value, mult * stddev, mult * stddev]];
        }
      } else {
        rollingData[i] = [date, mult * value];
      }
    }
  } else if (this.attr_("customBars")) {
    low = 0;
    var mid = 0;
    high = 0;
    var count = 0;
    for (i = 0; i < originalData.length; i++) {
      var data = originalData[i][1];
      y = data[1];
      rollingData[i] = [originalData[i][0], [y, y - data[0], data[2] - y]];

      if (y !== null && !isNaN(y)) {
        low += data[0];
        mid += y;
        high += data[2];
        count += 1;
      }
      if (i - rollPeriod >= 0) {
        var prev = originalData[i - rollPeriod];
        if (prev[1][1] !== null && !isNaN(prev[1][1])) {
          low -= prev[1][0];
          mid -= prev[1][1];
          high -= prev[1][2];
          count -= 1;
        }
      }
      if (count) {
        rollingData[i] = [originalData[i][0], [ 1.0 * mid / count,
                                                1.0 * (mid - low) / count,
                                                1.0 * (high - mid) / count ]];
      } else {
        rollingData[i] = [originalData[i][0], [null, null, null]];
      }
    }
  } else {
    // Calculate the rolling average for the first rollPeriod - 1 points where
    // there is not enough data to roll over the full number of points
    if (!this.attr_("errorBars")){
      if (rollPeriod == 1) {
        return originalData;
      }

      for (i = 0; i < originalData.length; i++) {
        sum = 0;
        num_ok = 0;
        for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
          y = originalData[j][1];
          if (y === null || isNaN(y)) continue;
          num_ok++;
          sum += originalData[j][1];
        }
        if (num_ok) {
          rollingData[i] = [originalData[i][0], sum / num_ok];
        } else {
          rollingData[i] = [originalData[i][0], null];
        }
      }

    } else {
      for (i = 0; i < originalData.length; i++) {
        sum = 0;
        var variance = 0;
        num_ok = 0;
        for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
          y = originalData[j][1][0];
          if (y === null || isNaN(y)) continue;
          num_ok++;
          sum += originalData[j][1][0];
          variance += Math.pow(originalData[j][1][1], 2);
        }
        if (num_ok) {
          stddev = Math.sqrt(variance) / num_ok;
          rollingData[i] = [originalData[i][0],
                            [sum / num_ok, sigma * stddev, sigma * stddev]];
        } else {
          rollingData[i] = [originalData[i][0], [null, null, null]];
        }
      }
    }
  }

  return rollingData;
};

/**
 * Detects the type of the str (date or numeric) and sets the various
 * formatting attributes in this.attrs_ based on this type.
 * @param {String} str An x value.
 * @private
 */
Dygraph.prototype.detectTypeFromString_ = function(str) {
  var isDate = false;
  var dashPos = str.indexOf('-');  // could be 2006-01-01 _or_ 1.0e-2
  if ((dashPos > 0 && (str[dashPos-1] != 'e' && str[dashPos-1] != 'E')) ||
      str.indexOf('/') >= 0 ||
      isNaN(parseFloat(str))) {
    isDate = true;
  } else if (str.length == 8 && str > '19700101' && str < '20371231') {
    // TODO(danvk): remove support for this format.
    isDate = true;
  }

  if (isDate) {
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.axes.x.valueFormatter = Dygraph.dateString_;
    this.attrs_.axes.x.ticker = Dygraph.dateTicker;
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.dateAxisFormatter;
  } else {
    /** @private (shut up, jsdoc!) */
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    // TODO(danvk): use Dygraph.numberValueFormatter here?
    /** @private (shut up, jsdoc!) */
    this.attrs_.axes.x.valueFormatter = function(x) { return x; };
    this.attrs_.axes.x.ticker = Dygraph.numericLinearTicks;
    this.attrs_.axes.x.axisLabelFormatter = this.attrs_.axes.x.valueFormatter;
  }
};

/**
 * Parses the value as a floating point number. This is like the parseFloat()
 * built-in, but with a few differences:
 * - the empty string is parsed as null, rather than NaN.
 * - if the string cannot be parsed at all, an error is logged.
 * If the string can't be parsed, this method returns null.
 * @param {String} x The string to be parsed
 * @param {Number} opt_line_no The line number from which the string comes.
 * @param {String} opt_line The text of the line from which the string comes.
 * @private
 */

// Parse the x as a float or return null if it's not a number.
Dygraph.prototype.parseFloat_ = function(x, opt_line_no, opt_line) {
  var val = parseFloat(x);
  if (!isNaN(val)) return val;

  // Try to figure out what happeend.
  // If the value is the empty string, parse it as null.
  if (/^ *$/.test(x)) return null;

  // If it was actually "NaN", return it as NaN.
  if (/^ *nan *$/i.test(x)) return NaN;

  // Looks like a parsing error.
  var msg = "Unable to parse '" + x + "' as a number";
  if (opt_line !== null && opt_line_no !== null) {
    msg += " on line " + (1+opt_line_no) + " ('" + opt_line + "') of CSV.";
  }
  this.error(msg);

  return null;
};

/**
 * @private
 * Parses a string in a special csv format.  We expect a csv file where each
 * line is a date point, and the first field in each line is the date string.
 * We also expect that all remaining fields represent series.
 * if the errorBars attribute is set, then interpret the fields as:
 * date, series1, stddev1, series2, stddev2, ...
 * @param {[Object]} data See above.
 *
 * @return [Object] An array with one entry for each row. These entries
 * are an array of cells in that row. The first entry is the parsed x-value for
 * the row. The second, third, etc. are the y-values. These can take on one of
 * three forms, depending on the CSV and constructor parameters:
 * 1. numeric value
 * 2. [ value, stddev ]
 * 3. [ low value, center value, high value ]
 */
Dygraph.prototype.parseCSV_ = function(data) {
  var ret = [];
  var line_delimiter = Dygraph.detectLineDelimiter(data);
  var lines = data.split(line_delimiter || "\n");
  var vals, j;

  // Use the default delimiter or fall back to a tab if that makes sense.
  var delim = this.attr_('delimiter');
  if (lines[0].indexOf(delim) == -1 && lines[0].indexOf('\t') >= 0) {
    delim = '\t';
  }

  var start = 0;
  if (!('labels' in this.user_attrs_)) {
    // User hasn't explicitly set labels, so they're (presumably) in the CSV.
    start = 1;
    this.attrs_.labels = lines[0].split(delim);  // NOTE: _not_ user_attrs_.
  }
  var line_no = 0;

  var xParser;
  var defaultParserSet = false;  // attempt to auto-detect x value type
  var expectedCols = this.attr_("labels").length;
  var outOfOrder = false;
  for (var i = start; i < lines.length; i++) {
    var line = lines[i];
    line_no = i;
    if (line.length === 0) continue;  // skip blank lines
    if (line[0] == '#') continue;    // skip comment lines
    var inFields = line.split(delim);
    if (inFields.length < 2) continue;

    var fields = [];
    if (!defaultParserSet) {
      this.detectTypeFromString_(inFields[0]);
      xParser = this.attr_("xValueParser");
      defaultParserSet = true;
    }
    fields[0] = xParser(inFields[0], this);

    // If fractions are expected, parse the numbers as "A/B"
    if (this.fractions_) {
      for (j = 1; j < inFields.length; j++) {
        // TODO(danvk): figure out an appropriate way to flag parse errors.
        vals = inFields[j].split("/");
        if (vals.length != 2) {
          this.error('Expected fractional "num/den" values in CSV data ' +
                     "but found a value '" + inFields[j] + "' on line " +
                     (1 + i) + " ('" + line + "') which is not of this form.");
          fields[j] = [0, 0];
        } else {
          fields[j] = [this.parseFloat_(vals[0], i, line),
                       this.parseFloat_(vals[1], i, line)];
        }
      }
    } else if (this.attr_("errorBars")) {
      // If there are error bars, values are (value, stddev) pairs
      if (inFields.length % 2 != 1) {
        this.error('Expected alternating (value, stdev.) pairs in CSV data ' +
                   'but line ' + (1 + i) + ' has an odd number of values (' +
                   (inFields.length - 1) + "): '" + line + "'");
      }
      for (j = 1; j < inFields.length; j += 2) {
        fields[(j + 1) / 2] = [this.parseFloat_(inFields[j], i, line),
                               this.parseFloat_(inFields[j + 1], i, line)];
      }
    } else if (this.attr_("customBars")) {
      // Bars are a low;center;high tuple
      for (j = 1; j < inFields.length; j++) {
        var val = inFields[j];
        if (/^ *$/.test(val)) {
          fields[j] = [null, null, null];
        } else {
          vals = val.split(";");
          if (vals.length == 3) {
            fields[j] = [ this.parseFloat_(vals[0], i, line),
                          this.parseFloat_(vals[1], i, line),
                          this.parseFloat_(vals[2], i, line) ];
          } else {
            this.warn('When using customBars, values must be either blank ' +
                      'or "low;center;high" tuples (got "' + val +
                      '" on line ' + (1+i));
          }
        }
      }
    } else {
      // Values are just numbers
      for (j = 1; j < inFields.length; j++) {
        fields[j] = this.parseFloat_(inFields[j], i, line);
      }
    }
    if (ret.length > 0 && fields[0] < ret[ret.length - 1][0]) {
      outOfOrder = true;
    }

    if (fields.length != expectedCols) {
      this.error("Number of columns in line " + i + " (" + fields.length +
                 ") does not agree with number of labels (" + expectedCols +
                 ") " + line);
    }

    // If the user specified the 'labels' option and none of the cells of the
    // first row parsed correctly, then they probably double-specified the
    // labels. We go with the values set in the option, discard this row and
    // log a warning to the JS console.
    if (i === 0 && this.attr_('labels')) {
      var all_null = true;
      for (j = 0; all_null && j < fields.length; j++) {
        if (fields[j]) all_null = false;
      }
      if (all_null) {
        this.warn("The dygraphs 'labels' option is set, but the first row of " +
                  "CSV data ('" + line + "') appears to also contain labels. " +
                  "Will drop the CSV labels and use the option labels.");
        continue;
      }
    }
    ret.push(fields);
  }

  if (outOfOrder) {
    this.warn("CSV is out of order; order it correctly to speed loading.");
    ret.sort(function(a,b) { return a[0] - b[0]; });
  }

  return ret;
};

/**
 * @private
 * The user has provided their data as a pre-packaged JS array. If the x values
 * are numeric, this is the same as dygraphs' internal format. If the x values
 * are dates, we need to convert them from Date objects to ms since epoch.
 * @param {[Object]} data
 * @return {[Object]} data with numeric x values.
 */
Dygraph.prototype.parseArray_ = function(data) {
  // Peek at the first x value to see if it's numeric.
  if (data.length === 0) {
    this.error("Can't plot empty data set");
    return null;
  }
  if (data[0].length === 0) {
    this.error("Data set cannot contain an empty row");
    return null;
  }

  var i;
  if (this.attr_("labels") === null) {
    this.warn("Using default labels. Set labels explicitly via 'labels' " +
              "in the options parameter");
    this.attrs_.labels = [ "X" ];
    for (i = 1; i < data[0].length; i++) {
      this.attrs_.labels.push("Y" + i);
    }
  } else {
    var num_labels = this.attr_("labels");
    if (num_labels.length != data[0].length) {
      this.error("Mismatch between number of labels (" + num_labels +
          ") and number of columns in array (" + data[0].length + ")");
      return null;
    }
  }

  if (Dygraph.isDateLike(data[0][0])) {
    // Some intelligent defaults for a date x-axis.
    this.attrs_.axes.x.valueFormatter = Dygraph.dateString_;
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.dateAxisFormatter;
    this.attrs_.axes.x.ticker = Dygraph.dateTicker;

    // Assume they're all dates.
    var parsedData = Dygraph.clone(data);
    for (i = 0; i < data.length; i++) {
      if (parsedData[i].length === 0) {
        this.error("Row " + (1 + i) + " of data is empty");
        return null;
      }
      if (parsedData[i][0] === null ||
          typeof(parsedData[i][0].getTime) != 'function' ||
          isNaN(parsedData[i][0].getTime())) {
        this.error("x value in row " + (1 + i) + " is not a Date");
        return null;
      }
      parsedData[i][0] = parsedData[i][0].getTime();
    }
    return parsedData;
  } else {
    // Some intelligent defaults for a numeric x-axis.
    /** @private (shut up, jsdoc!) */
    this.attrs_.axes.x.valueFormatter = function(x) { return x; };
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.numberAxisLabelFormatter;
    this.attrs_.axes.x.ticker = Dygraph.numericLinearTicks;
    return data;
  }
};

/**
 * Parses a DataTable object from gviz.
 * The data is expected to have a first column that is either a date or a
 * number. All subsequent columns must be numbers. If there is a clear mismatch
 * between this.xValueParser_ and the type of the first column, it will be
 * fixed. Fills out rawData_.
 * @param {[Object]} data See above.
 * @private
 */
Dygraph.prototype.parseDataTable_ = function(data) {
  var shortTextForAnnotationNum = function(num) {
    // converts [0-9]+ [A-Z][a-z]*
    // example: 0=A, 1=B, 25=Z, 26=Aa, 27=Ab
    // and continues like.. Ba Bb .. Za .. Zz..Aaa...Zzz Aaaa Zzzz
    var shortText = String.fromCharCode(65 /* A */ + num % 26);
    num = Math.floor(num / 26);
    while ( num > 0 ) {
      shortText = String.fromCharCode(65 /* A */ + (num - 1) % 26 ) + shortText.toLowerCase();
      num = Math.floor((num - 1) / 26);
    }
    return shortText;
  };

  var cols = data.getNumberOfColumns();
  var rows = data.getNumberOfRows();

  var indepType = data.getColumnType(0);
  if (indepType == 'date' || indepType == 'datetime') {
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.axes.x.valueFormatter = Dygraph.dateString_;
    this.attrs_.axes.x.ticker = Dygraph.dateTicker;
    this.attrs_.axes.x.axisLabelFormatter = Dygraph.dateAxisFormatter;
  } else if (indepType == 'number') {
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.axes.x.valueFormatter = function(x) { return x; };
    this.attrs_.axes.x.ticker = Dygraph.numericLinearTicks;
    this.attrs_.axes.x.axisLabelFormatter = this.attrs_.axes.x.valueFormatter;
  } else {
    this.error("only 'date', 'datetime' and 'number' types are supported for " +
               "column 1 of DataTable input (Got '" + indepType + "')");
    return null;
  }

  // Array of the column indices which contain data (and not annotations).
  var colIdx = [];
  var annotationCols = {};  // data index -> [annotation cols]
  var hasAnnotations = false;
  var i, j;
  for (i = 1; i < cols; i++) {
    var type = data.getColumnType(i);
    if (type == 'number') {
      colIdx.push(i);
    } else if (type == 'string' && this.attr_('displayAnnotations')) {
      // This is OK -- it's an annotation column.
      var dataIdx = colIdx[colIdx.length - 1];
      if (!annotationCols.hasOwnProperty(dataIdx)) {
        annotationCols[dataIdx] = [i];
      } else {
        annotationCols[dataIdx].push(i);
      }
      hasAnnotations = true;
    } else {
      this.error("Only 'number' is supported as a dependent type with Gviz." +
                 " 'string' is only supported if displayAnnotations is true");
    }
  }

  // Read column labels
  // TODO(danvk): add support back for errorBars
  var labels = [data.getColumnLabel(0)];
  for (i = 0; i < colIdx.length; i++) {
    labels.push(data.getColumnLabel(colIdx[i]));
    if (this.attr_("errorBars")) i += 1;
  }
  this.attrs_.labels = labels;
  cols = labels.length;

  var ret = [];
  var outOfOrder = false;
  var annotations = [];
  for (i = 0; i < rows; i++) {
    var row = [];
    if (typeof(data.getValue(i, 0)) === 'undefined' ||
        data.getValue(i, 0) === null) {
      this.warn("Ignoring row " + i +
                " of DataTable because of undefined or null first column.");
      continue;
    }

    if (indepType == 'date' || indepType == 'datetime') {
      row.push(data.getValue(i, 0).getTime());
    } else {
      row.push(data.getValue(i, 0));
    }
    if (!this.attr_("errorBars")) {
      for (j = 0; j < colIdx.length; j++) {
        var col = colIdx[j];
        row.push(data.getValue(i, col));
        if (hasAnnotations &&
            annotationCols.hasOwnProperty(col) &&
            data.getValue(i, annotationCols[col][0]) !== null) {
          var ann = {};
          ann.series = data.getColumnLabel(col);
          ann.xval = row[0];
          ann.shortText = shortTextForAnnotationNum(annotations.length);
          ann.text = '';
          for (var k = 0; k < annotationCols[col].length; k++) {
            if (k) ann.text += "\n";
            ann.text += data.getValue(i, annotationCols[col][k]);
          }
          annotations.push(ann);
        }
      }

      // Strip out infinities, which give dygraphs problems later on.
      for (j = 0; j < row.length; j++) {
        if (!isFinite(row[j])) row[j] = null;
      }
    } else {
      for (j = 0; j < cols - 1; j++) {
        row.push([ data.getValue(i, 1 + 2 * j), data.getValue(i, 2 + 2 * j) ]);
      }
    }
    if (ret.length > 0 && row[0] < ret[ret.length - 1][0]) {
      outOfOrder = true;
    }
    ret.push(row);
  }

  if (outOfOrder) {
    this.warn("DataTable is out of order; order it correctly to speed loading.");
    ret.sort(function(a,b) { return a[0] - b[0]; });
  }
  this.rawData_ = ret;

  if (annotations.length > 0) {
    this.setAnnotations(annotations, true);
  }
};

/**
 * Get the CSV data. If it's in a function, call that function. If it's in a
 * file, do an XMLHttpRequest to get it.
 * @private
 */
Dygraph.prototype.start_ = function() {
  var data = this.file_;

  // Functions can return references of all other types.
  if (typeof data == 'function') {
    data = data();
  }

  if (Dygraph.isArrayLike(data)) {
    this.rawData_ = this.parseArray_(data);
    this.predraw_();
  } else if (typeof data == 'object' &&
             typeof data.getColumnRange == 'function') {
    // must be a DataTable from gviz.
    this.parseDataTable_(data);
    this.predraw_();
  } else if (typeof data == 'string') {
    // Heuristic: a newline means it's CSV data. Otherwise it's an URL.
    var line_delimiter = Dygraph.detectLineDelimiter(data);
    if (line_delimiter) {
      this.loadedEvent_(data);
    } else {
      var req = new XMLHttpRequest();
      var caller = this;
      req.onreadystatechange = function () {
        if (req.readyState == 4) {
          if (req.status === 200 ||  // Normal http
              req.status === 0) {    // Chrome w/ --allow-file-access-from-files
            caller.loadedEvent_(req.responseText);
          }
        }
      };

      req.open("GET", data, true);
      req.send(null);
    }
  } else {
    this.error("Unknown data format: " + (typeof data));
  }
};

/**
 * Changes various properties of the graph. These can include:
 * <ul>
 * <li>file: changes the source data for the graph</li>
 * <li>errorBars: changes whether the data contains stddev</li>
 * </ul>
 *
 * There's a huge variety of options that can be passed to this method. For a
 * full list, see http://dygraphs.com/options.html.
 *
 * @param {Object} attrs The new properties and values
 * @param {Boolean} [block_redraw] Usually the chart is redrawn after every
 * call to updateOptions(). If you know better, you can pass true to explicitly
 * block the redraw. This can be useful for chaining updateOptions() calls,
 * avoiding the occasional infinite loop and preventing redraws when it's not
 * necessary (e.g. when updating a callback).
 */
Dygraph.prototype.updateOptions = function(input_attrs, block_redraw) {
  if (typeof(block_redraw) == 'undefined') block_redraw = false;

  // mapLegacyOptions_ drops the "file" parameter as a convenience to us.
  var file = input_attrs.file;
  var attrs = Dygraph.mapLegacyOptions_(input_attrs);

  // TODO(danvk): this is a mess. Move these options into attr_.
  if ('rollPeriod' in attrs) {
    this.rollPeriod_ = attrs.rollPeriod;
  }
  if ('dateWindow' in attrs) {
    this.dateWindow_ = attrs.dateWindow;
    if (!('isZoomedIgnoreProgrammaticZoom' in attrs)) {
      this.zoomed_x_ = (attrs.dateWindow !== null);
    }
  }
  if ('valueRange' in attrs && !('isZoomedIgnoreProgrammaticZoom' in attrs)) {
    this.zoomed_y_ = (attrs.valueRange !== null);
  }

  // TODO(danvk): validate per-series options.
  // Supported:
  // strokeWidth
  // pointSize
  // drawPoints
  // highlightCircleSize

  // Check if this set options will require new points.
  var requiresNewPoints = Dygraph.isPixelChangingOptionList(this.attr_("labels"), attrs);

  Dygraph.updateDeep(this.user_attrs_, attrs);

  if (file) {
    this.file_ = file;
    if (!block_redraw) this.start_();
  } else {
    if (!block_redraw) {
      if (requiresNewPoints) {
        this.predraw_();
      } else {
        this.renderGraph_(false);
      }
    }
  }
};

/**
 * Returns a copy of the options with deprecated names converted into current
 * names. Also drops the (potentially-large) 'file' attribute. If the caller is
 * interested in that, they should save a copy before calling this.
 * @private
 */
Dygraph.mapLegacyOptions_ = function(attrs) {
  var my_attrs = {};
  for (var k in attrs) {
    if (k == 'file') continue;
    if (attrs.hasOwnProperty(k)) my_attrs[k] = attrs[k];
  }

  var set = function(axis, opt, value) {
    if (!my_attrs.axes) my_attrs.axes = {};
    if (!my_attrs.axes[axis]) my_attrs.axes[axis] = {};
    my_attrs.axes[axis][opt] = value;
  };
  var map = function(opt, axis, new_opt) {
    if (typeof(attrs[opt]) != 'undefined') {
      set(axis, new_opt, attrs[opt]);
      delete my_attrs[opt];
    }
  };

  // This maps, e.g., xValueFormater -> axes: { x: { valueFormatter: ... } }
  map('xValueFormatter', 'x', 'valueFormatter');
  map('pixelsPerXLabel', 'x', 'pixelsPerLabel');
  map('xAxisLabelFormatter', 'x', 'axisLabelFormatter');
  map('xTicker', 'x', 'ticker');
  map('yValueFormatter', 'y', 'valueFormatter');
  map('pixelsPerYLabel', 'y', 'pixelsPerLabel');
  map('yAxisLabelFormatter', 'y', 'axisLabelFormatter');
  map('yTicker', 'y', 'ticker');
  return my_attrs;
};

/**
 * Resizes the dygraph. If no parameters are specified, resizes to fill the
 * containing div (which has presumably changed size since the dygraph was
 * instantiated. If the width/height are specified, the div will be resized.
 *
 * This is far more efficient than destroying and re-instantiating a
 * Dygraph, since it doesn't have to reparse the underlying data.
 *
 * @param {Number} [width] Width (in pixels)
 * @param {Number} [height] Height (in pixels)
 */
Dygraph.prototype.resize = function(width, height) {
  if (this.resize_lock) {
    return;
  }
  this.resize_lock = true;

  if ((width === null) != (height === null)) {
    this.warn("Dygraph.resize() should be called with zero parameters or " +
              "two non-NULL parameters. Pretending it was zero.");
    width = height = null;
  }

  var old_width = this.width_;
  var old_height = this.height_;

  if (width) {
    this.maindiv_.style.width = width + "px";
    this.maindiv_.style.height = height + "px";
    this.width_ = width;
    this.height_ = height;
  } else {
    this.width_ = this.maindiv_.clientWidth;
    this.height_ = this.maindiv_.clientHeight;
  }

  if (old_width != this.width_ || old_height != this.height_) {
    // TODO(danvk): there should be a clear() method.
    this.maindiv_.innerHTML = "";
    this.roller_ = null;
    this.attrs_.labelsDiv = null;
    this.createInterface_();
    if (this.annotations_.length) {
      // createInterface_ reset the layout, so we need to do this.
      this.layout_.setAnnotations(this.annotations_);
    }
    this.predraw_();
  }

  this.resize_lock = false;
};

/**
 * Adjusts the number of points in the rolling average. Updates the graph to
 * reflect the new averaging period.
 * @param {Number} length Number of points over which to average the data.
 */
Dygraph.prototype.adjustRoll = function(length) {
  this.rollPeriod_ = length;
  this.predraw_();
};

/**
 * Returns a boolean array of visibility statuses.
 */
Dygraph.prototype.visibility = function() {
  // Do lazy-initialization, so that this happens after we know the number of
  // data series.
  if (!this.attr_("visibility")) {
    this.attrs_.visibility = [];
  }
  // TODO(danvk): it looks like this could go into an infinite loop w/ user_attrs.
  while (this.attr_("visibility").length < this.numColumns() - 1) {
    this.attrs_.visibility.push(true);
  }
  return this.attr_("visibility");
};

/**
 * Changes the visiblity of a series.
 */
Dygraph.prototype.setVisibility = function(num, value) {
  var x = this.visibility();
  if (num < 0 || num >= x.length) {
    this.warn("invalid series number in setVisibility: " + num);
  } else {
    x[num] = value;
    this.predraw_();
  }
};

/**
 * How large of an area will the dygraph render itself in?
 * This is used for testing.
 * @return A {width: w, height: h} object.
 * @private
 */
Dygraph.prototype.size = function() {
  return { width: this.width_, height: this.height_ };
};

/**
 * Update the list of annotations and redraw the chart.
 * See dygraphs.com/annotations.html for more info on how to use annotations.
 * @param ann {Array} An array of annotation objects.
 * @param suppressDraw {Boolean} Set to "true" to block chart redraw (optional).
 */
Dygraph.prototype.setAnnotations = function(ann, suppressDraw) {
  // Only add the annotation CSS rule once we know it will be used.
  Dygraph.addAnnotationRule();
  this.annotations_ = ann;
  this.layout_.setAnnotations(this.annotations_);
  if (!suppressDraw) {
    this.predraw_();
  }
};

/**
 * Return the list of annotations.
 */
Dygraph.prototype.annotations = function() {
  return this.annotations_;
};

/**
 * Get the list of label names for this graph. The first column is the
 * x-axis, so the data series names start at index 1.
 */
Dygraph.prototype.getLabels = function() {
  return this.attr_("labels").slice();
};

/**
 * Get the index of a series (column) given its name. The first column is the
 * x-axis, so the data series start with index 1.
 */
Dygraph.prototype.indexFromSetName = function(name) {
  return this.setIndexByName_[name];
};

/**
 * Get the internal dataset index given its name. These are numbered starting from 0,
 * and only count visible sets.
 * @private
 */
Dygraph.prototype.datasetIndexFromSetName_ = function(name) {
  return this.datasetIndex_[this.indexFromSetName(name)];
};

/**
 * @private
 * Adds a default style for the annotation CSS classes to the document. This is
 * only executed when annotations are actually used. It is designed to only be
 * called once -- all calls after the first will return immediately.
 */
Dygraph.addAnnotationRule = function() {
  // TODO(danvk): move this function into plugins/annotations.js?
  if (Dygraph.addedAnnotationCSS) return;

  var rule = "border: 1px solid black; " +
             "background-color: white; " +
             "text-align: center;";

  var styleSheetElement = document.createElement("style");
  styleSheetElement.type = "text/css";
  document.getElementsByTagName("head")[0].appendChild(styleSheetElement);

  // Find the first style sheet that we can access.
  // We may not add a rule to a style sheet from another domain for security
  // reasons. This sometimes comes up when using gviz, since the Google gviz JS
  // adds its own style sheets from google.com.
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].disabled) continue;
    var mysheet = document.styleSheets[i];
    try {
      if (mysheet.insertRule) {  // Firefox
        var idx = mysheet.cssRules ? mysheet.cssRules.length : 0;
        mysheet.insertRule(".dygraphDefaultAnnotation { " + rule + " }", idx);
      } else if (mysheet.addRule) {  // IE
        mysheet.addRule(".dygraphDefaultAnnotation", rule);
      }
      Dygraph.addedAnnotationCSS = true;
      return;
    } catch(err) {
      // Was likely a security exception.
    }
  }

  this.warn("Unable to add default annotation CSS rule; display may be off.");
};

// Older pages may still use this name.
var DateGraph = Dygraph;
