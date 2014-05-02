/**
 * @license
 * Copyright 2014 Petr Shevtsov (petr.shevtsov@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */
/*global Dygraph:false */
Dygraph.Plugins.Crosshair = (function() {
/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

/**
 * Creates the crosshair
 *
 * @constructor
 */

var crosshair = function() {
  this.options = null;
};

crosshair.prototype.toString = function() {
  return "Crosshair Plugin";
};

/**
 * @param {Dygraph} g Graph instance.
 * @return {object.<string, function(ev)>} Mapping of event names to callbacks.
 */
crosshair.prototype.activate = function(g) {
  this.options = g.getOption('crosshair');

  return {
    select: this.select,
    deselect: this.deselect
  };
};

crosshair.prototype.select = function(e) {
  var ctx = e.dygraph.canvas_ctx_;
  var width = e.dygraph.width_;
  var height = e.dygraph.height_;
  var canvasx = e.dygraph.selPoints_[0].canvasx;
  var options = this.options;

  if (options === false) return;
  
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(0, 0, 0,0.3)";
  ctx.beginPath();

  if (options === "vertical" || options === "both" || options === true) {
    ctx.moveTo(canvasx, 0);
    ctx.lineTo(canvasx, height);
  }

  if (options === "horizontal" || options === "both" || options === true) {
    for (var i = 0; i < e.dygraph.selPoints_.length; i++) {
      var canvasy = e.dygraph.selPoints_[i].canvasy;
      ctx.moveTo(0, canvasy);
      ctx.lineTo(width, canvasy);
    }
  }

  ctx.stroke();
  ctx.closePath();
};

return crosshair;
})();
