/**
 * @license
 * Copyright 2012 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/*global Dygraph:false */

Dygraph.Plugins.Axes = (function() {

'use strict';

/*
Bits of jankiness:
- Direct layout access
- Direct area access
- Should include calculation of ticks, not just the drawing.

Options left to make axis-friendly.
  ('drawAxesAtZero')
  ('xAxisHeight')
*/

/**
 * Draws the axes. This includes the labels on the x- and y-axes, as well
 * as the tick marks on the axes.
 * It does _not_ draw the grid lines which span the entire chart.
 */
var axes = function() {
  this.xlabels_ = [];
  this.ylabels_ = [];
};

axes.prototype.toString = function() {
  return 'Axes Plugin';
};

axes.prototype.activate = function(g) {
  return {
    layout: this.layout,
    clearChart: this.clearChart,
    willDrawChart: this.willDrawChart
  };
};

axes.prototype.layout = function(e) {
  var g = e.dygraph;

  for(var i=0; i < g.numAxes(); i++) {
    var width = 2 * g.getOptionForAxis('axisTickSize', i);
    if(g.getOptionForAxis('position', i) === 'left') {
      e.reserveSpaceLeft(width, i); 
    } else {
      e.reserveSpaceRight(width, i);
    }
  }

  if (g.getOptionForAxis('drawAxis', 'x')) {
    var h;
    // NOTE: I think this is probably broken now, since g.getOption() now
    // hits the dictionary. (That is, g.getOption('xAxisHeight') now always
    // has a value.)
    if (g.getOption('xAxisHeight')) {
      h = g.getOption('xAxisHeight');
    } else {
      h = g.getOptionForAxis('axisLabelFontSize', 'x') + 2 * g.getOptionForAxis('axisTickSize', 'x');
    }
    e.reserveSpaceBottom(h);
  }
  
};

axes.prototype.detachLabels = function() {
  function removeArray(ary) {
    for (var i = 0; i < ary.length; i++) {
      var el = ary[i];
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  }

  removeArray(this.xlabels_);
  removeArray(this.ylabels_);
  this.xlabels_ = [];
  this.ylabels_ = [];
};

axes.prototype.clearChart = function(e) {
  this.detachLabels();
};

axes.prototype.willDrawChart = function(e) {
  var g = e.dygraph;

  if (!g.getOptionForAxis('drawAxis', 'x') &&
      !g.getOptionForAxis('drawAxis', 'y') &&
      !g.getOptionForAxis('drawAxis', 'y2')) {
    return;
  }
  
  // Round pixels to half-integer boundaries for crisper drawing.
  function halfUp(x)  { return Math.round(x) + 0.5; }
  function halfDown(y){ return Math.round(y) - 0.5; }

  var context = e.drawingContext;
  var containerDiv = e.canvas.parentNode;
  var canvasWidth = g.width_;  // e.canvas.width is affected by pixel ratio.
  var canvasHeight = g.height_;

  var label, x, y, tick, i, maxWidth;

  var makeLabelStyle = function(axis) {
    return {
      position: 'absolute',
      fontSize: g.getOptionForAxis('axisLabelFontSize', axis) + 'px',
      zIndex: 10,
      color: g.getOptionForAxis('axisLabelColor', axis),
      width: g.getOptionForAxis('axisLabelWidth', axis) + 'px',
      // height: g.getOptionForAxis('axisLabelFontSize', 'x') + 2 + "px",
      lineHeight: 'normal',  // Something other than "normal" line-height screws up label positioning.
      overflow: 'hidden'
    };
  };

  var labelStyles = {};
  labelStyles[-1] = makeLabelStyle('x');
  for(var i=0; i < g.numAxes(); i++) {
    labelStyles[i] = makeLabelStyle(i);
  }

  var makeDiv = function(txt, axis) {
    /*
     * This seems to be called with the following three sets of axis/prec_axis:
     * x: undefined
     * y: y1
     * y: y2
     */
    var div = document.createElement('div');
    var labelStyle = labelStyles[axis];
    for (var name in labelStyle) {
      if (labelStyle.hasOwnProperty(name)) {
        div.style[name] = labelStyle[name];
      }
    }
    var inner_div = document.createElement('div');
    inner_div.className = 'dygraph-axis-label' +
                          ' dygraph-axis-label-' + axis +
/*                          ' dygraph-axis-label-' + 
                          (axis === -1 ? 'x' : (axis === 0 ? 'y1' : 'y2')) +*/
                          ' dygraph-axis-label-' +  (axis === -1 ? 'x' : 'y');
    inner_div.innerHTML = txt;
    div.appendChild(inner_div);
    return div;
  };

  // axis lines
  context.save();

  var layout = g.layout_;
  var area = e.dygraph.plotter_.area;

  // Helper for repeated axis-option accesses.
  var makeOptionGetter = function(axis) {
    return function(option) {
      return g.getOptionForAxis(option, axis);
    };
  };

  if (layout.yticks && layout.yticks.length > 0) {
    for (var i = 0; i < layout.yticks.length; i++) {
      tick = layout.yticks[i];
      if (typeof(tick) == 'function') return;  // <-- when would this happen?
      var tickAxis = tick[0];
      var tickPosPer = tick[1];
      var tickLabel = tick[2];
      var getAxisOption = makeOptionGetter(tickAxis);
      var axisArea = layout.getAxisArea(tickAxis);
      var sgn = 1;
      if(getAxisOption('position') === 'right') {
        sgn = -1;
      }
  
      var fontSize = getAxisOption('axisLabelFontSize');
      y = area.y + tickPosPer * area.h;


      /* Tick marks are currently clipped, so don't bother drawing them.
      context.beginPath();
      context.moveTo(halfUp(x), halfDown(y));
      context.lineTo(halfUp(x - sgn * this.attr_('axisTickSize')), halfDown(y));
      context.closePath();
      context.stroke();
      */

      label = makeDiv(tickLabel, tickAxis);
      var top = (y - fontSize / 2);
      if (top < 0) top = 0;

      if (top + fontSize + 3 > canvasHeight) {
        label.style.bottom = '0';
      } else {
        label.style.top = top + 'px';
      }
      
      if(getAxisOption('position') === 'left') {
        // align label to the right
        label.style.left = (axisArea.x + axisArea.w - getAxisOption('axisLabelWidth') - 4) + 'px';
        label.style.textAlign = 'right';
      } else {
        // align label to the left site
        label.style.left = (axisArea.x + 4) + 'px';
        label.style.textAlign = 'left';
      }

      containerDiv.appendChild(label);
      this.ylabels_.push(label);
    }

    // The lowest tick on the y-axis often overlaps with the leftmost
    // tick on the x-axis. Shift the bottom tick up a little bit to
    // compensate if necessary.
    var bottomTick = this.ylabels_[0];
    // Interested in the y2 axis also?
    var fontSize = g.getOptionForAxis('axisLabelFontSize', 'y');
    var bottom = parseInt(bottomTick.style.top, 10) + fontSize;
    if (bottom > canvasHeight - fontSize) {
      bottomTick.style.top = (parseInt(bottomTick.style.top, 10) -
          fontSize / 2) + 'px';
    }
    

    // draw a vertical line on the left to separate the chart from the labels.
    var axisX;
    if (g.getOption('drawAxesAtZero')) {
      var r = g.toPercentXCoord(0);
      if (r > 1 || r < 0 || isNaN(r)) r = 0;
      axisX = halfUp(area.x + r * area.w);
    } else {
      axisX = halfUp(area.x);
    }

    context.strokeStyle = g.getOptionForAxis('axisLineColor', 'y');
    context.lineWidth = g.getOptionForAxis('axisLineWidth', 'y');

    context.beginPath();
    context.moveTo(axisX, halfDown(area.y));
    context.lineTo(axisX, halfDown(area.y + area.h));
    context.closePath();
    context.stroke();
  }

  if (g.getOptionForAxis('drawAxis', 'x')) {
    if (layout.xticks) {
      var getAxisOption = makeOptionGetter('x');
      for (i = 0; i < layout.xticks.length; i++) {
        tick = layout.xticks[i];
        x = area.x + tick[0] * area.w;
        y = area.y + area.h;

        /* Tick marks are currently clipped, so don't bother drawing them.
        context.beginPath();
        context.moveTo(halfUp(x), halfDown(y));
        context.lineTo(halfUp(x), halfDown(y + this.attr_('axisTickSize')));
        context.closePath();
        context.stroke();
        */

        label = makeDiv(tick[1], -1);
        label.style.textAlign = 'center';
        label.style.top = (y + getAxisOption('axisTickSize')) + 'px';

        var left = (x - getAxisOption('axisLabelWidth')/2);
        if (left + getAxisOption('axisLabelWidth') > canvasWidth) {
          left = canvasWidth - getAxisOption('axisLabelWidth');
          label.style.textAlign = 'right';
        }
        if (left < 0) {
          left = 0;
          label.style.textAlign = 'left';
        }

        label.style.left = left + 'px';
        label.style.width = getAxisOption('axisLabelWidth') + 'px';
        containerDiv.appendChild(label);
        this.xlabels_.push(label);
      }
    }

    context.strokeStyle = g.getOptionForAxis('axisLineColor', 'x');
    context.lineWidth = g.getOptionForAxis('axisLineWidth', 'x');
    context.beginPath();
    var axisY;
    if (g.getOption('drawAxesAtZero')) {
      var r = g.toPercentYCoord(0, 0);
      if (r > 1 || r < 0) r = 1;
      axisY = halfDown(area.y + r * area.h);
    } else {
      axisY = halfDown(area.y + area.h);
    }
    context.moveTo(halfUp(area.x), axisY);
    context.lineTo(halfUp(area.x + area.w), axisY);
    context.closePath();
    context.stroke();
  }

  context.restore();
};

return axes;
})();
