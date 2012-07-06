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
  return connectSeparatedPoints ? DygraphCanvasRenderer._predicateThatSkipsEmptyPoints : null;
}

DygraphCanvasRenderer._predicateThatSkipsEmptyPoints =
  function(array, idx) { return array[idx].yval !== null; }

DygraphCanvasRenderer.prototype._drawStyledLine = function(
    ctx, i, setName, color, strokeWidth, strokePattern, drawPoints,
    drawPointCallback, pointSize) {
  // TODO(konigsberg): Compute attributes outside this method call.
  var stepPlot = this.attr_("stepPlot");
  var firstIndexInSet = this.layout.setPointsOffsets[i];
  var setLength = this.layout.setPointsLengths[i];
  var points = this.layout.points;
  if (!Dygraph.isArrayLike(strokePattern)) {
    strokePattern = null;
  }
  var drawGapPoints = this.dygraph_.attr_('drawGapEdgePoints', setName);

  ctx.save();

  var iter = Dygraph.createIterator(points, firstIndexInSet, setLength,
      DygraphCanvasRenderer._getIteratorPredicate(this.attr_("connectSeparatedPoints")));

  var pointsOnLine;
  var strategy;
  if (!strokePattern || strokePattern.length <= 1) {
    strategy = trivialStrategy(ctx, color, strokeWidth);
  } else {
    strategy = nonTrivialStrategy(this, ctx, color, strokeWidth, strokePattern);
  }
  pointsOnLine = this._drawSeries(ctx, iter, strokeWidth, pointSize, drawPoints, drawGapPoints, stepPlot, strategy);
  this._drawPointsOnLine(ctx, pointsOnLine, drawPointCallback, setName, color, pointSize);

  ctx.restore();
};

var nonTrivialStrategy = function(renderer, ctx, color, strokeWidth, strokePattern) {
  return new function() {
    this.init = function() {  };
    this.finish = function() { };
    this.startSegment = function() {
       ctx.beginPath();
       ctx.strokeStyle = color;
       ctx.lineWidth = strokeWidth;
    };
    this.endSegment = function() {
      ctx.stroke(); // should this include closePath?
    };
    this.drawLine = function(x1, y1, x2, y2) {
      renderer._dashedLine(ctx, x1, y1, x2, y2, strokePattern);
    };
    this.skipPixel = function(prevX, prevY, curX, curY) {
      // TODO(konigsberg): optimize with http://jsperf.com/math-round-vs-hack/6 ?
      return (Math.round(prevX) == Math.round(curX) &&
           Math.round(prevY) == Math.round(curY));
    };
  };
};

var trivialStrategy = function(ctx, color, strokeWidth) {
  return new function() {
    this.init = function() {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    };
    this.finish = function() {
      ctx.stroke(); // should this include closePath?
    };
    this.startSegment = function() { };
    this.endSegment = function() { };
    this.drawLine = function(x1, y1, x2, y2) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    };
    // don't skip pixels.
    this.skipPixel = function() {
      return false;
    };
  };
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
    stepPlot, strategy) {

  var prevCanvasX = null;
  var prevCanvasY = null;
  var nextCanvasY = null;
  var isIsolated; // true if this point is isolated (no line segments)
  var point; // the point being processed in the while loop
  var pointsOnLine = []; // Array of [canvasx, canvasy] pairs.
  var first = true; // the first cycle through the while loop

  strategy.init();

  while(iter.hasNext()) {
    point = iter.next();
    if (point.canvasy === null || point.canvasy != point.canvasy) {
      if (stepPlot && prevCanvasX !== null) {
        // Draw a horizontal line to the start of the missing data
        strategy.startSegment();
        strategy.drawLine(prevX, prevY, point.canvasx, prevY);
        strategy.endSegment();
      }
      prevCanvasX = prevCanvasY = null;
    } else {
      nextCanvasY = iter.hasNext() ? iter.peek().canvasy : null;
      // TODO: we calculate isNullOrNaN for this point, and the next, and then, when
      // we iterate, test for isNullOrNaN again. Why bother?
      var isNextCanvasYNullOrNaN = nextCanvasY === null || nextCanvasY != nextCanvasY;
      isIsolated = (!prevCanvasX && isNextCanvasYNullOrNaN);
      if (drawGapPoints) {
        // Also consider a point to be "isolated" if it's adjacent to a
        // null point, excluding the graph edges.
        if ((!first && !prevCanvasX) ||
            (iter.hasNext() && isNextCanvasYNullOrNaN)) {
          isIsolated = true;
        }
      }
      if (prevCanvasX !== null) {
        if (strategy.skipPixel(prevCanvasX, prevCanvasY, point.canvasx, point.canvasy)) {
          continue;
        }
        if (strokeWidth) {
          strategy.startSegment();
          if (stepPlot) {
            strategy.drawLine(prevCanvasX, prevCanvasY, point.canvasx, prevCanvasY);
            prevCanvasX = point.canvasx;
          }
          strategy.drawLine(prevCanvasX, prevCanvasY, point.canvasx, point.canvasy);      
          strategy.endSegment();
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
  strategy.finish();
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
  var point, i, prevX, prevY, prevYs, color, setName, newYs, err_color, rgb, yscale, axis;

  var setNames = this.layout.setNames;
  var setCount = setNames.length;

  this.colors = this.dygraph_.colorsMap_;

  // Update Points
  // TODO(danvk): here
  //
  // TODO(bhs): this loop is a hot-spot for high-point-count charts. These
  // transformations can be pushed into the canvas via linear transformation
  // matrices.
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

      var iter = Dygraph.createIterator(points, firstIndexInSet, setLength,
          DygraphCanvasRenderer._getIteratorPredicate(this.attr_("connectSeparatedPoints")));

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
      while (iter.hasNext()) {
        point = iter.next();
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

      var iter = Dygraph.createIterator(points, firstIndexInSet, setLength,
          DygraphCanvasRenderer._getIteratorPredicate(this.attr_("connectSeparatedPoints")));

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
      while(iter.hasNext()) {
        point = iter.next();
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
