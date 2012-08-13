/**
 * @license
 * Copyright 2012 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

Dygraph.Plugins.Grid = (function() {

/*

Current bits of jankiness:
- Direct layout access
- Direct area access

*/

"use strict";


/**
 * Draws the gridlines, i.e. the gray horizontal & vertical lines running the
 * length of the chart.
 *
 * @constructor
 */
var grid = function() {
};

grid.prototype.toString = function() {
  return "Gridline Plugin";
};

grid.prototype.activate = function(g) {
  return {
    willDrawChart: this.willDrawChart
  };
};

grid.prototype.willDrawChart = function(e) {
  // Draw the new X/Y grid. Lines appear crisper when pixels are rounded to
  // half-integers. This prevents them from drawing in two rows/cols.
  var g = e.dygraph;
  var ctx = e.drawingContext;
  var layout = g.layout_;
  var area = e.dygraph.plotter_.area;

  function halfUp(x)  { return Math.round(x) + 0.5; }
  function halfDown(y){ return Math.round(y) - 0.5; }

  var x, y, i, ticks;
  if (g.getOption('drawYGrid')) {
    ticks = layout.yticks;
    ctx.save();
    ctx.strokeStyle = g.getOption('gridLineColor');
    ctx.lineWidth = g.getOption('gridLineWidth');
    for (i = 0; i < ticks.length; i++) {
      // TODO(danvk): allow secondary axes to draw a grid, too.
      if (ticks[i][0] !== 0) continue;
      x = halfUp(area.x);
      y = halfDown(area.y + ticks[i][1] * area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + area.w, y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  if (g.getOption('drawXGrid')) {
    ticks = layout.xticks;
    ctx.save();
    ctx.strokeStyle = g.getOption('gridLineColor');
    ctx.lineWidth = g.getOption('gridLineWidth');
    for (i = 0; i < ticks.length; i++) {
      x = halfUp(area.x + ticks[i][0] * area.w);
      y = halfDown(area.y + area.h);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, area.y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
};

grid.prototype.destroy = function() {
};

return grid;

})();
