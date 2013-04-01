/**
 * @license
 * Copyright 2013 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/*global Dygraph:false */

Dygraph.Plugins.Hairlines = (function() {

"use strict";

/**
Current bits of jankiness:
- Uses dygraph.layout_ to get the parsed hairlines.
- Uses dygraph.plotter_.area

It would be nice if the plugin didn't require so much special support inside
the core dygraphs classes, but hairlines involve quite a bit of parsing and
layout.

TODO(danvk): cache DOM elements.

*/

/**
 * @typedef {
 *   xFraction: number,   // invariant across resize
 *   interpolated: bool,  // alternative is to snap to closest
 *   lineDiv: !Element    // vertical hairline div
 *   infoDiv: !Element    // div containing info about the nearest points
 * } Hairline
 */

var hairlines = function() {
  /* @type {!Array.<!Hairline>} */
  this.hairlines_ = [];

  // Used to detect resizes (which require the divs to be repositioned).
  this.lastWidth_ = -1;
  this.lastHeight = -1;
  this.dygraph_ = null;
};

hairlines.prototype.toString = function() {
  return "Hairlines Plugin";
};

hairlines.prototype.activate = function(g) {
  this.dygraph_ = g;
  this.hairlines_ = [this.createHairline(0.55)];

  return {
    didDrawChart: this.didDrawChart
  };
};

hairlines.prototype.detachLabels = function() {
  for (var i = 0; i < this.hairlines_.length; i++) {
    var h = this.hairlines_[i];
    $(h.lineDiv).remove();
    $(h.infoDiv).remove();
    this.hairlines_[i] = null;
  }
  this.hairlines_ = [];
};

hairlines.prototype.hairlineWasDragged = function(h, event, ui) {
  var area = this.dygraph_.getArea();
  h.xFraction = (ui.position.left - area.x) / area.w;
  this.updateHairlineDivPositions();
  this.updateHairlineInfo();
};

hairlines.prototype.createHairline = function(xFraction) {
  var h;
  var self = this;

  var $lineDiv = $('<div/>').css({
    'border-right': '1px solid black',
    'width': '0px',
    'position': 'absolute',
    'z-index': '10'
  })
    .addClass('dygraph-hairline')
    .appendTo(this.dygraph_.graphDiv);

  var $infoDiv = $('<div/>').css({
    'border': '1px solid black',
    'display': 'table',  // shrink to fit
    'z-index': '10',
    'padding': '3px',
    'background': 'white',
    'position': 'absolute'
  })
    .addClass('dygraph-hairline-info')
    .text('Info')
    .draggable({
      'axis': 'x',
      'containment': 'parent',
      'drag': function(event, ui) {
        self.hairlineWasDragged(h, event, ui);
      }
      // TODO(danvk): set cursor here
    })
    .appendTo(this.dygraph_.graphDiv);

  h = {
    xFraction: xFraction,
    interpolated: true,
    lineDiv: $lineDiv.get(0),
    infoDiv: $infoDiv.get(0)
  };

  return h;
};

// Positions existing hairline divs.
hairlines.prototype.updateHairlineDivPositions = function() {
  var layout = this.dygraph_.getArea();
  $.each(this.hairlines_, function(idx, h) {
    var left = layout.x + h.xFraction * layout.w;
    $(h.lineDiv).css({
      'left': left + 'px',
      'top': layout.y + 'px',
      'height': layout.h + 'px'
    });
    $(h.infoDiv).css({
      'left': left + 'px',
      'top': layout.y + 'px',
    });
  });
};

// Fills out the info div based on current coordinates.
hairlines.prototype.updateHairlineInfo = function() {
  var g = this.dygraph_;
  var xRange = g.xAxisRange();
  $.each(this.hairlines_, function(idx, h) {
    var xValue = h.xFraction * (xRange[1] - xRange[0]) + xRange[0];

    // TODO(danvk): find appropriate y-values and format them.

    var xOptView = g.optionsViewForAxis_('x');
    var xvf = xOptView('valueFormatter');
    var html = xvf(xValue, xOptView, xValue, g);
    $(h.infoDiv).html(html);
  });
};

hairlines.prototype.didDrawChart = function(e) {
  var g = e.dygraph;

  // Early out in the (common) case of zero hairlines.
  if (this.hairlines_.length === 0) return;

  var containerDiv = e.canvas.parentNode;
  var width = containerDiv.offsetWidth;
  var height = containerDiv.offsetHeight;
  if (width !== this.lastWidth_ || height !== this.lastHeight_) {
    this.lastWidth_ = width;
    this.lastHeight_ = height;
    this.updateHairlineDivPositions();
  }

  this.updateHairlineInfo();
};

hairlines.prototype.destroy = function() {
  this.detachLabels();
};

return hairlines;

})();
