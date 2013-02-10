// Copyright (c) 2013 Google, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/*global Dygraph:false */

/**
 * @fileoverview Plug-in for providing horizontal guidelines.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

/*
 * values is an array of numbers, or a function that returns an array of numbers, evaluated at draw time.
 * color is a string, or array of strings (1:1 value map) or a function that takes a value and returns a string, or null.
 * styler is a function that takes a context and value, and styles the context. Or null.
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
      var colorType = typeof(this.color);
      if (colorType !== null) {
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
      var x0 = g.toDomXCoord(g.xAxisRange()[0]);
      ctx.moveTo(x0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.closePath();
      ctx.stroke();
 
      ctx.restore();
    }
  };

  return guidelines;

})    ; // ();
