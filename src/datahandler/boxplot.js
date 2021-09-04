/**
 * @license
 * Copyright 2016 Vojtech Horky (vojtech.horky@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview DataHandler implementation for the "boxplot" data formats.
 * 
 * @author Vojtech Horky (vojtech.horky@gmail.com)
 */

import DygraphDataHandler from './datahandler';
import DygraphLayout from '../dygraph-layout';

"use strict";

var BoxplotHandler = function() {
  DygraphDataHandler.call(this);
};

BoxplotHandler.prototype = new DygraphDataHandler();

/** @inheritDoc */
BoxplotHandler.prototype.extractSeries = function(rawData, seriesIndex, options) {
  var series = [];
  var x, y, q0, q1, q2, q3, q4;
  for (var j = 0; j < rawData.length; j++) {
    x = rawData[j][0];
    var data = rawData[j][seriesIndex];
    y = data[0];
    switch (data.length) {
    case 3:
      q0 = null;
      q1 = data[1];
      q2 = y;
      q3 = data[2];
      q4 = null;
      break;
    case 5:
      q0 = data[1];
      q1 = data[2];
      q2 = y;
      q3 = data[3];
      q4 = data[4];
      break;
    case 6:
      q0 = data[1];
      q1 = data[2];
      q2 = data[3]
      q3 = data[4];
      q4 = data[5];
      break;
    default:
      q0 = null;
      q1 = null;
      q2 = null;
      q3 = null;
      q4 = null;
    }
    
    series.push([ x, y, [ q0, q1, q2, q3, q4 ] ]);
  }
  return series;
};

/** @inheritDoc */
BoxplotHandler.prototype.getExtremeYValues = function(series, dateWindow, options) {
  var low = null, high = null;
  
  for (var i = 0; i < series.length; i++) {
    var y = series[i][1];
    if (y === null || isNaN(y)) {
      continue;
    }
    
    var q0 = series[i][2][0];
    var q4 = series[i][2][4];
    
    if ((low === null) || (q0 < low)) {
      low = q0;
    }
    if ((high === null) || (q4 > high)) {
      high = q4;
    }
  }
  
  return [ low, high ];
};

/** @inheritDoc */
BoxplotHandler.prototype.onPointsCreated_ = function(series, points) {
  for (var i = 0; i < series.length; ++i) {
    var item = series[i];
    var point = points[i];
    
    point.box = [ DygraphDataHandler.parseFloat(item[2][1]),
                  DygraphDataHandler.parseFloat(item[2][2]),
                  DygraphDataHandler.parseFloat(item[2][3]) ];
    
    point.whisker = [ DygraphDataHandler.parseFloat(item[2][0]),
                      DygraphDataHandler.parseFloat(item[2][4]) ]
  }
};

/** @inheritDoc */
BoxplotHandler.prototype.onLineEvaluated = function(points, axis, logscale) {
  for (var j = 0; j < points.length; j++) {
    var p = points[j];
    p.y_box = [ DygraphLayout.calcYNormal_(axis, p.box[0], logscale),
                    DygraphLayout.calcYNormal_(axis, p.box[1], logscale),
                    DygraphLayout.calcYNormal_(axis, p.box[2], logscale) ];
    
    p.y_whisker = [ DygraphLayout.calcYNormal_(axis, p.whisker[0], logscale),
                    DygraphLayout.calcYNormal_(axis, p.whisker[1], logscale) ];
  }
};

export default BoxplotHandler;
