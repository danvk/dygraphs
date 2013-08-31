/**
 * @license
 * Copyright 2013 David Eberlein (david.eberlein@ch.sauter-bc.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview DataHandler base implementation for the "bar" 
 * data formats. This implementation must be extended and the
 * extractSeries and rollingAverage must be implemented.
 * @author David Eberlein (david.eberlein@ch.sauter-bc.com)
 */

(function() {

/*global Dygraph:false */
/*global DygraphLayout:false */
"use strict";

/**
 * @constructor
 * @extends {Dygraph.DataHandler}
 */
Dygraph.DataHandlers.BarsHandler = function() {
};

var BarsHandler = Dygraph.DataHandlers.BarsHandler;
BarsHandler.prototype = new Dygraph.DataHandler();

/** @inheritDoc */
BarsHandler.prototype.extractSeries = function(rawData, seriesIndex, options) {
  // Not implemented here must be extended
};

/** @inheritDoc */
BarsHandler.prototype.rollingAverage =
    function(series, rollPeriod, options) {
  // Not implemented here, must be extended.
};

/** @inheritDoc */
BarsHandler.prototype.onPointsCreated_ = function(series, points) {
  for (var i = 0; i < series.length; ++i) {
    var item = series[i];
    var point = points[i];
    point.y_top = NaN;
    point.y_bottom = NaN;
    point.yval_minus = Dygraph.parseFloat(item[2][0]);
    point.yval_plus = Dygraph.parseFloat(item[2][1]);
  }
};

/** @inheritDoc */
BarsHandler.prototype.getExtremeYValues = function(series, dateWindow, options) {
  var minY = null, maxY = null, y;

  var firstIdx = 0;
  var lastIdx = series.length - 1;

  for ( var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1];
    if (y === null || isNaN(y)) continue;

    var low = series[j][2][0];
    var high = series[j][2][1];

    if (low > y) low = y; // this can happen with custom bars,
    if (high < y) high = y; // e.g. in tests/custom-bars.html

    if (maxY === null || high > maxY) maxY = high;
    if (minY === null || low < minY) minY = low;
  }

  return [ minY, maxY ];
};

/** @inheritDoc */
BarsHandler.prototype.onLineEvaluated = function(points, axis, logscale) {
  var point;
  for (var j = 0; j < points.length; j++) {
    // Copy over the error terms
    point = points[j];
    point.y_top = DygraphLayout.calcYNormal_(axis, point.yval_minus, logscale);
    point.y_bottom = DygraphLayout.calcYNormal_(axis, point.yval_plus, logscale);
  }
};

})();
