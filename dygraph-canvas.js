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
/*global Dygraph:false,RGBColorParser:false */
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
 * @param {Dygraph} dygraph The chart to which this renderer belongs.
 * @param {HTMLCanvasElement} element The &lt;canvas&gt; DOM element on which to draw.
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
  // NOTE(konigsberg): isIE is never defined in this object. Bug of some sort.
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

/**
 * This just forwards to dygraph.attr_.
 * TODO(danvk): remove this?
 * @private
 */
DygraphCanvasRenderer.prototype.attr_ = function(name, opt_seriesName) {
  return this.dygraph_.attr_(name, opt_seriesName);
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
  // attaches point.canvas{x,y}
  this._updatePoints();

  // actually draws the chart.
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
  return connectSeparatedPoints ?
      DygraphCanvasRenderer._predicateThatSkipsEmptyPoints :
      null;
};

DygraphCanvasRenderer._predicateThatSkipsEmptyPoints =
    function(array, idx) {
  return array[idx].yval !== null;
};

/**
 * Draws a line with the styles passed in and calls all the drawPointCallbacks.
 * @param {Object} e The dictionary passed to the plotter function.
 * @private
 */
DygraphCanvasRenderer._drawStyledLine = function(e,
    color, strokeWidth, strokePattern, drawPoints,
    drawPointCallback, pointSize) {
  var g = e.dygraph;
  // TODO(konigsberg): Compute attributes outside this method call.
  var stepPlot = g.getOption("stepPlot", e.setName);

  if (!Dygraph.isArrayLike(strokePattern)) {
    strokePattern = null;
  }

  var drawGapPoints = g.getOption('drawGapEdgePoints', e.setName);

  var points = e.points;
  var iter = Dygraph.createIterator(points, 0, points.length,
      DygraphCanvasRenderer._getIteratorPredicate(
          g.getOption("connectSeparatedPoints")));  // TODO(danvk): per-series?

  var stroking = strokePattern && (strokePattern.length >= 2);

  var ctx = e.drawingContext;
  ctx.save();
  if (stroking) {
    ctx.installPattern(strokePattern);
  }

  var pointsOnLine = DygraphCanvasRenderer._drawSeries(
      e, iter, strokeWidth, pointSize, drawPoints, drawGapPoints, stepPlot, color);
  DygraphCanvasRenderer._drawPointsOnLine(
      e, pointsOnLine, drawPointCallback, color, pointSize);

  if (stroking) {
    ctx.uninstallPattern();
  }

  ctx.restore();
};

/**
 * This does the actual drawing of lines on the canvas, for just one series.
 * Returns a list of [canvasx, canvasy] pairs for points for which a
 * drawPointCallback should be fired.  These include isolated points, or all
 * points if drawPoints=true.
 * @param {Object} e The dictionary passed to the plotter function.
 * @private
 */
DygraphCanvasRenderer._drawSeries = function(e,
    iter, strokeWidth, pointSize, drawPoints, drawGapPoints, stepPlot, color) {

  var prevCanvasX = null;
  var prevCanvasY = null;
  var nextCanvasY = null;
  var isIsolated; // true if this point is isolated (no line segments)
  var point; // the point being processed in the while loop
  var pointsOnLine = []; // Array of [canvasx, canvasy] pairs.
  var first = true; // the first cycle through the while loop

  var ctx = e.drawingContext;
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
        ctx.moveTo(prevCanvasX, prevCanvasY);
        ctx.lineTo(point.canvasx, prevCanvasY);
      }
      prevCanvasX = prevCanvasY = null;
    } else {
      isIsolated = false;
      if (drawGapPoints || !prevCanvasX) {
        iter.nextIdx_ = i;
        iter.next();
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
          }

          ctx.lineTo(point.canvasx, point.canvasy);
        }
      } else {
        ctx.moveTo(point.canvasx, point.canvasy);
      }
      if (drawPoints || isIsolated) {
        pointsOnLine.push([point.canvasx, point.canvasy, point.idx]);
      }
      prevCanvasX = point.canvasx;
      prevCanvasY = point.canvasy;
    }
    first = false;
  }
  ctx.stroke();
  return pointsOnLine;
};

/**
 * This fires the drawPointCallback functions, which draw dots on the points by
 * default. This gets used when the "drawPoints" option is set, or when there
 * are isolated points.
 * @param {Object} e The dictionary passed to the plotter function.
 * @private
 */
DygraphCanvasRenderer._drawPointsOnLine = function(
    e, pointsOnLine, drawPointCallback, color, pointSize) {
  var ctx = e.drawingContext;
  for (var idx = 0; idx < pointsOnLine.length; idx++) {
    var cb = pointsOnLine[idx];
    ctx.save();
    drawPointCallback(
        e.dygraph, e.setName, ctx, cb[0], cb[1], color, pointSize, cb[2]);
    ctx.restore();
  }
};

/**
 * Attaches canvas coordinates to the points array.
 * @private
 */
DygraphCanvasRenderer.prototype._updatePoints = function() {
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
  for (var i = sets.length; i--;) {
    var points = sets[i];
    for (var j = points.length; j--;) {
      var point = points[j];
      point.canvasx = this.area.w * point.x + this.area.x;
      point.canvasy = this.area.h * point.y + this.area.y;
    }
  }
};

/**
 * Add canvas Actually draw the lines chart, including error bars.
 *
 * This function can only be called if DygraphLayout's points array has been
 * updated with canvas{x,y} attributes, i.e. by
 * DygraphCanvasRenderer._updatePoints.
 *
 * @param {string=} opt_seriesName when specified, only that series will
 *     be drawn. (This is used for expedited redrawing with highlightSeriesOpts)
 * @param {CanvasRenderingContext2D} opt_ctx when specified, the drawing
 *     context.  However, lines are typically drawn on the object's
 *     elementContext.
 * @private
 */
DygraphCanvasRenderer.prototype._renderLineChart = function(opt_seriesName, opt_ctx) {
  var ctx = opt_ctx || this.elementContext;
  var i;

  var sets = this.layout.points;
  var setNames = this.layout.setNames;
  var setName;

  this.colors = this.dygraph_.colorsMap_;

  // Determine which series have specialized plotters.
  var plotter_attr = this.attr_("plotter");
  var plotters = plotter_attr;
  if (!Dygraph.isArrayLike(plotters)) {
    plotters = [plotters];
  }

  var setPlotters = {};  // series name -> plotter fn.
  for (i = 0; i < setNames.length; i++) {
    setName = setNames[i];
    var setPlotter = this.attr_("plotter", setName);
    if (setPlotter == plotter_attr) continue;  // not specialized.

    setPlotters[setName] = setPlotter;
  }

  for (i = 0; i < plotters.length; i++) {
    var plotter = plotters[i];
    var is_last = (i == plotters.length - 1);

    for (var j = 0; j < sets.length; j++) {
      setName = setNames[j];
      if (opt_seriesName && setName != opt_seriesName) continue;

      var points = sets[j];

      // Only throw in the specialized plotters on the last iteration.
      var p = plotter;
      if (setName in setPlotters) {
        if (is_last) {
          p = setPlotters[setName];
        } else {
          // Don't use the standard plotters in this case.
          continue;
        }
      }

      var color = this.colors[setName];
      var strokeWidth = this.dygraph_.getOption("strokeWidth", setName);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      p({
        points: points,
        setName: setName,
        drawingContext: ctx,
        color: color,
        strokeWidth: strokeWidth,
        dygraph: this.dygraph_,
        axis: this.dygraph_.axisPropertiesForSeries(setName),
        plotArea: this.area,
        seriesIndex: j,
        seriesCount: sets.length,
        singleSeriesName: opt_seriesName,
        allSeriesPoints: sets
      });
      ctx.restore();
    }
  }
};

/**
 * Standard plotters. These may be used by clients via Dygraph.Plotters.
 * See comments there for more details.
 */
DygraphCanvasRenderer._Plotters = {
  linePlotter: function(e) {
    DygraphCanvasRenderer._linePlotter(e);
  },

  fillPlotter: function(e) {
    DygraphCanvasRenderer._fillPlotter(e);
  },

  errorPlotter: function(e) {
    DygraphCanvasRenderer._errorPlotter(e);
  }
};

/**
 * Plotter which draws the central lines for a series.
 * @private
 */
DygraphCanvasRenderer._linePlotter = function(e) {
  var g = e.dygraph;
  var setName = e.setName;
  var strokeWidth = e.strokeWidth;

  // TODO(danvk): Check if there's any performance impact of just calling
  // getOption() inside of _drawStyledLine. Passing in so many parameters makes
  // this code a bit nasty.
  var borderWidth = g.getOption("strokeBorderWidth", setName);
  var drawPointCallback = g.getOption("drawPointCallback", setName) ||
      Dygraph.Circles.DEFAULT;
  var strokePattern = g.getOption("strokePattern", setName);
  var drawPoints = g.getOption("drawPoints", setName);
  var pointSize = g.getOption("pointSize", setName);

  if (borderWidth && strokeWidth) {
    DygraphCanvasRenderer._drawStyledLine(e,
        g.getOption("strokeBorderColor", setName),
        strokeWidth + 2 * borderWidth,
        strokePattern,
        drawPoints,
        drawPointCallback,
        pointSize
        );
  }

  DygraphCanvasRenderer._drawStyledLine(e,
      e.color,
      strokeWidth,
      strokePattern,
      drawPoints,
      drawPointCallback,
      pointSize
  );
};

/**
 * Draws the shaded error bars/confidence intervals for each series.
 * This happens before the center lines are drawn, since the center lines
 * need to be drawn on top of the error bars for all series.
 * @private
 */
DygraphCanvasRenderer._errorPlotter = function(e) {
  var g = e.dygraph;
  var setName = e.setName;
  var errorBars = g.getOption("errorBars") || g.getOption("customBars");
  if (!errorBars) return;

  var fillGraph = g.getOption("fillGraph", setName);
  if (fillGraph) {
    g.warn("Can't use fillGraph option with error bars");
  }

  var ctx = e.drawingContext;
  var color = e.color;
  var fillAlpha = g.getOption('fillAlpha', setName);
  var stepPlot = g.getOption("stepPlot", setName);
  var points = e.points;

  var iter = Dygraph.createIterator(points, 0, points.length,
      DygraphCanvasRenderer._getIteratorPredicate(
          g.getOption("connectSeparatedPoints")));

  var newYs;

  // setup graphics context
  var prevX = NaN;
  var prevY = NaN;
  var prevYs = [-1, -1];
  // should be same color as the lines but only 15% opaque.
  var rgb = new RGBColorParser(color);
  var err_color =
      'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + fillAlpha + ')';
  ctx.fillStyle = err_color;
  ctx.beginPath();

  var isNullUndefinedOrNaN = function(x) {
    return (x === null ||
            x === undefined ||
            isNaN(x));
  };

  while (iter.hasNext) {
    var point = iter.next();
    if ((!stepPlot && isNullUndefinedOrNaN(point.y)) ||
        (stepPlot && !isNaN(prevY) && isNullUndefinedOrNaN(prevY))) {
      prevX = NaN;
      continue;
    }

    if (stepPlot) {
      newYs = [ point.y_bottom, point.y_top ];
      prevY = point.y;
    } else {
      newYs = [ point.y_bottom, point.y_top ];
    }
    newYs[0] = e.plotArea.h * newYs[0] + e.plotArea.y;
    newYs[1] = e.plotArea.h * newYs[1] + e.plotArea.y;
    if (!isNaN(prevX)) {
      if (stepPlot) {
        ctx.moveTo(prevX, prevYs[0]);
        ctx.lineTo(point.canvasx, prevYs[0]);
        ctx.lineTo(point.canvasx, prevYs[1]);
      } else {
        ctx.moveTo(prevX, prevYs[0]);
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
};

/**
 * Draws the shaded regions when "fillGraph" is set. Not to be confused with
 * error bars.
 *
 * For stacked charts, it's more convenient to handle all the series
 * simultaneously. So this plotter plots all the points on the first series
 * it's asked to draw, then ignores all the other series.
 *
 * @private
 */
DygraphCanvasRenderer._fillPlotter = function(e) {
  // Skip if we're drawing a single series for interactive highlight overlay.
  if (e.singleSeriesName) return;

  // We'll handle all the series at once, not one-by-one.
  if (e.seriesIndex !== 0) return;

  var g = e.dygraph;
  var setNames = g.getLabels().slice(1);  // remove x-axis

  // getLabels() includes names for invisible series, which are not included in
  // allSeriesPoints. We remove those to make the two match.
  // TODO(danvk): provide a simpler way to get this information.
  for (var i = setNames.length; i >= 0; i--) {
    if (!g.visibility()[i]) setNames.splice(i, 1);
  }

  var anySeriesFilled = (function() {
    for (var i = 0; i < setNames.length; i++) {
      if (g.getOption("fillGraph", setNames[i])) return true;
    }
    return false;
  })();

  if (!anySeriesFilled) return;

  var ctx = e.drawingContext;
  var area = e.plotArea;
  var sets = e.allSeriesPoints;
  var setCount = sets.length;

  var fillAlpha = g.getOption('fillAlpha');
  var stackedGraph = g.getOption("stackedGraph");
  var colors = g.getColors();

  // For stacked graphs, track the baseline for filling.
  //
  // The filled areas below graph lines are trapezoids with two
  // vertical edges. The top edge is the line segment being drawn, and
  // the baseline is the bottom edge. Each baseline corresponds to the
  // top line segment from the previous stacked line. In the case of
  // step plots, the trapezoids are rectangles.
  var baseline = {};
  var currBaseline;
  var prevStepPlot;  // for different line drawing modes (line/step) per series

  // process sets in reverse order (needed for stacked graphs)
  for (var setIdx = setCount - 1; setIdx >= 0; setIdx--) {
    var setName = setNames[setIdx];
    if (!g.getOption('fillGraph', setName)) continue;
    
    var stepPlot = g.getOption('stepPlot', setName);
    var color = colors[setIdx];
    var axis = g.axisPropertiesForSeries(setName);
    var axisY = 1.0 + axis.minyval * axis.yscale;
    if (axisY < 0.0) axisY = 0.0;
    else if (axisY > 1.0) axisY = 1.0;
    axisY = area.h * axisY + area.y;

    var points = sets[setIdx];
    var iter = Dygraph.createIterator(points, 0, points.length,
        DygraphCanvasRenderer._getIteratorPredicate(
            g.getOption("connectSeparatedPoints")));

    // setup graphics context
    var prevX = NaN;
    var prevYs = [-1, -1];
    var newYs;
    // should be same color as the lines but only 15% opaque.
    var rgb = new RGBColorParser(color);
    var err_color =
        'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + fillAlpha + ')';
    ctx.fillStyle = err_color;
    ctx.beginPath();
    var last_x, is_first = true;
    while (iter.hasNext) {
      var point = iter.next();
      if (!Dygraph.isOK(point.y)) {
        prevX = NaN;
        if (point.y_stacked !== null && !isNaN(point.y_stacked)) {
          baseline[point.canvasx] = area.h * point.y_stacked + area.y;
        }
        continue;
      }
      if (stackedGraph) {
        if (!is_first && last_x == point.xval) {
          continue;
        } else {
          is_first = false;
          last_x = point.xval;
        }

        currBaseline = baseline[point.canvasx];
        var lastY;
        if (currBaseline === undefined) {
          lastY = axisY;
        } else {
          if(prevStepPlot) {
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
        
        // Move to top fill point
        if (stepPlot) {
          ctx.lineTo(point.canvasx, prevYs[0]);
        } else {
          ctx.lineTo(point.canvasx, newYs[0]);
        }
        // Move to bottom fill point
        if (prevStepPlot && currBaseline) {
          // Draw to the bottom of the baseline
          ctx.lineTo(point.canvasx, currBaseline[1]);
        } else {
          ctx.lineTo(point.canvasx, newYs[1]);
        }

        ctx.lineTo(prevX, prevYs[1]);
        ctx.closePath();
      }
      prevYs = newYs;
      prevX = point.canvasx;
    }
    prevStepPlot = stepPlot;
    ctx.fill();
  }
};
