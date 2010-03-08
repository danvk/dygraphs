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

 For further documentation and examples, see http://www.danvk.org/dygraphs

 */

/**
 * An interactive, zoomable graph
 * @param {String | Function} file A file containing CSV data or a function that
 * returns this data. The expected format for each line is
 * YYYYMMDD,val1,val2,... or, if attrs.errorBars is set,
 * YYYYMMDD,val1,stddev1,val2,stddev2,...
 * @param {Object} attrs Various other attributes, e.g. errorBars determines
 * whether the input data contains error ranges.
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
Dygraph.toString = function() {
  return this.__repr__();
};

// Various default values
Dygraph.DEFAULT_ROLL_PERIOD = 1;
Dygraph.DEFAULT_WIDTH = 480;
Dygraph.DEFAULT_HEIGHT = 320;
Dygraph.AXIS_LINE_WIDTH = 0.3;

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
  labelsKMB: false,
  labelsKMG2: false,

  strokeWidth: 1.0,

  axisTickSize: 3,
  axisLabelFontSize: 14,
  xAxisLabelWidth: 50,
  yAxisLabelWidth: 50,
  rightGap: 5,

  showRoller: false,
  xValueFormatter: Dygraph.dateString_,
  xValueParser: Dygraph.dateParser,
  xTicker: Dygraph.dateTicker,

  delimiter: ',',

  logScale: false,
  sigma: 2.0,
  errorBars: false,
  fractions: false,
  wilsonInterval: true,  // only relevant if fractions is true
  customBars: false,
  fillGraph: false,
  fillAlpha: 0.15,
  connectSeparatedPoints: false,

  stackedGraph: false,
  hideOverlayOnMouseOut: true
};

// Various logging levels.
Dygraph.DEBUG = 1;
Dygraph.INFO = 2;
Dygraph.WARNING = 3;
Dygraph.ERROR = 3;

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
 * and interaction &lt;canvas&gt; inside of it. See the constructor for details
 * on the parameters.
 * @param {String | Function} file Source data
 * @param {Array.<String>} labels Names of the data series
 * @param {Object} attrs Miscellaneous other options
 * @private
 */
Dygraph.prototype.__init__ = function(div, file, attrs) {
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
  this.valueRange_ = attrs.valueRange || null;
  this.wilsonInterval_ = attrs.wilsonInterval || true;
  this.is_initial_draw_ = true;

  // Clear the div. This ensure that, if multiple dygraphs are passed the same
  // div, then only one will be drawn.
  div.innerHTML = "";

  // If the div isn't already sized then inherit from our attrs or
  // give it a default size.
  if (div.style.width == '') {
    div.style.width = attrs.width || Dygraph.DEFAULT_WIDTH + "px";
  }
  if (div.style.height == '') {
    div.style.height = attrs.height || Dygraph.DEFAULT_HEIGHT + "px";
  }
  this.width_ = parseInt(div.style.width, 10);
  this.height_ = parseInt(div.style.height, 10);
  // The div might have been specified as percent of the current window size,
  // convert that to an appropriate number of pixels.
  if (div.style.width.indexOf("%") == div.style.width.length - 1) {
    // Minus ten pixels  keeps scrollbars from showing up for a 100% width div.
    this.width_ = (this.width_ * self.innerWidth / 100) - 10;
  }
  if (div.style.height.indexOf("%") == div.style.height.length - 1) {
    this.height_ = (this.height_ * self.innerHeight / 100) - 10;
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

  // Make a note of whether labels will be pulled from the CSV file.
  this.labelsFromCSV_ = (this.attr_("labels") == null);

  // Create the containing DIV and other interactive elements
  this.createInterface_();

  this.start_();
};

Dygraph.prototype.attr_ = function(name) {
  if (typeof(this.user_attrs_[name]) != 'undefined') {
    return this.user_attrs_[name];
  } else if (typeof(this.attrs_[name]) != 'undefined') {
    return this.attrs_[name];
  } else {
    return null;
  }
};

// TODO(danvk): any way I can get the line numbers to be this.warn call?
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
}
Dygraph.prototype.info = function(message) {
  this.log(Dygraph.INFO, message);
}
Dygraph.prototype.warn = function(message) {
  this.log(Dygraph.WARNING, message);
}
Dygraph.prototype.error = function(message) {
  this.log(Dygraph.ERROR, message);
}

/**
 * Returns the current rolling period, as set by the user or an option.
 * @return {Number} The number of days in the rolling window
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
  if (this.dateWindow_) return this.dateWindow_;

  // The entire chart is visible.
  var left = this.rawData_[0][0];
  var right = this.rawData_[this.rawData_.length - 1][0];
  return [left, right];
};

/**
 * Returns the currently-visible y-range. This can be affected by zooming,
 * panning or a call to updateOptions.
 * Returns a two-element array: [bottom, top].
 */
Dygraph.prototype.yAxisRange = function() {
  return this.displayedYRange_;
};

/**
 * Convert from data coordinates to canvas/div X/Y coordinates.
 * Returns a two-element array: [X, Y]
 */
Dygraph.prototype.toDomCoords = function(x, y) {
  var ret = [null, null];
  var area = this.plotter_.area;
  if (x !== null) {
    var xRange = this.xAxisRange();
    ret[0] = area.x + (x - xRange[0]) / (xRange[1] - xRange[0]) * area.w;
  }

  if (y !== null) {
    var yRange = this.yAxisRange();
    ret[1] = area.y + (yRange[1] - y) / (yRange[1] - yRange[0]) * area.h;
  }

  return ret;
};

// TODO(danvk): use these functions throughout dygraphs.
/**
 * Convert from canvas/div coords to data coordinates.
 * Returns a two-element array: [X, Y]
 */
Dygraph.prototype.toDataCoords = function(x, y) {
  var ret = [null, null];
  var area = this.plotter_.area;
  if (x !== null) {
    var xRange = this.xAxisRange();
    ret[0] = xRange[0] + (x - area.x) / area.w * (xRange[1] - xRange[0]);
  }

  if (y !== null) {
    var yRange = this.yAxisRange();
    ret[1] = yRange[0] + (area.h - y) / area.h * (yRange[1] - yRange[0]);
  }

  return ret;
};

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

Dygraph.clipCanvas_ = function(cnv, clip) {
  var ctx = cnv.getContext("2d");
  ctx.beginPath();
  ctx.rect(clip.left, clip.top, clip.width, clip.height);
  ctx.clip();
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

  var clip = {
    top: 0,
    left: this.attr_("yAxisLabelWidth") + 2 * this.attr_("axisTickSize")
  };
  clip.width = this.width_ - clip.left - this.attr_("rightGap");
  clip.height = this.height_ - this.attr_("axisLabelFontSize")
      - 2 * this.attr_("axisTickSize");
  this.clippingArea_ = clip;

  // Create the canvas for interactive parts of the chart.
  this.canvas_ = Dygraph.createCanvas();
  this.canvas_.style.position = "absolute";
  this.canvas_.width = this.width_;
  this.canvas_.height = this.height_;
  this.canvas_.style.width = this.width_ + "px";    // for IE
  this.canvas_.style.height = this.height_ + "px";  // for IE
  this.graphDiv.appendChild(this.canvas_);

  // ... and for static parts of the chart.
  this.hidden_ = this.createPlotKitCanvas_(this.canvas_);

  // Make sure we don't overdraw.
  Dygraph.clipCanvas_(this.hidden_, this.clippingArea_);
  Dygraph.clipCanvas_(this.canvas_, this.clippingArea_);

  var dygraph = this;
  Dygraph.addEvent(this.hidden_, 'mousemove', function(e) {
    dygraph.mouseMove_(e);
  });
  Dygraph.addEvent(this.hidden_, 'mouseout', function(e) {
    dygraph.mouseOut_(e);
  });

  // Create the grapher
  // TODO(danvk): why does the Layout need its own set of options?
  this.layoutOptions_ = { 'xOriginIsZero': false };
  Dygraph.update(this.layoutOptions_, this.attrs_);
  Dygraph.update(this.layoutOptions_, this.user_attrs_);
  Dygraph.update(this.layoutOptions_, {
    'errorBars': (this.attr_("errorBars") || this.attr_("customBars")) });

  this.layout_ = new DygraphLayout(this, this.layoutOptions_);

  // TODO(danvk): why does the Renderer need its own set of options?
  this.renderOptions_ = { colorScheme: this.colors_,
                          strokeColor: null,
                          axisLineWidth: Dygraph.AXIS_LINE_WIDTH };
  Dygraph.update(this.renderOptions_, this.attrs_);
  Dygraph.update(this.renderOptions_, this.user_attrs_);
  this.plotter_ = new DygraphCanvasRenderer(this,
                                            this.hidden_, this.layout_,
                                            this.renderOptions_);

  this.createStatusMessage_();
  this.createRollInterface_();
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
 * Creates the canvas containing the PlotKit graph. Only plotkit ever draws on
 * this particular canvas. All Dygraph work is done on this.canvas_.
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
  this.graphDiv.appendChild(h);
  return h;
};

// Taken from MochiKit.Color
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
  // TODO(danvk): compute this directly into this.attrs_['colorScheme'] and do
  // away with this.renderOptions_.
  var num = this.attr_("labels").length - 1;
  this.colors_ = [];
  var colors = this.attr_('colors');
  if (!colors) {
    var sat = this.attr_('colorSaturation') || 1.0;
    var val = this.attr_('colorValue') || 0.5;
    for (var i = 1; i <= num; i++) {
      if (!this.visibility()[i-1]) continue;
      // alternate colors for high contrast.
      var idx = i - parseInt(i % 2 ? i / 2 : (i - num)/2, 10);
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

  // TODO(danvk): update this w/r/t/ the new options system.
  this.renderOptions_.colorScheme = this.colors_;
  Dygraph.update(this.plotter_.options, this.renderOptions_);
  Dygraph.update(this.layoutOptions_, this.user_attrs_);
  Dygraph.update(this.layoutOptions_, this.attrs_);
}

/**
 * Return the list of colors. This is either the list of colors passed in the
 * attributes, or the autogenerated list of rgb(r,g,b) strings.
 * @return {Array<string>} The list of colors.
 */
Dygraph.prototype.getColors = function() {
  return this.colors_;
};

// The following functions are from quirksmode.org with a modification for Safari from
// http://blog.firetree.net/2005/07/04/javascript-find-position/
// http://www.quirksmode.org/js/findpos.html
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
Dygraph.prototype.createStatusMessage_ = function(){
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
 * Create the text box to adjust the averaging period
 * @return {Object} The newly-created text box
 * @private
 */
Dygraph.prototype.createRollInterface_ = function() {
  var display = this.attr_('showRoller') ? "block" : "none";
  var textAttr = { "position": "absolute",
                   "zIndex": 10,
                   "top": (this.plotter_.area.h - 25) + "px",
                   "left": (this.plotter_.area.x + 1) + "px",
                   "display": display
                  };
  var roller = document.createElement("input");
  roller.type = "text";
  roller.size = "2";
  roller.value = this.rollPeriod_;
  for (var name in textAttr) {
    if (textAttr.hasOwnProperty(name)) {
      roller.style[name] = textAttr[name];
    }
  }

  var pa = this.graphDiv;
  pa.appendChild(roller);
  var dygraph = this;
  roller.onchange = function() { dygraph.adjustRoll(roller.value); };
  return roller;
};

// These functions are taken from MochiKit.Signal
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
 * Set up all the mouse handlers needed to capture dragging behavior for zoom
 * events.
 * @private
 */
Dygraph.prototype.createDragInterface_ = function() {
  var self = this;

  // Tracks whether the mouse is down right now
  var isZooming = false;
  var isPanning = false;
  var dragStartX = null;
  var dragStartY = null;
  var dragEndX = null;
  var dragEndY = null;
  var prevEndX = null;
  var draggingDate = null;
  var dateRange = null;

  // Utility function to convert page-wide coordinates to canvas coords
  var px = 0;
  var py = 0;
  var getX = function(e) { return Dygraph.pageX(e) - px };
  var getY = function(e) { return Dygraph.pageX(e) - py };

  // Draw zoom rectangles when the mouse is down and the user moves around
  Dygraph.addEvent(this.hidden_, 'mousemove', function(event) {
    if (isZooming) {
      dragEndX = getX(event);
      dragEndY = getY(event);

      self.drawZoomRect_(dragStartX, dragEndX, prevEndX);
      prevEndX = dragEndX;
    } else if (isPanning) {
      dragEndX = getX(event);
      dragEndY = getY(event);

      // Want to have it so that:
      // 1. draggingDate appears at dragEndX
      // 2. daterange = (dateWindow_[1] - dateWindow_[0]) is unaltered.

      self.dateWindow_[0] = draggingDate - (dragEndX / self.width_) * dateRange;
      self.dateWindow_[1] = self.dateWindow_[0] + dateRange;
      self.drawGraph_(self.rawData_);
    }
  });

  // Track the beginning of drag events
  Dygraph.addEvent(this.hidden_, 'mousedown', function(event) {
    px = Dygraph.findPosX(self.canvas_);
    py = Dygraph.findPosY(self.canvas_);
    dragStartX = getX(event);
    dragStartY = getY(event);

    if (event.altKey || event.shiftKey) {
      if (!self.dateWindow_) return;  // have to be zoomed in to pan.
      isPanning = true;
      dateRange = self.dateWindow_[1] - self.dateWindow_[0];
      draggingDate = (dragStartX / self.width_) * dateRange +
        self.dateWindow_[0];
    } else {
      isZooming = true;
    }
  });

  // If the user releases the mouse button during a drag, but not over the
  // canvas, then it doesn't count as a zooming action.
  Dygraph.addEvent(document, 'mouseup', function(event) {
    if (isZooming || isPanning) {
      isZooming = false;
      dragStartX = null;
      dragStartY = null;
    }

    if (isPanning) {
      isPanning = false;
      draggingDate = null;
      dateRange = null;
    }
  });

  // Temporarily cancel the dragging event when the mouse leaves the graph
  Dygraph.addEvent(this.hidden_, 'mouseout', function(event) {
    if (isZooming) {
      dragEndX = null;
      dragEndY = null;
    }
  });

  // If the mouse is released on the canvas during a drag event, then it's a
  // zoom. Only do the zoom if it's over a large enough area (>= 10 pixels)
  Dygraph.addEvent(this.hidden_, 'mouseup', function(event) {
    if (isZooming) {
      isZooming = false;
      dragEndX = getX(event);
      dragEndY = getY(event);
      var regionWidth = Math.abs(dragEndX - dragStartX);
      var regionHeight = Math.abs(dragEndY - dragStartY);

      if (regionWidth < 2 && regionHeight < 2 &&
          self.attr_('clickCallback') != null &&
          self.lastx_ != undefined) {
        // TODO(danvk): pass along more info about the points.
        self.attr_('clickCallback')(event, self.lastx_, self.selPoints_);
      }

      if (regionWidth >= 10) {
        self.doZoom_(Math.min(dragStartX, dragEndX),
                     Math.max(dragStartX, dragEndX));
      } else {
        self.canvas_.getContext("2d").clearRect(0, 0,
                                           self.canvas_.width,
                                           self.canvas_.height);
      }

      dragStartX = null;
      dragStartY = null;
    }

    if (isPanning) {
      isPanning = false;
      draggingDate = null;
      dateRange = null;
    }
  });

  // Double-clicking zooms back out
  Dygraph.addEvent(this.hidden_, 'dblclick', function(event) {
    if (self.dateWindow_ == null) return;
    self.dateWindow_ = null;
    self.drawGraph_(self.rawData_);
    var minDate = self.rawData_[0][0];
    var maxDate = self.rawData_[self.rawData_.length - 1][0];
    if (self.attr_("zoomCallback")) {
      self.attr_("zoomCallback")(minDate, maxDate);
    }
  });
};

/**
 * Draw a gray zoom rectangle over the desired area of the canvas. Also clears
 * up any previous zoom rectangles that were drawn. This could be optimized to
 * avoid extra redrawing, but it's tricky to avoid interactions with the status
 * dots.
 * @param {Number} startX The X position where the drag started, in canvas
 * coordinates.
 * @param {Number} endX The current X position of the drag, in canvas coords.
 * @param {Number} prevEndX The value of endX on the previous call to this
 * function. Used to avoid excess redrawing
 * @private
 */
Dygraph.prototype.drawZoomRect_ = function(startX, endX, prevEndX) {
  var ctx = this.canvas_.getContext("2d");

  // Clean up from the previous rect if necessary
  if (prevEndX) {
    ctx.clearRect(Math.min(startX, prevEndX), 0,
                  Math.abs(startX - prevEndX), this.height_);
  }

  // Draw a light-grey rectangle to show the new viewing area
  if (endX && startX) {
    ctx.fillStyle = "rgba(128,128,128,0.33)";
    ctx.fillRect(Math.min(startX, endX), 0,
                 Math.abs(endX - startX), this.height_);
  }
};

/**
 * Zoom to something containing [lowX, highX]. These are pixel coordinates
 * in the canvas. The exact zoom window may be slightly larger if there are no
 * data points near lowX or highX. This function redraws the graph.
 * @param {Number} lowX The leftmost pixel value that should be visible.
 * @param {Number} highX The rightmost pixel value that should be visible.
 * @private
 */
Dygraph.prototype.doZoom_ = function(lowX, highX) {
  // Find the earliest and latest dates contained in this canvasx range.
  var r = this.toDataCoords(lowX, null);
  var minDate = r[0];
  r = this.toDataCoords(highX, null);
  var maxDate = r[0];

  this.dateWindow_ = [minDate, maxDate];
  this.drawGraph_(this.rawData_);
  if (this.attr_("zoomCallback")) {
    this.attr_("zoomCallback")(minDate, maxDate);
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
  var canvasx = Dygraph.pageX(event) - Dygraph.findPosX(this.hidden_);
  var points = this.layout_.points;

  var lastx = -1;
  var lasty = -1;

  // Loop through all the points and find the date nearest to our current
  // location.
  var minDist = 1e+100;
  var idx = -1;
  for (var i = 0; i < points.length; i++) {
    var dist = Math.abs(points[i].canvasx - canvasx);
    if (dist > minDist) continue;
    minDist = dist;
    idx = i;
  }
  if (idx >= 0) lastx = points[idx].xval;
  // Check that you can really highlight the last day's data
  if (canvasx > points[points.length-1].canvasx)
    lastx = points[points.length-1].xval;

  // Extract the points we've selected
  this.selPoints_ = [];
  for (var i = 0; i < points.length; i++) {
    if (points[i].xval == lastx) {
      this.selPoints_.push(points[i]);
    }
  }

  if (this.attr_("highlightCallback")) {
    var px = this.lastHighlightCallbackX;
    if (px !== null && lastx != px) {
      // only fire if the selected point has changed.
      this.lastHighlightCallbackX = lastx;
      if (!this.attr_("stackedGraph")) {
        this.attr_("highlightCallback")(event, lastx, this.selPoints_);
      } else {
        // "unstack" the points.
        var callbackPoints = this.selPoints_.map(
            function(p) { return {xval: p.xval, yval: p.yval, name: p.name} });
        var cumulative_sum = 0;
        for (var j = callbackPoints.length - 1; j >= 0; j--) {
          callbackPoints[j].yval -= cumulative_sum;
          cumulative_sum += callbackPoints[j].yval;
        }
        this.attr_("highlightCallback")(event, lastx, callbackPoints);
      }
    }
  }

  // Save last x position for callbacks.
  this.lastx_ = lastx;
  
  this.updateSelection_();
};

/**
 * Draw dots over the selectied points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @private
 */
Dygraph.prototype.updateSelection_ = function() {
  // Clear the previously drawn vertical, if there is one
  var circleSize = this.attr_('highlightCircleSize');
  var ctx = this.canvas_.getContext("2d");
  if (this.previousVerticalX_ >= 0) {
    var px = this.previousVerticalX_;
    ctx.clearRect(px - circleSize - 1, 0, 2 * circleSize + 2, this.height_);
  }

  var isOK = function(x) { return x && !isNaN(x); };

  if (this.selPoints_.length > 0) {
    var canvasx = this.selPoints_[0].canvasx;

    // Set the status message to indicate the selected point(s)
    var replace = this.attr_('xValueFormatter')(this.lastx_, this) + ":";
    var clen = this.colors_.length;
    for (var i = 0; i < this.selPoints_.length; i++) {
      if (!isOK(this.selPoints_[i].canvasy)) continue;
      if (this.attr_("labelsSeparateLines")) {
        replace += "<br/>";
      }
      var point = this.selPoints_[i];
      var c = new RGBColor(this.plotter_.colors[point.name]);
      replace += " <b><font color='" + c.toHex() + "'>"
              + point.name + "</font></b>:"
              + this.round_(point.yval, 2);
    }
    this.attr_("labelsDiv").innerHTML = replace;

    // Draw colored circles over the center of each selected point
    ctx.save();
    for (var i = 0; i < this.selPoints_.length; i++) {
      if (!isOK(this.selPoints_[i].canvasy)) continue;
      ctx.beginPath();
      ctx.fillStyle = this.plotter_.colors[this.selPoints_[i].name];
      ctx.arc(canvasx, this.selPoints_[i].canvasy, circleSize,
              0, 2 * Math.PI, false);
      ctx.fill();
    }
    ctx.restore();

    this.previousVerticalX_ = canvasx;
  }
};

/**
 * Set manually set selected dots, and display information about them
 * @param int row number that should by highlighted
 *            false value clears the selection
 * @public
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
        this.selPoints_.push(this.layout_.points[pos+row]);
      }
      pos += this.layout_.datasets[i].length;
    }
  }
  
  if (this.selPoints_.length) {
    this.lastx_ = this.selPoints_[0].xval;
    this.updateSelection_();
  } else {
    this.lastx_ = -1;
    this.clearSelection();
  }

};

/**
 * The mouse has left the canvas. Clear out whatever artifacts remain
 * @param {Object} event the mouseout event from the browser.
 * @private
 */
Dygraph.prototype.mouseOut_ = function(event) {
  if (this.attr_("hideOverlayOnMouseOut")) {
    this.clearSelection();
  }
};

/**
 * Remove all selection from the canvas
 * @public
 */
Dygraph.prototype.clearSelection = function() {
  // Get rid of the overlay data
  var ctx = this.canvas_.getContext("2d");
  ctx.clearRect(0, 0, this.width_, this.height_);
  this.attr_("labelsDiv").innerHTML = "";
  this.selPoints_ = [];
  this.lastx_ = -1;
}

/**
 * Returns the number of the currently selected row
 * @return int row number, of -1 if nothing is selected
 * @public
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
}

Dygraph.zeropad = function(x) {
  if (x < 10) return "0" + x; else return "" + x;
}

/**
 * Return a string version of the hours, minutes and seconds portion of a date.
 * @param {Number} date The JavaScript date (ms since epoch)
 * @return {String} A time of the form "HH:MM:SS"
 * @private
 */
Dygraph.prototype.hmsString_ = function(date) {
  var zeropad = Dygraph.zeropad;
  var d = new Date(date);
  if (d.getSeconds()) {
    return zeropad(d.getHours()) + ":" +
           zeropad(d.getMinutes()) + ":" +
           zeropad(d.getSeconds());
  } else {
    return zeropad(d.getHours()) + ":" + zeropad(d.getMinutes());
  }
}

/**
 * Convert a JS date (millis since epoch) to YYYY/MM/DD
 * @param {Number} date The JavaScript date (ms since epoch)
 * @return {String} A date of the form "YYYY/MM/DD"
 * @private
 * TODO(danvk): why is this part of the prototype?
 */
Dygraph.dateString_ = function(date, self) {
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
  if (frac) ret = " " + self.hmsString_(date);

  return year + "/" + month + "/" + day + ret;
};

/**
 * Round a number to the specified number of digits past the decimal point.
 * @param {Number} num The number to round
 * @param {Number} places The number of decimals to which to round
 * @return {Number} The rounded number
 * @private
 */
Dygraph.prototype.round_ = function(num, places) {
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
  this.drawGraph_(this.rawData_);
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
  var startDate, endDate;
  if (this.dateWindow_) {
    startDate = this.dateWindow_[0];
    endDate = this.dateWindow_[1];
  } else {
    startDate = this.rawData_[0][0];
    endDate   = this.rawData_[this.rawData_.length - 1][0];
  }

  var xTicks = this.attr_('xTicker')(startDate, endDate, this);
  this.layout_.updateOptions({xTicks: xTicks});
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
Dygraph.NUM_GRANULARITIES = 20;

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

// NumXTicks()
//
//   If we used this time granularity, how many ticks would there be?
//   This is only an approximation, but it's generally good enough.
//
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

    var msInYear = 365.2524 * 24 * 3600 * 1000;
    var num_years = 1.0 * (end_time - start_time) / msInYear;
    return Math.floor(0.5 + 1.0 * num_years * num_months / year_mod);
  }
};

// GetXAxis()
//
//   Construct an x-axis of nicely-formatted times on meaningful boundaries
//   (e.g. 'Jan 09' rather than 'Jan 22, 2009').
//
//   Returns an array containing {v: millis, label: label} dictionaries.
//
Dygraph.prototype.GetXAxis = function(start_time, end_time, granularity) {
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
      var d = new Date(t);
      var frac = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
      if (frac == 0 || granularity >= Dygraph.DAILY) {
        // the extra hour covers DST problems.
        ticks.push({ v:t, label: new Date(t + 3600*1000).strftime(format) });
      } else {
        ticks.push({ v:t, label: this.hmsString_(t) });
      }
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
    }

    var start_year = new Date(start_time).getFullYear();
    var end_year   = new Date(end_time).getFullYear();
    var zeropad = Dygraph.zeropad;
    for (var i = start_year; i <= end_year; i++) {
      if (i % year_mod != 0) continue;
      for (var j = 0; j < months.length; j++) {
        var date_str = i + "/" + zeropad(1 + months[j]) + "/01";
        var t = Date.parse(date_str);
        if (t < start_time || t > end_time) continue;
        ticks.push({ v:t, label: new Date(t).strftime('%b %y') });
      }
    }
  }

  return ticks;
};


/**
 * Add ticks to the x-axis based on a date range.
 * @param {Number} startDate Start of the date window (millis since epoch)
 * @param {Number} endDate End of the date window (millis since epoch)
 * @return {Array.<Object>} Array of {label, value} tuples.
 * @public
 */
Dygraph.dateTicker = function(startDate, endDate, self) {
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
 * Add ticks when the x axis has numbers on it (instead of dates)
 * @param {Number} startDate Start of the date window (millis since epoch)
 * @param {Number} endDate End of the date window (millis since epoch)
 * @return {Array.<Object>} Array of {label, value} tuples.
 * @public
 */
Dygraph.numericTicks = function(minV, maxV, self) {
  // Basic idea:
  // Try labels every 1, 2, 5, 10, 20, 50, 100, etc.
  // Calculate the resulting tick spacing (i.e. this.height_ / nTicks).
  // The first spacing greater than pixelsPerYLabel is what we use.
  // TODO(danvk): version that works on a log scale.
  if (self.attr_("labelsKMG2")) {
    var mults = [1, 2, 4, 8];
  } else {
    var mults = [1, 2, 5];
  }
  var scale, low_val, high_val, nTicks;
  // TODO(danvk): make it possible to set this for x- and y-axes independently.
  var pixelsPerTick = self.attr_('pixelsPerYLabel');
  for (var i = -10; i < 50; i++) {
    if (self.attr_("labelsKMG2")) {
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

  // Construct labels for the ticks
  var ticks = [];
  var k;
  var k_labels = [];
  if (self.attr_("labelsKMB")) {
    k = 1000;
    k_labels = [ "K", "M", "B", "T" ];
  }
  if (self.attr_("labelsKMG2")) {
    if (k) self.warn("Setting both labelsKMB and labelsKMG2. Pick one!");
    k = 1024;
    k_labels = [ "k", "M", "G", "T" ];
  }

  // Allow reverse y-axis if it's explicitly requested.
  if (low_val > high_val) scale *= -1;

  for (var i = 0; i < nTicks; i++) {
    var tickV = low_val + i * scale;
    var absTickV = Math.abs(tickV);
    var label = self.round_(tickV, 2);
    if (k_labels.length) {
      // Round up to an appropriate unit.
      var n = k*k*k*k;
      for (var j = 3; j >= 0; j--, n /= k) {
        if (absTickV >= n) {
          label = self.round_(tickV / n, 1) + k_labels[j];
          break;
        }
      }
    }
    ticks.push( {label: label, v: tickV} );
  }
  return ticks;
};

/**
 * Adds appropriate ticks on the y-axis
 * @param {Number} minY The minimum Y value in the data set
 * @param {Number} maxY The maximum Y value in the data set
 * @private
 */
Dygraph.prototype.addYTicks_ = function(minY, maxY) {
  // Set the number of ticks so that the labels are human-friendly.
  // TODO(danvk): make this an attribute as well.
  var ticks = Dygraph.numericTicks(minY, maxY, this);
  this.layout_.updateOptions( { yAxis: [minY, maxY],
                                yTicks: ticks } );
};

// Computes the range of the data series (including confidence intervals).
// series is either [ [x1, y1], [x2, y2], ... ] or
// [ [x1, [y1, dev_low, dev_high]], [x2, [y2, dev_low, dev_high]], ...
// Returns [low, high]
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
 * Update the graph with new data. Data is in the format
 * [ [date1, val1, val2, ...], [date2, val1, val2, ...] if errorBars=false
 * or, if errorBars=true,
 * [ [date1, [val1,stddev1], [val2,stddev2], ...], [date2, ...], ...]
 * @param {Array.<Object>} data The data (see above)
 * @private
 */
Dygraph.prototype.drawGraph_ = function(data) {
  // This is used to set the second parameter to drawCallback, below.
  var is_initial_draw = this.is_initial_draw_;
  this.is_initial_draw_ = false;

  var minY = null, maxY = null;
  this.layout_.removeAllDatasets();
  this.setColors_();
  this.attrs_['pointSize'] = 0.5 * this.attr_('highlightCircleSize');

  var connectSeparatedPoints = this.attr_('connectSeparatedPoints');

  // For stacked series.
  var cumulative_y = [];
  var stacked_datasets = [];

  // Loop over all fields in the dataset
  for (var i = 1; i < data[0].length; i++) {
    if (!this.visibility()[i - 1]) continue;

    var series = [];
    for (var j = 0; j < data.length; j++) {
      if (data[j][i] || !connectSeparatedPoints) {
        var date = data[j][0];
        series.push([date, data[j][i]]);
      }
    }
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

    var extremes = this.extremeValues_(series);
    var thisMinY = extremes[0];
    var thisMaxY = extremes[1];
    if (!minY || thisMinY < minY) minY = thisMinY;
    if (!maxY || thisMaxY > maxY) maxY = thisMaxY;

    if (bars) {
      var vals = [];
      for (var j=0; j<series.length; j++)
        vals[j] = [series[j][0],
                   series[j][1][0], series[j][1][1], series[j][1][2]];
      this.layout_.addDataset(this.attr_("labels")[i], vals);
    } else if (this.attr_("stackedGraph")) {
      var vals = [];
      var l = series.length;
      var actual_y;
      for (var j = 0; j < l; j++) {
        if (cumulative_y[series[j][0]] === undefined)
          cumulative_y[series[j][0]] = 0;

        actual_y = series[j][1];
        cumulative_y[series[j][0]] += actual_y;

        vals[j] = [series[j][0], cumulative_y[series[j][0]]]

        if (!maxY || cumulative_y[series[j][0]] > maxY)
          maxY = cumulative_y[series[j][0]];
      }
      stacked_datasets.push([this.attr_("labels")[i], vals]);
      //this.layout_.addDataset(this.attr_("labels")[i], vals);
    } else {
      this.layout_.addDataset(this.attr_("labels")[i], series);
    }
  }

  if (stacked_datasets.length > 0) {
    for (var i = (stacked_datasets.length - 1); i >= 0; i--) {
      this.layout_.addDataset(stacked_datasets[i][0], stacked_datasets[i][1]);
    }
  }

  // Use some heuristics to come up with a good maxY value, unless it's been
  // set explicitly by the user.
  if (this.valueRange_ != null) {
    this.addYTicks_(this.valueRange_[0], this.valueRange_[1]);
    this.displayedYRange_ = this.valueRange_;
  } else {
    // This affects the calculation of span, below.
    if (this.attr_("includeZero") && minY > 0) {
      minY = 0;
    }

    // Add some padding and round up to an integer to be human-friendly.
    var span = maxY - minY;
    // special case: if we have no sense of scale, use +/-10% of the sole value.
    if (span == 0) { span = maxY; }
    var maxAxisY = maxY + 0.1 * span;
    var minAxisY = minY - 0.1 * span;

    // Try to include zero and make it minAxisY (or maxAxisY) if it makes sense.
    if (minAxisY < 0 && minY >= 0) minAxisY = 0;
    if (maxAxisY > 0 && maxY <= 0) maxAxisY = 0;

    if (this.attr_("includeZero")) {
      if (maxY < 0) maxAxisY = 0;
      if (minY > 0) minAxisY = 0;
    }

    this.addYTicks_(minAxisY, maxAxisY);
    this.displayedYRange_ = [minAxisY, maxAxisY];
  }

  this.addXTicks_();

  // Tell PlotKit to use this new data and render itself
  this.layout_.updateOptions({dateWindow: this.dateWindow_});
  this.layout_.evaluateWithError();
  this.plotter_.clear();
  this.plotter_.render();
  this.canvas_.getContext('2d').clearRect(0, 0, this.canvas_.width,
                                         this.canvas_.height);

  if (this.attr_("drawCallback") !== null) {
    this.attr_("drawCallback")(this, is_initial_draw);
  }
};

/**
 * Calculates the rolling average of a data set.
 * If originalData is [label, val], rolls the average of those.
 * If originalData is [label, [, it's interpreted as [value, stddev]
 *   and the roll is returned in the same form, with appropriately reduced
 *   stddev for each value.
 * Note that this is where fractional input (i.e. '5/10') is converted into
 *   decimal values.
 * @param {Array} originalData The data in the appropriate format (see above)
 * @param {Number} rollPeriod The number of days over which to average the data
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
    // there is not enough data to roll over the full number of days
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
 * Parses a date, returning the number of milliseconds since epoch. This can be
 * passed in as an xValueParser in the Dygraph constructor.
 * TODO(danvk): enumerate formats that this understands.
 * @param {String} A date in YYYYMMDD format.
 * @return {Number} Milliseconds since epoch.
 * @public
 */
Dygraph.dateParser = function(dateStr, self) {
  var dateStrSlashed;
  var d;
  if (dateStr.search("-") != -1) {  // e.g. '2009-7-12' or '2009-07-12'
    dateStrSlashed = dateStr.replace("-", "/", "g");
    while (dateStrSlashed.search("-") != -1) {
      dateStrSlashed = dateStrSlashed.replace("-", "/");
    }
    d = Date.parse(dateStrSlashed);
  } else if (dateStr.length == 8) {  // e.g. '20090712'
    // TODO(danvk): remove support for this format. It's confusing.
    dateStrSlashed = dateStr.substr(0,4) + "/" + dateStr.substr(4,2)
                       + "/" + dateStr.substr(6,2);
    d = Date.parse(dateStrSlashed);
  } else {
    // Any format that Date.parse will accept, e.g. "2009/07/12" or
    // "2009/07/12 12:34:56"
    d = Date.parse(dateStr);
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
  if (str.indexOf('-') >= 0 ||
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
  } else {
    this.attrs_.xValueFormatter = function(x) { return x; };
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.xTicker = Dygraph.numericTicks;
  }
};

/**
 * Parses a string in a special csv format.  We expect a csv file where each
 * line is a date point, and the first field in each line is the date string.
 * We also expect that all remaining fields represent series.
 * if the errorBars attribute is set, then interpret the fields as:
 * date, series1, stddev1, series2, stddev2, ...
 * @param {Array.<Object>} data See above.
 * @private
 *
 * @return Array.<Object> An array with one entry for each row. These entries
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
  if (this.labelsFromCSV_) {
    start = 1;
    this.attrs_.labels = lines[0].split(delim);
  }

  var xParser;
  var defaultParserSet = false;  // attempt to auto-detect x value type
  var expectedCols = this.attr_("labels").length;
  var outOfOrder = false;
  for (var i = start; i < lines.length; i++) {
    var line = lines[i];
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
        fields[j] = [parseFloat(vals[0]), parseFloat(vals[1])];
      }
    } else if (this.attr_("errorBars")) {
      // If there are error bars, values are (value, stddev) pairs
      for (var j = 1; j < inFields.length; j += 2)
        fields[(j + 1) / 2] = [parseFloat(inFields[j]),
                               parseFloat(inFields[j + 1])];
    } else if (this.attr_("customBars")) {
      // Bars are a low;center;high tuple
      for (var j = 1; j < inFields.length; j++) {
        var vals = inFields[j].split(";");
        fields[j] = [ parseFloat(vals[0]),
                      parseFloat(vals[1]),
                      parseFloat(vals[2]) ];
      }
    } else {
      // Values are just numbers
      for (var j = 1; j < inFields.length; j++) {
        fields[j] = parseFloat(inFields[j]);
      }
    }
    if (ret.length > 0 && fields[0] < ret[ret.length - 1][0]) {
      outOfOrder = true;
    }
    ret.push(fields);

    if (fields.length != expectedCols) {
      this.error("Number of columns in line " + i + " (" + fields.length +
                 ") does not agree with number of labels (" + expectedCols +
                 ") " + line);
    }
  }

  if (outOfOrder) {
    this.warn("CSV is out of order; order it correctly to speed loading.");
    ret.sort(function(a,b) { return a[0] - b[0] });
  }

  return ret;
};

/**
 * The user has provided their data as a pre-packaged JS array. If the x values
 * are numeric, this is the same as dygraphs' internal format. If the x values
 * are dates, we need to convert them from Date objects to ms since epoch.
 * @param {Array.<Object>} data
 * @return {Array.<Object>} data with numeric x values.
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
    this.attrs_.xTicker = Dygraph.dateTicker;

    // Assume they're all dates.
    var parsedData = Dygraph.clone(data);
    for (var i = 0; i < data.length; i++) {
      if (parsedData[i].length == 0) {
        this.error("Row " << (1 + i) << " of data is empty");
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
 * fixed. Returned value is in the same format as return value of parseCSV_.
 * @param {Array.<Object>} data See above.
 * @private
 */
Dygraph.prototype.parseDataTable_ = function(data) {
  var cols = data.getNumberOfColumns();
  var rows = data.getNumberOfRows();

  // Read column labels
  var labels = [];
  for (var i = 0; i < cols; i++) {
    labels.push(data.getColumnLabel(i));
    if (i != 0 && this.attr_("errorBars")) i += 1;
  }
  this.attrs_.labels = labels;
  cols = labels.length;

  var indepType = data.getColumnType(0);
  if (indepType == 'date' || indepType == 'datetime') {
    this.attrs_.xValueFormatter = Dygraph.dateString_;
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.xTicker = Dygraph.dateTicker;
  } else if (indepType == 'number') {
    this.attrs_.xValueFormatter = function(x) { return x; };
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.xTicker = Dygraph.numericTicks;
  } else {
    this.error("only 'date', 'datetime' and 'number' types are supported for " +
               "column 1 of DataTable input (Got '" + indepType + "')");
    return null;
  }

  var ret = [];
  var outOfOrder = false;
  for (var i = 0; i < rows; i++) {
    var row = [];
    if (typeof(data.getValue(i, 0)) === 'undefined' ||
        data.getValue(i, 0) === null) {
      this.warning("Ignoring row " + i +
                   " of DataTable because of undefined or null first column.");
      continue;
    }

    if (indepType == 'date' || indepType == 'datetime') {
      row.push(data.getValue(i, 0).getTime());
    } else {
      row.push(data.getValue(i, 0));
    }
    if (!this.attr_("errorBars")) {
      for (var j = 1; j < cols; j++) {
        row.push(data.getValue(i, j));
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
  return ret;
}

// These functions are all based on MochiKit.
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

Dygraph.isDateLike = function (o) {
  if (typeof(o) != "object" || o === null ||
      typeof(o.getTime) != 'function') {
    return false;
  }
  return true;
};

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
    this.drawGraph_(this.rawData_);
  } else if (typeof this.file_ == 'object' &&
             typeof this.file_.getColumnRange == 'function') {
    // must be a DataTable from gviz.
    this.rawData_ = this.parseDataTable_(this.file_);
    this.drawGraph_(this.rawData_);
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
 * @param {Object} attrs The new properties and values
 */
Dygraph.prototype.updateOptions = function(attrs) {
  // TODO(danvk): this is a mess. Rethink this function.
  if (attrs.rollPeriod) {
    this.rollPeriod_ = attrs.rollPeriod;
  }
  if (attrs.dateWindow) {
    this.dateWindow_ = attrs.dateWindow;
  }
  if (attrs.valueRange) {
    this.valueRange_ = attrs.valueRange;
  }
  Dygraph.update(this.user_attrs_, attrs);

  this.labelsFromCSV_ = (this.attr_("labels") == null);

  // TODO(danvk): this doesn't match the constructor logic
  this.layout_.updateOptions({ 'errorBars': this.attr_("errorBars") });
  if (attrs['file']) {
    this.file_ = attrs['file'];
    this.start_();
  } else {
    this.drawGraph_(this.rawData_);
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
 * @param {Number} width Width (in pixels)
 * @param {Number} height Height (in pixels)
 */
Dygraph.prototype.resize = function(width, height) {
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
  this.drawGraph_(this.rawData_);
};

/**
 * Adjusts the number of days in the rolling average. Updates the graph to
 * reflect the new averaging period.
 * @param {Number} length Number of days over which to average the data.
 */
Dygraph.prototype.adjustRoll = function(length) {
  this.rollPeriod_ = length;
  this.drawGraph_(this.rawData_);
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
  if (num < 0 && num >= x.length) {
    this.warn("invalid series number in setVisibility: " + num);
  } else {
    x[num] = value;
    this.drawGraph_(this.rawData_);
  }
};

/**
 * Create a new canvas element. This is more complex than a simple
 * document.createElement("canvas") because of IE and excanvas.
 */
Dygraph.createCanvas = function() {
  var canvas = document.createElement("canvas");

  isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);
  if (isIE) {
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
  this.container.innerHTML = '';
  this.date_graph = new Dygraph(this.container, data, options);
}

/**
 * Google charts compatible setSelection
 * Only row selection is supported, all points in the 
 * row will be highlighted
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
