/**
 * @license
 * Copyright 2014 Petr Shevtsov (petr.shevtsov@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/*global Dygraph:false */
/*jshint globalstrict: true */
Dygraph.Plugins.Crosshair = (function() {
"use strict";

/**
 * Creates the crosshair
 *
 * @constructor
 */

var crosshair = function() {
  this.canvas_ = document.createElement("canvas");
};

crosshair.prototype.toString = function() {
  return "Crosshair Plugin";
};

/**
 * @param {Dygraph} g Graph instance.
 * @return {object.<string, function(ev)>} Mapping of event names to callbacks.
 */
crosshair.prototype.activate = function(g) {
  g.graphDiv.appendChild(this.canvas_);

  return {
    select: this.select,
    deselect: this.deselect
  };
};

crosshair.prototype.select = function(e) {
  var options = e.dygraph.getOption('crosshair');
  if (options === null) {
    return;
  }

  var width = e.dygraph.width_;
  var height = e.dygraph.height_;
  this.canvas_.width = width;
  this.canvas_.height = height;
  this.canvas_.style.width = width + "px";    // for IE
  this.canvas_.style.height = height + "px";  // for IE

  var ctx = this.canvas_.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(0, 0, 0,0.3)";
  ctx.beginPath();

  var canvasx = Math.floor(e.dygraph.selPoints_[0].canvasx) + 0.5; // crisper rendering

  if (options === "vertical" || options === "both" || options === true) {
    ctx.moveTo(canvasx, 0);
    ctx.lineTo(canvasx, height);
  }

  if (options === "horizontal" || options === "both" || options === true) {
    for (var i = 0; i < e.dygraph.selPoints_.length; i++) {
      var canvasy = Math.floor(e.dygraph.selPoints_[i].canvasy) + 0.5; // crisper rendering
      ctx.moveTo(0, canvasy);
      ctx.lineTo(width, canvasy);
    }
  }

  ctx.stroke();
  ctx.closePath();
};

crosshair.prototype.deselect = function(e) {
  var ctx = this.canvas_.getContext("2d");
  ctx.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
};

crosshair.prototype.destroy = function() {
  this.canvas_ = null;
};

return crosshair;
})();
