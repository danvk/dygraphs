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
  // save a copy.
  var parse = this.attr_('xValueParser');
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
      var x1 = series[0][0];
      if (!this.minxval || x1 < this.minxval) this.minxval = x1;

      var x2 = series[series.length - 1][0];
      if (!this.maxxval || x2 > this.maxxval) this.maxxval = x2;
    }
  }
  this.xrange = this.maxxval - this.minxval;
  this.xscale = (this.xrange != 0 ? 1/this.xrange : 1.0);

  this.minyval = this.options.yAxis[0];
  this.maxyval = this.options.yAxis[1];
  this.yrange = this.maxyval - this.minyval;
  this.yscale = (this.yrange != 0 ? 1/this.yrange : 1.0);
};

DygraphLayout.prototype._evaluateLineCharts = function() {
  // add all the rects
  this.points = new Array();
  for (var setName in this.datasets) {
    if (!this.datasets.hasOwnProperty(setName)) continue;

    var dataset = this.datasets[setName];
    for (var j = 0; j < dataset.length; j++) {
      var item = dataset[j];
      var point = {
        // TODO(danvk): here
        x: ((parseFloat(item[0]) - this.minxval) * this.xscale),
        y: 1.0 - ((parseFloat(item[1]) - this.minyval) * this.yscale),
        xval: parseFloat(item[0]),
        yval: parseFloat(item[1]),
        name: setName
      };

      // limit the x, y values so they do not overdraw
      if (point.y <= 0.0) {
        point.y = 0.0;
      }
      if (point.y >= 1.0) {
        point.y = 1.0;
      }
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
  for (var i = 0; i < this.options.yTicks.length; i++) {
    var tick = this.options.yTicks[i];
    var label = tick.label;
    var pos = 1.0 - (this.yscale * (tick.v - this.minyval));
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.yticks.push([pos, label]);
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

  this.area = {
    x: this.options.yAxisLabelWidth + 2 * this.options.axisTickSize,
    y: 0
  };
  this.area.w = this.width - this.area.x - this.options.rightGap;
  this.area.h = this.height - this.options.axisLabelFontSize -
                2 * this.options.axisTickSize;

  this.container.style.position = "relative";
  this.container.style.width = this.width + "px";
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
    el.parentNode.removeChild(el);
  }
  for (var i = 0; i < this.ylabels.length; i++) {
    var el = this.ylabels[i];
    el.parentNode.removeChild(el);
  }
  for (var i = 0; i < this.annotations.length; i++) {
    var el = this.annotations[i];
    el.parentNode.removeChild(el);
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
  // Draw the new X/Y grid
  var ctx = this.element.getContext("2d");

  if (this.options.underlayCallback) {
    this.options.underlayCallback(ctx, this.area, this.layout, this.dygraph_);
  }

  if (this.options.drawYGrid) {
    var ticks = this.layout.yticks;
    ctx.save();
    ctx.strokeStyle = this.options.gridLineColor;
    ctx.lineWidth = this.options.axisLineWidth;
    for (var i = 0; i < ticks.length; i++) {
      var x = this.area.x;
      var y = this.area.y + ticks[i][0] * this.area.h;
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
      var x = this.area.x + ticks[i][0] * this.area.w;
      var y = this.area.y + this.area.h;
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
        var y = this.area.y + tick[0] * this.area.h;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - this.options.axisTickSize, y);
        context.closePath();
        context.stroke();

        var label = makeDiv(tick[1]);
        var top = (y - this.options.axisLabelFontSize / 2);
        if (top < 0) top = 0;

        if (top + this.options.axisLabelFontSize + 3 > this.height) {
          label.style.bottom = "0px";
        } else {
          label.style.top = top + "px";
        }
        label.style.left = "0px";
        label.style.textAlign = "right";
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

    context.beginPath();
    context.moveTo(this.area.x, this.area.y);
    context.lineTo(this.area.x, this.area.y + this.area.h);
    context.closePath();
    context.stroke();
  }

  if (this.options.drawXAxis) {
    if (this.layout.xticks) {
      for (var i = 0; i < this.layout.xticks.length; i++) {
        var tick = this.layout.xticks[i];
        if (typeof(dataset) == "function") return;

        var x = this.area.x + tick[0] * this.area.w;
        var y = this.area.y + this.area.h;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + this.options.axisTickSize);
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
    context.moveTo(this.area.x, this.area.y + this.area.h);
    context.lineTo(this.area.x + this.area.w, this.area.y + this.area.h);
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
  };

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
  var context = this.element.getContext("2d");
  var colorCount = this.options.colorScheme.length;
  var colorScheme = this.options.colorScheme;
  var fillAlpha = this.options.fillAlpha;
  var errorBars = this.layout.options.errorBars;
  var fillGraph = this.layout.options.fillGraph;
  var stackedGraph = this.layout.options.stackedGraph;
  var stepPlot = this.layout.options.stepPlot;

  var setNames = [];
  for (var name in this.layout.datasets) {
    if (this.layout.datasets.hasOwnProperty(name)) {
      setNames.push(name);
    }
  }
  var setCount = setNames.length;

  this.colors = {};
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
      var color = this.colors[setName];

      // setup graphics context
      ctx.save();
      var prevX = NaN;
      var prevY = NaN;
      var prevYs = [-1, -1];
      var yscale = this.layout.yscale;
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
    var axisY = 1.0 + this.layout.minyval * this.layout.yscale;
    if (axisY < 0.0) axisY = 0.0;
    else if (axisY > 1.0) axisY = 1.0;
    axisY = this.area.h * axisY + this.area.y;

    var baseline = [];  // for stacked graphs: baseline for filling

    // process sets in reverse order (needed for stacked graphs)
    for (var i = setCount - 1; i >= 0; i--) {
      var setName = setNames[i];
      var color = this.colors[setName];

      // setup graphics context
      ctx.save();
      var prevX = NaN;
      var prevYs = [-1, -1];
      var yscale = this.layout.yscale;
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

    // setup graphics context
    context.save();
    var point = this.layout.points[0];
    var pointSize = this.dygraph_.attr_("pointSize");
    var prevX = null, prevY = null;
    var drawPoints = this.dygraph_.attr_("drawPoints");
    var points = this.layout.points;
    for (var j = 0; j < points.length; j++) {
      var point = points[j];
      if (point.name == setName) {
        if (!isOK(point.canvasy)) {
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
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = this.options.strokeWidth;
            ctx.moveTo(prevX, prevY);
            if (stepPlot) {
              ctx.lineTo(point.canvasx, prevY);
            }
            prevX = point.canvasx;
            prevY = point.canvasy;
            ctx.lineTo(prevX, prevY);
            ctx.stroke();
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
