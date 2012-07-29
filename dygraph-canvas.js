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


/**
 * @constructor
 *
 * This gets called when there are "new points" to chart. This is generally the
 * case when the underlying data being charted has changed. It is _not_ called
 * in the common case that the user has zoomed or is panning the view.
 *
 * The chart canvas has already been created by the Dygraph object. The
 * renderer simply gets a drawing context.
 *
 * @param {Dyraph} dygraph The chart to which this renderer belongs.
 * @param {Canvas} element The &lt;canvas&gt; DOM element on which to draw.
 * @param {CanvasRenderingContext2D} elementContext The drawing context.
 * @param {DygraphLayout} layout The chart's DygraphLayout object.
 *
 * TODO(danvk): remove the elementContext property.
 */
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

/**
 * Clears out all chart content and DOM elements.
 * This is called immediately before render() on every frame, including
 * during zooms and pans.
 * @private
 */
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
};

/**
 * Checks whether the browser supports the &lt;canvas&gt; tag.
 * @private
 */
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
 * This method is responsible for drawing everything on the chart, including
 * lines, error bars, fills and axes.
 * It is called immediately after clear() on every frame, including during pans
 * and zooms.
 * @private
 */
DygraphCanvasRenderer.prototype.render = function() {
  this._renderLineChart();
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


/**
 * Returns a predicate to be used with an iterator, which will
 * iterate over points appropriately, depending on whether
 * connectSeparatedPoints is true. When it's false, the predicate will
 * skip over points with missing yVals.
 */
DygraphCanvasRenderer._getIteratorPredicate = function(connectSeparatedPoints) {
  return connectSeparatedPoints
      ? DygraphCanvasRenderer._predicateThatSkipsEmptyPoints
      : null;
};

DygraphCanvasRenderer._predicateThatSkipsEmptyPoints =
    function(array, idx) {
  return array[idx].yval !== null;
};

/**
 * @private
 */
DygraphCanvasRenderer.prototype._drawStyledLine = function(
    ctx, setIdx, setName, color, strokeWidth, strokePattern, drawPoints,
    drawPointCallback, pointSize) {
  // TODO(konigsberg): Compute attributes outside this method call.
  var stepPlot = this.attr_("stepPlot");
  if (!Dygraph.isArrayLike(strokePattern)) {
    strokePattern = null;
  }
  var drawGapPoints = this.dygraph_.attr_('drawGapEdgePoints', setName);

  var points = this.layout.points[setIdx];
  var iter = Dygraph.createIterator(points, 0, points.length,
      DygraphCanvasRenderer._getIteratorPredicate(
          this.attr_("connectSeparatedPoints")));

  var stroking = strokePattern && (strokePattern.length >= 2);

  ctx.save();
  if (stroking) {
    ctx.installPattern(strokePattern);
  }

  var pointsOnLine = this._drawSeries(ctx, iter, strokeWidth, pointSize, drawPoints, drawGapPoints, stepPlot, color);
  this._drawPointsOnLine(ctx, pointsOnLine, drawPointCallback, setName, color, pointSize);

  if (stroking) {
    ctx.uninstallPattern();
  }

  ctx.restore();
};

DygraphCanvasRenderer.prototype._drawPointsOnLine = function(ctx, pointsOnLine, drawPointCallback, setName, color, pointSize) {
  for (var idx = 0; idx < pointsOnLine.length; idx++) {
    var cb = pointsOnLine[idx];
    ctx.save();
    drawPointCallback(
        this.dygraph_, setName, ctx, cb[0], cb[1], color, pointSize);
    ctx.restore();
  }
}

DygraphCanvasRenderer.prototype._drawSeries = function(
    ctx, iter, strokeWidth, pointSize, drawPoints, drawGapPoints,
    stepPlot, color) {

  var prevCanvasX = null;
  var prevCanvasY = null;
  var nextCanvasY = null;
  var isIsolated; // true if this point is isolated (no line segments)
  var point; // the point being processed in the while loop
  var pointsOnLine = []; // Array of [canvasx, canvasy] pairs.
  var first = true; // the first cycle through the while loop

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;

  // NOTE: we break the iterator's encapsulation here for about a 25% speedup.
  var arr = iter.array_;
  var limit = iter.end_;
  var predicate = iter.predicate_;

  for (var i = iter.start_; i < limit; i++) {
    point = arr[i];
    if (predicate) {
      while (i < limit && !predicate(arr, i)) {
        i++;
      }
      if (i == limit) break;
      point = arr[i];
    }

    if (point.canvasy === null || point.canvasy != point.canvasy) {
      if (stepPlot && prevCanvasX !== null) {
        // Draw a horizontal line to the start of the missing data
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(point.canvasx, prevY);
      }
      prevCanvasX = prevCanvasY = null;
    } else {
      isIsolated = false;
      if (drawGapPoints || !prevCanvasX) {
        iter.nextIdx_ = i;
        var peek = iter.next();
        nextCanvasY = iter.hasNext ? iter.peek.canvasy : null;

        var isNextCanvasYNullOrNaN = nextCanvasY === null ||
            nextCanvasY != nextCanvasY;
        isIsolated = (!prevCanvasX && isNextCanvasYNullOrNaN);
        if (drawGapPoints) {
          // Also consider a point to be "isolated" if it's adjacent to a
          // null point, excluding the graph edges.
          if ((!first && !prevCanvasX) ||
              (iter.hasNext && isNextCanvasYNullOrNaN)) {
            isIsolated = true;
          }
        }
      }

      if (prevCanvasX !== null) {
        if (strokeWidth) {
          if (stepPlot) {
            ctx.moveTo(prevCanvasX, prevCanvasY);
            ctx.lineTo(point.canvasx, prevCanvasY);
            prevCanvasX = point.canvasx;
          }

          // TODO(danvk): this moveTo is rarely necessary
          ctx.moveTo(prevCanvasX, prevCanvasY);
          ctx.lineTo(point.canvasx, point.canvasy);
        }
      }
      if (drawPoints || isIsolated) {
        pointsOnLine.push([point.canvasx, point.canvasy]);
      }
      prevCanvasX = point.canvasx;
      prevCanvasY = point.canvasy;
    }
    first = false;
  }
  ctx.stroke();
  return pointsOnLine;
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
 * @private
 */
DygraphCanvasRenderer.prototype._renderLineChart = function() {
  var ctx = this.elementContext;
  var errorBars = this.attr_("errorBars") || this.attr_("customBars");
  var fillGraph = this.attr_("fillGraph");
  var i;

  var setNames = this.layout.setNames;
  var setCount = setNames.length;

  this.colors = this.dygraph_.colorsMap_;

  // Update Points
  // TODO(danvk): here
  //
  // TODO(bhs): this loop is a hot-spot for high-point-count charts. These
  // transformations can be pushed into the canvas via linear transformation
  // matrices.
  // NOTE(danvk): this is trickier than it sounds at first. The transformation
  // needs to be done before the .moveTo() and .lineTo() calls, but must be
  // undone before the .stroke() call to ensure that the stroke width is
  // unaffected.  An alternative is to reduce the stroke width in the
  // transformed coordinate space, but you can't specify different values for
  // each dimension (as you can with .scale()). The speedup here is ~12%.
  var sets = this.layout.points;
  for (i = sets.length; i--;) {
    var points = sets[i];
    for (var j = points.length; j--;) {
      var point = points[j];
      point.canvasx = this.area.w * point.x + this.area.x;
      point.canvasy = this.area.h * point.y + this.area.y;
    }
  }

  // Draw any "fills", i.e. error bars or the filled area under a series.
  // These must all be drawn before any lines, so that the main lines of a
  // series are drawn on top.
  if (errorBars) {
    if (fillGraph) {
      this.dygraph_.warn("Can't use fillGraph option with error bars");
    }

    ctx.save();
    this.drawErrorBars_(points);
    ctx.restore();
  } else if (fillGraph) {
    ctx.save();
    this.drawFillBars_(points);
    ctx.restore();
  }

  // Drawing the lines.
  for (i = 0; i < setCount; i += 1) {
    this._drawLine(ctx, i);
  }
};

/**
 * Draws the shaded error bars/confidence intervals for each series.
 * This happens before the center lines are drawn, since the center lines
 * need to be drawn on top of the error bars for all series.
 *
 * @private
 */
DygraphCanvasRenderer.prototype.drawErrorBars_ = function(points) {
  var ctx = this.elementContext;
  var setNames = this.layout.setNames;
  var setCount = setNames.length;
  var fillAlpha = this.attr_('fillAlpha');
  var stepPlot = this.attr_('stepPlot');

  var newYs;

  for (var setIdx = 0; setIdx < setCount; setIdx++) {
    var setName = setNames[setIdx];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);
    var color = this.colors[setName];

    var points = this.layout.points[setIdx];
    var iter = Dygraph.createIterator(points, 0, points.length,
        DygraphCanvasRenderer._getIteratorPredicate(
            this.attr_("connectSeparatedPoints")));

    // setup graphics context
    var prevX = NaN;
    var prevY = NaN;
    var prevYs = [-1, -1];
    var yscale = axis.yscale;
    // should be same color as the lines but only 15% opaque.
    var rgb = new RGBColor(color);
    var err_color =
        'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + fillAlpha + ')';
    ctx.fillStyle = err_color;
    ctx.beginPath();
    while (iter.hasNext) {
      var point = iter.next();
      if (!Dygraph.isOK(point.y)) {
        prevX = NaN;
        continue;
      }

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
    ctx.fill();
  }
};

/**
 * Draws the shaded regions when "fillGraph" is set. Not to be confused with
 * error bars.
 *
 * @private
 */
DygraphCanvasRenderer.prototype.drawFillBars_ = function(points) {
  var ctx = this.elementContext;
  var setNames = this.layout.setNames;
  var setCount = setNames.length;
  var fillAlpha = this.attr_('fillAlpha');
  var stepPlot = this.attr_('stepPlot');
  var stackedGraph = this.attr_("stackedGraph");

  var baseline = {};  // for stacked graphs: baseline for filling
  var currBaseline;

  // process sets in reverse order (needed for stacked graphs)
  for (var setIdx = setCount - 1; setIdx >= 0; setIdx--) {
    var setName = setNames[setIdx];
    var color = this.colors[setName];
    var axis = this.dygraph_.axisPropertiesForSeries(setName);
    var axisY = 1.0 + axis.minyval * axis.yscale;
    if (axisY < 0.0) axisY = 0.0;
    else if (axisY > 1.0) axisY = 1.0;
    axisY = this.area.h * axisY + this.area.y;

    var points = this.layout.points[setIdx];
    var iter = Dygraph.createIterator(points, 0, points.length,
        DygraphCanvasRenderer._getIteratorPredicate(
            this.attr_("connectSeparatedPoints")));

    // setup graphics context
    var prevX = NaN;
    var prevYs = [-1, -1];
    var newYs;
    var yscale = axis.yscale;
    // should be same color as the lines but only 15% opaque.
    var rgb = new RGBColor(color);
    var err_color =
        'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + fillAlpha + ')';
    ctx.fillStyle = err_color;
    ctx.beginPath();
    while(iter.hasNext) {
      var point = iter.next();
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
    ctx.fill();
  }
};
