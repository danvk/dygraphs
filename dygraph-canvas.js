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

  this.area = layout.getPlotArea();
  this.container.style.position = "relative";
  this.container.style.width = this.width + "px";

  // Set up a clipping area for the canvas (and the interaction canvas).
  // This ensures that we don't overdraw.
  if (this.dygraph_.isUsingExcanvas_) {
    this._createIEClipArea();
  } else {
    var ctx = this.dygraph_.canvas_ctx_;
    ctx.beginPath();
    ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
    ctx.clip();

    ctx = this.dygraph_.hidden_ctx_;
    ctx.beginPath();
    ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
    ctx.clip();
  }
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
    // TODO(konigsberg): I don't think these calls to save() have a corresponding restore().
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
    if (area.w == 0 || area.h == 0) {
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
  createClipDiv({x:0, y:0, w:plotArea.x, h:this.height});
  // Top
  createClipDiv({x:plotArea.x, y:0, w:this.width-plotArea.x, h:plotArea.y});
  // Right side
  createClipDiv({x:plotArea.x+plotArea.w, y:0, w:this.width-plotArea.x-plotArea.w, h:this.height});
  // Bottom
  createClipDiv({x:plotArea.x, y:plotArea.y+plotArea.h, w:this.width-plotArea.x, h:this.height-plotArea.h-plotArea.y});
}

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
    // height: this.attr_('axisLabelFontSize') + 2 + "px",
    lineHeight: "normal", // Something other than "normal" line-height screws up label positioning.
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
      var num_axes = this.dygraph_.numAxes();
      for (var i = 0; i < this.layout.yticks.length; i++) {
        var tick = this.layout.yticks[i];
        if (typeof(tick) == "function") return;
        var x = this.area.x;
        var sgn = 1;
        var prec_axis = 'y1';
        if (tick[0] == 1) {  // right-side y-axis
          x = this.area.x + this.area.w;
          sgn = -1;
          prec_axis = 'y2';
        }
        var y = this.area.y + tick[1] * this.area.h;

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x - sgn * this.attr_('axisTickSize')), halfDown(y));
        context.closePath();
        context.stroke();
        */

        var label = makeDiv(tick[2], 'y', num_axes == 2 ? prec_axis : null);
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

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x), halfDown(y + this.attr_('axisTickSize')));
        context.closePath();
        context.stroke();
        */

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
  var isNullOrNaN = function(x) {
    return (x === null || isNaN(x));
  };

  // TODO(danvk): use this.attr_ for many of these.
  var context = this.elementContext;
  var fillAlpha = this.attr_('fillAlpha');
  var errorBars = this.attr_("errorBars") || this.attr_("customBars");
  var fillGraph = this.attr_("fillGraph");
  var stackedGraph = this.attr_("stackedGraph");
  var stepPlot = this.attr_("stepPlot");
  var points = this.layout.points;
  var pointsLength = points.length;

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
  for (var i = pointsLength; i--;) {
    var point = points[i];
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
      for (var j = 0; j < pointsLength; j++) {
        var point = points[j];
        if (point.name == setName) {
          if (!Dygraph.isOK(point.y)) {
            prevX = NaN;
            continue;
          }

          // TODO(danvk): here
          if (stepPlot) {
            var newYs = [ point.y_bottom, point.y_top ];
            prevY = point.y;
          } else {
            var newYs = [ point.y_bottom, point.y_top ];
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
      for (var j = 0; j < pointsLength; j++) {
        var point = points[j];
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

  // Drawing the lines.
  var firstIndexInSet = 0;
  var afterLastIndexInSet = 0;
  var setLength = 0;
  for (var i = 0; i < setCount; i += 1) {
    setLength = this.layout.setPointsLengths[i];
    afterLastIndexInSet += setLength;
    var setName = setNames[i];
    var color = this.colors[setName];
    var strokeWidth = this.dygraph_.attr_("strokeWidth", setName);

    // setup graphics context
    context.save();
    var pointSize = this.dygraph_.attr_("pointSize", setName);
    var prevX = null, prevY = null;
    var drawPoints = this.dygraph_.attr_("drawPoints", setName);
    for (var j = firstIndexInSet; j < afterLastIndexInSet; j++) {
      var point = points[j];
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
    firstIndexInSet = afterLastIndexInSet;
  }

  context.restore();
};
