/**
 * @license
 * Copyright 2015 Petr Shevtsov (petr.shevtsov@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 *
 * Ribbon is a horizontal band of colors that runs through the chart. It can be useful
 * to visualize categorical variables (http://en.wikipedia.org/wiki/Categorical_variable)
 * that change over time (along the x-axis). For example multiple states of economy
 * like "bust", "recession", "recovery", "boom" can be encoded as [0, 1, 2, 3]
 * respectively (or normalized as [0, 0.33, 0.66, 1]) and assigned colors
 * ["red","orange","green","purple"].
 *
 * Plugin options:
 *
 * `data`: Array of numeric values in the range from 0 to 1. Ribbon data array
 * must be of same length as number of rows of Dygraph raw data table.
 * Each of the values (0-1) scales to a position in the palette array scale
 * (see palette argument below). For example, if palette is defined as
 * ["transparent", "#ef2929", "#8ae234"], then 0 is the leftmost position ("#ef2929")
 * on the palette scale, 1 is the rightmost position ("#8ae234") and 0.5 is the middle
 * position ("#ef2929").
 *
 * `parser`: Function (function (data, dygraph)) returning the array of numeric values.
 * Function arguments: raw data, dygraph instance. Provide it if the ribbon data,
 * i.e. encodings are part of the dygraph raw data table rather than supplied separately
 * through ribbon data argument.
 *
 * `options`: Object with the following properties:
 *
 *  - `palette`: array of hexadecimal color codes.
 *    Default: ["transparent", "#ef2929", "#8ae234"].
 *    Pick colors from e.g. http://www.w3schools.com/tags/ref_colorpicker.asp
 *
 *  - `top`: vertical position of the top edge of the ribbon relative to chart height.
 *    Value in the range from 0 (bottom edge of the chart) to 1 (top edge of the chart).
 *    E.g. 0.5 places the top edge of the ribbon at the 50% height of the chart.
 *
 *  - `bottom`: vertical position of the bottom edge of the ribbon relative to chart
 *    height. See top.
 */

/*global Dygraph:false */

Dygraph.Plugins.Ribbon = (function() {
  "use strict";

  var ribbon = function(options) {
    options = options || {};

    this.ribbonData_ = options.data || null;
    this.ribbonDataParser_ = options.parser || null;
    this.ribbonOptions_ = options.options || {};

    var defaultOptions = {
      palette: [
        "transparent",
        "#ef2929",
        "#8ae234"
      ],
      top: 1,
      bottom: 0
    };

    function update(self, o) {
      if (typeof(o) != 'undefined' && o !== null) {
        for (var k in o) {
          if (o.hasOwnProperty(k)) {
            self[k] = o[k];
          }
        }
      }
      return self;
    }

    this.ribbonOptions_ = update(defaultOptions, this.ribbonOptions_);
    this.ribbonOptions_.top = Math.min(this.ribbonOptions_.top, 1);
    this.ribbonOptions_.top = Math.max(this.ribbonOptions_.top, 0);
    this.ribbonOptions_.bottom = Math.min(this.ribbonOptions_.bottom, 1);
    this.ribbonOptions_.bottom = Math.max(this.ribbonOptions_.bottom, 0);

    this.ribbonOptions_.top = Math.max(this.ribbonOptions_.top, this.ribbonOptions_.bottom);
    this.ribbonOptions_.bottom = Math.min(this.ribbonOptions_.top, this.ribbonOptions_.bottom);
  };

  ribbon.prototype.toString = function() {
    return "Ribbon Plugin";
  };

  ribbon.prototype.activate = function(g) {
    if (this.ribbonData_ !== null || this.ribbonDataParser_ !== null) {
      return {
        willDrawChart: this.willDrawChart
      };
    }
  };

  ribbon.prototype.decodeColor = function(val) {
    var max = Math.max.apply(null, this.ribbonData_);
    val = val / max;
    var idx = Math.ceil((this.ribbonOptions_.palette.length - 1) * val);

    return this.ribbonOptions_.palette[idx];
  };

  ribbon.prototype.willDrawChart = function(e) {
    var g = e.dygraph;
    var layout = g.layout_;
    var points = layout.points[0];
    var area = layout.getPlotArea();
    if (this.ribbonData_ === null) {
      this.ribbonData_ = this.ribbonDataParser_(g.rawData_, g);
    }
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      var nextpoint = points[i + 1];

      var left = g.toDomCoords(point.xval, 0)[0];
      var right = (nextpoint === undefined) ? g.canvas_.width : g.toDomCoords(nextpoint.xval, 0)[0];
      var color = this.decodeColor(this.ribbonData_[point.idx]);
      var y = area.h * (1 - this.ribbonOptions_.top) + area.y;
      var h = (area.h - area.h * this.ribbonOptions_.bottom) - y;
      g.hidden_ctx_.fillStyle = color;
      g.hidden_ctx_.fillRect(left, y, right - left, h);
    }
  };

  return ribbon;
})();
