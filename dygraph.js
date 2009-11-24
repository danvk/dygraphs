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

  strokeWidth: 1.0,

  // TODO(danvk): default padding

  showRoller: false,
  xValueFormatter: Dygraph.dateString_,
  xValueParser: Dygraph.dateParser,
  xTicker: Dygraph.dateTicker,

  sigma: 2.0,
  errorBars: false,
  fractions: false,
  wilsonInterval: true,  // only relevant if fractions is true
  customBars: false
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
    MochiKit.Base.update(attrs, { 'labels': new_labels });
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
  this.customBars_ = attrs.customBars || false;

  // If the div isn't already sized then give it a default size.
  if (div.style.width == '') {
    div.style.width = Dygraph.DEFAULT_WIDTH + "px";
  }
  if (div.style.height == '') {
    div.style.height = Dygraph.DEFAULT_HEIGHT + "px";
  }
  this.width_ = parseInt(div.style.width, 10);
  this.height_ = parseInt(div.style.height, 10);

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
  MochiKit.Base.update(this.user_attrs_, attrs);

  this.attrs_ = {};
  MochiKit.Base.update(this.attrs_, Dygraph.DEFAULT_ATTRS);

  // Make a note of whether labels will be pulled from the CSV file.
  this.labelsFromCSV_ = (this.attr_("labels") == null);

  // Create the containing DIV and other interactive elements
  this.createInterface_();

  // Create the PlotKit grapher
  // TODO(danvk): why does the Layout need its own set of options?
  this.layoutOptions_ = { 'errorBars': (this.attr_("errorBars") ||
                                        this.customBars_),
                          'xOriginIsZero': false };
  MochiKit.Base.update(this.layoutOptions_, this.attrs_);
  MochiKit.Base.update(this.layoutOptions_, this.user_attrs_);

  this.layout_ = new DygraphLayout(this.layoutOptions_);

  // TODO(danvk): why does the Renderer need its own set of options?
  this.renderOptions_ = { colorScheme: this.colors_,
                          strokeColor: null,
                          strokeWidth: this.attr_("strokeWidth"),
                          axisLabelFontSize: 14,
                          axisLineWidth: Dygraph.AXIS_LINE_WIDTH };
  MochiKit.Base.update(this.renderOptions_, this.attrs_);
  MochiKit.Base.update(this.renderOptions_, this.user_attrs_);
  this.plotter_ = new DygraphCanvasRenderer(this.hidden_, this.layout_,
                                            this.renderOptions_);

  this.createStatusMessage_();
  this.createRollInterface_();
  this.createDragInterface_();

  // connect(window, 'onload', this, function(e) { this.start_(); });
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
}

/**
 * Generates interface elements for the Dygraph: a containing div, a div to
 * display the current point, and a textbox to adjust the rolling average
 * period.
 * @private
 */
Dygraph.prototype.createInterface_ = function() {
  // Create the all-enclosing graph div
  var enclosing = this.maindiv_;

  this.graphDiv = MochiKit.DOM.DIV( { style: { 'width': this.width_ + "px",
                                                'height': this.height_ + "px"
                                                 }});
  appendChildNodes(enclosing, this.graphDiv);

  // Create the canvas to store
  var canvas = MochiKit.DOM.CANVAS;
  this.canvas_ = canvas( { style: { 'position': 'absolute' },
                          width: this.width_,
                          height: this.height_});
  appendChildNodes(this.graphDiv, this.canvas_);

  this.hidden_ = this.createPlotKitCanvas_(this.canvas_);
  connect(this.hidden_, 'onmousemove', this, function(e) { this.mouseMove_(e) });
  connect(this.hidden_, 'onmouseout', this, function(e) { this.mouseOut_(e) });
}

/**
 * Creates the canvas containing the PlotKit graph. Only plotkit ever draws on
 * this particular canvas. All Dygraph work is done on this.canvas_.
 * @param {Object} canvas The Dygraph canvas to over which to overlay the plot
 * @return {Object} The newly-created canvas
 * @private
 */
Dygraph.prototype.createPlotKitCanvas_ = function(canvas) {
  var h = document.createElement("canvas");
  h.style.position = "absolute";
  h.style.top = canvas.style.top;
  h.style.left = canvas.style.left;
  h.width = this.width_;
  h.height = this.height_;
  MochiKit.DOM.appendChildNodes(this.graphDiv, h);
  return h;
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
      var hue = (1.0*i/(1+num));
      this.colors_.push( MochiKit.Color.Color.fromHSV(hue, sat, val) );
    }
  } else {
    for (var i = 0; i < num; i++) {
      var colorStr = colors[i % colors.length];
      this.colors_.push( MochiKit.Color.Color.fromString(colorStr) );
    }
  }

  // TODO(danvk): update this w/r/t/ the new options system. 
  this.renderOptions_.colorScheme = this.colors_;
  MochiKit.Base.update(this.plotter_.options, this.renderOptions_);
  MochiKit.Base.update(this.layoutOptions_, this.user_attrs_);
  MochiKit.Base.update(this.layoutOptions_, this.attrs_);
}

/**
 * Create the div that contains information on the selected point(s)
 * This goes in the top right of the canvas, unless an external div has already
 * been specified.
 * @private
 */
Dygraph.prototype.createStatusMessage_ = function(){
  if (!this.attr_("labelsDiv")) {
    var divWidth = this.attr_('labelsDivWidth');
    var messagestyle = { "style": {
      "position": "absolute",
      "fontSize": "14px",
      "zIndex": 10,
      "width": divWidth + "px",
      "top": "0px",
      "left": this.width_ - divWidth + "px",
      "background": "white",
      "textAlign": "left",
      "overflow": "hidden"}};
    MochiKit.Base.update(messagestyle["style"], this.attr_('labelsDivStyles'));
    var div = MochiKit.DOM.DIV(messagestyle);
    MochiKit.DOM.appendChildNodes(this.graphDiv, div);
    this.attrs_.labelsDiv = div;
  }
};

/**
 * Create the text box to adjust the averaging period
 * @return {Object} The newly-created text box
 * @private
 */
Dygraph.prototype.createRollInterface_ = function() {
  var padding = this.plotter_.options.padding;
  var display = this.attr_('showRoller') ? "block" : "none";
  var textAttr = { "type": "text",
                   "size": "2",
                   "value": this.rollPeriod_,
                   "style": { "position": "absolute",
                              "zIndex": 10,
                              "top": (this.height_ - 25 - padding.bottom) + "px",
                              "left": (padding.left+1) + "px",
                              "display": display }
                  };
  var roller = MochiKit.DOM.INPUT(textAttr);
  var pa = this.graphDiv;
  MochiKit.DOM.appendChildNodes(pa, roller);
  connect(roller, 'onchange', this,
          function() { this.adjustRoll(roller.value); });
  return roller;
}

/**
 * Set up all the mouse handlers needed to capture dragging behavior for zoom
 * events. Uses MochiKit.Signal to attach all the event handlers.
 * @private
 */
Dygraph.prototype.createDragInterface_ = function() {
  var self = this;

  // Tracks whether the mouse is down right now
  var mouseDown = false;
  var dragStartX = null;
  var dragStartY = null;
  var dragEndX = null;
  var dragEndY = null;
  var prevEndX = null;

  // Utility function to convert page-wide coordinates to canvas coords
  var px = 0;
  var py = 0;
  var getX = function(e) { return e.mouse().page.x - px };
  var getY = function(e) { return e.mouse().page.y - py };

  // Draw zoom rectangles when the mouse is down and the user moves around
  connect(this.hidden_, 'onmousemove', function(event) {
    if (mouseDown) {
      dragEndX = getX(event);
      dragEndY = getY(event);

      self.drawZoomRect_(dragStartX, dragEndX, prevEndX);
      prevEndX = dragEndX;
    }
  });

  // Track the beginning of drag events
  connect(this.hidden_, 'onmousedown', function(event) {
    mouseDown = true;
    px = PlotKit.Base.findPosX(self.canvas_);
    py = PlotKit.Base.findPosY(self.canvas_);
    dragStartX = getX(event);
    dragStartY = getY(event);
  });

  // If the user releases the mouse button during a drag, but not over the
  // canvas, then it doesn't count as a zooming action.
  connect(document, 'onmouseup', this, function(event) {
    if (mouseDown) {
      mouseDown = false;
      dragStartX = null;
      dragStartY = null;
    }
  });

  // Temporarily cancel the dragging event when the mouse leaves the graph
  connect(this.hidden_, 'onmouseout', this, function(event) {
    if (mouseDown) {
      dragEndX = null;
      dragEndY = null;
    }
  });

  // If the mouse is released on the canvas during a drag event, then it's a
  // zoom. Only do the zoom if it's over a large enough area (>= 10 pixels)
  connect(this.hidden_, 'onmouseup', this, function(event) {
    if (mouseDown) {
      mouseDown = false;
      dragEndX = getX(event);
      dragEndY = getY(event);
      var regionWidth = Math.abs(dragEndX - dragStartX);
      var regionHeight = Math.abs(dragEndY - dragStartY);

      if (regionWidth < 2 && regionHeight < 2 &&
          self.attr_('clickCallback') != null &&
          self.lastx_ != undefined) {
        // TODO(danvk): pass along more info about the point.
        self.attr_('clickCallback')(event, new Date(self.lastx_));
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
  });

  // Double-clicking zooms back out
  connect(this.hidden_, 'ondblclick', this, function(event) {
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
  var points = this.layout_.points;
  var minDate = null;
  var maxDate = null;
  // Find the nearest [minDate, maxDate] that contains [lowX, highX]
  for (var i = 0; i < points.length; i++) {
    var cx = points[i].canvasx;
    var x = points[i].xval;
    if (cx < lowX  && (minDate == null || x > minDate)) minDate = x;
    if (cx > highX && (maxDate == null || x < maxDate)) maxDate = x;
  }
  // Use the extremes if either is missing
  if (minDate == null) minDate = points[0].xval;
  if (maxDate == null) maxDate = points[points.length-1].xval;

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
  var canvasx = event.mouse().page.x - PlotKit.Base.findPosX(this.hidden_);
  var points = this.layout_.points;

  var lastx = -1;
  var lasty = -1;

  // Loop through all the points and find the date nearest to our current
  // location.
  var minDist = 1e+100;
  var idx = -1;
  for (var i = 0; i < points.length; i++) {
    var dist = Math.abs(points[i].canvasx - canvasx);
    if (dist > minDist) break;
    minDist = dist;
    idx = i;
  }
  if (idx >= 0) lastx = points[idx].xval;
  // Check that you can really highlight the last day's data
  if (canvasx > points[points.length-1].canvasx)
    lastx = points[points.length-1].xval;

  // Extract the points we've selected
  var selPoints = [];
  for (var i = 0; i < points.length; i++) {
    if (points[i].xval == lastx) {
      selPoints.push(points[i]);
    }
  }

  // Clear the previously drawn vertical, if there is one
  var circleSize = this.attr_('highlightCircleSize');
  var ctx = this.canvas_.getContext("2d");
  if (this.previousVerticalX_ >= 0) {
    var px = this.previousVerticalX_;
    ctx.clearRect(px - circleSize - 1, 0, 2 * circleSize + 2, this.height_);
  }

  if (selPoints.length > 0) {
    var canvasx = selPoints[0].canvasx;

    // Set the status message to indicate the selected point(s)
    var replace = this.attr_('xValueFormatter')(lastx, this) + ":";
    var clen = this.colors_.length;
    for (var i = 0; i < selPoints.length; i++) {
      if (this.attr_("labelsSeparateLines")) {
        replace += "<br/>";
      }
      var point = selPoints[i];
      replace += " <b><font color='" + this.colors_[i%clen].toHexString() + "'>"
              + point.name + "</font></b>:"
              + this.round_(point.yval, 2);
    }
    this.attr_("labelsDiv").innerHTML = replace;

    // Save last x position for callbacks.
    this.lastx_ = lastx;

    // Draw colored circles over the center of each selected point
    ctx.save()
    for (var i = 0; i < selPoints.length; i++) {
      ctx.beginPath();
      ctx.fillStyle = this.colors_[i%clen].toRGBString();
      ctx.arc(canvasx, selPoints[i%clen].canvasy, circleSize, 0, 360, false);
      ctx.fill();
    }
    ctx.restore();

    this.previousVerticalX_ = canvasx;
  }
};

/**
 * The mouse has left the canvas. Clear out whatever artifacts remain
 * @param {Object} event the mouseout event from the browser.
 * @private
 */
Dygraph.prototype.mouseOut_ = function(event) {
  // Get rid of the overlay data
  var ctx = this.canvas_.getContext("2d");
  ctx.clearRect(0, 0, this.width_, this.height_);
  this.attr_("labelsDiv").innerHTML = "";
};

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
  } else if (d.getMinutes()) {
    return zeropad(d.getHours()) + ":" + zeropad(d.getMinutes());
  } else {
    return zeropad(d.getHours());
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
Dygraph.TEN_SECONDLY = 1;
Dygraph.THIRTY_SECONDLY  = 2;
Dygraph.MINUTELY = 3;
Dygraph.TEN_MINUTELY = 4;
Dygraph.THIRTY_MINUTELY = 5;
Dygraph.HOURLY = 6;
Dygraph.SIX_HOURLY = 7;
Dygraph.DAILY = 8;
Dygraph.WEEKLY = 9;
Dygraph.MONTHLY = 10;
Dygraph.QUARTERLY = 11;
Dygraph.BIANNUAL = 12;
Dygraph.ANNUAL = 13;
Dygraph.DECADAL = 14;
Dygraph.NUM_GRANULARITIES = 15;

Dygraph.SHORT_SPACINGS = [];
Dygraph.SHORT_SPACINGS[Dygraph.SECONDLY]        = 1000 * 1;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_SECONDLY]    = 1000 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_SECONDLY] = 1000 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.MINUTELY]        = 1000 * 60;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_MINUTELY]    = 1000 * 60 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_MINUTELY] = 1000 * 60 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]          = 1000 * 3600;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]          = 1000 * 3600 * 6;
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
    var format = '%d%b';  // e.g. "1 Jan"
    // TODO(danvk): be smarter about making sure this really hits a "nice" time.
    if (granularity < Dygraph.HOURLY) {
      start_time = spacing * Math.floor(0.5 + start_time / spacing);
    }
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
  var mults = [1, 2, 5];
  var scale, low_val, high_val, nTicks;
  // TODO(danvk): make it possible to set this for x- and y-axes independently.
  var pixelsPerTick = self.attr_('pixelsPerYLabel');
  for (var i = -10; i < 50; i++) {
    var base_scale = Math.pow(10, i);
    for (var j = 0; j < mults.length; j++) {
      scale = base_scale * mults[j];
      low_val = Math.floor(minV / scale) * scale;
      high_val = Math.ceil(maxV / scale) * scale;
      nTicks = (high_val - low_val) / scale;
      var spacing = self.height_ / nTicks;
      // wish I could break out of both loops at once...
      if (spacing > pixelsPerTick) break;
    }
    if (spacing > pixelsPerTick) break;
  }

  // Construct labels for the ticks
  var ticks = [];
  for (var i = 0; i < nTicks; i++) {
    var tickV = low_val + i * scale;
    var label = self.round_(tickV, 2);
    if (self.attr_("labelsKMB")) {
      var k = 1000;
      if (tickV >= k*k*k) {
        label = self.round_(tickV/(k*k*k), 1) + "B";
      } else if (tickV >= k*k) {
        label = self.round_(tickV/(k*k), 1) + "M";
      } else if (tickV >= k) {
        label = self.round_(tickV/k, 1) + "K";
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

/**
 * Update the graph with new data. Data is in the format
 * [ [date1, val1, val2, ...], [date2, val1, val2, ...] if errorBars=false
 * or, if errorBars=true,
 * [ [date1, [val1,stddev1], [val2,stddev2], ...], [date2, ...], ...]
 * @param {Array.<Object>} data The data (see above)
 * @private
 */
Dygraph.prototype.drawGraph_ = function(data) {
  var maxY = null;
  this.layout_.removeAllDatasets();
  this.setColors_();

  // Loop over all fields in the dataset
  for (var i = 1; i < data[0].length; i++) {
    var series = [];
    for (var j = 0; j < data.length; j++) {
      var date = data[j][0];
      series[j] = [date, data[j][i]];
    }
    series = this.rollingAverage(series, this.rollPeriod_);

    // Prune down to the desired range, if necessary (for zooming)
    var bars = this.attr_("errorBars") || this.customBars_;
    if (this.dateWindow_) {
      var low = this.dateWindow_[0];
      var high= this.dateWindow_[1];
      var pruned = [];
      for (var k = 0; k < series.length; k++) {
        if (series[k][0] >= low && series[k][0] <= high) {
          pruned.push(series[k]);
          var y = bars ? series[k][1][0] : series[k][1];
          if (maxY == null || y > maxY) maxY = y;
        }
      }
      series = pruned;
    } else {
      if (!this.customBars_) {
        for (var j = 0; j < series.length; j++) {
          var y = bars ? series[j][1][0] : series[j][1];
          if (maxY == null || y > maxY) {
            maxY = bars ? y + series[j][1][1] : y;
          }
        }
      } else {
        // With custom bars, maxY is the max of the high values.
        for (var j = 0; j < series.length; j++) {
          var y = series[j][1][0];
          var high = series[j][1][2];
          if (high > y) y = high;
          if (maxY == null || y > maxY) {
            maxY = y;
          }
        }
      }
    }

    if (bars) {
      var vals = [];
      for (var j=0; j<series.length; j++)
        vals[j] = [series[j][0],
                   series[j][1][0], series[j][1][1], series[j][1][2]];
      this.layout_.addDataset(this.attr_("labels")[i], vals);
    } else {
      this.layout_.addDataset(this.attr_("labels")[i], series);
    }
  }

  // Use some heuristics to come up with a good maxY value, unless it's been
  // set explicitly by the user.
  if (this.valueRange_ != null) {
    this.addYTicks_(this.valueRange_[0], this.valueRange_[1]);
  } else {
    // Add some padding and round up to an integer to be human-friendly.
    maxY *= 1.1;
    if (maxY <= 0.0) maxY = 1.0;
    this.addYTicks_(0, maxY);
  }

  this.addXTicks_();

  // Tell PlotKit to use this new data and render itself
  this.layout_.evaluateWithError();
  this.plotter_.clear();
  this.plotter_.render();
  this.canvas_.getContext('2d').clearRect(0, 0,
                                         this.canvas_.width, this.canvas_.height);
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
  } else if (this.customBars_) {
    var low = 0;
    var mid = 0;
    var high = 0;
    var count = 0;
    for (var i = 0; i < originalData.length; i++) {
      var data = originalData[i][1];
      var y = data[1];
      rollingData[i] = [originalData[i][0], [y, y - data[0], data[2] - y]];

      low += data[0];
      mid += y;
      high += data[2];
      count += 1;
      if (i - rollPeriod >= 0) {
        var prev = originalData[i - rollPeriod];
        low -= prev[1][0];
        mid -= prev[1][1];
        high -= prev[1][2];
        count -= 1;
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
      for (var i = 0; i < num_init_points; i++) {
        var sum = 0;
        for (var j = 0; j < i + 1; j++)
          sum += originalData[j][1];
        rollingData[i] = [originalData[i][0], sum / (i + 1)];
      }
      // Calculate the rolling average for the remaining points
      for (var i = Math.min(rollPeriod - 1, originalData.length - 2);
          i < originalData.length;
          i++) {
        var sum = 0;
        for (var j = i - rollPeriod + 1; j < i + 1; j++)
          sum += originalData[j][1];
        rollingData[i] = [originalData[i][0], sum / rollPeriod];
      }
    } else {
      for (var i = 0; i < num_init_points; i++) {
        var sum = 0;
        var variance = 0;
        for (var j = 0; j < i + 1; j++) {
          sum += originalData[j][1][0];
          variance += Math.pow(originalData[j][1][1], 2);
        }
        var stddev = Math.sqrt(variance)/(i+1);
        rollingData[i] = [originalData[i][0],
                          [sum/(i+1), sigma * stddev, sigma * stddev]];
      }
      // Calculate the rolling average for the remaining points
      for (var i = Math.min(rollPeriod - 1, originalData.length - 2);
          i < originalData.length;
          i++) {
        var sum = 0;
        var variance = 0;
        for (var j = i - rollPeriod + 1; j < i + 1; j++) {
          sum += originalData[j][1][0];
          variance += Math.pow(originalData[j][1][1], 2);
        }
        var stddev = Math.sqrt(variance) / rollPeriod;
        rollingData[i] = [originalData[i][0],
                          [sum / rollPeriod, sigma * stddev, sigma * stddev]];
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
  if (dateStr.length == 10 && dateStr.search("-") != -1) {  // e.g. '2009-07-12'
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
  var start = 0;
  if (this.labelsFromCSV_) {
    start = 1;
    this.attrs_.labels = lines[0].split(",");
  }

  var xParser;
  var defaultParserSet = false;  // attempt to auto-detect x value type
  var expectedCols = this.attr_("labels").length;
  for (var i = start; i < lines.length; i++) {
    var line = lines[i];
    if (line.length == 0) continue;  // skip blank lines
    var inFields = line.split(',');
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
    } else if (this.customBars_) {
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
    ret.push(fields);

    if (fields.length != expectedCols) {
      this.error("Number of columns in line " + i + " (" + fields.length +
                 ") does not agree with number of labels (" + expectedCols +
                 ") " + line);
    }
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

  if (MochiKit.Base.isDateLike(data[0][0])) {
    // Some intelligent defaults for a date x-axis.
    this.attrs_.xValueFormatter = Dygraph.dateString_;
    this.attrs_.xTicker = Dygraph.dateTicker;

    // Assume they're all dates.
    var parsedData = MochiKit.Base.clone(data);
    for (var i = 0; i < data.length; i++) {
      if (parsedData[i].length == 0) {
        this.error("Row " << (1 + i) << " of data is empty");
        return null;
      }
      if (parsedData[i][0] == null
          || typeof(parsedData[i][0].getTime) != 'function') {
        this.error("x value in row " << (1 + i) << " is not a Date");
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
  }
  this.attrs_.labels = labels;

  var indepType = data.getColumnType(0);
  if (indepType == 'date') {
    this.attrs_.xValueFormatter = Dygraph.dateString_;
    this.attrs_.xValueParser = Dygraph.dateParser;
    this.attrs_.xTicker = Dygraph.dateTicker;
  } else if (indepType != 'number') {
    this.attrs_.xValueFormatter = function(x) { return x; };
    this.attrs_.xValueParser = function(x) { return parseFloat(x); };
    this.attrs_.xTicker = Dygraph.numericTicks;
  } else {
    this.error("only 'date' and 'number' types are supported for column 1" +
               "of DataTable input (Got '" + indepType + "')");
    return null;
  }

  var ret = [];
  for (var i = 0; i < rows; i++) {
    var row = [];
    if (indepType == 'date') {
      row.push(data.getValue(i, 0).getTime());
    } else {
      row.push(data.getValue(i, 0));
    }
    for (var j = 1; j < cols; j++) {
      row.push(data.getValue(i, j));
    }
    ret.push(row);
  }
  return ret;
}

/**
 * Get the CSV data. If it's in a function, call that function. If it's in a
 * file, do an XMLHttpRequest to get it.
 * @private
 */
Dygraph.prototype.start_ = function() {
  if (typeof this.file_ == 'function') {
    // CSV string. Pretend we got it via XHR.
    this.loadedEvent_(this.file_());
  } else if (MochiKit.Base.isArrayLike(this.file_)) {
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
  if (attrs.customBars) {
    this.customBars_ = attrs.customBars;
  }
  if (attrs.rollPeriod) {
    this.rollPeriod_ = attrs.rollPeriod;
  }
  if (attrs.dateWindow) {
    this.dateWindow_ = attrs.dateWindow;
  }
  if (attrs.valueRange) {
    this.valueRange_ = attrs.valueRange;
  }
  MochiKit.Base.update(this.user_attrs_, attrs);

  this.labelsFromCSV_ = (this.attr_("labels") == null);

  // TODO(danvk): this doesn't match the constructor logic
  this.layout_.updateOptions({ 'errorBars': this.attr_("errorBars") });
  if (attrs['file'] && attrs['file'] != this.file_) {
    this.file_ = attrs['file'];
    this.start_();
  } else {
    this.drawGraph_(this.rawData_);
  }
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

// Older pages may still use this name.
DateGraph = Dygraph;
