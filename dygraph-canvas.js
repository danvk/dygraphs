// Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
// All Rights Reserved.

/**
 * @fileoverview Based on PlotKit, but modified to meet the needs of dygraphs.
 * In particular, support for:
 * - grid overlays
 * - error bars
 * - dygraphs attribute system
 *
 * High level overview of classes:
 *
 * - DygraphLayout
 *     This contains all the data to be charted.
 *     It uses data coordinates, but also records the chart range (in data
 *     coordinates) and hence is able to calculate percentage positions ('In
 *     this view, Point A lies 25% down the x-axis.')
 *     Two things that it does not do are:
 *     1. Record pixel coordinates for anything.
 *     2. (oddly) determine anything about the layout of chart elements.
 *     The naming is a vestige of Dygraph's original PlotKit roots.
 *
 * - DygraphCanvasRenderer
 *     This class determines the charting area (in pixel coordinates), maps the
 *     percentage coordinates in the DygraphLayout to pixels and draws them.
 *     It's also responsible for creating chart DOM elements, i.e. annotations,
 *     tick mark labels, the title and the x/y-axis labels.
 */

/**
 * Creates a new DygraphLayout object.
 * @return {Object} The DygraphLayout object
 */
DygraphLayout = function(dygraph) {
  this.dygraph_ = dygraph;
  this.datasets = new Array();
  this.annotations = new Array();
  this.yAxes_ = null;

  // TODO(danvk): it's odd that xTicks_ and yTicks_ are inputs, but xticks and
  // yticks are outputs. Clean this up.
  this.xTicks_ = null;
  this.yTicks_ = null;
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

DygraphLayout.prototype.setXTicks = function(xTicks) {
  this.xTicks_ = xTicks;
};

// TODO(danvk): add this to the Dygraph object's API or move it into Layout.
DygraphLayout.prototype.setYAxes = function (yAxes) {
  this.yAxes_ = yAxes;
};

DygraphLayout.prototype.setDateWindow = function(dateWindow) {
  this.dateWindow_ = dateWindow;
};

DygraphLayout.prototype.evaluate = function() {
  this._evaluateLimits();
  this._evaluateLineCharts();
  this._evaluateLineTicks();
  this._evaluateAnnotations();
};

DygraphLayout.prototype._evaluateLimits = function() {
  this.minxval = this.maxxval = null;
  if (this.dateWindow_) {
    this.minxval = this.dateWindow_[0];
    this.maxxval = this.dateWindow_[1];
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

  for (var i = 0; i < this.yAxes_.length; i++) {
    var axis = this.yAxes_[i];
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
    var axis = this.dygraph_.axisPropertiesForSeries(setName);

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
  for (var i = 0; i < this.xTicks_.length; i++) {
    var tick = this.xTicks_[i];
    var label = tick.label;
    var pos = this.xscale * (tick.v - this.minxval);
    if ((pos >= 0.0) && (pos <= 1.0)) {
      this.xticks.push([pos, label]);
    }
  }

  this.yticks = new Array();
  for (var i = 0; i < this.yAxes_.length; i++ ) {
    var axis = this.yAxes_[i];
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
  if (!(this.attr_('errorBars') || this.attr_('customBars'))) return;

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

/**
 * The DygraphCanvasRenderer class does the actual rendering of the chart onto
 * a canvas. It's based on PlotKit.CanvasRenderer.
 * @param {Object} element The canvas to attach to
 * @param {Object} elementContext The 2d context of the canvas (injected so it
 * can be mocked for testing.)
 * @param {Layout} layout The DygraphLayout object for this graph.
 */
DygraphCanvasRenderer = function(dygraph, element, elementContext, layout) {
  this.dygraph_ = dygraph;

  this.layout = layout;
  this.element = element;
  this.elementContext = elementContext;
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
  this.chartLabels = {};

  this.area = this.computeArea_();
  this.container.style.position = "relative";
  this.container.style.width = this.width + "px";

  // Set up a clipping area for the canvas (and the interaction canvas).
  // This ensures that we don't overdraw.
  var ctx = this.dygraph_.canvas_ctx_;
  ctx.beginPath();
  ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
  ctx.clip();

  ctx = this.dygraph_.hidden_ctx_;
  ctx.beginPath();
  ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
  ctx.clip();
};

DygraphCanvasRenderer.prototype.attr_ = function(x) {
  return this.dygraph_.attr_(x);
};

// Compute the box which the chart should be drawn in. This is the canvas's
// box, less space needed for axis and chart labels.
// TODO(danvk): this belongs in DygraphLayout.
DygraphCanvasRenderer.prototype.computeArea_ = function() {
  var area = {
    // TODO(danvk): per-axis setting.
    x: 0,
    y: 0
  };
  if (this.attr_('drawYAxis')) {
   area.x = this.attr_('yAxisLabelWidth') + 2 * this.attr_('axisTickSize');
  }

  area.w = this.width - area.x - this.attr_('rightGap');
  area.h = this.height;
  if (this.attr_('drawXAxis')) {
    if (this.attr_('xAxisHeight')) {
      area.h -= this.attr_('xAxisHeight');
    } else {
      area.h -= this.attr_('axisLabelFontSize') + 2 * this.attr_('axisTickSize');
    }
  }

  // Shrink the drawing area to accomodate additional y-axes.
  if (this.dygraph_.numAxes() == 2) {
    // TODO(danvk): per-axis setting.
    area.w -= (this.attr_('yAxisLabelWidth') + 2 * this.attr_('axisTickSize'));
  } else if (this.dygraph_.numAxes() > 2) {
    this.dygraph_.error("Only two y-axes are supported at this time. (Trying " +
                        "to use " + this.dygraph_.numAxes() + ")");
  }

  // Add space for chart labels: title, xlabel and ylabel.
  if (this.attr_('title')) {
    area.h -= this.attr_('titleHeight');
    area.y += this.attr_('titleHeight');
  }
  if (this.attr_('xlabel')) {
    area.h -= this.attr_('xLabelHeight');
  }
  if (this.attr_('ylabel')) {
    // It would make sense to shift the chart here to make room for the y-axis
    // label, but the default yAxisLabelWidth is large enough that this results
    // in overly-padded charts. The y-axis label should fit fine. If it
    // doesn't, the yAxisLabelWidth option can be increased.
  }

  return area;
};

DygraphCanvasRenderer.prototype.clear = function() {
  if (this.isIE) {
    // VML takes a while to start up, so we just poll every this.IEDelay
    try {
      if (this.clearDelay) {
        this.clearDelay.cancel();
        this.clearDelay = null;
      }
      var context = this.elementContext;
    }
    catch (e) {
      // TODO(danvk): this is broken, since MochiKit.Async is gone.
      this.clearDelay = MochiKit.Async.wait(this.IEDelay);
      this.clearDelay.addCallback(bind(this.clear, this));
      return;
    }
  }

  var context = this.elementContext;
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
  for (var k in this.chartLabels) {
    if (!this.chartLabels.hasOwnProperty(k)) continue;
    var el = this.chartLabels[k];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  this.xlabels = new Array();
  this.ylabels = new Array();
  this.annotations = new Array();
  this.chartLabels = {};
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
 * @param { [String] } colors Array of color strings. Should have one entry for
 * each series to be rendered.
 */
DygraphCanvasRenderer.prototype.setColors = function(colors) {
  this.colorScheme_ = colors;
};

/**
 * Draw an X/Y grid on top of the existing plot
 */
DygraphCanvasRenderer.prototype.render = function() {
  // Draw the new X/Y grid. Lines appear crisper when pixels are rounded to
  // half-integers. This prevents them from drawing in two rows/cols.
  var ctx = this.elementContext;
  function halfUp(x){return Math.round(x)+0.5};
  function halfDown(y){return Math.round(y)-0.5};

  if (this.attr_('underlayCallback')) {
    // NOTE: we pass the dygraph object to this callback twice to avoid breaking
    // users who expect a deprecated form of this callback.
    this.attr_('underlayCallback')(ctx, this.area, this.dygraph_, this.dygraph_);
  }

  if (this.attr_('drawYGrid')) {
    var ticks = this.layout.yticks;
    ctx.save();
    ctx.strokeStyle = this.attr_('gridLineColor');
    ctx.lineWidth = this.attr_('gridLineWidth');
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

  if (this.attr_('drawXGrid')) {
    var ticks = this.layout.xticks;
    ctx.save();
    ctx.strokeStyle = this.attr_('gridLineColor');
    ctx.lineWidth = this.attr_('gridLineWidth');
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
  this._renderChartLabels(); 
  this._renderAnnotations();
};


DygraphCanvasRenderer.prototype._renderAxis = function() {
  if (!this.attr_('drawXAxis') && !this.attr_('drawYAxis')) return;

  // Round pixels to half-integer boundaries for crisper drawing.
  function halfUp(x){return Math.round(x)+0.5};
  function halfDown(y){return Math.round(y)-0.5};

  var context = this.elementContext;

  var labelStyle = {
    position: "absolute",
    fontSize: this.attr_('axisLabelFontSize') + "px",
    zIndex: 10,
    color: this.attr_('axisLabelColor'),
    width: this.attr_('axisLabelWidth') + "px",
    overflow: "hidden"
  };
  var makeDiv = function(txt, axis) {
    var div = document.createElement("div");
    for (var name in labelStyle) {
      if (labelStyle.hasOwnProperty(name)) {
        div.style[name] = labelStyle[name];
      }
    }
    var inner_div = document.createElement("div");
    // TODO(danvk): separate class for secondary y-axis
    inner_div.className = 'dygraph-axis-label dygraph-axis-label-' + axis;
    inner_div.appendChild(document.createTextNode(txt));
    div.appendChild(inner_div);
    return div;
  };

  // axis lines
  context.save();
  context.strokeStyle = this.attr_('axisLineColor');
  context.lineWidth = this.attr_('axisLineWidth');

  if (this.attr_('drawYAxis')) {
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
        context.lineTo(halfUp(x - sgn * this.attr_('axisTickSize')), halfDown(y));
        context.closePath();
        context.stroke();

        var label = makeDiv(tick[2], 'y');
        var top = (y - this.attr_('axisLabelFontSize') / 2);
        if (top < 0) top = 0;

        if (top + this.attr_('axisLabelFontSize') + 3 > this.height) {
          label.style.bottom = "0px";
        } else {
          label.style.top = top + "px";
        }
        if (tick[0] == 0) {
          label.style.left = (this.area.x - this.attr_('yAxisLabelWidth') - this.attr_('axisTickSize')) + "px";
          label.style.textAlign = "right";
        } else if (tick[0] == 1) {
          label.style.left = (this.area.x + this.area.w +
                              this.attr_('axisTickSize')) + "px";
          label.style.textAlign = "left";
        }
        label.style.width = this.attr_('yAxisLabelWidth') + "px";
        this.container.appendChild(label);
        this.ylabels.push(label);
      }

      // The lowest tick on the y-axis often overlaps with the leftmost
      // tick on the x-axis. Shift the bottom tick up a little bit to
      // compensate if necessary.
      var bottomTick = this.ylabels[0];
      var fontSize = this.attr_('axisLabelFontSize');
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

  if (this.attr_('drawXAxis')) {
    if (this.layout.xticks) {
      for (var i = 0; i < this.layout.xticks.length; i++) {
        var tick = this.layout.xticks[i];
        if (typeof(dataset) == "function") return;

        var x = this.area.x + tick[0] * this.area.w;
        var y = this.area.y + this.area.h;
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x), halfDown(y + this.attr_('axisTickSize')));
        context.closePath();
        context.stroke();

        var label = makeDiv(tick[1], 'x');
        label.style.textAlign = "center";
        label.style.top = (y + this.attr_('axisTickSize')) + 'px';

        var left = (x - this.attr_('axisLabelWidth')/2);
        if (left + this.attr_('axisLabelWidth') > this.width) {
          left = this.width - this.attr_('xAxisLabelWidth');
          label.style.textAlign = "right";
        }
        if (left < 0) {
          left = 0;
          label.style.textAlign = "left";
        }

        label.style.left = left + "px";
        label.style.width = this.attr_('xAxisLabelWidth') + "px";
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


DygraphCanvasRenderer.prototype._renderChartLabels = function() {
  // Generate divs for the chart title, xlabel and ylabel.
  // Space for these divs has already been taken away from the charting area in
  // the DygraphCanvasRenderer constructor.
  if (this.attr_('title')) {
    var div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.top = '0px';
    div.style.left = this.area.x + 'px';
    div.style.width = this.area.w + 'px';
    div.style.height = this.attr_('titleHeight') + 'px';
    div.style.textAlign = 'center';
    div.style.fontSize = (this.attr_('titleHeight') - 8) + 'px';
    div.style.fontWeight = 'bold';
    var class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-title';
    class_div.innerHTML = this.attr_('title');
    div.appendChild(class_div);
    this.container.appendChild(div);
    this.chartLabels.title = div;
  }

  if (this.attr_('xlabel')) {
    var div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.bottom = 0;  // TODO(danvk): this is lazy. Calculate style.top.
    div.style.left = this.area.x + 'px';
    div.style.width = this.area.w + 'px';
    div.style.height = this.attr_('xLabelHeight') + 'px';
    div.style.textAlign = 'center';
    div.style.fontSize = (this.attr_('xLabelHeight') - 2) + 'px';

    var class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-xlabel';
    class_div.innerHTML = this.attr_('xlabel');
    div.appendChild(class_div);
    this.container.appendChild(div);
    this.chartLabels.xlabel = div;
  }

  if (this.attr_('ylabel')) {
    var box = {
      left: 0,
      top: this.area.y,
      width: this.attr_('yLabelWidth'),
      height: this.area.h
    };
    // TODO(danvk): is this outer div actually necessary?
    var div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.left = box.left;
    div.style.top = box.top + 'px';
    div.style.width = box.width + 'px';
    div.style.height = box.height + 'px';
    div.style.fontSize = (this.attr_('yLabelWidth') - 2) + 'px';

    var inner_div = document.createElement("div");
    inner_div.style.position = 'absolute';
    inner_div.style.width = box.height + 'px';
    inner_div.style.height = box.width + 'px';
    inner_div.style.top = (box.height / 2 - box.width / 2) + 'px';
    inner_div.style.left = (box.width / 2 - box.height / 2) + 'px';
    inner_div.style.textAlign = 'center';

    // CSS rotation is an HTML5 feature which is not standardized. Hence every
    // browser has its own name for the CSS style.
    inner_div.style.transform = 'rotate(-90deg)';        // HTML5
    inner_div.style.WebkitTransform = 'rotate(-90deg)';  // Safari/Chrome
    inner_div.style.MozTransform = 'rotate(-90deg)';     // Firefox
    inner_div.style.OTransform = 'rotate(-90deg)';       // Opera
    inner_div.style.msTransform = 'rotate(-90deg)';      // IE9

    if (typeof(document.documentMode) !== 'undefined' &&
        document.documentMode < 9) {
      // We're dealing w/ an old version of IE, so we have to rotate the text
      // using a BasicImage transform. This uses a different origin of rotation
      // than HTML5 rotation (top left of div vs. its center).
      inner_div.style.filter =
       'progid:DXImageTransform.Microsoft.BasicImage(rotation=3)';
      inner_div.style.left = '0px';
      inner_div.style.top = '0px';
    }

    var class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-ylabel';
    class_div.innerHTML = this.attr_('ylabel');

    inner_div.appendChild(class_div);
    div.appendChild(inner_div);
    this.container.appendChild(div);
    this.chartLabels.ylabel = div;
  }
};


DygraphCanvasRenderer.prototype._renderAnnotations = function() {
  var annotationStyle = {
    "position": "absolute",
    "fontSize": this.attr_('axisLabelFontSize') + "px",
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

    var ctx = this.elementContext;
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
  var context = this.elementContext;
  var fillAlpha = this.attr_('fillAlpha');
  var errorBars = this.attr_("errorBars") || this.attr_("customBars");
  var fillGraph = this.attr_("fillGraph");
  var stackedGraph = this.attr_("stackedGraph");
  var stepPlot = this.attr_("stepPlot");

  var setNames = [];
  for (var name in this.layout.datasets) {
    if (this.layout.datasets.hasOwnProperty(name)) {
      setNames.push(name);
    }
  }
  var setCount = setNames.length;

  // TODO(danvk): Move this mapping into Dygraph and get it out of here.
  this.colors = {}
  for (var i = 0; i < setCount; i++) {
    this.colors[setNames[i]] = this.colorScheme_[i % this.colorScheme_.length];
  }

  // Update Points
  // TODO(danvk): here
  for (var i = 0; i < this.layout.points.length; i++) {
    var point = this.layout.points[i];
    point.canvasx = this.area.w * point.x + this.area.x;
    point.canvasy = this.area.h * point.y + this.area.y;
  }

  // create paths
  var ctx = context;
  if (errorBars) {
    if (fillGraph) {
      this.dygraph_.warn("Can't use fillGraph option with error bars");
    }

    for (var i = 0; i < setCount; i++) {
      var setName = setNames[i];
      var axis = this.dygraph_.axisPropertiesForSeries(setName);
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
          if (!Dygraph.isOK(point.y)) {
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
      var axis = this.dygraph_.axisPropertiesForSeries(setName);
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
          if (!Dygraph.isOK(point.y)) {
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

  var isNullOrNaN = function(x) {
    return (x === null || isNaN(x));
  };

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
        if (isNullOrNaN(point.canvasy)) {
          if (stepPlot && prevX != null) {
            // Draw a horizontal line to the start of the missing data
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = this.attr_('strokeWidth');
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
                                       isNullOrNaN(points[j+1].canvasy)));

          if (prevX === null) {
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
