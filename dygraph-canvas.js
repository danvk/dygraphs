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
  MochiKit.Base.update(this.options, options ? options : {});
  this.datasets = new Array();
};

DygraphLayout.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

DygraphLayout.prototype.addDataset = function(setname, set_xy) {
  this.datasets[setname] = set_xy;
};

DygraphLayout.prototype.evaluate = function() {
  this._evaluateLimits();
  this._evaluateLineCharts();
  this._evaluateLineTicks();
};

DygraphLayout.prototype._evaluateLimits = function() {
  this.minxval = this.maxxval = null;
  for (var name in this.datasets) {
    var series = this.datasets[name];
    var x1 = series[0][0];
    if (!this.minxval || x1 < this.minxval) this.minxval = x1;

    var x2 = series[series.length - 1][0];
    if (!this.maxxval || x2 > this.maxxval) this.maxxval = x2;
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
    var dataset = this.datasets[setName];
    for (var j = 0; j < dataset.length; j++) {
      var item = dataset[j];
      var point = {
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
      if ((point.x >= 0.0) && (point.x <= 1.0)) {
        this.points.push(point);
      }
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
  MochiKit.Base.update(this.options, new_options ? new_options : {});
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
      "axisLineColor": Color.blackColor(),
      "axisLineWidth": 0.5,
      "axisTickSize": 3,
      "axisLabelColor": Color.blackColor(),
      "axisLabelFont": "Arial",
      "axisLabelFontSize": 9,
      "axisLabelWidth": 50,
      "drawYGrid": true,
      "drawXGrid": true,
      "gridLineColor": MochiKit.Color.Color.grayColor()
  };
  MochiKit.Base.update(this.options, options);

  this.layout = layout;
  this.element = MochiKit.DOM.getElement(element);
  this.container = this.element.parentNode;

  // Stuff relating to Canvas on IE support    
  this.isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);

  if (this.isIE && !isNil(G_vmlCanvasManager)) {
      this.IEDelay = 0.5;
      this.maxTries = 5;
      this.renderDelay = null;
      this.clearDelay = null;
      this.element = G_vmlCanvasManager.initElement(this.element);
  }

  this.height = this.element.height;
  this.width = this.element.width;

  // --- check whether everything is ok before we return
  if (!this.isIE && !(DygraphCanvasRenderer.isSupported(this.element)))
      throw "Canvas is not supported.";

  // internal state
  this.xlabels = new Array();
  this.ylabels = new Array();

  this.area = {
    x: this.options.yAxisLabelWidth + 2 * this.options.axisTickSize,
    y: 0
  };
  this.area.w = this.width - this.area.x - this.options.rightGap;
  this.area.h = this.height - this.options.axisLabelFontSize -
                2 * this.options.axisTickSize;

  MochiKit.DOM.updateNodeAttributes(this.container, 
    {"style":{ "position": "relative", "width": this.width + "px"}});
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
      this.clearDelay = MochiKit.Async.wait(this.IEDelay);
      this.clearDelay.addCallback(bind(this.clear, this));
      return;
    }
  }

  var context = this.element.getContext("2d");
  context.clearRect(0, 0, this.width, this.height);

  MochiKit.Iter.forEach(this.xlabels, MochiKit.DOM.removeElement);
  MochiKit.Iter.forEach(this.ylabels, MochiKit.DOM.removeElement);
  this.xlabels = new Array();
  this.ylabels = new Array();
};


DygraphCanvasRenderer.isSupported = function(canvasName) {
  var canvas = null;
  try {
    if (MochiKit.Base.isUndefinedOrNull(canvasName)) 
      canvas = MochiKit.DOM.CANVAS({});
    else
      canvas = MochiKit.DOM.getElement(canvasName);
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
  if (this.options.drawYGrid) {
    var ticks = this.layout.yticks;
    ctx.save();
    ctx.strokeStyle = this.options.gridLineColor.toRGBString();
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
    ctx.strokeStyle = this.options.gridLineColor.toRGBString();
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
  // TODO(danvk) Call super.render()
  this._renderLineChart();
  this._renderAxis();
};


DygraphCanvasRenderer.prototype._renderAxis = function() {
  if (!this.options.drawXAxis && !this.options.drawYAxis)
    return;

  var context = this.element.getContext("2d");

  var labelStyle = {"style":
    {"position": "absolute",
      "fontSize": this.options.axisLabelFontSize + "px",
      "zIndex": 10,
      "color": this.options.axisLabelColor.toRGBString(),
      "width": this.options.axisLabelWidth + "px",
      "overflow": "hidden"
    }
  };

  // axis lines
  context.save();
  context.strokeStyle = this.options.axisLineColor.toRGBString();
  context.lineWidth = this.options.axisLineWidth;


  if (this.options.drawYAxis) {
    if (this.layout.yticks) {
      var drawTick = function(tick) {
        if (typeof(tick) == "function") return;
        var x = this.area.x;
        var y = this.area.y + tick[0] * this.area.h;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - this.options.axisTickSize, y);
        context.closePath();
        context.stroke();

        var label = DIV(labelStyle, tick[1]);
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
        MochiKit.DOM.appendChildNodes(this.container, label);
        this.ylabels.push(label);
      };

      MochiKit.Iter.forEach(this.layout.yticks, bind(drawTick, this));

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
      var drawTick = function(tick) {
        if (typeof(dataset) == "function") return;

        var x = this.area.x + tick[0] * this.area.w;
        var y = this.area.y + this.area.h;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + this.options.axisTickSize);
        context.closePath();
        context.stroke();

        var label = DIV(labelStyle, tick[1]);
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
        MochiKit.DOM.appendChildNodes(this.container, label);
        this.xlabels.push(label);
      };

      MochiKit.Iter.forEach(this.layout.xticks, bind(drawTick, this));
    }

    context.beginPath();
    context.moveTo(this.area.x, this.area.y + this.area.h);
    context.lineTo(this.area.x + this.area.w, this.area.y + this.area.h);
    context.closePath();
    context.stroke();
  }

  context.restore();
};


/**
 * Overrides the CanvasRenderer method to draw error bars
 */
DygraphCanvasRenderer.prototype._renderLineChart = function() {
  var context = this.element.getContext("2d");
  var colorCount = this.options.colorScheme.length;
  var colorScheme = this.options.colorScheme;
  var setNames = MochiKit.Base.keys(this.layout.datasets);
  var errorBars = this.layout.options.errorBars;
  var setCount = setNames.length;
  var bind = MochiKit.Base.bind;
  var partial = MochiKit.Base.partial;

  //Update Points
  var updatePoint = function(point) {
    point.canvasx = this.area.w * point.x + this.area.x;
    point.canvasy = this.area.h * point.y + this.area.y;
  }
  MochiKit.Iter.forEach(this.layout.points, updatePoint, this);

  // create paths
  var isOK = function(x) { return x && !isNaN(x); };
  var makePath = function(ctx) {
    for (var i = 0; i < setCount; i++) {
      var setName = setNames[i];
      var color = colorScheme[i%colorCount];
      var strokeX = this.options.strokeColorTransform;

      // setup graphics context
      context.save();
      context.strokeStyle = color.toRGBString();
      context.lineWidth = this.options.strokeWidth;
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
              ctx.moveTo(prevX, prevY);
              prevX = point.canvasx;
              prevY = point.canvasy;
              ctx.lineTo(prevX, prevY);
              ctx.stroke();
            }

            if (drawPoints || isIsolated) {
             ctx.beginPath();
             ctx.fillStyle = color.toRGBString();
             ctx.arc(point.canvasx, point.canvasy, pointSize, 0, 360, false);
             ctx.fill();
            }
          }
        }
      }
    }
  };

  var makeErrorBars = function(ctx) {
    for (var i = 0; i < setCount; i++) {
      var setName = setNames[i];
      var color = colorScheme[i % colorCount];
      var strokeX = this.options.strokeColorTransform;

      // setup graphics context
      context.save();
      context.strokeStyle = color.toRGBString();
      context.lineWidth = this.options.strokeWidth;
      var prevX = -1;
      var prevYs = [-1, -1];
      var count = 0;
      var yscale = this.layout.yscale;
      var errorTrapezoid = function(ctx_,point) {
        count++;
        if (point.name == setName) {
          if (!point.y || isNaN(point.y)) {
            prevX = -1;
            return;
          }
          var newYs = [ point.y - point.errorPlus * yscale,
                        point.y + point.errorMinus * yscale ];
          newYs[0] = this.area.h * newYs[0] + this.area.y;
          newYs[1] = this.area.h * newYs[1] + this.area.y;
          if (prevX >= 0) {
            ctx_.moveTo(prevX, prevYs[0]);
            ctx_.lineTo(point.canvasx, newYs[0]);
            ctx_.lineTo(point.canvasx, newYs[1]);
            ctx_.lineTo(prevX, prevYs[1]);
            ctx_.closePath();
          }
          prevYs[0] = newYs[0];
          prevYs[1] = newYs[1];
          prevX = point.canvasx;
        }
      };
      // should be same color as the lines
      var err_color = color.colorWithAlpha(0.15);
      ctx.fillStyle = err_color.toRGBString();
      ctx.beginPath();
      MochiKit.Iter.forEach(this.layout.points, partial(errorTrapezoid, ctx), this);
      ctx.fill();
    }
  };

  if (errorBars)
    bind(makeErrorBars, this)(context);
  bind(makePath, this)(context);
  context.restore();
};
