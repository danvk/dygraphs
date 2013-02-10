/*global Dygraph:false */

/**
 * @fileoverview Plug-in for providing horizontal guidelines.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 *
 * Usage:
 * 
 * g = new Dygraph(div, data, {
 *   plugins : [
 *     Dygraph.Plugins.Guidelines(
 *        [ 500, 1000, 1500, 2000, 2500 ],
 *        [ "black", "blue", "red", "green", "orange" ],
 *        function(ctx, g, value, idx) {
 *          ctx.lineWidth = idx / 2;
 *        })
 *   ]};
 *
 * The object takes three parameters:
 *
 * values: either an array of numbers, or a function that returns an array
 *    of numbers, evaluated at draw time.
 * color (optional): can be a string (e.g. "blue"), an array of strings
 *    (1:1 mapping to values) or a function(g, value idx) that returns a string.
 * styler (optional): function(ctx, g, value, idx) that can be used to style
 *    drawing context.
 */
Dygraph.Plugins.Guidelines = (function(values, color, styler) {

  "use strict";

  /**
   * Create a new instance.
   *
   * @constructor
   */
  var guidelines = function() {
    // Initialize, and standardize.
    this.values = typeof(values) === "function" ? values : function() { return values; };
    this.color = color;
    this.styler = styler;
  };

  guidelines.prototype.toString = function() {
    return 'Guidelines Plugin';
  };

  guidelines.prototype.activate = function(g) {
    return {
      willDrawChart: this.willDrawChart
    };
  };

  guidelines.prototype.willDrawChart = function(e) {
    var g = e.dygraph;

    var values = this.values();

    var ctx = e.drawingContext;

    for (var idx = 0; idx < values.length; idx++) {
      var value = values[idx];

      ctx.save();
      if (this.color !== null) {
        var colorType = typeof(this.color);
        if (colorType === "string") {
          ctx.strokeStyle = this.color;
        } else if (Array.isArray(this.color)) {
          ctx.strokeStyle = this.color[idx];
        } else {
          ctx.strokeStyle = this.color(g, value, idx);
        }
      }

      if (this.styler) {
        this.styler(ctx, g, value, idx);
      }

      ctx.beginPath();
      var y = g.toDomYCoord(value);
      var a = g.getArea();
      ctx.moveTo(a.x, y);
      ctx.lineTo(a.x + a.w, y);
      ctx.closePath();
      ctx.stroke();
 
      ctx.restore();
    }
  };

  return guidelines;

});
