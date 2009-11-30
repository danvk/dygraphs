// Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
// All Rights Reserved.

/**
 * @fileoverview Subclasses various parts of PlotKit to meet the additional
 * needs of Dygraph: grid overlays and error bars
 */

// Subclass PlotKit.Layout to add:
// 1. Sigma/errorBars properties
// 2. Copy error terms for PlotKit.CanvasRenderer._renderLineChart

/**
 * Creates a new DygraphLayout object. Options are the same as those allowed
 * by the PlotKit.Layout constructor.
 * @param {Object} options Options for PlotKit.Layout
 * @return {Object} The DygraphLayout object
 */
DygraphLayout = function(options) {
  PlotKit.Layout.call(this, "line", options);
};
DygraphLayout.prototype = new PlotKit.Layout();

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
    if (PlotKit.Base.isFuncLike(dataset)) continue;
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
  PlotKit.CanvasRenderer.call(this, element, layout, options);
  this.dygraph_ = dygraph;
  this.options.shouldFill = false;
  this.options.shouldStroke = true;
  this.options.drawYGrid = true;
  this.options.drawXGrid = true;
  this.options.gridLineColor = MochiKit.Color.Color.grayColor();
  MochiKit.Base.update(this.options, options);

  // TODO(danvk) This shouldn't be necessary: effects should be overlaid
  this.options.drawBackground = false;
};
DygraphCanvasRenderer.prototype = new PlotKit.CanvasRenderer();

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
  this._renderLineAxis();
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
