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

/*global Dygraph:false */
/*global DygraphLayout:false */
"use strict";

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _datahandler = require('./datahandler');

var _datahandler2 = _interopRequireDefault(_datahandler);

var _dygraphLayout = require('../dygraph-layout');

var _dygraphLayout2 = _interopRequireDefault(_dygraphLayout);

/**
 * @constructor
 * @extends {Dygraph.DataHandler}
 */
var BarsHandler = function BarsHandler() {
  _datahandler2['default'].call(this);
};
BarsHandler.prototype = new _datahandler2['default']();

// TODO(danvk): figure out why the jsdoc has to be copy/pasted from superclass.
//   (I get closure compiler errors if this isn't here.)
/**
 * @override
 * @param {!Array.<Array>} rawData The raw data passed into dygraphs where 
 *     rawData[i] = [x,ySeries1,...,ySeriesN].
 * @param {!number} seriesIndex Index of the series to extract. All other
 *     series should be ignored.
 * @param {!DygraphOptions} options Dygraph options.
 * @return {Array.<[!number,?number,?]>} The series in the unified data format
 *     where series[i] = [x,y,{extras}]. 
 */
BarsHandler.prototype.extractSeries = function (rawData, seriesIndex, options) {
  // Not implemented here must be extended
};

/**
 * @override
 * @param {!Array.<[!number,?number,?]>} series The series in the unified 
 *          data format where series[i] = [x,y,{extras}].
 * @param {!number} rollPeriod The number of points over which to average the data
 * @param {!DygraphOptions} options The dygraph options.
 * TODO(danvk): be more specific than "Array" here.
 * @return {!Array.<[!number,?number,?]>} the rolled series.
 */
BarsHandler.prototype.rollingAverage = function (series, rollPeriod, options) {
  // Not implemented here, must be extended.
};

/** @inheritDoc */
BarsHandler.prototype.onPointsCreated_ = function (series, points) {
  for (var i = 0; i < series.length; ++i) {
    var item = series[i];
    var point = points[i];
    point.y_top = NaN;
    point.y_bottom = NaN;
    point.yval_minus = _datahandler2['default'].parseFloat(item[2][0]);
    point.yval_plus = _datahandler2['default'].parseFloat(item[2][1]);
  }
};

/** @inheritDoc */
BarsHandler.prototype.getExtremeYValues = function (series, dateWindow, options) {
  var minY = null,
      maxY = null,
      y;

  var firstIdx = 0;
  var lastIdx = series.length - 1;

  for (var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1];
    if (y === null || isNaN(y)) continue;

    var low = series[j][2][0];
    var high = series[j][2][1];

    if (low > y) low = y; // this can happen with custom bars,
    if (high < y) high = y; // e.g. in tests/custom-bars.html

    if (maxY === null || high > maxY) maxY = high;
    if (minY === null || low < minY) minY = low;
  }

  return [minY, maxY];
};

/** @inheritDoc */
BarsHandler.prototype.onLineEvaluated = function (points, axis, logscale) {
  var point;
  for (var j = 0; j < points.length; j++) {
    // Copy over the error terms
    point = points[j];
    point.y_top = _dygraphLayout2['default'].calcYNormal_(axis, point.yval_minus, logscale);
    point.y_bottom = _dygraphLayout2['default'].calcYNormal_(axis, point.yval_plus, logscale);
  }
};

exports['default'] = BarsHandler;
module.exports = exports['default'];