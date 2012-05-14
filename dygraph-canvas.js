/**
 * @license
 * Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Based on PlotKit.CanvasRenderer, but modified to meet the
 * needs of dygraphs.
 *
 * In particular, support for:
 * - grid overlays
 * - error bars
 * - dygraphs attribute system
 */

/**
 * The DygraphCanvasRenderer class does the actual rendering of the chart onto
 * a canvas. It's based on PlotKit.CanvasRenderer.
 * @param {Object} element The canvas to attach to
 * @param {Object} elementContext The 2d context of the canvas (injected so it
 * can be mocked for testing.)
 * @param {Layout} layout The DygraphLayout object for this graph.
 * @constructor
 */

/*jshint globalstrict: true */
/*global Dygraph:false,RGBColor:false */
"use strict";


var DygraphCanvasRenderer = function(dygraph, element, elementContext, layout) {
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
  this.xlabels = [];
  this.ylabels = [];
  this.annotations = [];
  this.chartLabels = {};

  this.area = layout.getPlotArea();
  this.container.style.position = "relative";
  this.container.style.width = this.width + "px";

  // Set up a clipping area for the canvas (and the interaction canvas).
  // This ensures that we don't overdraw.
  if (this.dygraph_.isUsingExcanvas_) {
    this._createIEClipArea();
  } else {
    // on Android 3 and 4, setting a clipping area on a canvas prevents it from
    // displaying anything.
    if (!Dygraph.isAndroid()) {
      var ctx = this.dygraph_.canvas_ctx_;
      ctx.beginPath();
      ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
      ctx.clip();

      ctx = this.dygraph_.hidden_ctx_;
      ctx.beginPath();
      ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
      ctx.clip();
    }
  }
};

DygraphCanvasRenderer.prototype.attr_ = function(x) {
  return this.dygraph_.attr_(x);
};

DygraphCanvasRenderer.prototype.clear = function() {
  var context;
  if (this.isIE) {
    // VML takes a while to start up, so we just poll every this.IEDelay
    try {
      if (this.clearDelay) {
        this.clearDelay.cancel();
        this.clearDelay = null;
      }
      context = this.elementContext;
    }
    catch (e) {
      // TODO(danvk): this is broken, since MochiKit.Async is gone.
      // this.clearDelay = MochiKit.Async.wait(this.IEDelay);
      // this.clearDelay.addCallback(bind(this.clear, this));
      return;
    }
  }

  context = this.elementContext;
  context.clearRect(0, 0, this.width, this.height);

  function removeArray(ary) {
    for (var i = 0; i < ary.length; i++) {
      var el = ary[i];
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  }

  removeArray(this.xlabels);
  removeArray(this.ylabels);
  removeArray(this.annotations);

  for (var k in this.chartLabels) {
    if (!this.chartLabels.hasOwnProperty(k)) continue;
    var el = this.chartLabels[k];
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  this.xlabels = [];
  this.ylabels = [];
  this.annotations = [];
  this.chartLabels = {};
};


DygraphCanvasRenderer.isSupported = function(canvasName) {
  var canvas = null;
  try {
    if (typeof(canvasName) == 'undefined' || canvasName === null) {
      canvas = document.createElement("canvas");
    } else {
      canvas = canvasName;
    }
    canvas.getContext("2d");
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
  function halfUp(x)  { return Math.round(x) + 0.5; }
  function halfDown(y){ return Math.round(y) - 0.5; }

  if (this.attr_('underlayCallback')) {
    // NOTE: we pass the dygraph object to this callback twice to avoid breaking
    // users who expect a deprecated form of this callback.
    this.attr_('underlayCallback')(ctx, this.area, this.dygraph_, this.dygraph_);
  }

  var x, y, i, ticks;
  if (this.attr_('drawYGrid')) {
    ticks = this.layout.yticks;
    // TODO(konigsberg): I don't think these calls to save() have a corresponding restore().
    ctx.save();
    ctx.strokeStyle = this.attr_('gridLineColor');
    ctx.lineWidth = this.attr_('gridLineWidth');
    for (i = 0; i < ticks.length; i++) {
      // TODO(danvk): allow secondary axes to draw a grid, too.
      if (ticks[i][0] !== 0) continue;
      x = halfUp(this.area.x);
      y = halfDown(this.area.y + ticks[i][1] * this.area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + this.area.w, y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  if (this.attr_('drawXGrid')) {
    ticks = this.layout.xticks;
    ctx.save();
    ctx.strokeStyle = this.attr_('gridLineColor');
    ctx.lineWidth = this.attr_('gridLineWidth');
    for (i=0; i<ticks.length; i++) {
      x = halfUp(this.area.x + ticks[i][0] * this.area.w);
      y = halfDown(this.area.y + this.area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, this.area.y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Do the ordinary rendering, as before
  this._renderLineChart();
  this._renderAxis();
  this._renderChartLabels();
  this._renderAnnotations();
};

DygraphCanvasRenderer.prototype._createIEClipArea = function() {
  var className = 'dygraph-clip-div';
  var graphDiv = this.dygraph_.graphDiv;

  // Remove old clip divs.
  for (var i = graphDiv.childNodes.length-1; i >= 0; i--) {
    if (graphDiv.childNodes[i].className == className) {
      graphDiv.removeChild(graphDiv.childNodes[i]);
    }
  }

  // Determine background color to give clip divs.
  var backgroundColor = document.bgColor;
  var element = this.dygraph_.graphDiv;
  while (element != document) {
    var bgcolor = element.currentStyle.backgroundColor;
    if (bgcolor && bgcolor != 'transparent') {
      backgroundColor = bgcolor;
      break;
    }
    element = element.parentNode;
  }

  function createClipDiv(area) {
    if (area.w === 0 || area.h === 0) {
      return;
    }
    var elem = document.createElement('div');
    elem.className = className;
    elem.style.backgroundColor = backgroundColor;
    elem.style.position = 'absolute';
    elem.style.left = area.x + 'px';
    elem.style.top = area.y + 'px';
    elem.style.width = area.w + 'px';
    elem.style.height = area.h + 'px';
    graphDiv.appendChild(elem);
  }

  var plotArea = this.area;
  // Left side
  createClipDiv({
    x:0, y:0,
    w:plotArea.x,
    h:this.height
  });

  // Top
  createClipDiv({
    x: plotArea.x, y: 0,
    w: this.width - plotArea.x,
    h: plotArea.y
  });

  // Right side
  createClipDiv({
    x: plotArea.x + plotArea.w, y: 0,
    w: this.width-plotArea.x - plotArea.w,
    h: this.height
  });

  // Bottom
  createClipDiv({
    x: plotArea.x,
    y: plotArea.y + plotArea.h,
    w: this.width - plotArea.x,
    h: this.height - plotArea.h - plotArea.y
  });
};

DygraphCanvasRenderer.prototype._renderAxis = function() {
  if (!this.attr_('drawXAxis') && !this.attr_('drawYAxis')) return;

  // Round pixels to half-integer boundaries for crisper drawing.
  function halfUp(x)  { return Math.round(x) + 0.5; }
  function halfDown(y){ return Math.round(y) - 0.5; }

  var context = this.elementContext;

  var label, x, y, tick, i;

  var labelStyle = {
    position: "absolute",
    fontSize: this.attr_('axisLabelFontSize') + "px",
    zIndex: 10,
    color: this.attr_('axisLabelColor'),
    width: this.attr_('axisLabelWidth') + "px",
    // height: this.attr_('axisLabelFontSize') + 2 + "px",
    lineHeight: "normal",  // Something other than "normal" line-height screws up label positioning.
    overflow: "hidden"
  };
  var makeDiv = function(txt, axis, prec_axis) {
    var div = document.createElement("div");
    for (var name in labelStyle) {
      if (labelStyle.hasOwnProperty(name)) {
        div.style[name] = labelStyle[name];
      }
    }
    var inner_div = document.createElement("div");
    inner_div.className = 'dygraph-axis-label' +
                          ' dygraph-axis-label-' + axis +
                          (prec_axis ? ' dygraph-axis-label-' + prec_axis : '');
    inner_div.innerHTML=txt;
    div.appendChild(inner_div);
    return div;
  };

  // axis lines
  context.save();
  context.strokeStyle = this.attr_('axisLineColor');
  context.lineWidth = this.attr_('axisLineWidth');

  if (this.attr_('drawYAxis')) {
    if (this.layout.yticks && this.layout.yticks.length > 0) {
      var num_axes = this.dygraph_.numAxes();
      for (i = 0; i < this.layout.yticks.length; i++) {
        tick = this.layout.yticks[i];
        if (typeof(tick) == "function") return;
        x = this.area.x;
        var sgn = 1;
        var prec_axis = 'y1';
        if (tick[0] == 1) {  // right-side y-axis
          x = this.area.x + this.area.w;
          sgn = -1;
          prec_axis = 'y2';
        }
        y = this.area.y + tick[1] * this.area.h;

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x - sgn * this.attr_('axisTickSize')), halfDown(y));
        context.closePath();
        context.stroke();
        */

        label = makeDiv(tick[2], 'y', num_axes == 2 ? prec_axis : null);
        var top = (y - this.attr_('axisLabelFontSize') / 2);
        if (top < 0) top = 0;

        if (top + this.attr_('axisLabelFontSize') + 3 > this.height) {
          label.style.bottom = "0px";
        } else {
          label.style.top = top + "px";
        }
        if (tick[0] === 0) {
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
      var bottom = parseInt(bottomTick.style.top, 10) + fontSize;
      if (bottom > this.height - fontSize) {
        bottomTick.style.top = (parseInt(bottomTick.style.top, 10) -
            fontSize / 2) + "px";
      }
    }

    // draw a vertical line on the left to separate the chart from the labels.
    var axisX;
    if (this.attr_('drawAxesAtZero')) {
      var r = this.dygraph_.toPercentXCoord(0);
      if (r > 1 || r < 0) r = 0;
      axisX = halfUp(this.area.x + r * this.area.w);
    } else {
      axisX = halfUp(this.area.x);
    }
    context.beginPath();
    context.moveTo(axisX, halfDown(this.area.y));
    context.lineTo(axisX, halfDown(this.area.y + this.area.h));
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
      for (i = 0; i < this.layout.xticks.length; i++) {
        tick = this.layout.xticks[i];
        x = this.area.x + tick[0] * this.area.w;
        y = this.area.y + this.area.h;

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x), halfDown(y + this.attr_('axisTickSize')));
        context.closePath();
        context.stroke();
        */

        label = makeDiv(tick[1], 'x');
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
    var axisY;
    if (this.attr_('drawAxesAtZero')) {
      var r = this.dygraph_.toPercentYCoord(0, 0);
      if (r > 1 || r < 0) r = 1;
      axisY = halfDown(this.area.y + r * this.area.h);
    } else {
      axisY = halfDown(this.area.y + this.area.h);
    }
    context.moveTo(halfUp(this.area.x), axisY);
    context.lineTo(halfUp(this.area.x + this.area.w), axisY);
    context.closePath();
    context.stroke();
  }

  context.restore();
};


DygraphCanvasRenderer.prototype._renderChartLabels = function() {
  var div, class_div;

  // Generate divs for the chart title, xlabel and ylabel.
  // Space for these divs has already been taken away from the charting area in
  // the DygraphCanvasRenderer constructor.
  if (this.attr_('title')) {
    div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.top = '0px';
    div.style.left = this.area.x + 'px';
    div.style.width = this.area.w + 'px';
    div.style.height = this.attr_('titleHeight') + 'px';
    div.style.textAlign = 'center';
    div.style.fontSize = (this.attr_('titleHeight') - 8) + 'px';
    div.style.fontWeight = 'bold';
    class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-title';
    class_div.innerHTML = this.attr_('title');
    div.appendChild(class_div);
    this.container.appendChild(div);
    this.chartLabels.title = div;
  }

  if (this.attr_('xlabel')) {
    div = document.createElement("div");
    div.style.position = 'absolute';
    div.style.bottom = 0;  // TODO(danvk): this is lazy. Calculate style.top.
    div.style.left = this.area.x + 'px';
    div.style.width = this.area.w + 'px';
    div.style.height = this.attr_('xLabelHeight') + 'px';
    div.style.textAlign = 'center';
    div.style.fontSize = (this.attr_('xLabelHeight') - 2) + 'px';

    class_div = document.createElement("div");
    class_div.className = 'dygraph-label dygraph-xlabel';
    class_div.innerHTML = this.attr_('xlabel');
    div.appendChild(class_div);
    this.container.appendChild(div);
    this.chartLabels.xlabel = div;
  }

  var that = this;
  function createRotatedDiv(axis, classes, html) {
    var box = {
      left: 0,
      top: that.area.y,
      width: that.attr_('yLabelWidth'),
      height: that.area.h
    };
    // TODO(danvk): is this outer div actually necessary?
    div = document.createElement("div");
    div.style.position = 'absolute';
    if (axis == 1) {
      div.style.left = box.left;
    } else {
      div.style.right = box.left;
    }
    div.style.top = box.top + 'px';
    div.style.width = box.width + 'px';
    div.style.height = box.height + 'px';
    div.style.fontSize = (that.attr_('yLabelWidth') - 2) + 'px';

    var inner_div = document.createElement("div");
    inner_div.style.position = 'absolute';
    inner_div.style.width = box.height + 'px';
    inner_div.style.height = box.width + 'px';
    inner_div.style.top = (box.height / 2 - box.width / 2) + 'px';
    inner_div.style.left = (box.width / 2 - box.height / 2) + 'px';
    inner_div.style.textAlign = 'center';

    // CSS rotation is an HTML5 feature which is not standardized. Hence every
    // browser has its own name for the CSS style.
    var val = 'rotate(' + (axis == 1 ? '-' : '') + '90deg)';
    inner_div.style.transform = val;        // HTML5
    inner_div.style.WebkitTransform = val;  // Safari/Chrome
    inner_div.style.MozTransform = val;     // Firefox
    inner_div.style.OTransform = val;       // Opera
    inner_div.style.msTransform = val;      // IE9

    if (typeof(document.documentMode) !== 'undefined' &&
        document.documentMode < 9) {
      // We're dealing w/ an old version of IE, so we have to rotate the text
      // using a BasicImage transform. This uses a different origin of rotation
      // than HTML5 rotation (top left of div vs. its center).
      inner_div.style.filter =
          'progid:DXImageTransform.Microsoft.BasicImage(rotation=' +
          (axis == 1 ? '3' : '1') + ')';
      inner_div.style.left = '0px';
      inner_div.style.top = '0px';
    }

    class_div = document.createElement("div");
    class_div.className = classes;
    class_div.innerHTML = html;

    inner_div.appendChild(class_div);
    div.appendChild(inner_div);
    return div;
  }

  var div;
  if (this.attr_('ylabel')) {
    div = createRotatedDiv(1, 'dygraph-label dygraph-ylabel',
                           this.attr_('ylabel'));
    this.container.appendChild(div);
    this.chartLabels.ylabel = div;
  }
  if (this.attr_('y2label') && this.dygraph_.numAxes() == 2) {
    div = createRotatedDiv(2, 'dygraph-label dygraph-y2label',
                           this.attr_('y2label'));
    this.container.appendChild(div);
    this.chartLabels.y2label = div;
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
  };

  // Get a list of point with annotations.
  var points = this.layout.annotated_points;
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (p.canvasx < this.area.x || p.canvasx > this.area.x + this.area.w ||
        p.canvasy < this.area.y || p.canvasy > this.area.y + this.area.h) {
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

    this.dygraph_.addEvent(div, 'click',
        bindEvt('clickHandler', 'annotationClickHandler', p, this));
    this.dygraph_.addEvent(div, 'mouseover',
        bindEvt('mouseOverHandler', 'annotationMouseOverHandler', p, this));
    this.dygraph_.addEvent(div, 'mouseout',
        bindEvt('mouseOutHandler', 'annotationMouseOutHandler', p, this));
    this.dygraph_.addEvent(div, 'dblclick',
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

DygraphCanvasRenderer.makeNextPointStep_ = function(
    connect, points, start, end) {
  if (connect) {
    return function(j) {
      while (++j + start < end) {
        if (!(points[start + j].yval === null)) break;
      }
      return j;
    }
  } else {
    return function(j) { return j + 1 };
  }
};

DygraphCanvasRenderer.prototype._drawStyledLine = function(
    ctx, i, setName, color, strokeWidth, strokePattern, drawPoints,
    drawPointCallback, pointSize) {
  var isNullOrNaN = function(x) {
    return (x === null || isNaN(x));
  };

  var stepPlot = this.attr_("stepPlot");
  var firstIndexInSet = this.layout.setPointsOffsets[i];
  var setLength = this.layout.setPointsLengths[i];
  var afterLastIndexInSet = firstIndexInSet + setLength;
  var points = this.layout.points;
  var prevX = null;
  var prevY = null;
  var nextY = null;
  var pointsOnLine = []; // Array of [canvasx, canvasy] pairs.
  if (!Dygraph.isArrayLike(strokePattern)) {
    strokePattern = null;
  }
  var drawGapPoints = this.dygraph_.attr_('drawGapEdgePoints', setName);

  var point, nextPoint;
  var next = DygraphCanvasRenderer.makeNextPointStep_(
      this.attr_('connectSeparatedPoints'), points, firstIndexInSet,
      afterLastIndexInSet);
  ctx.save();
  for (var j = 0; j < setLength; j = next(j)) {
    point = points[firstIndexInSet + j];
    nextY = (next(j) < setLength) ?
        points[firstIndexInSet + next(j)].canvasy : null;
    if (isNullOrNaN(point.canvasy)) {
      if (stepPlot && prevX !== null) {
        // Draw a horizontal line to the start of the missing data
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = this.attr_('strokeWidth');
        this._dashedLine(ctx, prevX, prevY, point.canvasx, prevY, strokePattern);
        ctx.stroke();
      }
      // this will make us move to the next point, not draw a line to it.
      prevX = prevY = null;
    } else {
      // A point is "isolated" if it is non-null but both the previous
      // and next points are null.
      var isIsolated = (!prevX && isNullOrNaN(nextY));
      if (drawGapPoints) {
        // Also consider a point to be is "isolated" if it's adjacent to a
        // null point, excluding the graph edges.
        if ((j > 0 && !prevX) ||
            (next(j) < setLength && isNullOrNaN(nextY))) {
          isIsolated = true;
        }
      }
      if (prevX === null) {
        prevX = point.canvasx;
        prevY = point.canvasy;
      } else {
        // Skip over points that will be drawn in the same pixel.
        if (Math.round(prevX) == Math.round(point.canvasx) &&
            Math.round(prevY) == Math.round(point.canvasy)) {
          continue;
        }
        // TODO(antrob): skip over points that lie on a line that is already
        // going to be drawn. There is no need to have more than 2
        // consecutive points that are collinear.
        if (strokeWidth) {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          if (stepPlot) {
            this._dashedLine(ctx, prevX, prevY, point.canvasx, prevY, strokePattern);
            prevX = point.canvasx;
          }
          this._dashedLine(ctx, prevX, prevY, point.canvasx, point.canvasy, strokePattern);
          prevX = point.canvasx;
          prevY = point.canvasy;
          ctx.stroke();
        }
      }

      if (drawPoints || isIsolated) {
        pointsOnLine.push([point.canvasx, point.canvasy]);
      }
    }
  }
  for (var idx = 0; idx < pointsOnLine.length; idx++) {
    var cb = pointsOnLine[idx];
    ctx.save();
    drawPointCallback(
        this.dygraph_, setName, ctx, cb[0], cb[1], color, pointSize);
    ctx.restore();
  }
  ctx.restore();
};

DygraphCanvasRenderer.prototype._drawLine = function(ctx, i) {
  var setNames = this.layout.setNames;
  var setName = setNames[i];

  var strokeWidth = this.dygraph_.attr_("strokeWidth", setName);
  var borderWidth = this.dygraph_.attr_("strokeBorderWidth", setName);
  var drawPointCallback = this.dygraph_.attr_("drawPointCallback", setName) ||
      Dygraph.Circles.DEFAULT;
  if (borderWidth && strokeWidth) {
    this._drawStyledLine(ctx, i, setName,
        this.dygraph_.attr_("strokeBorderColor", setName),
        strokeWidth + 2 * borderWidth,
        this.dygraph_.attr_("strokePattern", setName),
        this.dygraph_.attr_("drawPoints", setName),
        drawPointCallback,
        this.dygraph_.attr_("pointSize", setName));
  }

  this._drawStyledLine(ctx, i, setName,
      this.colors[setName],
      strokeWidth,
      this.dygraph_.attr_("strokePattern", setName),
      this.dygraph_.attr_("drawPoints", setName),
      drawPointCallback,
      this.dygraph_.attr_("pointSize", setName));
};

/**
 * Actually draw the lines chart, including error bars.
 * TODO(danvk): split this into several smaller functions.
 * @private
 */
DygraphCanvasRenderer.prototype._renderLineChart = function() {
  // TODO(danvk): use this.attr_ for many of these.
  var ctx = this.elementContext;
  var fillAlpha = this.attr_('fillAlpha');
  var errorBars = this.attr_("errorBars") || this.attr_("customBars");
  var fillGraph = this.attr_("fillGraph");
  var stackedGraph = this.attr_("stackedGraph");
  var stepPlot = this.attr_("stepPlot");
  var points = this.layout.points;
  var pointsLength = points.length;
  var point, i, j, prevX, prevY, prevYs, color, setName, newYs, err_color, rgb, yscale, axis;

  var setNames = this.layout.setNames;
  var setCount = setNames.length;

  // TODO(danvk): Move this mapping into Dygraph and get it out of here.
  this.colors = {};
  for (i = 0; i < setCount; i++) {
    this.colors[setNames[i]] = this.colorScheme_[i % this.colorScheme_.length];
  }

  // Update Points
  // TODO(danvk): here
  for (i = pointsLength; i--;) {
    point = points[i];
    point.canvasx = this.area.w * point.x + this.area.x;
    point.canvasy = this.area.h * point.y + this.area.y;
  }

  // create paths
  if (errorBars) {
    ctx.save();
    if (fillGraph) {
      this.dygraph_.warn("Can't use fillGraph option with error bars");
    }

    for (i = 0; i < setCount; i++) {
      setName = setNames[i];
      axis = this.dygraph_.axisPropertiesForSeries(setName);
      color = this.colors[setName];

      var firstIndexInSet = this.layout.setPointsOffsets[i];
      var setLength = this.layout.setPointsLengths[i];
      var afterLastIndexInSet = firstIndexInSet + setLength;

      var next = DygraphCanvasRenderer.makeNextPointStep_(
        this.attr_('connectSeparatedPoints'), points,
        afterLastIndexInSet);

      // setup graphics context
      prevX = NaN;
      prevY = NaN;
      prevYs = [-1, -1];
      yscale = axis.yscale;
      // should be same color as the lines but only 15% opaque.
      rgb = new RGBColor(color);
      err_color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' +
                            fillAlpha + ')';
      ctx.fillStyle = err_color;
      ctx.beginPath();
      for (j = firstIndexInSet; j < afterLastIndexInSet; j = next(j)) {
        point = points[j];
        if (point.name == setName) { // TODO(klausw): this is always true
          if (!Dygraph.isOK(point.y)) {
            prevX = NaN;
            continue;
          }

          // TODO(danvk): here
          if (stepPlot) {
            newYs = [ point.y_bottom, point.y_top ];
            prevY = point.y;
          } else {
            newYs = [ point.y_bottom, point.y_top ];
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
    ctx.restore();
  } else if (fillGraph) {
    ctx.save();
    var baseline = {};  // for stacked graphs: baseline for filling
    var currBaseline;

    // process sets in reverse order (needed for stacked graphs)
    for (i = setCount - 1; i >= 0; i--) {
      setName = setNames[i];
      color = this.colors[setName];
      axis = this.dygraph_.axisPropertiesForSeries(setName);
      var axisY = 1.0 + axis.minyval * axis.yscale;
      if (axisY < 0.0) axisY = 0.0;
      else if (axisY > 1.0) axisY = 1.0;
      axisY = this.area.h * axisY + this.area.y;
      var firstIndexInSet = this.layout.setPointsOffsets[i];
      var setLength = this.layout.setPointsLengths[i];
      var afterLastIndexInSet = firstIndexInSet + setLength;

      var next = DygraphCanvasRenderer.makeNextPointStep_(
        this.attr_('connectSeparatedPoints'), points,
        afterLastIndexInSet);

      // setup graphics context
      prevX = NaN;
      prevYs = [-1, -1];
      yscale = axis.yscale;
      // should be same color as the lines but only 15% opaque.
      rgb = new RGBColor(color);
      err_color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' +
                            fillAlpha + ')';
      ctx.fillStyle = err_color;
      ctx.beginPath();
      for (j = firstIndexInSet; j < afterLastIndexInSet; j = next(j)) {
        point = points[j];
        if (point.name == setName) { // TODO(klausw): this is always true
          if (!Dygraph.isOK(point.y)) {
            prevX = NaN;
            continue;
          }
          if (stackedGraph) {
            currBaseline = baseline[point.canvasx];
            var lastY;
            if (currBaseline === undefined) {
              lastY = axisY;
            } else {
              if(stepPlot) {
                lastY = currBaseline[0];
              } else {
                lastY = currBaseline;
              }
            }
            newYs = [ point.canvasy, lastY ];
            
            if(stepPlot) {
              // Step plots must keep track of the top and bottom of
              // the baseline at each point.
              if(prevYs[0] === -1) {
                baseline[point.canvasx] = [ point.canvasy, axisY ];
              } else {
                baseline[point.canvasx] = [ point.canvasy, prevYs[0] ];
              }
            } else {
              baseline[point.canvasx] = point.canvasy;
            }
            
          } else {
            newYs = [ point.canvasy, axisY ];
          }
          if (!isNaN(prevX)) {
            ctx.moveTo(prevX, prevYs[0]);
            
            if (stepPlot) {
              ctx.lineTo(point.canvasx, prevYs[0]);
              if(currBaseline) {
                // Draw to the bottom of the baseline
                ctx.lineTo(point.canvasx, currBaseline[1]);
              } else {
                ctx.lineTo(point.canvasx, newYs[1]);
              }
            } else {
              ctx.lineTo(point.canvasx, newYs[0]);
              ctx.lineTo(point.canvasx, newYs[1]);
            }
            
            ctx.lineTo(prevX, prevYs[1]);
            ctx.closePath();
          }
          prevYs = newYs;
          prevX = point.canvasx;
        }
      }
      ctx.fill();
    }
    ctx.restore();
  }

  // Drawing the lines.
  for (i = 0; i < setCount; i += 1) {
    this._drawLine(ctx, i);
  }
};

/**
 * This does dashed lines onto a canvas for a given pattern. You must call
 * ctx.stroke() after to actually draw it, much line ctx.lineTo(). It remembers
 * the state of the line in regards to where we left off on drawing the pattern.
 * You can draw a dashed line in several function calls and the pattern will be
 * continous as long as you didn't call this function with a different pattern
 * in between.
 * @param ctx The canvas 2d context to draw on.
 * @param x The start of the line's x coordinate.
 * @param y The start of the line's y coordinate.
 * @param x2 The end of the line's x coordinate.
 * @param y2 The end of the line's y coordinate.
 * @param pattern The dash pattern to draw, an array of integers where even 
 * index is drawn and odd index is not drawn (Ex. [10, 2, 5, 2], 10 is drawn 5
 * is drawn, 2 is the space between.). A null pattern, array of length one, or
 * empty array will do just a solid line.
 * @private
 */
DygraphCanvasRenderer.prototype._dashedLine = function(ctx, x, y, x2, y2, pattern) {
  // Original version http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas
  // Modified by Russell Valentine to keep line history and continue the pattern
  // where it left off.
  var dx, dy, len, rot, patternIndex, segment;

  // If we don't have a pattern or it is an empty array or of size one just
  // do a solid line.
  if (!pattern || pattern.length <= 1) {
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    return;
  }

  // If we have a different dash pattern than the last time this was called we
  // reset our dash history and start the pattern from the begging 
  // regardless of state of the last pattern.
  if (!Dygraph.compareArrays(pattern, this._dashedLineToHistoryPattern)) {
    this._dashedLineToHistoryPattern = pattern;
    this._dashedLineToHistory = [0, 0];
  }
  ctx.save();

  // Calculate transformation parameters
  dx = (x2-x);
  dy = (y2-y);
  len = Math.sqrt(dx*dx + dy*dy);
  rot = Math.atan2(dy, dx);

  // Set transformation
  ctx.translate(x, y);
  ctx.moveTo(0, 0);
  ctx.rotate(rot);

  // Set last pattern index we used for this pattern.
  patternIndex = this._dashedLineToHistory[0];
  x = 0;
  while (len > x) {
    // Get the length of the pattern segment we are dealing with.
    segment = pattern[patternIndex];
    // If our last draw didn't complete the pattern segment all the way we 
    // will try to finish it. Otherwise we will try to do the whole segment.
    if (this._dashedLineToHistory[1]) {
      x += this._dashedLineToHistory[1];
    } else {
      x += segment;
    }
    if (x > len) {
      // We were unable to complete this pattern index all the way, keep
      // where we are the history so our next draw continues where we left off
      // in the pattern.
      this._dashedLineToHistory = [patternIndex, x-len];
      x = len;
    } else {
      // We completed this patternIndex, we put in the history that we are on
      // the beginning of the next segment.
      this._dashedLineToHistory = [(patternIndex+1)%pattern.length, 0];
    }

    // We do a line on a even pattern index and just move on a odd pattern index.
    // The move is the empty space in the dash.
    if(patternIndex % 2 === 0) {
      ctx.lineTo(x, 0);
    } else {
      ctx.moveTo(x, 0);
    }
    // If we are not done, next loop process the next pattern segment, or the
    // first segment again if we are at the end of the pattern.
    patternIndex = (patternIndex+1) % pattern.length;
  }
  ctx.restore();
};
