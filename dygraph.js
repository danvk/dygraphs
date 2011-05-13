// Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
// All Rights Reserved.

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
Dygraph = function(div, data, opts) {
  if (arguments.length > 0) {
    if (arguments.length == 4) {
      // Old versions of dygraphs took in the series labels as a constructor
      // parameter. This doesn't make sense anymore, but it's easy to continue
      // to support this usage.
      this.warn("Using deprecated four-argument dygraph constructor");
      this.__old_init__(div, data, arguments[2], arguments[3]);
    } else {
      this.__init__(div, data, opts);
    }
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

Dygraph.LOG_SCALE = 10;
Dygraph.LN_TEN = Math.log(Dygraph.LOG_SCALE);
/** @private */
Dygraph.log10 = function(x) {
  return Math.log(x) / Dygraph.LN_TEN;
}

// Default attribute values.
Dygraph.DEFAULT_ATTRS = {
  highlightCircleSize: 3,
  pixelsPerXLabel: 60,
  pixelsPerYLabel: 30,

  labelsDivWidth: 250,
  labelsDivStyles: {
    // TODO(danvk): move defaults from createStatusMessage_ here.
  },
  labelsSeparateLines: false,
  labelsShowZeroValues: true,
  labelsKMB: false,
  labelsKMG2: false,
  showLabelsOnHighlight: true,

  yValueFormatter: function(a,b) { return Dygraph.numberFormatter(a,b); },
  digitsAfterDecimal: 2,
  maxNumberWidth: 6,
  sigFigs: null,

  strokeWidth: 1.0,

  axisTickSize: 3,
  axisLabelFontSize: 14,
  xAxisLabelWidth: 50,
  yAxisLabelWidth: 50,
  xAxisLabelFormatter: Dygraph.dateAxisFormatter,
  rightGap: 5,

  showRoller: false,
  xValueFormatter: Dygraph.dateString_,
  xValueParser: Dygraph.dateParser,
  xTicker: Dygraph.dateTicker,

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

  interactionModel: null  // will be set to Dygraph.defaultInteractionModel.
};

// Various logging levels.
Dygraph.DEBUG = 1;
Dygraph.INFO = 2;
Dygraph.WARNING = 3;
Dygraph.ERROR = 3;

// Directions for panning and zooming. Use bit operations when combined
// values are possible.
Dygraph.HORIZONTAL = 1;
Dygraph.VERTICAL = 2;

// Used for initializing annotation CSS rules only once.
Dygraph.addedAnnotationCSS = false;

/**
 * @private
 * Return the 2d context for a dygraph canvas.
 *
 * This method is only exposed for the sake of replacing the function in
 * automated tests, e.g.
 *
 * var oldFunc = Dygraph.getContext();
 * Dygraph.getContext = function(canvas) {
 *   var realContext = oldFunc(canvas);
 *   return new Proxy(realContext);
 * };
 */
Dygraph.getContext = function(canvas) {
  return canvas.getContext("2d");
};

Dygraph.prototype.__old_init__ = function(div, file, labels, attrs) {
  // Labels is no longer a constructor parameter, since it's typically set
  // directly from the data source. It also conains a name for the x-axis,
  // which the previous constructor form did not.
  if (labels != null) {
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
    setTimeout(function() { self.__init__(div, file, attrs) }, 100);
  }

  // Support two-argument constructor
  if (attrs == null) { attrs = {}; }

  // Copy the important bits into the object
  // TODO(danvk): most of these should just stay in the attrs_ dictionary.
  this.maindiv_ = div;
  this.file_ = file;
  this.rollPeriod_ = attrs.rollPeriod || Dygraph.DEFAULT_ROLL_PERIOD;
  this.previousVerticalX_ = -1;
  this.fractions_ = attrs.fractions || false;
  this.dateWindow_ = attrs.dateWindow || null;

  this.wilsonInterval_ = attrs.wilsonInterval || true;
  this.is_initial_draw_ = true;
  this.annotations_ = [];

  // Zoomed indicators - These indicate when the graph has been zoomed and on what axis.
  this.zoomed_x_ = false;
  this.zoomed_y_ = false;

  // Clear the div. This ensure that, if multiple dygraphs are passed the same
  // div, then only one will be drawn.
  div.innerHTML = "";

  // If the div isn't already sized then inherit from our attrs or
  // give it a default size.
  if (div.style.width == '') {
    div.style.width = (attrs.width || Dygraph.DEFAULT_WIDTH) + "px";
  }
  if (div.style.height == '') {
    div.style.height = (attrs.height || Dygraph.DEFAULT_HEIGHT) + "px";
  }
  this.width_ = parseInt(div.style.width, 10);
  this.height_ = parseInt(div.style.height, 10);
  // The div might have been specified as percent of the current window size,
  // convert that to an appropriate number of pixels.
  if (div.style.width.indexOf("%") == div.style.width.length - 1) {
    this.width_ = div.offsetWidth;
  }
  if (div.style.height.indexOf("%") == div.style.height.length - 1) {
    this.height_ = div.offsetHeight;
  }

  if (this.width_ == 0) {
    this.error("dygraph has zero width. Please specify a width in pixels.");
  }
  if (this.height_ == 0) {
    this.error("dygraph has zero height. Please specify a height in pixels.");
  }

  // TODO(danvk): set fillGraph to be part of attrs_ here, not user_attrs_.
  if (attrs['stackedGraph']) {
    attrs['fillGraph'] = true;
    // TODO(nikhilk): Add any other stackedGraph checks here.
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

  this.attrs_ = {};
  Dygraph.update(this.attrs_, Dygraph.DEFAULT_ATTRS);

  this.boundaryIds_ = [];

  // Create the containing DIV and other interactive elements
  this.createInterface_();

  this.start_();
};

/**
 * Returns the zoomed status of the chart for one or both axes.
 *
 * Axis is an optional parameter. Can be set to 'x' or 'y'.
 *
 * The zoomed status for an axis is set whenever a user zooms using the mouse
 * or when the dateWindow or valueRange are updated (unless the isZoomedIgnoreProgrammaticZoom
 * option is also specified).
 */
Dygraph.prototype.isZoomed = function(axis) {
  if (axis == null) return this.zoomed_x_ || this.zoomed_y_;
  if (axis == 'x') return this.zoomed_x_;
  if (axis == 'y') return this.zoomed_y_;
  throw "axis parameter to Dygraph.isZoomed must be missing, 'x' or 'y'.";
};

/**
 * Returns information about the Dygraph object, including its containing ID.
 */
Dygraph.prototype.toString = function() {
  var maindiv = this.maindiv_;
  var id = (maindiv && maindiv.id) ? maindiv.id : maindiv
  return "[Dygraph " + id + "]";
}

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
  if (seriesName &&
      typeof(this.user_attrs_[seriesName]) != 'undefined' &&
      this.user_attrs_[seriesName] != null &&
      typeof(this.user_attrs_[seriesName][name]) != 'undefined') {
    return this.user_attrs_[seriesName][name];
  } else if (typeof(this.user_attrs_[name]) != 'undefined') {
    return this.user_attrs_[name];
  } else if (typeof(this.attrs_[name]) != 'undefined') {
    return this.attrs_[name];
  } else {
    return null;
  }
};

// TODO(danvk): any way I can get the line numbers to be this.warn call?
/**
 * @private
 * Log an error on the JS console at the given severity.
 * @param { Integer } severity One of Dygraph.{DEBUG,INFO,WARNING,ERROR}
 * @param { String } The message to log.
 */
Dygraph.prototype.log = function(severity, message) {
  if (typeof(console) != 'undefined') {
    switch (severity) {
      case Dygraph.DEBUG:
        console.debug('dygraphs: ' + message);
        break;
      case Dygraph.INFO:
        console.info('dygraphs: ' + message);
        break;
      case Dygraph.WARNING:
        console.warn('dygraphs: ' + message);
        break;
      case Dygraph.ERROR:
        console.error('dygraphs: ' + message);
        break;
    }
  }
};

/** @private */
Dygraph.prototype.info = function(message) {
  this.log(Dygraph.INFO, message);
};

/** @private */
Dygraph.prototype.warn = function(message) {
  this.log(Dygraph.WARNING, message);
};

/** @private */
Dygraph.prototype.error = function(message) {
  this.log(Dygraph.ERROR, message);
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
  if (idx < 0 || idx >= this.axes_.length) return null;
  return [ this.axes_[idx].computedValueRange[0],
           this.axes_[idx].computedValueRange[1] ];
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
  if (x == null) {
    return null;
  };

  var area = this.plotter_.area;
  var xRange = this.xAxisRange();
  return area.x + (x - xRange[0]) / (xRange[1] - xRange[0]) * area.w;
}

/**
 * Convert from data x coordinates to canvas/div Y coordinate and optional
 * axis. Uses the first axis by default.
 *
 * returns a single value or null if y is null.
 */
Dygraph.prototype.toDomYCoord = function(y, axis) {
  var pct = this.toPercentYCoord(y, axis);

  if (pct == null) {
    return null;
  }
  var area = this.plotter_.area;
  return area.y + pct * area.h;
}

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
  if (x == null) {
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
  if (y == null) {
    return null;
  }

  var area = this.plotter_.area;
  var yRange = this.yAxisRange(axis);

  if (typeof(axis) == "undefined") axis = 0;
  if (!this.axes_[axis].logscale) {
    return yRange[0] + (area.y + area.h - y) / area.h * (yRange[1] - yRange[0]);
  } else {
    // Computing the inverse of toDomCoord.
    var pct = (y - area.y) / area.h

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
  if (y == null) {
    return null;
  }
  if (typeof(axis) == "undefined") axis = 0;

  var area = this.plotter_.area;
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
}

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
  if (x == null) {
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
  return this.rawData_[0].length;
};

/**
 * Returns the number of rows (excluding any header/label row).
 * @return { Integer } The number of rows, less any header.
 */
Dygraph.prototype.numRows = function() {
  return this.rawData_.length;
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
 * @private
 * Add an event handler. This smooths a difference between IE and the rest of
 * the world.
 * @param { DOM element } el The element to add the event to.
 * @param { String } evt The name of the event, e.g. 'click' or 'mousemove'.
 * @param { Function } fn The function to call on the event. The function takes
 * one parameter: the event object.
 */
Dygraph.addEvent = function(el, evt, fn) {
  var normed_fn = function(e) {
    if (!e) var e = window.event;
    fn(e);
  };
  if (window.addEventListener) {  // Mozilla, Netscape, Firefox
    el.addEventListener(evt, normed_fn, false);
  } else {  // IE
    el.attachEvent('on' + evt, normed_fn);
  }
};


/**
 * @private
 * Cancels further processing of an event. This is useful to prevent default
 * browser actions, e.g. highlighting text on a double-click.
 * Based on the article at
 * http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
 * @param { Event } e The event whose normal behavior should be canceled.
 */
Dygraph.cancelEvent = function(e) {
  e = e ? e : window.event;
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.cancelBubble = true;
  e.cancel = true;
  e.returnValue = false;
  return false;
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

  // The interactive parts of the graph are drawn on top of the chart.
  this.graphDiv.appendChild(this.hidden_);
  this.graphDiv.appendChild(this.canvas_);
  this.mouseEventElement_ = this.canvas_;

  var dygraph = this;
  Dygraph.addEvent(this.mouseEventElement_, 'mousemove', function(e) {
    dygraph.mouseMove_(e);
  });
  Dygraph.addEvent(this.mouseEventElement_, 'mouseout', function(e) {
    dygraph.mouseOut_(e);
  });

  // Create the grapher
  this.layout_ = new DygraphLayout(this);

  this.createStatusMessage_();
  this.createDragInterface_();
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
  removeRecursive(this.maindiv_);

  var nullOut = function(obj) {
    for (var n in obj) {
      if (typeof(obj[n]) === 'object') {
        obj[n] = null;
      }
    }
  };

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
 * Convert hsv values to an rgb(r,g,b) string. Taken from MochiKit.Color. This
 * is used to generate default series colors which are evenly spaced on the
 * color wheel.
 * @param { Number } hue Range is 0.0-1.0.
 * @param { Number } saturation Range is 0.0-1.0.
 * @param { Number } value Range is 0.0-1.0.
 * @return { String } "rgb(r,g,b)" where r, g and b range from 0-255.
 * @private
 */
Dygraph.hsvToRGB = function (hue, saturation, value) {
  var red;
  var green;
  var blue;
  if (saturation === 0) {
    red = value;
    green = value;
    blue = value;
  } else {
    var i = Math.floor(hue * 6);
    var f = (hue * 6) - i;
    var p = value * (1 - saturation);
    var q = value * (1 - (saturation * f));
    var t = value * (1 - (saturation * (1 - f)));
    switch (i) {
      case 1: red = q; green = value; blue = p; break;
      case 2: red = p; green = value; blue = t; break;
      case 3: red = p; green = q; blue = value; break;
      case 4: red = t; green = p; blue = value; break;
      case 5: red = value; green = p; blue = q; break;
      case 6: // fall through
      case 0: red = value; green = t; blue = p; break;
    }
  }
  red = Math.floor(255 * red + 0.5);
  green = Math.floor(255 * green + 0.5);
  blue = Math.floor(255 * blue + 0.5);
  return 'rgb(' + red + ',' + green + ',' + blue + ')';
};


/**
 * Generate a set of distinct colors for the data series. This is done with a
 * color wheel. Saturation/Value are customizable, and the hue is
 * equally-spaced around the color wheel. If a custom set of colors is
 * specified, that is used instead.
 * @private
 */
Dygraph.prototype.setColors_ = function() {
  var num = this.attr_("labels").length - 1;
  this.colors_ = [];
  var colors = this.attr_('colors');
  if (!colors) {
    var sat = this.attr_('colorSaturation') || 1.0;
    var val = this.attr_('colorValue') || 0.5;
    var half = Math.ceil(num / 2);
    for (var i = 1; i <= num; i++) {
      if (!this.visibility()[i-1]) continue;
      // alternate colors for high contrast.
      var idx = i % 2 ? Math.ceil(i / 2) : (half + i / 2);
      var hue = (1.0 * idx/ (1 + num));
      this.colors_.push(Dygraph.hsvToRGB(hue, sat, val));
    }
  } else {
    for (var i = 0; i < num; i++) {
      if (!this.visibility()[i]) continue;
      var colorStr = colors[i % colors.length];
      this.colors_.push(colorStr);
    }
  }

  this.plotter_.setColors(this.colors_);
};

/**
 * Return the list of colors. This is either the list of colors passed in the
 * attributes or the autogenerated list of rgb(r,g,b) strings.
 * @return {Array<string>} The list of colors.
 */
Dygraph.prototype.getColors = function() {
  return this.colors_;
};

// The following functions are from quirksmode.org with a modification for Safari from
// http://blog.firetree.net/2005/07/04/javascript-find-position/
// http://www.quirksmode.org/js/findpos.html

/** @private */
Dygraph.findPosX = function(obj) {
  var curleft = 0;
  if(obj.offsetParent)
    while(1)
    {
      curleft += obj.offsetLeft;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  else if(obj.x)
    curleft += obj.x;
  return curleft;
};


/** @private */
Dygraph.findPosY = function(obj) {
  var curtop = 0;
  if(obj.offsetParent)
    while(1)
    {
      curtop += obj.offsetTop;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  else if(obj.y)
    curtop += obj.y;
  return curtop;
};


/**
 * Create the div that contains information on the selected point(s)
 * This goes in the top right of the canvas, unless an external div has already
 * been specified.
 * @private
 */
Dygraph.prototype.createStatusMessage_ = function() {
  var userLabelsDiv = this.user_attrs_["labelsDiv"];
  if (userLabelsDiv && null != userLabelsDiv
    && (typeof(userLabelsDiv) == "string" || userLabelsDiv instanceof String)) {
    this.user_attrs_["labelsDiv"] = document.getElementById(userLabelsDiv);
  }
  if (!this.attr_("labelsDiv")) {
    var divWidth = this.attr_('labelsDivWidth');
    var messagestyle = {
      "position": "absolute",
      "fontSize": "14px",
      "zIndex": 10,
      "width": divWidth + "px",
      "top": "0px",
      "left": (this.width_ - divWidth - 2) + "px",
      "background": "white",
      "textAlign": "left",
      "overflow": "hidden"};
    Dygraph.update(messagestyle, this.attr_('labelsDivStyles'));
    var div = document.createElement("div");
    for (var name in messagestyle) {
      if (messagestyle.hasOwnProperty(name)) {
        div.style[name] = messagestyle[name];
      }
    }
    this.graphDiv.appendChild(div);
    this.attrs_.labelsDiv = div;
  }
};

/**
 * Position the labels div so that:
 * - its right edge is flush with the right edge of the charting area
 * - its top edge is flush with the top edge of the charting area
 * @private
 */
Dygraph.prototype.positionLabelsDiv_ = function() {
  // Don't touch a user-specified labelsDiv.
  if (this.user_attrs_.hasOwnProperty("labelsDiv")) return;

  var area = this.plotter_.area;
  var div = this.attr_("labelsDiv");
  div.style.left = area.x + area.w - this.attr_("labelsDivWidth") - 1 + "px";
  div.style.top = area.y + "px";
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
 * Returns the x-coordinate of the event in a coordinate system where the
 * top-left corner of the page (not the window) is (0,0).
 * Taken from MochiKit.Signal
 */
Dygraph.pageX = function(e) {
  if (e.pageX) {
    return (!e.pageX || e.pageX < 0) ? 0 : e.pageX;
  } else {
    var de = document;
    var b = document.body;
    return e.clientX +
        (de.scrollLeft || b.scrollLeft) -
        (de.clientLeft || 0);
  }
};

/**
 * @private
 * Returns the y-coordinate of the event in a coordinate system where the
 * top-left corner of the page (not the window) is (0,0).
 * Taken from MochiKit.Signal
 */
Dygraph.pageY = function(e) {
  if (e.pageY) {
    return (!e.pageY || e.pageY < 0) ? 0 : e.pageY;
  } else {
    var de = document;
    var b = document.body;
    return e.clientY +
        (de.scrollTop || b.scrollTop) -
        (de.clientTop || 0);
  }
};

/**
 * @private
 * Converts page the x-coordinate of the event to pixel x-coordinates on the
 * canvas (i.e. DOM Coords).
 */
Dygraph.prototype.dragGetX_ = function(e, context) {
  return Dygraph.pageX(e) - context.px
};

/**
 * @private
 * Converts page the y-coordinate of the event to pixel y-coordinates on the
 * canvas (i.e. DOM Coords).
 */
Dygraph.prototype.dragGetY_ = function(e, context) {
  return Dygraph.pageY(e) - context.py
};

/**
 * A collection of functions to facilitate build custom interaction models.
 * @class
 */
Dygraph.Interaction = {};

/**
 * Called in response to an interaction model operation that
 * should start the default panning behavior.
 *
 * It's used in the default callback for "mousedown" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the startPan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.startPan = function(event, g, context) {
  context.isPanning = true;
  var xRange = g.xAxisRange();
  context.dateRange = xRange[1] - xRange[0];
  context.initialLeftmostDate = xRange[0];
  context.xUnitsPerPixel = context.dateRange / (g.plotter_.area.w - 1);

  if (g.attr_("panEdgeFraction")) {
    var maxXPixelsToDraw = g.width_ * g.attr_("panEdgeFraction");
    var xExtremes = g.xAxisExtremes(); // I REALLY WANT TO CALL THIS xTremes!

    var boundedLeftX = g.toDomXCoord(xExtremes[0]) - maxXPixelsToDraw;
    var boundedRightX = g.toDomXCoord(xExtremes[1]) + maxXPixelsToDraw;

    var boundedLeftDate = g.toDataXCoord(boundedLeftX);
    var boundedRightDate = g.toDataXCoord(boundedRightX);
    context.boundedDates = [boundedLeftDate, boundedRightDate];

    var boundedValues = [];
    var maxYPixelsToDraw = g.height_ * g.attr_("panEdgeFraction");

    for (var i = 0; i < g.axes_.length; i++) {
      var axis = g.axes_[i];
      var yExtremes = axis.extremeRange;

      var boundedTopY = g.toDomYCoord(yExtremes[0], i) + maxYPixelsToDraw;
      var boundedBottomY = g.toDomYCoord(yExtremes[1], i) - maxYPixelsToDraw;

      var boundedTopValue = g.toDataYCoord(boundedTopY);
      var boundedBottomValue = g.toDataYCoord(boundedBottomY);

      boundedValues[i] = [boundedTopValue, boundedBottomValue];
    }
    context.boundedValues = boundedValues;
  }

  // Record the range of each y-axis at the start of the drag.
  // If any axis has a valueRange or valueWindow, then we want a 2D pan.
  context.is2DPan = false;
  for (var i = 0; i < g.axes_.length; i++) {
    var axis = g.axes_[i];
    var yRange = g.yAxisRange(i);
    // TODO(konigsberg): These values should be in |context|.
    // In log scale, initialTopValue, dragValueRange and unitsPerPixel are log scale.
    if (axis.logscale) {
      axis.initialTopValue = Dygraph.log10(yRange[1]);
      axis.dragValueRange = Dygraph.log10(yRange[1]) - Dygraph.log10(yRange[0]);
    } else {
      axis.initialTopValue = yRange[1];
      axis.dragValueRange = yRange[1] - yRange[0];
    }
    axis.unitsPerPixel = axis.dragValueRange / (g.plotter_.area.h - 1);

    // While calculating axes, set 2dpan.
    if (axis.valueWindow || axis.valueRange) context.is2DPan = true;
  }
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that pans the view.
 *
 * It's used in the default callback for "mousemove" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the movePan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.movePan = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var minDate = context.initialLeftmostDate -
    (context.dragEndX - context.dragStartX) * context.xUnitsPerPixel;
  if (context.boundedDates) {
    minDate = Math.max(minDate, context.boundedDates[0]);
  }
  var maxDate = minDate + context.dateRange;
  if (context.boundedDates) {
    if (maxDate > context.boundedDates[1]) {
      // Adjust minDate, and recompute maxDate.
      minDate = minDate - (maxDate - context.boundedDates[1]);
      maxDate = minDate + context.dateRange;
    }
  }

  g.dateWindow_ = [minDate, maxDate];

  // y-axis scaling is automatic unless this is a full 2D pan.
  if (context.is2DPan) {
    // Adjust each axis appropriately.
    for (var i = 0; i < g.axes_.length; i++) {
      var axis = g.axes_[i];

      var pixelsDragged = context.dragEndY - context.dragStartY;
      var unitsDragged = pixelsDragged * axis.unitsPerPixel;
 
      var boundedValue = context.boundedValues ? context.boundedValues[i] : null;

      // In log scale, maxValue and minValue are the logs of those values.
      var maxValue = axis.initialTopValue + unitsDragged;
      if (boundedValue) {
        maxValue = Math.min(maxValue, boundedValue[1]);
      }
      var minValue = maxValue - axis.dragValueRange;
      if (boundedValue) {
        if (minValue < boundedValue[0]) {
          // Adjust maxValue, and recompute minValue.
          maxValue = maxValue - (minValue - boundedValue[0]);
          minValue = maxValue - axis.dragValueRange;
        }
      }
      if (axis.logscale) {
        axis.valueWindow = [ Math.pow(Dygraph.LOG_SCALE, minValue),
                             Math.pow(Dygraph.LOG_SCALE, maxValue) ];
      } else {
        axis.valueWindow = [ minValue, maxValue ];
      }
    }
  }

  g.drawGraph_();
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that ends panning.
 *
 * It's used in the default callback for "mouseup" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the startZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.endPan = function(event, g, context) {
  // TODO(konigsberg): Clear the context data from the axis.
  // TODO(konigsberg): mouseup should just delete the
  // context object, and mousedown should create a new one.
  context.isPanning = false;
  context.is2DPan = false;
  context.initialLeftmostDate = null;
  context.dateRange = null;
  context.valueRange = null;
  context.boundedDates = null;
  context.boundedValues = null;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that starts zooming.
 *
 * It's used in the default callback for "mousedown" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the startZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.startZoom = function(event, g, context) {
  context.isZooming = true;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that defines zoom boundaries.
 *
 * It's used in the default callback for "mousemove" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the moveZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.moveZoom = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var xDelta = Math.abs(context.dragStartX - context.dragEndX);
  var yDelta = Math.abs(context.dragStartY - context.dragEndY);

  // drag direction threshold for y axis is twice as large as x axis
  context.dragDirection = (xDelta < yDelta / 2) ? Dygraph.VERTICAL : Dygraph.HORIZONTAL;

  g.drawZoomRect_(
      context.dragDirection,
      context.dragStartX,
      context.dragEndX,
      context.dragStartY,
      context.dragEndY,
      context.prevDragDirection,
      context.prevEndX,
      context.prevEndY);

  context.prevEndX = context.dragEndX;
  context.prevEndY = context.dragEndY;
  context.prevDragDirection = context.dragDirection;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that performs a zoom based on previously defined
 * bounds..
 *
 * It's used in the default callback for "mouseup" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the endZoom call.
 * @param { Dygraph} g The dygraph on which to end the zoom.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.endZoom = function(event, g, context) {
  // TODO(konigsberg): Refactor or rename this fn -- it deals with clicks, too.
  context.isZooming = false;
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);
  var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
  var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

  if (regionWidth < 2 && regionHeight < 2 &&
      g.lastx_ != undefined && g.lastx_ != -1) {
    // TODO(danvk): pass along more info about the points, e.g. 'x'
    if (g.attr_('clickCallback') != null) {
      g.attr_('clickCallback')(event, g.lastx_, g.selPoints_);
    }
    if (g.attr_('pointClickCallback')) {
      // check if the click was on a particular point.
      var closestIdx = -1;
      var closestDistance = 0;
      for (var i = 0; i < g.selPoints_.length; i++) {
        var p = g.selPoints_[i];
        var distance = Math.pow(p.canvasx - context.dragEndX, 2) +
                       Math.pow(p.canvasy - context.dragEndY, 2);
        if (closestIdx == -1 || distance < closestDistance) {
          closestDistance = distance;
          closestIdx = i;
        }
      }

      // Allow any click within two pixels of the dot.
      var radius = g.attr_('highlightCircleSize') + 2;
      if (closestDistance <= 5 * 5) {
        g.attr_('pointClickCallback')(event, g.selPoints_[closestIdx]);
      }
    }
  }

  if (regionWidth >= 10 && context.dragDirection == Dygraph.HORIZONTAL) {
    g.doZoomX_(Math.min(context.dragStartX, context.dragEndX),
               Math.max(context.dragStartX, context.dragEndX));
  } else if (regionHeight >= 10 && context.dragDirection == Dygraph.VERTICAL) {
    g.doZoomY_(Math.min(context.dragStartY, context.dragEndY),
               Math.max(context.dragStartY, context.dragEndY));
  } else {
    g.canvas_ctx_.clearRect(0, 0, g.canvas_.width, g.canvas_.height);
  }
  context.dragStartX = null;
  context.dragStartY = null;
};

/**
 * Default interation model for dygraphs. You can refer to specific elements of
 * this when constructing your own interaction model, e.g.:
 * g.updateOptions( {
 *   interactionModel: {
 *     mousedown: Dygraph.defaultInteractionModel.mousedown
 *   }
 * } );
 */
Dygraph.Interaction.defaultModel = {
  // Track the beginning of drag events
  mousedown: function(event, g, context) {
    context.initializeMouseDown(event, g, context);

    if (event.altKey || event.shiftKey) {
      Dygraph.startPan(event, g, context);
    } else {
      Dygraph.startZoom(event, g, context);
    }
  },

  // Draw zoom rectangles when the mouse is down and the user moves around
  mousemove: function(event, g, context) {
    if (context.isZooming) {
      Dygraph.moveZoom(event, g, context);
    } else if (context.isPanning) {
      Dygraph.movePan(event, g, context);
    }
  },

  mouseup: function(event, g, context) {
    if (context.isZooming) {
      Dygraph.endZoom(event, g, context);
    } else if (context.isPanning) {
      Dygraph.endPan(event, g, context);
    }
  },

  // Temporarily cancel the dragging event when the mouse leaves the graph
  mouseout: function(event, g, context) {
    if (context.isZooming) {
      context.dragEndX = null;
      context.dragEndY = null;
    }
  },

  // Disable zooming out if panning.
  dblclick: function(event, g, context) {
    if (event.altKey || event.shiftKey) {
      return;
    }
    // TODO(konigsberg): replace g.doUnzoom()_ with something that is
    // friendlier to public use.
    g.doUnzoom_();
  }
};

Dygraph.DEFAULT_ATTRS.interactionModel = Dygraph.Interaction.defaultModel;

// old ways of accessing these methods/properties
Dygraph.defaultInteractionModel = Dygraph.Interaction.defaultModel;
Dygraph.endZoom = Dygraph.Interaction.endZoom;
Dygraph.moveZoom = Dygraph.Interaction.moveZoom;
Dygraph.startZoom = Dygraph.Interaction.startZoom;
Dygraph.endPan = Dygraph.Interaction.endPan;
Dygraph.movePan = Dygraph.Interaction.movePan;
Dygraph.startPan = Dygraph.Interaction.startPan;

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
    dragStartX: null,
    dragStartY: null,
    dragEndX: null,
    dragEndY: null,
    dragDirection: null,
    prevEndX: null,
    prevEndY: null,
    prevDragDirection: null,

    // The value on the left side of the graph when a pan operation starts.
    initialLeftmostDate: null,

    // The number of units each pixel spans. (This won't be valid for log
    // scales)
    xUnitsPerPixel: null,

    // TODO(danvk): update this comment
    // The range in second/value units that the viewport encompasses during a
    // panning operation.
    dateRange: null,

    // Utility function to convert page-wide coordinates to canvas coords
    px: 0,
    py: 0,

    // Values for use with panEdgeFraction, which limit how far outside the
    // graph's data boundaries it can be panned.
    boundedDates: null, // [minDate, maxDate]
    boundedValues: null, // [[minValue, maxValue] ...]

    initializeMouseDown: function(event, g, context) {
      // prevents mouse drags from selecting page text.
      if (event.preventDefault) {
        event.preventDefault();  // Firefox, Chrome, etc.
      } else {
        event.returnValue = false;  // IE
        event.cancelBubble = true;
      }

      context.px = Dygraph.findPosX(g.canvas_);
      context.py = Dygraph.findPosY(g.canvas_);
      context.dragStartX = g.dragGetX_(event, context);
      context.dragStartY = g.dragGetY_(event, context);
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
    Dygraph.addEvent(this.mouseEventElement_, eventName,
        bindHandler(interactionModel[eventName]));
  }

  // If the user releases the mouse button during a drag, but not over the
  // canvas, then it doesn't count as a zooming action.
  Dygraph.addEvent(document, 'mouseup', function(event) {
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
  });
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
    ctx.clearRect(Math.min(startX, prevEndX), 0,
                  Math.abs(startX - prevEndX), this.height_);
  } else if (prevDirection == Dygraph.VERTICAL){
    ctx.clearRect(0, Math.min(startY, prevEndY),
                  this.width_, Math.abs(startY - prevEndY));
  }

  // Draw a light-grey rectangle to show the new viewing area
  if (direction == Dygraph.HORIZONTAL) {
    if (endX && startX) {
      ctx.fillStyle = "rgba(128,128,128,0.33)";
      ctx.fillRect(Math.min(startX, endX), 0,
                   Math.abs(endX - startX), this.height_);
    }
  }
  if (direction == Dygraph.VERTICAL) {
    if (endY && startY) {
      ctx.fillStyle = "rgba(128,128,128,0.33)";
      ctx.fillRect(0, Math.min(startY, endY),
                   this.width_, Math.abs(endY - startY));
    }
  }
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
  // Find the earliest and latest dates contained in this canvasx range.
  // Convert the call to date ranges of the raw data.
  var minDate = this.toDataXCoord(lowX);
  var maxDate = this.toDataXCoord(highX);
  this.doZoomXDates_(minDate, maxDate);
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
  this.dateWindow_ = [minDate, maxDate];
  this.zoomed_x_ = true;
  this.drawGraph_();
  if (this.attr_("zoomCallback")) {
    this.attr_("zoomCallback")(minDate, maxDate, this.yAxisRanges());
  }
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
  // Find the highest and lowest values in pixel range for each axis.
  // Note that lowY (in pixels) corresponds to the max Value (in data coords).
  // This is because pixels increase as you go down on the screen, whereas data
  // coordinates increase as you go up the screen.
  var valueRanges = [];
  for (var i = 0; i < this.axes_.length; i++) {
    var hi = this.toDataYCoord(lowY, i);
    var low = this.toDataYCoord(highY, i);
    this.axes_[i].valueWindow = [low, hi];
    valueRanges.push([low, hi]);
  }

  this.zoomed_y_ = true;
  this.drawGraph_();
  if (this.attr_("zoomCallback")) {
    var xRange = this.xAxisRange();
    var yRange = this.yAxisRange();
    this.attr_("zoomCallback")(xRange[0], xRange[1], this.yAxisRanges());
  }
};

/**
 * Reset the zoom to the original view coordinates. This is the same as
 * double-clicking on the graph.
 *
 * @private
 */
Dygraph.prototype.doUnzoom_ = function() {
  var dirty = false;
  if (this.dateWindow_ != null) {
    dirty = true;
    this.dateWindow_ = null;
  }

  for (var i = 0; i < this.axes_.length; i++) {
    if (this.axes_[i].valueWindow != null) {
      dirty = true;
      delete this.axes_[i].valueWindow;
    }
  }

  // Clear any selection, since it's likely to be drawn in the wrong place.
  this.clearSelection();

  if (dirty) {
    // Putting the drawing operation before the callback because it resets
    // yAxisRange.
    this.zoomed_x_ = false;
    this.zoomed_y_ = false;
    this.drawGraph_();
    if (this.attr_("zoomCallback")) {
      var minDate = this.rawData_[0][0];
      var maxDate = this.rawData_[this.rawData_.length - 1][0];
      this.attr_("zoomCallback")(minDate, maxDate, this.yAxisRanges());
    }
  }
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
  if (points === undefined) return;

  var canvasx = Dygraph.pageX(event) - Dygraph.findPosX(this.mouseEventElement_);

  var lastx = -1;
  var lasty = -1;

  // Loop through all the points and find the date nearest to our current
  // location.
  var minDist = 1e+100;
  var idx = -1;
  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    if (point == null) continue;
    var dist = Math.abs(point.canvasx - canvasx);
    if (dist > minDist) continue;
    minDist = dist;
    idx = i;
  }
  if (idx >= 0) lastx = points[idx].xval;

  // Extract the points we've selected
  this.selPoints_ = [];
  var l = points.length;
  if (!this.attr_("stackedGraph")) {
    for (var i = 0; i < l; i++) {
      if (points[i].xval == lastx) {
        this.selPoints_.push(points[i]);
      }
    }
  } else {
    // Need to 'unstack' points starting from the bottom
    var cumulative_sum = 0;
    for (var i = l - 1; i >= 0; i--) {
      if (points[i].xval == lastx) {
        var p = {};  // Clone the point since we modify it
        for (var k in points[i]) {
          p[k] = points[i][k];
        }
        p.yval -= cumulative_sum;
        cumulative_sum += p.yval;
        this.selPoints_.push(p);
      }
    }
    this.selPoints_.reverse();
  }

  if (this.attr_("highlightCallback")) {
    var px = this.lastx_;
    if (px !== null && lastx != px) {
      // only fire if the selected point has changed.
      this.attr_("highlightCallback")(event, lastx, this.selPoints_, this.idxToRow_(idx));
    }
  }

  // Save last x position for callbacks.
  this.lastx_ = lastx;

  this.updateSelection_();
};

/**
 * Transforms layout_.points index into data row number.
 * @param int layout_.points index
 * @return int row number, or -1 if none could be found.
 * @private
 */
Dygraph.prototype.idxToRow_ = function(idx) {
  if (idx < 0) return -1;

  for (var i in this.layout_.datasets) {
    if (idx < this.layout_.datasets[i].length) {
      return this.boundaryIds_[0][0]+idx;
    }
    idx -= this.layout_.datasets[i].length;
  }
  return -1;
};

/**
 * @private
 * @param { Number } x The number to consider.
 * @return { Boolean } Whether the number is zero or NaN.
 */
// TODO(danvk): rename this function to something like 'isNonZeroNan'.
Dygraph.isOK = function(x) {
  return x && !isNaN(x);
};

/**
 * @private
 * Generates HTML for the legend which is displayed when hovering over the
 * chart. If no selected points are specified, a default legend is returned
 * (this may just be the empty string).
 * @param { Number } [x] The x-value of the selected points.
 * @param { [Object] } [sel_points] List of selected points for the given
 * x-value. Should have properties like 'name', 'yval' and 'canvasy'.
 */
Dygraph.prototype.generateLegendHTML_ = function(x, sel_points) {
  // If no points are selected, we display a default legend. Traditionally,
  // this has been blank. But a better default would be a conventional legend,
  // which provides essential information for a non-interactive chart.
  if (typeof(x) === 'undefined') {
    if (this.attr_('legend') != 'always') return '';

    var sepLines = this.attr_('labelsSeparateLines');
    var labels = this.attr_('labels');
    var html = '';
    for (var i = 1; i < labels.length; i++) {
      if (!this.visibility()[i - 1]) continue;
      var c = this.plotter_.colors[labels[i]];
      if (html != '') html += (sepLines ? '<br/>' : ' ');
      html += "<b><span style='color: " + c + ";'>&mdash;" + labels[i] +
        "</span></b>";
    }
    return html;
  }

  var html = this.attr_('xValueFormatter')(x) + ":";

  var fmtFunc = this.attr_('yValueFormatter');
  var showZeros = this.attr_("labelsShowZeroValues");
  var sepLines = this.attr_("labelsSeparateLines");
  for (var i = 0; i < this.selPoints_.length; i++) {
    var pt = this.selPoints_[i];
    if (pt.yval == 0 && !showZeros) continue;
    if (!Dygraph.isOK(pt.canvasy)) continue;
    if (sepLines) html += "<br/>";

    var c = this.plotter_.colors[pt.name];
    var yval = fmtFunc(pt.yval, this);
    // TODO(danvk): use a template string here and make it an attribute.
    html += " <b><span style='color: " + c + ";'>"
      + pt.name + "</span></b>:"
      + yval;
  }
  return html;
};

/**
 * @private
 * Displays information about the selected points in the legend. If there is no
 * selection, the legend will be cleared.
 * @param { Number } [x] The x-value of the selected points.
 * @param { [Object] } [sel_points] List of selected points for the given
 * x-value. Should have properties like 'name', 'yval' and 'canvasy'.
 */
Dygraph.prototype.setLegendHTML_ = function(x, sel_points) {
  var html = this.generateLegendHTML_(x, sel_points);
  var labelsDiv = this.attr_("labelsDiv");
  if (labelsDiv !== null) {
    labelsDiv.innerHTML = html;
  } else {
    if (typeof(this.shown_legend_error_) == 'undefined') {
      this.error('labelsDiv is set to something nonexistent; legend will not be shown.');
      this.shown_legend_error_ = true;
    }
  }
};

/**
 * Draw dots over the selectied points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @private
 */
Dygraph.prototype.updateSelection_ = function() {
  // Clear the previously drawn vertical, if there is one
  var ctx = this.canvas_ctx_;
  if (this.previousVerticalX_ >= 0) {
    // Determine the maximum highlight circle size.
    var maxCircleSize = 0;
    var labels = this.attr_('labels');
    for (var i = 1; i < labels.length; i++) {
      var r = this.attr_('highlightCircleSize', labels[i]);
      if (r > maxCircleSize) maxCircleSize = r;
    }
    var px = this.previousVerticalX_;
    ctx.clearRect(px - maxCircleSize - 1, 0,
                  2 * maxCircleSize + 2, this.height_);
  }

  if (this.selPoints_.length > 0) {
    // Set the status message to indicate the selected point(s)
    if (this.attr_('showLabelsOnHighlight')) {
      this.setLegendHTML_(this.lastx_, this.selPoints_);
    }

    // Draw colored circles over the center of each selected point
    var canvasx = this.selPoints_[0].canvasx;
    ctx.save();
    for (var i = 0; i < this.selPoints_.length; i++) {
      var pt = this.selPoints_[i];
      if (!Dygraph.isOK(pt.canvasy)) continue;

      var circleSize = this.attr_('highlightCircleSize', pt.name);
      ctx.beginPath();
      ctx.fillStyle = this.plotter_.colors[pt.name];
      ctx.arc(canvasx, pt.canvasy, circleSize, 0, 2 * Math.PI, false);
      ctx.fill();
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
 */
Dygraph.prototype.setSelection = function(row) {
  // Extract the points we've selected
  this.selPoints_ = [];
  var pos = 0;

  if (row !== false) {
    row = row-this.boundaryIds_[0][0];
  }

  if (row !== false && row >= 0) {
    for (var i in this.layout_.datasets) {
      if (row < this.layout_.datasets[i].length) {
        var point = this.layout_.points[pos+row];
        
        if (this.attr_("stackedGraph")) {
          point = this.layout_.unstackPointAtIndex(pos+row);
        }
        
        this.selPoints_.push(point);
      }
      pos += this.layout_.datasets[i].length;
    }
  }

  if (this.selPoints_.length) {
    this.lastx_ = this.selPoints_[0].xval;
    this.updateSelection_();
  } else {
    this.clearSelection();
  }

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

  if (this.attr_("hideOverlayOnMouseOut")) {
    this.clearSelection();
  }
};

/**
 * Clears the current selection (i.e. points that were highlighted by moving
 * the mouse over the chart).
 */
Dygraph.prototype.clearSelection = function() {
  // Get rid of the overlay data
  this.canvas_ctx_.clearRect(0, 0, this.width_, this.height_);
  this.setLegendHTML_();
  this.selPoints_ = [];
  this.lastx_ = -1;
}

/**
 * Returns the number of the currently selected row. To get data for this row,
 * you can use the getValue method.
 * @return { Integer } row number, or -1 if nothing is selected
 */
Dygraph.prototype.getSelection = function() {
  if (!this.selPoints_ || this.selPoints_.length < 1) {
    return -1;
  }

  for (var row=0; row<this.layout_.points.length; row++ ) {
    if (this.layout_.points[row].x == this.selPoints_[0].x) {
      return row + this.boundaryIds_[0][0];
    }
  }
  return -1;
};

/**
 * Number formatting function which mimicks the behavior of %g in printf, i.e.
 * either exponential or fixed format (without trailing 0s) is used depending on
 * the length of the generated string.  The advantage of this format is that
 * there is a predictable upper bound on the resulting string length,
 * significant figures are not dropped, and normal numbers are not displayed in
 * exponential notation.
 *
 * NOTE: JavaScript's native toPrecision() is NOT a drop-in replacement for %g.
 * It creates strings which are too long for absolute values between 10^-4 and
 * 10^-6, e.g. '0.00001' instead of '1e-5'. See tests/number-format.html for
 * output examples.
 *
 * @param {Number} x The number to format
 * @param {Number} opt_precision The precision to use, default 2.
 * @return {String} A string formatted like %g in printf.  The max generated
 *                  string length should be precision + 6 (e.g 1.123e+300).
 */
Dygraph.floatFormat = function(x, opt_precision) {
  // Avoid invalid precision values; [1, 21] is the valid range.
  var p = Math.min(Math.max(1, opt_precision || 2), 21);

  // This is deceptively simple.  The actual algorithm comes from:
  //
  // Max allowed length = p + 4
  // where 4 comes from 'e+n' and '.'.
  //
  // Length of fixed format = 2 + y + p
  // where 2 comes from '0.' and y = # of leading zeroes.
  //
  // Equating the two and solving for y yields y = 2, or 0.00xxxx which is
  // 1.0e-3.
  //
  // Since the behavior of toPrecision() is identical for larger numbers, we
  // don't have to worry about the other bound.
  //
  // Finally, the argument for toExponential() is the number of trailing digits,
  // so we take off 1 for the value before the '.'.
  return (Math.abs(x) < 1.0e-3 && x != 0.0) ?
      x.toExponential(p - 1) : x.toPrecision(p);
};

/**
 * @private
 * Return a string version of a number. This respects the digitsAfterDecimal
 * and maxNumberWidth options.
 * @param {Number} x The number to be formatted
 * @param {Dygraph} g The dygraph object
 */
Dygraph.numberFormatter = function(x, g) {
  var sigFigs = g.attr_('sigFigs');

  if (sigFigs !== null) {
    // User has opted for a fixed number of significant figures.
    return Dygraph.floatFormat(x, sigFigs);
  }

  var digits = g.attr_('digitsAfterDecimal');
  var maxNumberWidth = g.attr_('maxNumberWidth');

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
 * @private
 * Converts '9' to '09' (useful for dates)
 */
Dygraph.zeropad = function(x) {
  if (x < 10) return "0" + x; else return "" + x;
};

/**
 * Return a string version of the hours, minutes and seconds portion of a date.
 * @param {Number} date The JavaScript date (ms since epoch)
 * @return {String} A time of the form "HH:MM:SS"
 * @private
 */
Dygraph.hmsString_ = function(date) {
  var zeropad = Dygraph.zeropad;
  var d = new Date(date);
  if (d.getSeconds()) {
    return zeropad(d.getHours()) + ":" +
           zeropad(d.getMinutes()) + ":" +
           zeropad(d.getSeconds());
  } else {
    return zeropad(d.getHours()) + ":" + zeropad(d.getMinutes());
  }
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
    if (frac == 0 || granularity >= Dygraph.DAILY) {
      return new Date(date.getTime() + 3600*1000).strftime('%d%b');
    } else {
      return Dygraph.hmsString_(date.getTime());
    }
  }
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
 * Round a number to the specified number of digits past the decimal point.
 * @param {Number} num The number to round
 * @param {Number} places The number of decimals to which to round
 * @return {Number} The rounded number
 * @private
 */
Dygraph.round_ = function(num, places) {
  var shift = Math.pow(10, places);
  return Math.round(num * shift)/shift;
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

Dygraph.prototype.months =  ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
Dygraph.prototype.quarters = ["Jan", "Apr", "Jul", "Oct"];

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
    range = [this.rawData_[0][0], this.rawData_[this.rawData_.length - 1][0]];
  }

  var xTicks = this.attr_('xTicker')(range[0], range[1], this);
  this.layout_.setXTicks(xTicks);
};

// Time granularity enumeration
Dygraph.SECONDLY = 0;
Dygraph.TWO_SECONDLY = 1;
Dygraph.FIVE_SECONDLY = 2;
Dygraph.TEN_SECONDLY = 3;
Dygraph.THIRTY_SECONDLY  = 4;
Dygraph.MINUTELY = 5;
Dygraph.TWO_MINUTELY = 6;
Dygraph.FIVE_MINUTELY = 7;
Dygraph.TEN_MINUTELY = 8;
Dygraph.THIRTY_MINUTELY = 9;
Dygraph.HOURLY = 10;
Dygraph.TWO_HOURLY = 11;
Dygraph.SIX_HOURLY = 12;
Dygraph.DAILY = 13;
Dygraph.WEEKLY = 14;
Dygraph.MONTHLY = 15;
Dygraph.QUARTERLY = 16;
Dygraph.BIANNUAL = 17;
Dygraph.ANNUAL = 18;
Dygraph.DECADAL = 19;
Dygraph.CENTENNIAL = 20;
Dygraph.NUM_GRANULARITIES = 21;

Dygraph.SHORT_SPACINGS = [];
Dygraph.SHORT_SPACINGS[Dygraph.SECONDLY]        = 1000 * 1;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_SECONDLY]    = 1000 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.FIVE_SECONDLY]   = 1000 * 5;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_SECONDLY]    = 1000 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_SECONDLY] = 1000 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.MINUTELY]        = 1000 * 60;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_MINUTELY]    = 1000 * 60 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.FIVE_MINUTELY]   = 1000 * 60 * 5;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_MINUTELY]    = 1000 * 60 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_MINUTELY] = 1000 * 60 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]          = 1000 * 3600;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_HOURLY]      = 1000 * 3600 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.SIX_HOURLY]      = 1000 * 3600 * 6;
Dygraph.SHORT_SPACINGS[Dygraph.DAILY]           = 1000 * 86400;
Dygraph.SHORT_SPACINGS[Dygraph.WEEKLY]          = 1000 * 604800;

/**
 * @private
 * If we used this time granularity, how many ticks would there be?
 * This is only an approximation, but it's generally good enough.
 */
Dygraph.prototype.NumXTicks = function(start_time, end_time, granularity) {
  if (granularity < Dygraph.MONTHLY) {
    // Generate one tick mark for every fixed interval of time.
    var spacing = Dygraph.SHORT_SPACINGS[granularity];
    return Math.floor(0.5 + 1.0 * (end_time - start_time) / spacing);
  } else {
    var year_mod = 1;  // e.g. to only print one point every 10 years.
    var num_months = 12;
    if (granularity == Dygraph.QUARTERLY) num_months = 3;
    if (granularity == Dygraph.BIANNUAL) num_months = 2;
    if (granularity == Dygraph.ANNUAL) num_months = 1;
    if (granularity == Dygraph.DECADAL) { num_months = 1; year_mod = 10; }
    if (granularity == Dygraph.CENTENNIAL) { num_months = 1; year_mod = 100; }

    var msInYear = 365.2524 * 24 * 3600 * 1000;
    var num_years = 1.0 * (end_time - start_time) / msInYear;
    return Math.floor(0.5 + 1.0 * num_years * num_months / year_mod);
  }
};

/**
 * @private
 *
 * Construct an x-axis of nicely-formatted times on meaningful boundaries
 * (e.g. 'Jan 09' rather than 'Jan 22, 2009').
 *
 * Returns an array containing {v: millis, label: label} dictionaries.
 */
Dygraph.prototype.GetXAxis = function(start_time, end_time, granularity) {
  var formatter = this.attr_("xAxisLabelFormatter");
  var ticks = [];
  if (granularity < Dygraph.MONTHLY) {
    // Generate one tick mark for every fixed interval of time.
    var spacing = Dygraph.SHORT_SPACINGS[granularity];
    var format = '%d%b';  // e.g. "1Jan"

    // Find a time less than start_time which occurs on a "nice" time boundary
    // for this granularity.
    var g = spacing / 1000;
    var d = new Date(start_time);
    if (g <= 60) {  // seconds
      var x = d.getSeconds(); d.setSeconds(x - x % g);
    } else {
      d.setSeconds(0);
      g /= 60;
      if (g <= 60) {  // minutes
        var x = d.getMinutes(); d.setMinutes(x - x % g);
      } else {
        d.setMinutes(0);
        g /= 60;

        if (g <= 24) {  // days
          var x = d.getHours(); d.setHours(x - x % g);
        } else {
          d.setHours(0);
          g /= 24;

          if (g == 7) {  // one week
            d.setDate(d.getDate() - d.getDay());
          }
        }
      }
    }
    start_time = d.getTime();

    for (var t = start_time; t <= end_time; t += spacing) {
      ticks.push({ v:t, label: formatter(new Date(t), granularity) });
    }
  } else {
    // Display a tick mark on the first of a set of months of each year.
    // Years get a tick mark iff y % year_mod == 0. This is useful for
    // displaying a tick mark once every 10 years, say, on long time scales.
    var months;
    var year_mod = 1;  // e.g. to only print one point every 10 years.

    if (granularity == Dygraph.MONTHLY) {
      months = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
    } else if (granularity == Dygraph.QUARTERLY) {
      months = [ 0, 3, 6, 9 ];
    } else if (granularity == Dygraph.BIANNUAL) {
      months = [ 0, 6 ];
    } else if (granularity == Dygraph.ANNUAL) {
      months = [ 0 ];
    } else if (granularity == Dygraph.DECADAL) {
      months = [ 0 ];
      year_mod = 10;
    } else if (granularity == Dygraph.CENTENNIAL) {
      months = [ 0 ];
      year_mod = 100;
    } else {
      this.warn("Span of dates is too long");
    }

    var start_year = new Date(start_time).getFullYear();
    var end_year   = new Date(end_time).getFullYear();
    var zeropad = Dygraph.zeropad;
    for (var i = start_year; i <= end_year; i++) {
      if (i % year_mod != 0) continue;
      for (var j = 0; j < months.length; j++) {
        var date_str = i + "/" + zeropad(1 + months[j]) + "/01";
        var t = Dygraph.dateStrToMillis(date_str);
        if (t < start_time || t > end_time) continue;
        ticks.push({ v:t, label: formatter(new Date(t), granularity) });
      }
    }
  }

  return ticks;
};


/**
 * Add ticks to the x-axis based on a date range.
 * @param {Number} startDate Start of the date window (millis since epoch)
 * @param {Number} endDate End of the date window (millis since epoch)
 * @param {Dygraph} self The dygraph object
 * @return { [Object] } Array of {label, value} tuples.
 * @public
 */
Dygraph.dateTicker = function(startDate, endDate, self) {
  // TODO(danvk): why does this take 'self' as a param?
  var chosen = -1;
  for (var i = 0; i < Dygraph.NUM_GRANULARITIES; i++) {
    var num_ticks = self.NumXTicks(startDate, endDate, i);
    if (self.width_ / num_ticks >= self.attr_('pixelsPerXLabel')) {
      chosen = i;
      break;
    }
  }

  if (chosen >= 0) {
    return self.GetXAxis(startDate, endDate, chosen);
  } else {
    // TODO(danvk): signal error.
  }
};

/**
 * @private
 * This is a list of human-friendly values at which to show tick marks on a log
 * scale. It is k * 10^n, where k=1..9 and n=-39..+39, so:
 * ..., 1, 2, 3, 4, 5, ..., 9, 10, 20, 30, ..., 90, 100, 200, 300, ...
 * NOTE: this assumes that Dygraph.LOG_SCALE = 10.
 */
Dygraph.PREFERRED_LOG_TICK_VALUES = function() {
  var vals = [];
  for (var power = -39; power <= 39; power++) {
    var range = Math.pow(10, power);
    for (var mult = 1; mult <= 9; mult++) {
      var val = range * mult;
      vals.push(val);
    }
  }
  return vals;
}();

/**
 * @private
 * Implementation of binary search over an array.
 * Currently does not work when val is outside the range of arry's values.
 * @param { Integer } val the value to search for
 * @param { Integer[] } arry is the value over which to search
 * @param { Integer } abs If abs > 0, find the lowest entry greater than val
 * If abs < 0, find the highest entry less than val.
 * if abs == 0, find the entry that equals val.
 * @param { Integer } [low] The first index in arry to consider (optional)
 * @param { Integer } [high] The last index in arry to consider (optional)
 */
Dygraph.binarySearch = function(val, arry, abs, low, high) {
  if (low == null || high == null) {
    low = 0;
    high = arry.length - 1;
  }
  if (low > high) {
    return -1;
  }
  if (abs == null) {
    abs = 0;
  }
  var validIndex = function(idx) {
    return idx >= 0 && idx < arry.length;
  }
  var mid = parseInt((low + high) / 2);
  var element = arry[mid];
  if (element == val) {
    return mid;
  }
  if (element > val) {
    if (abs > 0) {
      // Accept if element > val, but also if prior element < val.
      var idx = mid - 1;
      if (validIndex(idx) && arry[idx] < val) {
        return mid;
      }
    }
    return Dygraph.binarySearch(val, arry, abs, low, mid - 1);
  }
  if (element < val) {
    if (abs < 0) {
      // Accept if element < val, but also if prior element > val.
      var idx = mid + 1;
      if (validIndex(idx) && arry[idx] > val) {
        return mid;
      }
    }
    return Dygraph.binarySearch(val, arry, abs, mid + 1, high);
  }
};

// TODO(konigsberg): Update comment.
/**
 * Add ticks when the x axis has numbers on it (instead of dates)
 *
 * @param {Number} minV minimum value
 * @param {Number} maxV maximum value
 * @param self
 * @param {function} attribute accessor function.
 * @return {[Object]} Array of {label, value} tuples.
 */
Dygraph.numericTicks = function(minV, maxV, self, axis_props, vals) {
  var attr = function(k) {
    if (axis_props && axis_props.hasOwnProperty(k)) return axis_props[k];
    return self.attr_(k);
  };

  var ticks = [];
  if (vals) {
    for (var i = 0; i < vals.length; i++) {
      ticks.push({v: vals[i]});
    }
  } else {
    if (axis_props && attr("logscale")) {
      var pixelsPerTick = attr('pixelsPerYLabel');
      // NOTE(konigsberg): Dan, should self.height_ be self.plotter_.area.h?
      var nTicks  = Math.floor(self.height_ / pixelsPerTick);
      var minIdx = Dygraph.binarySearch(minV, Dygraph.PREFERRED_LOG_TICK_VALUES, 1);
      var maxIdx = Dygraph.binarySearch(maxV, Dygraph.PREFERRED_LOG_TICK_VALUES, -1);
      if (minIdx == -1) {
        minIdx = 0;
      }
      if (maxIdx == -1) {
        maxIdx = Dygraph.PREFERRED_LOG_TICK_VALUES.length - 1;
      }
      // Count the number of tick values would appear, if we can get at least
      // nTicks / 4 accept them.
      var lastDisplayed = null;
      if (maxIdx - minIdx >= nTicks / 4) {
        var axisId = axis_props.yAxisId;
        for (var idx = maxIdx; idx >= minIdx; idx--) {
          var tickValue = Dygraph.PREFERRED_LOG_TICK_VALUES[idx];
          var domCoord = axis_props.g.toDomYCoord(tickValue, axisId);
          var tick = { v: tickValue };
          if (lastDisplayed == null) {
            lastDisplayed = {
              tickValue : tickValue,
              domCoord : domCoord
            };
          } else {
            if (domCoord - lastDisplayed.domCoord >= pixelsPerTick) {
              lastDisplayed = {
                tickValue : tickValue,
                domCoord : domCoord
              };
            } else {
              tick.label = "";
            }
          }
          ticks.push(tick);
        }
        // Since we went in backwards order.
        ticks.reverse();
      }
    }

    // ticks.length won't be 0 if the log scale function finds values to insert.
    if (ticks.length == 0) {
      // Basic idea:
      // Try labels every 1, 2, 5, 10, 20, 50, 100, etc.
      // Calculate the resulting tick spacing (i.e. this.height_ / nTicks).
      // The first spacing greater than pixelsPerYLabel is what we use.
      // TODO(danvk): version that works on a log scale.
      if (attr("labelsKMG2")) {
        var mults = [1, 2, 4, 8];
      } else {
        var mults = [1, 2, 5];
      }
      var scale, low_val, high_val, nTicks;
      // TODO(danvk): make it possible to set this for x- and y-axes independently.
      var pixelsPerTick = attr('pixelsPerYLabel');
      for (var i = -10; i < 50; i++) {
        if (attr("labelsKMG2")) {
          var base_scale = Math.pow(16, i);
        } else {
          var base_scale = Math.pow(10, i);
        }
        for (var j = 0; j < mults.length; j++) {
          scale = base_scale * mults[j];
          low_val = Math.floor(minV / scale) * scale;
          high_val = Math.ceil(maxV / scale) * scale;
          nTicks = Math.abs(high_val - low_val) / scale;
          var spacing = self.height_ / nTicks;
          // wish I could break out of both loops at once...
          if (spacing > pixelsPerTick) break;
        }
        if (spacing > pixelsPerTick) break;
      }

      // Construct the set of ticks.
      // Allow reverse y-axis if it's explicitly requested.
      if (low_val > high_val) scale *= -1;
      for (var i = 0; i < nTicks; i++) {
        var tickV = low_val + i * scale;
        ticks.push( {v: tickV} );
      }
    }
  }

  // Add formatted labels to the ticks.
  var k;
  var k_labels = [];
  if (attr("labelsKMB")) {
    k = 1000;
    k_labels = [ "K", "M", "B", "T" ];
  }
  if (attr("labelsKMG2")) {
    if (k) self.warn("Setting both labelsKMB and labelsKMG2. Pick one!");
    k = 1024;
    k_labels = [ "k", "M", "G", "T" ];
  }
  var formatter = attr('yAxisLabelFormatter') ?
      attr('yAxisLabelFormatter') : attr('yValueFormatter');

  // Add labels to the ticks.
  for (var i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue;  // Use current label.
    var tickV = ticks[i].v;
    var absTickV = Math.abs(tickV);
    var label = formatter(tickV, self);
    if (k_labels.length > 0) {
      // Round up to an appropriate unit.
      var n = k*k*k*k;
      for (var j = 3; j >= 0; j--, n /= k) {
        if (absTickV >= n) {
          label = Dygraph.round_(tickV / n, attr('digitsAfterDecimal')) + k_labels[j];
          break;
        }
      }
    }
    ticks[i].label = label;
  }

  return ticks;
};

/**
 * @private
 * Computes the range of the data series (including confidence intervals).
 * @param { [Array] } series either [ [x1, y1], [x2, y2], ... ] or
 * [ [x1, [y1, dev_low, dev_high]], [x2, [y2, dev_low, dev_high]], ...
 * @return [low, high]
 */
Dygraph.prototype.extremeValues_ = function(series) {
  var minY = null, maxY = null;

  var bars = this.attr_("errorBars") || this.attr_("customBars");
  if (bars) {
    // With custom bars, maxY is the max of the high values.
    for (var j = 0; j < series.length; j++) {
      var y = series[j][1][0];
      if (!y) continue;
      var low = y - series[j][1][1];
      var high = y + series[j][1][2];
      if (low > y) low = y;    // this can happen with custom bars,
      if (high < y) high = y;  // e.g. in tests/custom-bars.html
      if (maxY == null || high > maxY) {
        maxY = high;
      }
      if (minY == null || low < minY) {
        minY = low;
      }
    }
  } else {
    for (var j = 0; j < series.length; j++) {
      var y = series[j][1];
      if (y === null || isNaN(y)) continue;
      if (maxY == null || y > maxY) {
        maxY = y;
      }
      if (minY == null || y < minY) {
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
  // TODO(danvk): move more computations out of drawGraph_ and into here.
  this.computeYAxes_();

  // Create a new plotter.
  if (this.plotter_) this.plotter_.clear();
  this.plotter_ = new DygraphCanvasRenderer(this,
                                            this.hidden_,
                                            this.hidden_ctx_,
                                            this.layout_);

  // The roller sits in the bottom left corner of the chart. We don't know where
  // this will be until the options are available, so it's positioned here.
  this.createRollInterface_();

  // Same thing applies for the labelsDiv. It's right edge should be flush with
  // the right edge of the charting area (which may not be the same as the right
  // edge of the div, if we have two y-axes.
  this.positionLabelsDiv_();

  // If the data or options have changed, then we'd better redraw.
  this.drawGraph_();
};

/**
 * Update the graph with new data. This method is called when the viewing area
 * has changed. If the underlying data or options have changed, predraw_ will
 * be called before drawGraph_ is called.
 * @private
 */
Dygraph.prototype.drawGraph_ = function() {
  var data = this.rawData_;

  // This is used to set the second parameter to drawCallback, below.
  var is_initial_draw = this.is_initial_draw_;
  this.is_initial_draw_ = false;

  var minY = null, maxY = null;
  this.layout_.removeAllDatasets();
  this.setColors_();
  this.attrs_['pointSize'] = 0.5 * this.attr_('highlightCircleSize');

  // Loop over the fields (series).  Go from the last to the first,
  // because if they're stacked that's how we accumulate the values.

  var cumulative_y = [];  // For stacked series.
  var datasets = [];

  var extremes = {};  // series name -> [low, high]

  // Loop over all fields and create datasets
  for (var i = data[0].length - 1; i >= 1; i--) {
    if (!this.visibility()[i - 1]) continue;

    var seriesName = this.attr_("labels")[i];
    var connectSeparatedPoints = this.attr_('connectSeparatedPoints', i);
    var logScale = this.attr_('logscale', i);

    var series = [];
    for (var j = 0; j < data.length; j++) {
      var date = data[j][0];
      var point = data[j][i];
      if (logScale) {
        // On the log scale, points less than zero do not exist.
        // This will create a gap in the chart. Note that this ignores
        // connectSeparatedPoints.
        if (point <= 0) {
          point = null;
        }
        series.push([date, point]);
      } else {
        if (point != null || !connectSeparatedPoints) {
          series.push([date, point]);
        }
      }
    }

    // TODO(danvk): move this into predraw_. It's insane to do it here.
    series = this.rollingAverage(series, this.rollPeriod_);

    // Prune down to the desired range, if necessary (for zooming)
    // Because there can be lines going to points outside of the visible area,
    // we actually prune to visible points, plus one on either side.
    var bars = this.attr_("errorBars") || this.attr_("customBars");
    if (this.dateWindow_) {
      var low = this.dateWindow_[0];
      var high= this.dateWindow_[1];
      var pruned = [];
      // TODO(danvk): do binary search instead of linear search.
      // TODO(danvk): pass firstIdx and lastIdx directly to the renderer.
      var firstIdx = null, lastIdx = null;
      for (var k = 0; k < series.length; k++) {
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
      this.boundaryIds_[i-1] = [firstIdx, lastIdx];
      for (var k = firstIdx; k <= lastIdx; k++) {
        pruned.push(series[k]);
      }
      series = pruned;
    } else {
      this.boundaryIds_[i-1] = [0, series.length-1];
    }

    var seriesExtremes = this.extremeValues_(series);

    if (bars) {
      for (var j=0; j<series.length; j++) {
        val = [series[j][0], series[j][1][0], series[j][1][1], series[j][1][2]];
        series[j] = val;
      }
    } else if (this.attr_("stackedGraph")) {
      var l = series.length;
      var actual_y;
      for (var j = 0; j < l; j++) {
        // If one data set has a NaN, let all subsequent stacked
        // sets inherit the NaN -- only start at 0 for the first set.
        var x = series[j][0];
        if (cumulative_y[x] === undefined) {
          cumulative_y[x] = 0;
        }

        actual_y = series[j][1];
        cumulative_y[x] += actual_y;

        series[j] = [x, cumulative_y[x]]

        if (cumulative_y[x] > seriesExtremes[1]) {
          seriesExtremes[1] = cumulative_y[x];
        }
        if (cumulative_y[x] < seriesExtremes[0]) {
          seriesExtremes[0] = cumulative_y[x];
        }
      }
    }
    extremes[seriesName] = seriesExtremes;

    datasets[i] = series;
  }

  for (var i = 1; i < datasets.length; i++) {
    if (!this.visibility()[i - 1]) continue;
    this.layout_.addDataset(this.attr_("labels")[i], datasets[i]);
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
  this.plotter_.clear();
  this.plotter_.render();
  this.canvas_.getContext('2d').clearRect(0, 0, this.canvas_.width,
                                          this.canvas_.height);

  if (is_initial_draw) {
    // Generate a static legend before any particular point is selected.
    this.setLegendHTML_();
  } else {
    if (typeof(this.selPoints_) !== 'undefined' && this.selPoints_.length) {
      // We should select the point nearest the page x/y here, but it's easier
      // to just clear the selection. This prevents erroneous hover dots from
      // being displayed.
      this.clearSelection();
    } else {
      this.clearSelection();
    }
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
  this.axes_ = [{ yAxisId : 0, g : this }];  // always have at least one y-axis.
  this.seriesToAxisMap_ = {};

  // Get a list of series names.
  var labels = this.attr_("labels");
  var series = {};
  for (var i = 1; i < labels.length; i++) series[labels[i]] = (i - 1);

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
  for (var i = 0; i < axisOptions.length; i++) {
    var k = axisOptions[i];
    var v = this.attr_(k);
    if (v) this.axes_[0][k] = v;
  }

  // Go through once and add all the axes.
  for (var seriesName in series) {
    if (!series.hasOwnProperty(seriesName)) continue;
    var axis = this.attr_("axis", seriesName);
    if (axis == null) {
      this.seriesToAxisMap_[seriesName] = 0;
      continue;
    }
    if (typeof(axis) == 'object') {
      // Add a new axis, making a copy of its per-axis options.
      var opts = {};
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
  for (var seriesName in series) {
    if (!series.hasOwnProperty(seriesName)) continue;
    var axis = this.attr_("axis", seriesName);
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

  // Now we remove series from seriesToAxisMap_ which are not visible. We do
  // this last so that hiding the first series doesn't destroy the axis
  // properties of the primary axis.
  var seriesToAxisFiltered = {};
  var vis = this.visibility();
  for (var i = 1; i < labels.length; i++) {
    var s = labels[i];
    if (vis[i - 1]) seriesToAxisFiltered[s] = this.seriesToAxisMap_[s];
  }
  this.seriesToAxisMap_ = seriesToAxisFiltered;
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
  var seriesForAxis = [];
  for (var series in this.seriesToAxisMap_) {
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
      var series = seriesForAxis[i];
      var minY = Infinity;  // extremes[series[0]][0];
      var maxY = -Infinity;  // extremes[series[0]][1];
      var extremeMinY, extremeMaxY;
      for (var j = 0; j < series.length; j++) {
        // Only use valid extremes to stop null data series' from corrupting the scale.
        extremeMinY = extremes[series[j]][0];
        if (extremeMinY != null) {
          minY = Math.min(extremeMinY, minY);
        }
        extremeMaxY = extremes[series[j]][1];
        if (extremeMaxY != null) {
          maxY = Math.max(extremeMaxY, maxY);
        }
      }
      if (axis.includeZero && minY > 0) minY = 0;

      // Ensure we have a valid scale, otherwise defualt to zero for safety.
      if (minY == Infinity) minY = 0;
      if (maxY == -Infinity) maxY = 0;

      // Add some padding and round up to an integer to be human-friendly.
      var span = maxY - minY;
      // special case: if we have no sense of scale, use +/-10% of the sole value.
      if (span == 0) { span = maxY; }

      var maxAxisY;
      var minAxisY;
      if (axis.logscale) {
        var maxAxisY = maxY + 0.1 * span;
        var minAxisY = minY;
      } else {
        var maxAxisY = maxY + 0.1 * span;
        var minAxisY = minY - 0.1 * span;

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
    if (i == 0 || axis.independentTicks) {
      axis.ticks =
        Dygraph.numericTicks(axis.computedValueRange[0],
                             axis.computedValueRange[1],
                             this,
                             axis);
    } else {
      var p_axis = this.axes_[0];
      var p_ticks = p_axis.ticks;
      var p_scale = p_axis.computedValueRange[1] - p_axis.computedValueRange[0];
      var scale = axis.computedValueRange[1] - axis.computedValueRange[0];
      var tick_values = [];
      for (var i = 0; i < p_ticks.length; i++) {
        var y_frac = (p_ticks[i].v - p_axis.computedValueRange[0]) / p_scale;
        var y_val = axis.computedValueRange[0] + y_frac * scale;
        tick_values.push(y_val);
      }

      axis.ticks =
        Dygraph.numericTicks(axis.computedValueRange[0],
                             axis.computedValueRange[1],
                             this, axis, tick_values);
    }
  }
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
  var rollPeriod = Math.min(rollPeriod, originalData.length - 1);
  var rollingData = [];
  var sigma = this.attr_("sigma");

  if (this.fractions_) {
    var num = 0;
    var den = 0;  // numerator/denominator
    var mult = 100.0;
    for (var i = 0; i < originalData.length; i++) {
      num += originalData[i][1][0];
      den += originalData[i][1][1];
      if (i - rollPeriod >= 0) {
        num -= originalData[i - rollPeriod][1][0];
        den -= originalData[i - rollPeriod][1][1];
      }

      var date = originalData[i][0];
      var value = den ? num / den : 0.0;
      if (this.attr_("errorBars")) {
        if (this.wilsonInterval_) {
          // For more details on this confidence interval, see:
          // http://en.wikipedia.org/wiki/Binomial_confidence_interval
          if (den) {
            var p = value < 0 ? 0 : value, n = den;
            var pm = sigma * Math.sqrt(p*(1-p)/n + sigma*sigma/(4*n*n));
            var denom = 1 + sigma * sigma / den;
            var low  = (p + sigma * sigma / (2 * den) - pm) / denom;
            var high = (p + sigma * sigma / (2 * den) + pm) / denom;
            rollingData[i] = [date,
                              [p * mult, (p - low) * mult, (high - p) * mult]];
          } else {
            rollingData[i] = [date, [0, 0, 0]];
          }
        } else {
          var stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
          rollingData[i] = [date, [mult * value, mult * stddev, mult * stddev]];
        }
      } else {
        rollingData[i] = [date, mult * value];
      }
    }
  } else if (this.attr_("customBars")) {
    var low = 0;
    var mid = 0;
    var high = 0;
    var count = 0;
    for (var i = 0; i < originalData.length; i++) {
      var data = originalData[i][1];
      var y = data[1];
      rollingData[i] = [originalData[i][0], [y, y - data[0], data[2] - y]];

      if (y != null && !isNaN(y)) {
        low += data[0];
        mid += y;
        high += data[2];
        count += 1;
      }
      if (i - rollPeriod >= 0) {
        var prev = originalData[i - rollPeriod];
        if (prev[1][1] != null && !isNaN(prev[1][1])) {
          low -= prev[1][0];
          mid -= prev[1][1];
          high -= prev[1][2];
          count -= 1;
        }
      }
      rollingData[i] = [originalData[i][0], [ 1.0 * mid / count,
                                              1.0 * (mid - low) / count,
                                              1.0 * (high - mid) / count ]];
    }
  } else {
    // Calculate the rolling average for the first rollPeriod - 1 points where
    // there is not enough data to roll over the full number of points
    var num_init_points = Math.min(rollPeriod - 1, originalData.length - 2);
    if (!this.attr_("errorBars")){
      if (rollPeriod == 1) {
        return originalData;
      }

      for (var i = 0; i < originalData.length; i++) {
        var sum = 0;
        var num_ok = 0;
        for (var j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
          var y = originalData[j][1];
          if (y == null || isNaN(y)) continue;
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
      for (var i = 0; i < originalData.length; i++) {
        var sum = 0;
        var variance = 0;
        var num_ok = 0;
        for (var j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
          var y = originalData[j][1][0];
          if (y == null || isNaN(y)) continue;
          num_ok++;
          sum += originalData[j][1][0];
          variance += Math.pow(originalData[j][1][1], 2);
        }
        if (num_ok) {
          var stddev = Math.sqrt(variance) / num_ok;
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
 * @private
 * Parses a date, returning the number of milliseconds since epoch. This can be
 * passed in as an xValueParser in the Dygraph constructor.
 * TODO(danvk): enumerate formats that this understands.
 * @param {String} A date in YYYYMMDD format.
 * @return {Number} Milliseconds since epoch.
 */
Dygraph.dateParser = function(dateStr, self) {
  var dateStrSlashed;
  var d;
  if (dateStr.search("-") != -1) {  // e.g. '2009-7-12' or '2009-07-12'
    dateStrSlashed = dateStr.replace("-", "/", "g");
    while (dateStrSlashed.search("-") != -1) {
      dateStrSlashed = dateStrSlashed.replace("-", "/");
    }
    d = Dygraph.dateStrToMillis(dateStrSlashed);
  } else if (dateStr.length == 8) {  // e.g. '20090712'
    // TODO(danvk): remove support for this format. It's confusing.
    dateStrSlashed = dateStr.substr(0,4) + "/" + dateStr.substr(4,2)
                       + "/" + dateStr.substr(6,2);
    d = Dygraph.dateStrToMillis(dateStrSlashed);
  } else {
    // Any format that Date.parse will accept, e.g. "2009/07/12" or
    // "2009/07/12 12:34:56"
    d = Dygraph.dateStrToMillis(dateStr);
  }

  if (!d || isNaN(d)) {
    self.error("Couldn't parse " + dateStr + " as a date");
  }
  return d;
};

/**
 * Detects the type of the str (date or numeric) and sets the various
 * formatting attributes in this.attrs_ based on this type.
 * @param {String} str An x value.
 * @private
 */
Dygraph.prototype.detectTypeFromString_ = function(str) {
  var isDate = false;
  if (str.indexOf('-') > 0 ||
      str.indexOf('/') >= 0 ||
      isNaN(parseFloat(str))) {
    isDate = true;
  } else if (str.length == 8 && str > '19700101' && str < '20371231') {
    // TODO(danvk): remove support for this format.
    isDate = true;
  }

  if (isDate) {
    this.attrs_.xValueFormatter = Dygraph.dateString_;
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.xTicker = Dygraph.dateTicker;
    this.attrs_.xAxisLabelFormatter = Dygraph.dateAxisFormatter;
  } else {
    // TODO(danvk): use Dygraph.numberFormatter here?
    /** @private (shut up, jsdoc!) */
    this.attrs_.xValueFormatter = function(x) { return x; };
    /** @private (shut up, jsdoc!) */
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.xTicker = Dygraph.numericTicks;
    this.attrs_.xAxisLabelFormatter = this.attrs_.xValueFormatter;
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
  var lines = data.split("\n");

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
    if (line.length == 0) continue;  // skip blank lines
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
      for (var j = 1; j < inFields.length; j++) {
        // TODO(danvk): figure out an appropriate way to flag parse errors.
        var vals = inFields[j].split("/");
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
      for (var j = 1; j < inFields.length; j += 2) {
        fields[(j + 1) / 2] = [this.parseFloat_(inFields[j], i, line),
                               this.parseFloat_(inFields[j + 1], i, line)];
      }
    } else if (this.attr_("customBars")) {
      // Bars are a low;center;high tuple
      for (var j = 1; j < inFields.length; j++) {
        var val = inFields[j];
        if (/^ *$/.test(val)) {
          fields[j] = [null, null, null];
        } else {
          var vals = val.split(";");
          if (vals.length == 3) {
            fields[j] = [ this.parseFloat_(vals[0], i, line),
                          this.parseFloat_(vals[1], i, line),
                          this.parseFloat_(vals[2], i, line) ];
          } else {
            this.warning('When using customBars, values must be either blank ' +
                         'or "low;center;high" tuples (got "' + val +
                         '" on line ' + (1+i));
          }
        }
      }
    } else {
      // Values are just numbers
      for (var j = 1; j < inFields.length; j++) {
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
    if (i == 0 && this.attr_('labels')) {
      var all_null = true;
      for (var j = 0; all_null && j < fields.length; j++) {
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
    ret.sort(function(a,b) { return a[0] - b[0] });
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
  if (data.length == 0) {
    this.error("Can't plot empty data set");
    return null;
  }
  if (data[0].length == 0) {
    this.error("Data set cannot contain an empty row");
    return null;
  }

  if (this.attr_("labels") == null) {
    this.warn("Using default labels. Set labels explicitly via 'labels' " +
              "in the options parameter");
    this.attrs_.labels = [ "X" ];
    for (var i = 1; i < data[0].length; i++) {
      this.attrs_.labels.push("Y" + i);
    }
  }

  if (Dygraph.isDateLike(data[0][0])) {
    // Some intelligent defaults for a date x-axis.
    this.attrs_.xValueFormatter = Dygraph.dateString_;
    this.attrs_.xAxisLabelFormatter = Dygraph.dateAxisFormatter;
    this.attrs_.xTicker = Dygraph.dateTicker;

    // Assume they're all dates.
    var parsedData = Dygraph.clone(data);
    for (var i = 0; i < data.length; i++) {
      if (parsedData[i].length == 0) {
        this.error("Row " + (1 + i) + " of data is empty");
        return null;
      }
      if (parsedData[i][0] == null
          || typeof(parsedData[i][0].getTime) != 'function'
          || isNaN(parsedData[i][0].getTime())) {
        this.error("x value in row " + (1 + i) + " is not a Date");
        return null;
      }
      parsedData[i][0] = parsedData[i][0].getTime();
    }
    return parsedData;
  } else {
    // Some intelligent defaults for a numeric x-axis.
    /** @private (shut up, jsdoc!) */
    this.attrs_.xValueFormatter = function(x) { return x; };
    this.attrs_.xTicker = Dygraph.numericTicks;
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
  var cols = data.getNumberOfColumns();
  var rows = data.getNumberOfRows();

  var indepType = data.getColumnType(0);
  if (indepType == 'date' || indepType == 'datetime') {
    this.attrs_.xValueFormatter = Dygraph.dateString_;
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.xTicker = Dygraph.dateTicker;
    this.attrs_.xAxisLabelFormatter = Dygraph.dateAxisFormatter;
  } else if (indepType == 'number') {
    this.attrs_.xValueFormatter = function(x) { return x; };
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.xTicker = Dygraph.numericTicks;
    this.attrs_.xAxisLabelFormatter = this.attrs_.xValueFormatter;
  } else {
    this.error("only 'date', 'datetime' and 'number' types are supported for " +
               "column 1 of DataTable input (Got '" + indepType + "')");
    return null;
  }

  // Array of the column indices which contain data (and not annotations).
  var colIdx = [];
  var annotationCols = {};  // data index -> [annotation cols]
  var hasAnnotations = false;
  for (var i = 1; i < cols; i++) {
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
  for (var i = 0; i < colIdx.length; i++) {
    labels.push(data.getColumnLabel(colIdx[i]));
    if (this.attr_("errorBars")) i += 1;
  }
  this.attrs_.labels = labels;
  cols = labels.length;

  var ret = [];
  var outOfOrder = false;
  var annotations = [];
  for (var i = 0; i < rows; i++) {
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
      for (var j = 0; j < colIdx.length; j++) {
        var col = colIdx[j];
        row.push(data.getValue(i, col));
        if (hasAnnotations &&
            annotationCols.hasOwnProperty(col) &&
            data.getValue(i, annotationCols[col][0]) != null) {
          var ann = {};
          ann.series = data.getColumnLabel(col);
          ann.xval = row[0];
          ann.shortText = String.fromCharCode(65 /* A */ + annotations.length)
          ann.text = '';
          for (var k = 0; k < annotationCols[col].length; k++) {
            if (k) ann.text += "\n";
            ann.text += data.getValue(i, annotationCols[col][k]);
          }
          annotations.push(ann);
        }
      }

      // Strip out infinities, which give dygraphs problems later on.
      for (var j = 0; j < row.length; j++) {
        if (!isFinite(row[j])) row[j] = null;
      }
    } else {
      for (var j = 0; j < cols - 1; j++) {
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
    ret.sort(function(a,b) { return a[0] - b[0] });
  }
  this.rawData_ = ret;

  if (annotations.length > 0) {
    this.setAnnotations(annotations, true);
  }
}

/**
 * @private
 * This is identical to JavaScript's built-in Date.parse() method, except that
 * it doesn't get replaced with an incompatible method by aggressive JS
 * libraries like MooTools or Joomla.
 * @param { String } str The date string, e.g. "2011/05/06"
 * @return { Integer } millis since epoch
 */
Dygraph.dateStrToMillis = function(str) {
  return new Date(str).getTime();
};

// These functions are all based on MochiKit.
/**
 * @private
 */
Dygraph.update = function (self, o) {
  if (typeof(o) != 'undefined' && o !== null) {
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        self[k] = o[k];
      }
    }
  }
  return self;
};

/**
 * @private
 */
Dygraph.isArrayLike = function (o) {
  var typ = typeof(o);
  if (
      (typ != 'object' && !(typ == 'function' &&
        typeof(o.item) == 'function')) ||
      o === null ||
      typeof(o.length) != 'number' ||
      o.nodeType === 3
     ) {
    return false;
  }
  return true;
};

/**
 * @private
 */
Dygraph.isDateLike = function (o) {
  if (typeof(o) != "object" || o === null ||
      typeof(o.getTime) != 'function') {
    return false;
  }
  return true;
};

/**
 * @private
 */
Dygraph.clone = function(o) {
  // TODO(danvk): figure out how MochiKit's version works
  var r = [];
  for (var i = 0; i < o.length; i++) {
    if (Dygraph.isArrayLike(o[i])) {
      r.push(Dygraph.clone(o[i]));
    } else {
      r.push(o[i]);
    }
  }
  return r;
};


/**
 * Get the CSV data. If it's in a function, call that function. If it's in a
 * file, do an XMLHttpRequest to get it.
 * @private
 */
Dygraph.prototype.start_ = function() {
  if (typeof this.file_ == 'function') {
    // CSV string. Pretend we got it via XHR.
    this.loadedEvent_(this.file_());
  } else if (Dygraph.isArrayLike(this.file_)) {
    this.rawData_ = this.parseArray_(this.file_);
    this.predraw_();
  } else if (typeof this.file_ == 'object' &&
             typeof this.file_.getColumnRange == 'function') {
    // must be a DataTable from gviz.
    this.parseDataTable_(this.file_);
    this.predraw_();
  } else if (typeof this.file_ == 'string') {
    // Heuristic: a newline means it's CSV data. Otherwise it's an URL.
    if (this.file_.indexOf('\n') >= 0) {
      this.loadedEvent_(this.file_);
    } else {
      var req = new XMLHttpRequest();
      var caller = this;
      req.onreadystatechange = function () {
        if (req.readyState == 4) {
          if (req.status == 200) {
            caller.loadedEvent_(req.responseText);
          }
        }
      };

      req.open("GET", this.file_, true);
      req.send(null);
    }
  } else {
    this.error("Unknown data format: " + (typeof this.file_));
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
Dygraph.prototype.updateOptions = function(attrs, block_redraw) {
  if (typeof(block_redraw) == 'undefined') block_redraw = false;

  // TODO(danvk): this is a mess. Move these options into attr_.
  if ('rollPeriod' in attrs) {
    this.rollPeriod_ = attrs.rollPeriod;
  }
  if ('dateWindow' in attrs) {
    this.dateWindow_ = attrs.dateWindow;
    if (!('isZoomedIgnoreProgrammaticZoom' in attrs)) {
      this.zoomed_x_ = attrs.dateWindow != null;
    }
  }
  if ('valueRange' in attrs && !('isZoomedIgnoreProgrammaticZoom' in attrs)) {
    this.zoomed_y_ = attrs.valueRange != null;
  }

  // TODO(danvk): validate per-series options.
  // Supported:
  // strokeWidth
  // pointSize
  // drawPoints
  // highlightCircleSize

  Dygraph.update(this.user_attrs_, attrs);

  if (attrs['file']) {
    this.file_ = attrs['file'];
    if (!block_redraw) this.start_();
  } else {
    if (!block_redraw) this.predraw_();
  }
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

  // TODO(danvk): there should be a clear() method.
  this.maindiv_.innerHTML = "";
  this.attrs_.labelsDiv = null;

  if (width) {
    this.maindiv_.style.width = width + "px";
    this.maindiv_.style.height = height + "px";
    this.width_ = width;
    this.height_ = height;
  } else {
    this.width_ = this.maindiv_.offsetWidth;
    this.height_ = this.maindiv_.offsetHeight;
  }

  this.createInterface_();
  this.predraw_();

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
    this.attrs_["visibility"] = [];
  }
  while (this.attr_("visibility").length < this.rawData_[0].length - 1) {
    this.attr_("visibility").push(true);
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
 * Update the list of annotations and redraw the chart.
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
 * Get the index of a series (column) given its name. The first column is the
 * x-axis, so the data series start with index 1.
 */
Dygraph.prototype.indexFromSetName = function(name) {
  var labels = this.attr_("labels");
  for (var i = 0; i < labels.length; i++) {
    if (labels[i] == name) return i;
  }
  return null;
};

/**
 * @private
 * Adds a default style for the annotation CSS classes to the document. This is
 * only executed when annotations are actually used. It is designed to only be
 * called once -- all calls after the first will return immediately.
 */
Dygraph.addAnnotationRule = function() {
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
}

/**
 * @private
 * Create a new canvas element. This is more complex than a simple
 * document.createElement("canvas") because of IE and excanvas.
 */
Dygraph.createCanvas = function() {
  var canvas = document.createElement("canvas");

  isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);
  if (isIE && (typeof(G_vmlCanvasManager) != 'undefined')) {
    canvas = G_vmlCanvasManager.initElement(canvas);
  }

  return canvas;
};


/**
 * A wrapper around Dygraph that implements the gviz API.
 * @param {Object} container The DOM object the visualization should live in.
 */
Dygraph.GVizChart = function(container) {
  this.container = container;
}

Dygraph.GVizChart.prototype.draw = function(data, options) {
  // Clear out any existing dygraph.
  // TODO(danvk): would it make more sense to simply redraw using the current
  // date_graph object?
  this.container.innerHTML = '';
  if (typeof(this.date_graph) != 'undefined') {
    this.date_graph.destroy();
  }

  this.date_graph = new Dygraph(this.container, data, options);
}

/**
 * Google charts compatible setSelection
 * Only row selection is supported, all points in the row will be highlighted
 * @param {Array} array of the selected cells
 * @public
 */
Dygraph.GVizChart.prototype.setSelection = function(selection_array) {
  var row = false;
  if (selection_array.length) {
    row = selection_array[0].row;
  }
  this.date_graph.setSelection(row);
}

/**
 * Google charts compatible getSelection implementation
 * @return {Array} array of the selected cells
 * @public
 */
Dygraph.GVizChart.prototype.getSelection = function() {
  var selection = [];

  var row = this.date_graph.getSelection();

  if (row < 0) return selection;

  col = 1;
  for (var i in this.date_graph.layout_.datasets) {
    selection.push({row: row, column: col});
    col++;
  }

  return selection;
}

// Older pages may still use this name.
DateGraph = Dygraph;

// <REMOVE_FOR_COMBINED>
Dygraph.OPTIONS_REFERENCE =  // <JSON>
{
  "xValueParser": {
    "default": "parseFloat() or Date.parse()*",
    "labels": ["CSV parsing"],
    "type": "function(str) -> number",
    "description": "A function which parses x-values (i.e. the dependent series). Must return a number, even when the values are dates. In this case, millis since epoch are used. This is used primarily for parsing CSV data. *=Dygraphs is slightly more accepting in the dates which it will parse. See code for details."
  },
  "stackedGraph": {
    "default": "false",
    "labels": ["Data Line display"],
    "type": "boolean",
    "description": "If set, stack series on top of one another rather than drawing them independently."
  },
  "pointSize": {
    "default": "1",
    "labels": ["Data Line display"],
    "type": "integer",
    "description": "The size of the dot to draw on each point in pixels (see drawPoints). A dot is always drawn when a point is \"isolated\", i.e. there is a missing point on either side of it. This also controls the size of those dots."
  },
  "labelsDivStyles": {
    "default": "null",
    "labels": ["Legend"],
    "type": "{}",
    "description": "Additional styles to apply to the currently-highlighted points div. For example, { 'font-weight': 'bold' } will make the labels bold."
  },
  "drawPoints": {
    "default": "false",
    "labels": ["Data Line display"],
    "type": "boolean",
    "description": "Draw a small dot at each point, in addition to a line going through the point. This makes the individual data points easier to see, but can increase visual clutter in the chart."
  },
  "height": {
    "default": "320",
    "labels": ["Overall display"],
    "type": "integer",
    "description": "Height, in pixels, of the chart. If the container div has been explicitly sized, this will be ignored."
  },
  "zoomCallback": {
    "default": "null",
    "labels": ["Callbacks"],
    "type": "function(minDate, maxDate, yRanges)",
    "description": "A function to call when the zoom window is changed (either by zooming in or out). minDate and maxDate are milliseconds since epoch. yRanges is an array of [bottom, top] pairs, one for each y-axis."
  },
  "pointClickCallback": {
    "default": "",
    "labels": ["Callbacks", "Interactive Elements"],
    "type": "",
    "description": ""
  },
  "colors": {
    "default": "(see description)",
    "labels": ["Data Series Colors"],
    "type": "array<string>",
    "example": "['red', '#00FF00']",
    "description": "List of colors for the data series. These can be of the form \"#AABBCC\" or \"rgb(255,100,200)\" or \"yellow\", etc. If not specified, equally-spaced points around a color wheel are used."
  },
  "connectSeparatedPoints": {
    "default": "false",
    "labels": ["Data Line display"],
    "type": "boolean",
    "description": "Usually, when Dygraphs encounters a missing value in a data series, it interprets this as a gap and draws it as such. If, instead, the missing values represents an x-value for which only a different series has data, then you'll want to connect the dots by setting this to true. To explicitly include a gap with this option set, use a value of NaN."
  },
  "highlightCallback": {
    "default": "null",
    "labels": ["Callbacks"],
    "type": "function(event, x, points,row)",
    "description": "When set, this callback gets called every time a new point is highlighted. The parameters are the JavaScript mousemove event, the x-coordinate of the highlighted points and an array of highlighted points: <code>[ {name: 'series', yval: y-value}, &hellip; ]</code>"
  },
  "includeZero": {
    "default": "false",
    "labels": ["Axis display"],
    "type": "boolean",
    "description": "Usually, dygraphs will use the range of the data plus some padding to set the range of the y-axis. If this option is set, the y-axis will always include zero, typically as the lowest value. This can be used to avoid exaggerating the variance in the data"
  },
  "rollPeriod": {
    "default": "1",
    "labels": ["Error Bars", "Rolling Averages"],
    "type": "integer &gt;= 1",
    "description": "Number of days over which to average data. Discussed extensively above."
  },
  "unhighlightCallback": {
    "default": "null",
    "labels": ["Callbacks"],
    "type": "function(event)",
    "description": "When set, this callback gets called every time the user stops highlighting any point by mousing out of the graph.  The parameter is the mouseout event."
  },
  "axisTickSize": {
    "default": "3.0",
    "labels": ["Axis display"],
    "type": "number",
    "description": "The size of the line to display next to each tick mark on x- or y-axes."
  },
  "labelsSeparateLines": {
    "default": "false",
    "labels": ["Legend"],
    "type": "boolean",
    "description": "Put <code>&lt;br/&gt;</code> between lines in the label string. Often used in conjunction with <strong>labelsDiv</strong>."
  },
  "xValueFormatter": {
    "default": "(Round to 2 decimal places)",
    "labels": ["Axis display"],
    "type": "function(x)",
    "description": "Function to provide a custom display format for the X value for mouseover."
  },
  "pixelsPerYLabel": {
    "default": "30",
    "labels": ["Axis display", "Grid"],
    "type": "integer",
    "description": "Number of pixels to require between each x- and y-label. Larger values will yield a sparser axis with fewer ticks."
  },
  "annotationMouseOverHandler": {
    "default": "null",
    "labels": ["Annotations"],
    "type": "function(annotation, point, dygraph, event)",
    "description": "If provided, this function is called whenever the user mouses over an annotation."
  },
  "annotationMouseOutHandler": {
    "default": "null",
    "labels": ["Annotations"],
    "type": "function(annotation, point, dygraph, event)",
    "description": "If provided, this function is called whenever the user mouses out of an annotation."
  },
  "annotationClickHandler": {
    "default": "null",
    "labels": ["Annotations"],
    "type": "function(annotation, point, dygraph, event)",
    "description": "If provided, this function is called whenever the user clicks on an annotation."
  },
  "annotationDblClickHandler": {
    "default": "null",
    "labels": ["Annotations"],
    "type": "function(annotation, point, dygraph, event)",
    "description": "If provided, this function is called whenever the user double-clicks on an annotation."
  },
  "drawCallback": {
    "default": "null",
    "labels": ["Callbacks"],
    "type": "function(dygraph, is_initial)",
    "description": "When set, this callback gets called every time the dygraph is drawn. This includes the initial draw, after zooming and repeatedly while panning. The first parameter is the dygraph being drawn. The second is a boolean value indicating whether this is the initial draw."
  },
  "labelsKMG2": {
    "default": "false",
    "labels": ["Value display/formatting"],
    "type": "boolean",
    "description": "Show k/M/G for kilo/Mega/Giga on y-axis. This is different than <code>labelsKMB</code> in that it uses base 2, not 10."
  },
  "delimiter": {
    "default": ",",
    "labels": ["CSV parsing"],
    "type": "string",
    "description": "The delimiter to look for when separating fields of a CSV file. Setting this to a tab is not usually necessary, since tab-delimited data is auto-detected."
  },
  "axisLabelFontSize": {
    "default": "14",
    "labels": ["Axis display"],
    "type": "integer",
    "description": "Size of the font (in pixels) to use in the axis labels, both x- and y-axis."
  },
  "underlayCallback": {
    "default": "null",
    "labels": ["Callbacks"],
    "type": "function(canvas, area, dygraph)",
    "description": "When set, this callback gets called before the chart is drawn. It details on how to use this."
  },
  "width": {
    "default": "480",
    "labels": ["Overall display"],
    "type": "integer",
    "description": "Width, in pixels, of the chart. If the container div has been explicitly sized, this will be ignored."
  },
  "interactionModel": {
    "default": "...",
    "labels": ["Interactive Elements"],
    "type": "Object",
    "description": "TODO(konigsberg): document this"
  },
  "xTicker": {
    "default": "Dygraph.dateTicker or Dygraph.numericTicks",
    "labels": ["Axis display"],
    "type": "function(min, max, dygraph) -> [{v: ..., label: ...}, ...]",
    "description": "This lets you specify an arbitrary function to generate tick marks on an axis. The tick marks are an array of (value, label) pairs. The built-in functions go to great lengths to choose good tick marks so, if you set this option, you'll most likely want to call one of them and modify the result."
  },
  "xAxisLabelWidth": {
    "default": "50",
    "labels": ["Axis display"],
    "type": "integer",
    "description": "Width, in pixels, of the x-axis labels."
  },
  "xAxisHeight": {
    "default": "(null)",
    "labels": ["Axis display"],
    "type": "integer",
    "description": "Height, in pixels, of the x-axis. If not set explicitly, this is computed based on axisLabelFontSize and axisTickSize."
  },
  "showLabelsOnHighlight": {
    "default": "true",
    "labels": ["Interactive Elements", "Legend"],
    "type": "boolean",
    "description": "Whether to show the legend upon mouseover."
  },
  "axis": {
    "default": "(none)",
    "labels": ["Axis display"],
    "type": "string or object",
    "description": "Set to either an object ({}) filled with options for this axis or to the name of an existing data series with its own axis to re-use that axis. See tests for usage."
  },
  "pixelsPerXLabel": {
    "default": "60",
    "labels": ["Axis display", "Grid"],
    "type": "integer",
    "description": "Number of pixels to require between each x- and y-label. Larger values will yield a sparser axis with fewer ticks."
  },
  "labelsDiv": {
    "default": "null",
    "labels": ["Legend"],
    "type": "DOM element or string",
    "example": "<code style='font-size: small'>document.getElementById('foo')</code>or<code>'foo'",
    "description": "Show data labels in an external div, rather than on the graph.  This value can either be a div element or a div id."
  },
  "fractions": {
    "default": "false",
    "labels": ["CSV parsing", "Error Bars"],
    "type": "boolean",
    "description": "When set, attempt to parse each cell in the CSV file as \"a/b\", where a and b are integers. The ratio will be plotted. This allows computation of Wilson confidence intervals (see below)."
  },
  "logscale": {
    "default": "false",
    "labels": ["Axis display"],
    "type": "boolean",
    "description": "When set for a y-axis, the graph shows that axis in log scale. Any values less than or equal to zero are not displayed.\n\nNot compatible with showZero, and ignores connectSeparatedPoints. Also, showing log scale with valueRanges that are less than zero will result in an unviewable graph."
  },
  "strokeWidth": {
    "default": "1.0",
    "labels": ["Data Line display"],
    "type": "integer",
    "example": "0.5, 2.0",
    "description": "The width of the lines connecting data points. This can be used to increase the contrast or some graphs."
  },
  "wilsonInterval": {
    "default": "true",
    "labels": ["Error Bars"],
    "type": "boolean",
    "description": "Use in conjunction with the \"fractions\" option. Instead of plotting +/- N standard deviations, dygraphs will compute a Wilson confidence interval and plot that. This has more reasonable behavior for ratios close to 0 or 1."
  },
  "fillGraph": {
    "default": "false",
    "labels": ["Data Line display"],
    "type": "boolean",
    "description": "Should the area underneath the graph be filled? This option is not compatible with error bars."
  },
  "highlightCircleSize": {
    "default": "3",
    "labels": ["Interactive Elements"],
    "type": "integer",
    "description": "The size in pixels of the dot drawn over highlighted points."
  },
  "gridLineColor": {
    "default": "rgb(128,128,128)",
    "labels": ["Grid"],
    "type": "red, blue",
    "description": "The color of the gridlines."
  },
  "visibility": {
    "default": "[true, true, ...]",
    "labels": ["Data Line display"],
    "type": "Array of booleans",
    "description": "Which series should initially be visible? Once the Dygraph has been constructed, you can access and modify the visibility of each series using the <code>visibility</code> and <code>setVisibility</code> methods."
  },
  "valueRange": {
    "default": "Full range of the input is shown",
    "labels": ["Axis display"],
    "type": "Array of two numbers",
    "example": "[10, 110]",
    "description": "Explicitly set the vertical range of the graph to [low, high]."
  },
  "labelsDivWidth": {
    "default": "250",
    "labels": ["Legend"],
    "type": "integer",
    "description": "Width (in pixels) of the div which shows information on the currently-highlighted points."
  },
  "colorSaturation": {
    "default": "1.0",
    "labels": ["Data Series Colors"],
    "type": "float (0.0 - 1.0)",
    "description": "If <strong>colors</strong> is not specified, saturation of the automatically-generated data series colors."
  },
  "yAxisLabelWidth": {
    "default": "50",
    "labels": ["Axis display"],
    "type": "integer",
    "description": "Width, in pixels, of the y-axis labels. This also affects the amount of space available for a y-axis chart label."
  },
  "hideOverlayOnMouseOut": {
    "default": "true",
    "labels": ["Interactive Elements", "Legend"],
    "type": "boolean",
    "description": "Whether to hide the legend when the mouse leaves the chart area."
  },
  "yValueFormatter": {
    "default": "(Round to 2 decimal places)",
    "labels": ["Axis display"],
    "type": "function(x)",
    "description": "Function to provide a custom display format for the Y value for mouseover."
  },
  "legend": {
    "default": "onmouseover",
    "labels": ["Legend"],
    "type": "string",
    "description": "When to display the legend. By default, it only appears when a user mouses over the chart. Set it to \"always\" to always display a legend of some sort."
  },
  "labelsShowZeroValues": {
    "default": "true",
    "labels": ["Legend"],
    "type": "boolean",
    "description": "Show zero value labels in the labelsDiv."
  },
  "stepPlot": {
    "default": "false",
    "labels": ["Data Line display"],
    "type": "boolean",
    "description": "When set, display the graph as a step plot instead of a line plot."
  },
  "labelsKMB": {
    "default": "false",
    "labels": ["Value display/formatting"],
    "type": "boolean",
    "description": "Show K/M/B for thousands/millions/billions on y-axis."
  },
  "rightGap": {
    "default": "5",
    "labels": ["Overall display"],
    "type": "integer",
    "description": "Number of pixels to leave blank at the right edge of the Dygraph. This makes it easier to highlight the right-most data point."
  },
  "avoidMinZero": {
    "default": "false",
    "labels": ["Axis display"],
    "type": "boolean",
    "description": "When set, the heuristic that fixes the Y axis at zero for a data set with the minimum Y value of zero is disabled. \nThis is particularly useful for data sets that contain many zero values, especially for step plots which may otherwise have lines not visible running along the bottom axis."
  },
  "xAxisLabelFormatter": {
    "default": "Dygraph.dateAxisFormatter",
    "labels": ["Axis display", "Value display/formatting"],
    "type": "function(date, granularity)",
    "description": "Function to call to format values along the x axis."
  },
  "clickCallback": {
    "snippet": "function(e, date){<br>&nbsp;&nbsp;alert(date);<br>}",
    "default": "null",
    "labels": ["Callbacks"],
    "type": "function(e, date)",
    "description": "A function to call when a data point is clicked. The function should take two arguments, the event object for the click and the date that was clicked."
  },
  "yAxisLabelFormatter": {
    "default": "yValueFormatter",
    "labels": ["Axis display", "Value display/formatting"],
    "type": "function(x)",
    "description": "Function used to format values along the Y axis. By default it uses the same as the <code>yValueFormatter</code> unless specified."
  },
  "labels": {
    "default": "[\"X\", \"Y1\", \"Y2\", ...]*",
    "labels": ["Legend"],
    "type": "array<string>",
    "description": "A name for each data series, including the independent (X) series. For CSV files and DataTable objections, this is determined by context. For raw data, this must be specified. If it is not, default values are supplied and a warning is logged."
  },
  "dateWindow": {
    "default": "Full range of the input is shown",
    "labels": ["Axis display"],
    "type": "Array of two Dates or numbers",
    "example": "[<br>&nbsp;&nbsp;Date.parse('2006-01-01'),<br>&nbsp;&nbsp;(new Date()).valueOf()<br>]",
    "description": "Initially zoom in on a section of the graph. Is of the form [earliest, latest], where earliest/latest are milliseconds since epoch. If the data for the x-axis is numeric, the values in dateWindow must also be numbers."
  },
  "showRoller": {
    "default": "false",
    "labels": ["Interactive Elements", "Rolling Averages"],
    "type": "boolean",
    "description": "If the rolling average period text box should be shown."
  },
  "sigma": {
    "default": "2.0",
    "labels": ["Error Bars"],
    "type": "float",
    "description": "When errorBars is set, shade this many standard deviations above/below each point."
  },
  "customBars": {
    "default": "false",
    "labels": ["CSV parsing", "Error Bars"],
    "type": "boolean",
    "description": "When set, parse each CSV cell as \"low;middle;high\". Error bars will be drawn for each point between low and high, with the series itself going through middle."
  },
  "colorValue": {
    "default": "1.0",
    "labels": ["Data Series Colors"],
    "type": "float (0.0 - 1.0)",
    "description": "If colors is not specified, value of the data series colors, as in hue/saturation/value. (0.0-1.0, default 0.5)"
  },
  "errorBars": {
    "default": "false",
    "labels": ["CSV parsing", "Error Bars"],
    "type": "boolean",
    "description": "Does the data contain standard deviations? Setting this to true alters the input format (see above)."
  },
  "displayAnnotations": {
    "default": "false",
    "labels": ["Annotations"],
    "type": "boolean",
    "description": "Only applies when Dygraphs is used as a GViz chart. Causes string columns following a data series to be interpreted as annotations on points in that series. This is the same format used by Google's AnnotatedTimeLine chart."
  },
  "panEdgeFraction": {
    "default": "null",
    "labels": ["Axis display", "Interactive Elements"],
    "type": "float",
    "default": "null",
    "description": "A value representing the farthest a graph may be panned, in percent of the display. For example, a value of 0.1 means that the graph can only be panned 10% pased the edges of the displayed values. null means no bounds."
  },
  "title": {
    "labels": ["Chart labels"],
    "type": "string",
    "default": "null",
    "description": "Text to display above the chart. You can supply any HTML for this value, not just text. If you wish to style it using CSS, use the 'dygraph-label' or 'dygraph-title' classes."
  },
  "titleHeight": {
    "default": "18",
    "labels": ["Chart labels"],
    "type": "integer",
    "description": "Height of the chart title, in pixels. This also controls the default font size of the title. If you style the title on your own, this controls how much space is set aside above the chart for the title's div."
  },
  "xlabel": {
    "labels": ["Chart labels"],
    "type": "string",
    "default": "null",
    "description": "Text to display below the chart's x-axis. You can supply any HTML for this value, not just text. If you wish to style it using CSS, use the 'dygraph-label' or 'dygraph-xlabel' classes."
  },
  "xLabelHeight": {
    "labels": ["Chart labels"],
    "type": "integer",
    "default": "18",
    "description": "Height of the x-axis label, in pixels. This also controls the default font size of the x-axis label. If you style the label on your own, this controls how much space is set aside below the chart for the x-axis label's div."
  },
  "ylabel": {
    "labels": ["Chart labels"],
    "type": "string",
    "default": "null",
    "description": "Text to display to the left of the chart's y-axis. You can supply any HTML for this value, not just text. If you wish to style it using CSS, use the 'dygraph-label' or 'dygraph-ylabel' classes. The text will be rotated 90 degrees by default, so CSS rules may behave in unintuitive ways. No additional space is set aside for a y-axis label. If you need more space, increase the width of the y-axis tick labels using the yAxisLabelWidth option. If you need a wider div for the y-axis label, either style it that way with CSS (but remember that it's rotated, so width is controlled by the 'height' property) or set the yLabelWidth option."
  },
  "yLabelWidth": {
    "labels": ["Chart labels"],
    "type": "integer",
    "default": "18",
    "description": "Width of the div which contains the y-axis label. Since the y-axis label appears rotated 90 degrees, this actually affects the height of its div."
  },
  "isZoomedIgnoreProgrammaticZoom" : {
    "default": "false",
    "labels": ["Zooming"],
    "type": "boolean",
    "description" : "When this option is passed to updateOptions() along with either the <code>dateWindow</code> or <code>valueRange</code> options, the zoom flags are not changed to reflect a zoomed state. This is primarily useful for when the display area of a chart is changed programmatically and also where manual zooming is allowed and use is made of the <code>isZoomed</code> method to determine this."
  },
  "drawXGrid": {
    "default": "true",
    "labels": ["Grid"],
    "type": "boolean",
    "description" : "Whether to display vertical gridlines under the chart."
  },
  "drawYGrid": {
    "default": "true",
    "labels": ["Grid"],
    "type": "boolean",
    "description" : "Whether to display horizontal gridlines under the chart."
  },
  "drawXAxis": {
    "default": "true",
    "labels": ["Axis display"],
    "type": "boolean",
    "description" : "Whether to draw the x-axis. Setting this to false also prevents x-axis ticks from being drawn and reclaims the space for the chart grid/lines."
  },
  "drawYAxis": {
    "default": "true",
    "labels": ["Axis display"],
    "type": "boolean",
    "description" : "Whether to draw the y-axis. Setting this to false also prevents y-axis ticks from being drawn and reclaims the space for the chart grid/lines."
  },
  "gridLineWidth": {
    "default": "0.3",
    "labels": ["Grid"],
    "type": "float",
    "description" : "Thickness (in pixels) of the gridlines drawn under the chart. The vertical/horizontal gridlines can be turned off entirely by using the drawXGrid and drawYGrid options."
  },
  "axisLineWidth": {
    "default": "0.3",
    "labels": ["Axis display"],
    "type": "float",
    "description" : "Thickness (in pixels) of the x- and y-axis lines."
  },
  "axisLineColor": {
    "default": "black",
    "labels": ["Axis display"],
    "type": "string",
    "description" : "Color of the x- and y-axis lines. Accepts any value which the HTML canvas strokeStyle attribute understands, e.g. 'black' or 'rgb(0, 100, 255)'."
  },
  "fillAlpha": {
    "default": "0.15",
    "labels": ["Error Bars", "Data Series Colors"],
    "type": "float (0.0 - 1.0)",
    "description" : "Error bars (or custom bars) for each series are drawn in the same color as the series, but with partial transparency. This sets the transparency. A value of 0.0 means that the error bars will not be drawn, whereas a value of 1.0 means that the error bars will be as dark as the line for the series itself. This can be used to produce chart lines whose thickness varies at each point."
  },
  "axisLabelColor": {
    "default": "black",
    "labels": ["Axis display"],
    "type": "string",
    "description" : "Color for x- and y-axis labels. This is a CSS color string."
  },
  "axisLabelWidth": {
    "default": "50",
    "labels": ["Axis display", "Chart labels"],
    "type": "integer",
    "description" : "Width (in pixels) of the containing divs for x- and y-axis labels. For the y-axis, this also controls "
  },
  "sigFigs" : {
    "default": "null",
    "labels": ["Value display/formatting"],
    "type": "integer",
    "description": "By default, dygraphs displays numbers with a fixed number of digits after the decimal point. If you'd prefer to have a fixed number of significant figures, set this option to that number of sig figs. A value of 2, for instance, would cause 1 to be display as 1.0 and 1234 to be displayed as 1.23e+3."
  },
  "digitsAfterDecimal" : {
    "default": "2",
    "labels": ["Value display/formatting"],
    "type": "integer",
    "description": "Unless it's run in scientific mode (see the <code>sigFigs</code> option), dygraphs displays numbers with <code>digitsAfterDecimal</code> digits after the decimal point. Trailing zeros are not displayed, so with a value of 2 you'll get '0', '0.1', '0.12', '123.45' but not '123.456' (it will be rounded to '123.46'). Numbers with absolute value less than 0.1^digitsAfterDecimal (i.e. those which would show up as '0.00') will be displayed in scientific notation."
  },
  "maxNumberWidth" : {
    "default": "6",
    "labels": ["Value display/formatting"],
    "type": "integer",
    "description": "When displaying numbers in normal (not scientific) mode, large numbers will be displayed with many trailing zeros (e.g. 100000000 instead of 1e9). This can lead to unwieldy y-axis labels. If there are more than <code>maxNumberWidth</code> digits to the left of the decimal in a number, dygraphs will switch to scientific notation, even when not operating in scientific mode. If you'd like to see all those digits, set this to something large, like 20 or 30."
  },
  "file": {
    "default": "(set when constructed)",
    "labels": ["Data"],
    "type": "string (URL of CSV or CSV), GViz DataTable or 2D Array",
    "description": "Sets the data being displayed in the chart. This can only be set when calling updateOptions; it cannot be set from the constructor. For a full description of valid data formats, see the <a href='http://dygraphs.com/data.html'>Data Formats</a> page."
  }
}
;  // </JSON>
// NOTE: in addition to parsing as JS, this snippet is expected to be valid
// JSON. This assumption cannot be checked in JS, but it will be checked when
// documentation is generated by the generate-documentation.py script. For the
// most part, this just means that you should always use double quotes.

// Do a quick sanity check on the options reference.
(function() {
  var warn = function(msg) { if (console) console.warn(msg); };
  var flds = ['type', 'default', 'description'];
  var valid_cats = [ 
   'Annotations',
   'Axis display',
   'Chart labels',
   'CSV parsing',
   'Callbacks',
   'Data',
   'Data Line display',
   'Data Series Colors',
   'Error Bars',
   'Grid',
   'Interactive Elements',
   'Legend',
   'Overall display',
   'Rolling Averages',
   'Value display/formatting',
   'Zooming'
  ];
  var cats = {};
  for (var i = 0; i < valid_cats.length; i++) cats[valid_cats[i]] = true;

  for (var k in Dygraph.OPTIONS_REFERENCE) {
    if (!Dygraph.OPTIONS_REFERENCE.hasOwnProperty(k)) continue;
    var op = Dygraph.OPTIONS_REFERENCE[k];
    for (var i = 0; i < flds.length; i++) {
      if (!op.hasOwnProperty(flds[i])) {
        warn('Option ' + k + ' missing "' + flds[i] + '" property');
      } else if (typeof(op[flds[i]]) != 'string') {
        warn(k + '.' + flds[i] + ' must be of type string');
      }
    }
    var labels = op['labels'];
    if (typeof(labels) !== 'object') {
      warn('Option "' + k + '" is missing a "labels": [...] option');
    } else {
      for (var i = 0; i < labels.length; i++) {
        if (!cats.hasOwnProperty(labels[i])) {
          warn('Option "' + k + '" has label "' + labels[i] +
               '", which is invalid.');
        }
      }
    }
  }
})();
// </REMOVE_FOR_COMBINED>
