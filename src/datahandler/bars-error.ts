/**
 * @license
 * Copyright 2013 David Eberlein (david.eberlein@ch.sauter-bc.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview DataHandler implementation for the error bars option.
 * @author David Eberlein (david.eberlein@ch.sauter-bc.com)
 */

import BarsHandler from './bars';
import { UnifiedPoint } from './datahandler';
import { DygraphOptions } from '../dygraph-types';

class ErrorBarsHandler extends BarsHandler {
  constructor() {
    super();
  }

  extractSeries(rawData: number[][], i: number, options: DygraphOptions): UnifiedPoint[] {
    // TODO(danvk): pre-allocate series here.
    const series: UnifiedPoint[] = [];
    const sigma = options.get("sigma");
    const logScale = options.get('logscale');
    for (let j = 0; j < rawData.length; j++) {
      const x = rawData[j][0];
      let point = rawData[j][i];
      if (logScale && point !== null) {
        // On the log scale, points less than zero do not exist.
        // This will create a gap in the chart.
        if (point[0] <= 0 || point[0] - sigma * point[1] <= 0) {
          point = null;
        }
      }
      // Extract to the unified data format.
      if (point !== null) {
        const y = point[0];
        if (y !== null && !isNaN(y)) {
          const variance = sigma * point[1];
          // preserve original error value in extras for further
          // filtering
          series.push([x, y, [y - variance, y + variance, point[1]]]);
        }
        else {
          series.push([x, y, [y, y, y]]);
        }
      }
      else {
        series.push([x, null, [null, null, null]]);
      }
    }
    return series;
  }

  rollingAverage(originalData: UnifiedPoint[], rollPeriod: number, options: DygraphOptions): UnifiedPoint[] {
    rollPeriod = Math.min(rollPeriod, originalData.length);
    var rollingData = [];
    var sigma = options.get("sigma");

    // Calculate the rolling average for the first rollPeriod - 1 points
    // where there is not enough data to roll over the full number of points
    for (let i = 0; i < originalData.length; i++) {
      let sum = 0;
      let variance = 0;
      let num_ok = 0;
      for (let j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
        const y = originalData[j][1];
        if (y === null || isNaN(y))
          continue;
        num_ok++;
        sum += y;
        variance += Math.pow(originalData[j][2][2], 2);
      }
      if (num_ok) {
        const stddev = Math.sqrt(variance) / num_ok;
        const value = sum / num_ok;
        rollingData[i] = [originalData[i][0], value,
        [value - sigma * stddev, value + sigma * stddev]];
      }
      else {
        // This explicitly preserves NaNs to aid with "independent
        // series".
        // See testRollingAveragePreservesNaNs.
        const v = (rollPeriod == 1) ? originalData[i][1] : null;
        rollingData[i] = [originalData[i][0], v, [v, v]];
      }
    }
    return rollingData;
  }
}

export default ErrorBarsHandler;
