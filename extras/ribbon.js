/**
 * @license
 * Copyright 2015 Petr Shevtsov (petr.shevtsov@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 *
 * Plugin options:
 *
 *  `data`: Array of numeric values (0-1) corresponding to the position
 *  in the pallete interval.
 *
 *  `parser`: Function (`function (data, dygraph)`) returning the array of numeric
 *  values. Function arguments: raw data, dygraph instance.
 *
 *  `options`: Object with the following properties:
 *
 *    `palette`: Colors Array. Default: ["transparent", "#ef2929", "#8ae234"]
 *
 *    `height`: Value (0-1) representing the height of the ribbon: 1 - full height,
 *    0.5 - 50% height and so on.
 *
 *    `position`: Value (0-1) representing the start position of the ribbon:
 *    0 - start from the bottom of chart, 0.25 - start from the 25% of the chart
 *    height and so on.
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
      height: 1,
      position: 0
    };

    this.ribbonOptions_ = Dygraph.update(defaultOptions, this.ribbonOptions_);
    this.ribbonOptions_.height = Math.min(this.ribbonOptions_.height, 1);
    this.ribbonOptions_.height = Math.max(this.ribbonOptions_.height, 0);
    this.ribbonOptions_.position = Math.min(this.ribbonOptions_.position, 1);
    this.ribbonOptions_.position = Math.max(this.ribbonOptions_.position, 0);
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
      var y = area.h * (1 - this.ribbonOptions_.height) + area.y;
      var h = (area.h - area.h * this.ribbonOptions_.position) - y;
      g.hidden_ctx_.fillStyle = color;
      g.hidden_ctx_.fillRect(left, y, right - left, h);
    }
  };

  return ribbon;
})();
