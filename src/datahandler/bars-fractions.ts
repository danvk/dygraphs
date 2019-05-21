/**
 * @license
 * Copyright 2013 David Eberlein (david.eberlein@ch.sauter-bc.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview DataHandler implementation for the combination
 * of error bars and fractions options.
 * @author David Eberlein (david.eberlein@ch.sauter-bc.com)
 */

import BarsHandler from './bars';
import { UnifiedPoint } from './datahandler';
import { DygraphOptions } from '../dygraph-types';

class FractionsBarsHandler extends BarsHandler {
  constructor() {
    super();
  }

  extractSeries(rawData: number[][], i: number, options: DygraphOptions): UnifiedPoint[] {
    // TODO(danvk): pre-allocate series here.
    let series = [];
    var mult = 100.0;
    var sigma = options.get("sigma");
    var logScale = options.get('logscale');
    for (let j = 0; j < rawData.length; j++) {
      let x = rawData[j][0];
      let point = rawData[j][i];
      if (logScale && point !== null) {
        // On the log scale, points less than zero do not exist.
        // This will create a gap in the chart.
        if (point[0] <= 0 || point[1] <= 0) {
          point = null;
        }
      }
      // Extract to the unified data format.
      if (point !== null) {
        let num = point[0];
        let den = point[1];
        if (num !== null && !isNaN(num)) {
          let value = den ? num / den : 0.0;
          let stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
          let variance = mult * stddev;
          let y = mult * value;
          // preserve original values in extras for further filtering
          series.push([x, y, [y - variance, y + variance, num, den]]);
        }
        else {
          series.push([x, num, [num, num, num, den]]);
        }
      }
      else {
        series.push([x, null, [null, null, null, null]]);
      }
    }
    return series;
  }

  rollingAverage(originalData: UnifiedPoint[], rollPeriod: number, options: DygraphOptions): UnifiedPoint[] {
    rollPeriod = Math.min(rollPeriod, originalData.length);
    var rollingData = [];
    var sigma = options.get("sigma");
    var wilsonInterval = options.get("wilsonInterval");
    var low: number, high: number, stddev: number;
    var num = 0;
    var den = 0; // numerator/denominator
    var mult = 100.0;
    for (let i = 0; i < originalData.length; i++) {
      num += originalData[i][2][2];
      den += originalData[i][2][3];
      if (i - rollPeriod >= 0) {
        num -= originalData[i - rollPeriod][2][2];
        den -= originalData[i - rollPeriod][2][3];
      }
      var date = originalData[i][0];
      var value = den ? num / den : 0.0;
      if (wilsonInterval) {
        // For more details on this confidence interval, see:
        // http://en.wikipedia.org/wiki/Binomial_confidence_interval
        if (den) {
          var p = value < 0 ? 0 : value, n = den;
          var pm = sigma * Math.sqrt(p * (1 - p) / n + sigma * sigma / (4 * n * n));
          var denom = 1 + sigma * sigma / den;
          low = (p + sigma * sigma / (2 * den) - pm) / denom;
          high = (p + sigma * sigma / (2 * den) + pm) / denom;
          rollingData[i] = [date, p * mult,
            [low * mult, high * mult]];
        }
        else {
          rollingData[i] = [date, 0, [0, 0]];
        }
      }
      else {
        stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
        rollingData[i] = [date, mult * value,
          [mult * (value - stddev), mult * (value + stddev)]];
      }
    }
    return rollingData;
  }
}

export default FractionsBarsHandler;
