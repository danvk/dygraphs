// Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
// All Rights Reserved.

/**
 * @fileoverview Based on PlotKit, but modified to meet the needs of dygraphs.
 * In particular, support for:
 * - grid overlays
 * - error bars
 * - dygraphs attribute system
 */

/**
 * Creates a new DygraphLayout object.
 * @param {Object} options Options for PlotKit.Layout
 * @return {Object} The DygraphLayout object
 */
DygraphLayout = function(dygraph, options) {
  this.dygraph_ = dygraph;
  this.options = {};  // TODO(danvk): remove, use attr_ instead.
  Dygraph.update(this.options, options ? options : {});
  this.datasets = new Array();
  this.annotations = new Array();
};

DygraphLayout.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

DygraphLayout.prototype.addDataset = function(setname, set_xy) {
  this.datasets[setname] = set_xy;
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

DygraphLayout.prototype.evaluate = function() {
  this._evaluateLimits();
  this._evaluateLineCharts();
  this._evaluateLineTicks();
  this._evaluateAnnotations();
};

DygraphLayout.prototype._evaluateLimits = function() {
  this.minxval = this.maxxval = null;
  if (this.options.dateWindow) {
    this.minxval = this.options.dateWindow[0];
    this.maxxval = this.options.dateWindow[1];
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

  for (var i = 0; i < this.options.yAxes.length; i++) {
    var axis = this.options.yAxes[i];
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

DygraphLayout.prototype._evaluateLineCharts = function() {
  // add all the rects
  this.points = new Array();
  for (var setName in this.datasets) {
    if (!this.datasets.hasOwnProperty(setName)) continue;

    var dataset = this.datasets[setName];
    var axis = this.options.yAxes[this.options.seriesToAxisMap[setName]];

    for (var j = 0; j < dataset.length; j++) {
      var item = dataset[j];

      var yval;
      if (axis.logscale) {
        yval = 1.0 - ((Dygraph.log10(parseFloat(item[1])) - Dygraph.log10(axis.minyval)) * axis.ylogscale); // really should just be yscale.
      } else {
        yval = 1.0 - ((parseFloat(item[1]) - axis.minyval) * axis.yscale);
      }
      var point = {
        // TODO(danvk): here
        x: ((parseFloat(item[0]) - this.minxval) * this.xscale),
        y: yval,
        xval: parseFloat(item[0]),
        yval: parseFloat(item[1]),
        name: setName
      };

      this.points.push(point);
    }
  }
};

DygraphLayout.prototype._evaluateLineTicks = function() {
  this.xticks = new Array();
  for (var i = 0; i < this.options.xTicks.length; i++) {
    var tick = this.options.xTicks[i];
    var label = tick.label;
    var pos = this.xscale * (tick.v - this.minxval);
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.xticks.push([pos, label]);
    }
  }

  this.yticks = new Array();
  for (var i = 0; i < this.options.yAxes.length; i++ ) {
    var axis = this.options.yAxes[i];
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
  if (!this.options.errorBars) return;

  // Copy over the error terms
  var i = 0; // index in this.points
  for (var setName in this.datasets) {
    if (!this.datasets.hasOwnProperty(setName)) continue;
    var j = 0;
    var dataset = this.datasets[setName];
    for (var j = 0; j < dataset.length; j++, i++) {
      var item = dataset[j];
      var xv = parseFloat(item[0]);
      var yv = parseFloat(item[1]);

      if (xv == this.points[i].xval &&
          yv == this.points[i].yval) {
        this.points[i].errorMinus = parseFloat(item[2]);
        this.points[i].errorPlus = parseFloat(item[3]);
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
 * Change the values of various layout options
 * @param {Object} new_options an associative array of new properties
 */
DygraphLayout.prototype.updateOptions = function(new_options) {
  Dygraph.update(this.options, new_options ? new_options : {});
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

// Subclass PlotKit.CanvasRenderer to add:
// 1. X/Y grid overlay
// 2. Ability to draw error bars (if required)

/**
 * Sets some PlotKit.CanvasRenderer options
 * @param {Object} element The canvas to attach to
 * @param {Layout} layout The DygraphLayout object for this graph.
 * @param {Object} options Options to pass on to CanvasRenderer
 */
DygraphCanvasRenderer = function(dygraph, element, layout, options) {
  // TODO(danvk): remove options, just use dygraph.attr_.
  this.dygraph_ = dygraph;

  // default options
  this.options = {
    "strokeWidth": 0.5,
    "drawXAxis": true,
    "drawYAxis": true,
    "axisLineColor": "black",
    "axisLineWidth": 0.5,
    "axisTickSize": 3,
    "axisLabelColor": "black",
    "axisLabelFont": "Arial",
    "axisLabelFontSize": 9,
    "axisLabelWidth": 50,
    "drawYGrid": true,
    "drawXGrid": true,
    "gridLineColor": "rgb(128,128,128)",
    "fillAlpha": 0.15,
    "underlayCallback": null
  };
  Dygraph.update(this.options, options);

  this.layout = layout;
  this.element = element;
  this.container = this.element.parentNode;

  this.height = this.element.height;
  this.width = this.element.width;

  // --- check whether everything is ok before we return
  if (!this.isIE && !(DygraphCanvasRenderer.isSupported(this.element)))
      throw "Canvas is not supported.";

  // internal state
  this.xlabels = new Array();
  this.ylabels = new Array();
  this.annotations = new Array();

  // TODO(danvk): consider all axes in this computation.
  this.area = {
    // TODO(danvk): per-axis setting.
    x: this.options.yAxisLabelWidth + 2 * this.options.axisTickSize,
    y: 0
  };
  this.area.w = this.width - this.area.x - this.options.rightGap;
  this.area.h = this.height - this.options.axisLabelFontSize -
                2 * this.options.axisTickSize;

  // Shrink the drawing area to accomodate additional y-axes.
  if (this.dygraph_.numAxes() == 2) {
    // TODO(danvk): per-axis setting.
    this.area.w -= (this.options.yAxisLabelWidth + 2 * this.options.axisTickSize);
  } else if (this.dygraph_.numAxes() > 2) {
    this.dygraph_.error("Only two y-axes are supported at this time. (Trying " +
                        "to use " + this.dygraph_.numAxes() + ")");
  }

  this.container.style.position = "relative";
  this.container.style.width = this.width + "px";

  // Set up a clipping area for the canvas (and the interaction canvas).
  // This ensures that we don't overdraw.
  var ctx = this.dygraph_.canvas_.getContext("2d");
  ctx.beginPath();
  ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
  ctx.clip();

  ctx = this.dygraph_.hidden_.getContext("2d");
  ctx.beginPath();
  ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
  ctx.clip();
};

DygraphCanvasRenderer.prototype.attr_ = function(x) {
  return this.dygraph_.attr_(x);
};

DygraphCanvasRenderer.prototype.clear = function() {
  if (this.isIE) {
    // VML takes a while to start up, so we just poll every this.IEDelay
    try {
      if (this.clearDelay) {
        this.clearDelay.cancel();
        this.clearDelay = null;
      }
      var context = this.element.getContext("2d");
    }
    catch (e) {
      // TODO(danvk): this is broken, since MochiKit.Async is gone.
      this.clearDelay = MochiKit.Async.wait(this.IEDelay);
      this.clearDelay.addCallback(bind(this.clear, this));
      return;
    }
  }

  var context = this.element.getContext("2d");
  context.clearRect(0, 0, this.width, this.height);

  for (var i = 0; i < this.xlabels.length; i++) {
    var el = this.xlabels[i];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  for (var i = 0; i < this.ylabels.length; i++) {
    var el = this.ylabels[i];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  for (var i = 0; i < this.annotations.length; i++) {
    var el = this.annotations[i];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  this.xlabels = new Array();
  this.ylabels = new Array();
  this.annotations = new Array();
};


DygraphCanvasRenderer.isSupported = function(canvasName) {
  var canvas = null;
  try {
    if (typeof(canvasName) == 'undefined' || canvasName == null)
      canvas = document.createElement("canvas");
    else
      canvas = canvasName;
    var context = canvas.getContext("2d");
  }
  catch (e) {
    var ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
    var opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1);
    if ((!ie) || (ie[1] < 6) || (opera))
      return false;
    return true;
  }
  return true;
};

/**
 * Draw an X/Y grid on top of the existing plot
 */
DygraphCanvasRenderer.prototype.render = function() {
  // Draw the new X/Y grid. Lines appear crisper when pixels are rounded to
  // half-integers. This prevents them from drawing in two rows/cols.
  var ctx = this.element.getContext("2d");
  function halfUp(x){return Math.round(x)+0.5};
  function halfDown(y){return Math.round(y)-0.5};

  if (this.options.underlayCallback) {
    // NOTE: we pass the dygraph object to this callback twice to avoid breaking
    // users who expect a deprecated form of this callback.
    this.options.underlayCallback(ctx, this.area, this.dygraph_, this.dygraph_);
  }

  if (this.options.drawYGrid) {
    var ticks = this.layout.yticks;
    ctx.save();
    ctx.strokeStyle = this.options.gridLineColor;
    ctx.lineWidth = this.options.axisLineWidth;
    for (var i = 0; i < ticks.length; i++) {
      // TODO(danvk): allow secondary axes to draw a grid, too.
      if (ticks[i][0] != 0) continue;
      var x = halfUp(this.area.x);
      var y = halfDown(this.area.y + ticks[i][1] * this.area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + this.area.w, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  if (this.options.drawXGrid) {
    var ticks = this.layout.xticks;
    ctx.save();
    ctx.strokeStyle = this.options.gridLineColor;
    ctx.lineWidth = this.options.axisLineWidth;
    for (var i=0; i<ticks.length; i++) {
      var x = halfUp(this.area.x + ticks[i][0] * this.area.w);
      var y = halfDown(this.area.y + this.area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, this.area.y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Do the ordinary rendering, as before
  this._renderLineChart();
  this._renderAxis();
  this._renderAnnotations();
};


DygraphCanvasRenderer.prototype._renderAxis = function() {
  if (!this.options.drawXAxis && !this.options.drawYAxis)
    return;

  // Round pixels to half-integer boundaries for crisper drawing.
  function halfUp(x){return Math.round(x)+0.5};
  function halfDown(y){return Math.round(y)-0.5};

  var context = this.element.getContext("2d");

  var labelStyle = {
    "position": "absolute",
    "fontSize": this.options.axisLabelFontSize + "px",
    "zIndex": 10,
    "color": this.options.axisLabelColor,
    "width": this.options.axisLabelWidth + "px",
    "overflow": "hidden"
  };
  var makeDiv = function(txt) {
    var div = document.createElement("div");
    for (var name in labelStyle) {
      if (labelStyle.hasOwnProperty(name)) {
        div.style[name] = labelStyle[name];
      }
    }
    div.appendChild(document.createTextNode(txt));
    return div;
  };

  // axis lines
  context.save();
  context.strokeStyle = this.options.axisLineColor;
  context.lineWidth = this.options.axisLineWidth;

  if (this.options.drawYAxis) {
    if (this.layout.yticks && this.layout.yticks.length > 0) {
      for (var i = 0; i < this.layout.yticks.length; i++) {
        var tick = this.layout.yticks[i];
        if (typeof(tick) == "function") return;
        var x = this.area.x;
        var sgn = 1;
        if (tick[0] == 1) {  // right-side y-axis
          x = this.area.x + this.area.w;
          sgn = -1;
        }
        var y = this.area.y + tick[1] * this.area.h;
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x - sgn * this.options.axisTickSize), halfDown(y));
        context.closePath();
        context.stroke();

        var label = makeDiv(tick[2]);
        var top = (y - this.options.axisLabelFontSize / 2);
        if (top < 0) top = 0;

        if (top + this.options.axisLabelFontSize + 3 > this.height) {
          label.style.bottom = "0px";
        } else {
          label.style.top = top + "px";
        }
        if (tick[0] == 0) {
          label.style.left = "0px";
          label.style.textAlign = "right";
        } else if (tick[0] == 1) {
          label.style.left = (this.area.x + this.area.w +
                              this.options.axisTickSize) + "px";
          label.style.textAlign = "left";
        }
        label.style.width = this.options.yAxisLabelWidth + "px";
        this.container.appendChild(label);
        this.ylabels.push(label);
      }

      // The lowest tick on the y-axis often overlaps with the leftmost
      // tick on the x-axis. Shift the bottom tick up a little bit to
      // compensate if necessary.
      var bottomTick = this.ylabels[0];
      var fontSize = this.options.axisLabelFontSize;
      var bottom = parseInt(bottomTick.style.top) + fontSize;
      if (bottom > this.height - fontSize) {
        bottomTick.style.top = (parseInt(bottomTick.style.top) -
            fontSize / 2) + "px";
      }
    }

    // draw a vertical line on the left to separate the chart from the labels.
    context.beginPath();
    context.moveTo(halfUp(this.area.x), halfDown(this.area.y));
    context.lineTo(halfUp(this.area.x), halfDown(this.area.y + this.area.h));
    context.closePath();
    context.stroke();

    // if there's a secondary y-axis, draw a vertical line for that, too.
    if (this.dygraph_.numAxes() == 2) {
      context.beginPath();
      context.moveTo(halfDown(this.area.x + this.area.w), halfDown(this.area.y));
      context.lineTo(halfDown(this.area.x + this.area.w), halfDown(this.area.y + this.area.h));
      context.closePath();
      context.stroke();
    }
  }

  if (this.options.drawXAxis) {
    if (this.layout.xticks) {
      for (var i = 0; i < this.layout.xticks.length; i++) {
        var tick = this.layout.xticks[i];
        if (typeof(dataset) == "function") return;

        var x = this.area.x + tick[0] * this.area.w;
        var y = this.area.y + this.area.h;
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x), halfDown(y + this.options.axisTickSize));
        context.closePath();
        context.stroke();

        var label = makeDiv(tick[1]);
        label.style.textAlign = "center";
        label.style.bottom = "0px";

        var left = (x - this.options.axisLabelWidth/2);
        if (left + this.options.axisLabelWidth > this.width) {
          left = this.width - this.options.xAxisLabelWidth;
          label.style.textAlign = "right";
        }
        if (left < 0) {
          left = 0;
          label.style.textAlign = "left";
        }

        label.style.left = left + "px";
        label.style.width = this.options.xAxisLabelWidth + "px";
        this.container.appendChild(label);
        this.xlabels.push(label);
      }
    }

    context.beginPath();
    context.moveTo(halfUp(this.area.x), halfDown(this.area.y + this.area.h));
    context.lineTo(halfUp(this.area.x + this.area.w), halfDown(this.area.y + this.area.h));
    context.closePath();
    context.stroke();
  }

  context.restore();
};


DygraphCanvasRenderer.prototype._renderAnnotations = function() {
  var annotationStyle = {
    "position": "absolute",
    "fontSize": this.options.axisLabelFontSize + "px",
    "zIndex": 10,
    "overflow": "hidden"
  };

  var bindEvt = function(eventName, classEventName, p, self) {
    return function(e) {
      var a = p.annotation;
      if (a.hasOwnProperty(eventName)) {
        a[eventName](a, p, self.dygraph_, e);
      } else if (self.dygraph_.attr_(classEventName)) {
        self.dygraph_.attr_(classEventName)(a, p, self.dygraph_,e );
      }
    };
  }

  // Get a list of point with annotations.
  var points = this.layout.annotated_points;
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (p.canvasx < this.area.x || p.canvasx > this.area.x + this.area.w) {
      continue;
    }

    var a = p.annotation;
    var tick_height = 6;
    if (a.hasOwnProperty("tickHeight")) {
      tick_height = a.tickHeight;
    }

    var div = document.createElement("div");
    for (var name in annotationStyle) {
      if (annotationStyle.hasOwnProperty(name)) {
        div.style[name] = annotationStyle[name];
      }
    }
    if (!a.hasOwnProperty('icon')) {
      div.className = "dygraphDefaultAnnotation";
    }
    if (a.hasOwnProperty('cssClass')) {
      div.className += " " + a.cssClass;
    }

    var width = a.hasOwnProperty('width') ? a.width : 16;
    var height = a.hasOwnProperty('height') ? a.height : 16;
    if (a.hasOwnProperty('icon')) {
      var img = document.createElement("img");
      img.src = a.icon;
      img.width = width;
      img.height = height;
      div.appendChild(img);
    } else if (p.annotation.hasOwnProperty('shortText')) {
      div.appendChild(document.createTextNode(p.annotation.shortText));
    }
    div.style.left = (p.canvasx - width / 2) + "px";
    if (a.attachAtBottom) {
      div.style.top = (this.area.h - height - tick_height) + "px";
    } else {
      div.style.top = (p.canvasy - height - tick_height) + "px";
    }
    div.style.width = width + "px";
    div.style.height = height + "px";
    div.title = p.annotation.text;
    div.style.color = this.colors[p.name];
    div.style.borderColor = this.colors[p.name];
    a.div = div;

    Dygraph.addEvent(div, 'click',
        bindEvt('clickHandler', 'annotationClickHandler', p, this));
    Dygraph.addEvent(div, 'mouseover',
        bindEvt('mouseOverHandler', 'annotationMouseOverHandler', p, this));
    Dygraph.addEvent(div, 'mouseout',
        bindEvt('mouseOutHandler', 'annotationMouseOutHandler', p, this));
    Dygraph.addEvent(div, 'dblclick',
        bindEvt('dblClickHandler', 'annotationDblClickHandler', p, this));

    this.container.appendChild(div);
    this.annotations.push(div);

    var ctx = this.element.getContext("2d");
    ctx.strokeStyle = this.colors[p.name];
    ctx.beginPath();
    if (!a.attachAtBottom) {
      ctx.moveTo(p.canvasx, p.canvasy);
      ctx.lineTo(p.canvasx, p.canvasy - 2 - tick_height);
    } else {
      ctx.moveTo(p.canvasx, this.area.h);
      ctx.lineTo(p.canvasx, this.area.h - 2 - tick_height);
    }
    ctx.closePath();
    ctx.stroke();
  }
};


/**
 * Overrides the CanvasRenderer method to draw error bars
 */
DygraphCanvasRenderer.prototype._renderLineChart = function() {
  // TODO(danvk): use this.attr_ for many of these.
  var context = this.element.getContext("2d");
  var colorCount = this.options.colorScheme.length;
  var colorScheme = this.options.colorScheme;
  var fillAlpha = this.options.fillAlpha;
  var errorBars = this.layout.options.errorBars;
  var fillGraph = this.attr_("fillGraph");
  var stackedGraph = this.layout.options.stackedGraph;
  var stepPlot = this.layout.options.stepPlot;

  var setNames = [];
  for (var name in this.layout.datasets) {
    if (this.layout.datasets.hasOwnProperty(name)) {
      setNames.push(name);
    }
  }
  var setCount = setNames.length;

  this.colors = {}
  for (var i = 0; i < setCount; i++) {
    this.colors[setNames[i]] = colorScheme[i % colorCount];
  }

  // Update Points
  // TODO(danvk): here
  for (var i = 0; i < this.layout.points.length; i++) {
    var point = this.layout.points[i];
    point.canvasx = this.area.w * point.x + this.area.x;
    point.canvasy = this.area.h * point.y + this.area.y;
  }

  // create paths
  var isOK = function(x) { return x && !isNaN(x); };

  var ctx = context;
  if (errorBars) {
    if (fillGraph) {
      this.dygraph_.warn("Can't use fillGraph option with error bars");
    }

    for (var i = 0; i < setCount; i++) {
      var setName = setNames[i];
      var axis = this.layout.options.yAxes[
        this.layout.options.seriesToAxisMap[setName]];
      var color = this.colors[setName];

      // setup graphics context
      ctx.save();
      var prevX = NaN;
      var prevY = NaN;
      var prevYs = [-1, -1];
      var yscale = axis.yscale;
      // should be same color as the lines but only 15% opaque.
      var rgb = new RGBColor(color);
      var err_color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' +
                            fillAlpha + ')';
      ctx.fillStyle = err_color;
      ctx.beginPath();
      for (var j = 0; j < this.layout.points.length; j++) {
        var point = this.layout.points[j];
        if (point.name == setName) {
          if (!isOK(point.y)) {
            prevX = NaN;
            continue;
          }

          // TODO(danvk): here
          if (stepPlot) {
            var newYs = [ prevY - point.errorPlus * yscale,
                          prevY + point.errorMinus * yscale ];
            prevY = point.y;
          } else {
            var newYs = [ point.y - point.errorPlus * yscale,
                          point.y + point.errorMinus * yscale ];
          }
          newYs[0] = this.area.h * newYs[0] + this.area.y;
          newYs[1] = this.area.h * newYs[1] + this.area.y;
          if (!isNaN(prevX)) {
            if (stepPlot) {
              ctx.moveTo(prevX, newYs[0]);
            } else {
              ctx.moveTo(prevX, prevYs[0]);
            }
            ctx.lineTo(point.canvasx, newYs[0]);
            ctx.lineTo(point.canvasx, newYs[1]);
            if (stepPlot) {
              ctx.lineTo(prevX, newYs[1]);
            } else {
              ctx.lineTo(prevX, prevYs[1]);
            }
            ctx.closePath();
          }
          prevYs = newYs;
          prevX = point.canvasx;
        }
      }
      ctx.fill();
    }
  } else if (fillGraph) {
    var baseline = []  // for stacked graphs: baseline for filling

    // process sets in reverse order (needed for stacked graphs)
    for (var i = setCount - 1; i >= 0; i--) {
      var setName = setNames[i];
      var color = this.colors[setName];
      var axis = this.layout.options.yAxes[
        this.layout.options.seriesToAxisMap[setName]];
      var axisY = 1.0 + axis.minyval * axis.yscale;
      if (axisY < 0.0) axisY = 0.0;
      else if (axisY > 1.0) axisY = 1.0;
      axisY = this.area.h * axisY + this.area.y;

      // setup graphics context
      ctx.save();
      var prevX = NaN;
      var prevYs = [-1, -1];
      var yscale = axis.yscale;
      // should be same color as the lines but only 15% opaque.
      var rgb = new RGBColor(color);
      var err_color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' +
                            fillAlpha + ')';
      ctx.fillStyle = err_color;
      ctx.beginPath();
      for (var j = 0; j < this.layout.points.length; j++) {
        var point = this.layout.points[j];
        if (point.name == setName) {
          if (!isOK(point.y)) {
            prevX = NaN;
            continue;
          }
          var newYs;
          if (stackedGraph) {
            lastY = baseline[point.canvasx];
            if (lastY === undefined) lastY = axisY;
            baseline[point.canvasx] = point.canvasy;
            newYs = [ point.canvasy, lastY ];
          } else {
            newYs = [ point.canvasy, axisY ];
          }
          if (!isNaN(prevX)) {
            ctx.moveTo(prevX, prevYs[0]);
            if (stepPlot) {
              ctx.lineTo(point.canvasx, prevYs[0]);
            } else {
              ctx.lineTo(point.canvasx, newYs[0]);
            }
            ctx.lineTo(point.canvasx, newYs[1]);
            ctx.lineTo(prevX, prevYs[1]);
            ctx.closePath();
          }
          prevYs = newYs;
          prevX = point.canvasx;
        }
      }
      ctx.fill();
    }
  }

  for (var i = 0; i < setCount; i++) {
    var setName = setNames[i];
    var color = this.colors[setName];
    var strokeWidth = this.dygraph_.attr_("strokeWidth", setName);

    // setup graphics context
    context.save();
    var point = this.layout.points[0];
    var pointSize = this.dygraph_.attr_("pointSize", setName);
    var prevX = null, prevY = null;
    var drawPoints = this.dygraph_.attr_("drawPoints", setName);
    var points = this.layout.points;
    for (var j = 0; j < points.length; j++) {
      var point = points[j];
      if (point.name == setName) {
        if (!isOK(point.canvasy)) {
          if (stepPlot && prevX != null) {
            // Draw a horizontal line to the start of the missing data
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = this.options.strokeWidth;
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(point.canvasx, prevY);
            ctx.stroke();
          }
          // this will make us move to the next point, not draw a line to it.
          prevX = prevY = null;
        } else {
          // A point is "isolated" if it is non-null but both the previous
          // and next points are null.
          var isIsolated = (!prevX && (j == points.length - 1 ||
                                       !isOK(points[j+1].canvasy)));

          if (!prevX) {
            prevX = point.canvasx;
            prevY = point.canvasy;
          } else {
            // TODO(danvk): figure out why this conditional is necessary.
            if (strokeWidth) {
              ctx.beginPath();
              ctx.strokeStyle = color;
              ctx.lineWidth = strokeWidth;
              ctx.moveTo(prevX, prevY);
              if (stepPlot) {
                ctx.lineTo(point.canvasx, prevY);
              }
              prevX = point.canvasx;
              prevY = point.canvasy;
              ctx.lineTo(prevX, prevY);
              ctx.stroke();
            }
          }

          if (drawPoints || isIsolated) {
           ctx.beginPath();
           ctx.fillStyle = color;
           ctx.arc(point.canvasx, point.canvasy, pointSize,
                   0, 2 * Math.PI, false);
           ctx.fill();
          }
        }
      }
    }
  }

  context.restore();
};
