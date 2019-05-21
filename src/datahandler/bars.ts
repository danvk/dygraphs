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

import DygraphDataHandler, { UnifiedPoint } from './datahandler';
import DygraphLayout from '../dygraph-layout';
import { DygraphOptions, DygraphPointType, DygraphAxisType } from '../dygraph-types';

class BarsHandler extends DygraphDataHandler {
  constructor() {
    super();
  }

  onPointsCreated_(series: UnifiedPoint[], points: DygraphPointType[]) {
    for (var i = 0; i < series.length; ++i) {
      var item = series[i];
      var point = points[i];
      point.y_top = NaN;
      point.y_bottom = NaN;
      point.yval_minus = DygraphDataHandler.parseFloat(item[2][0]);
      point.yval_plus = DygraphDataHandler.parseFloat(item[2][1]);
    }
  }

  getExtremeYValues(series: UnifiedPoint[], dateWindow: [number, number], options: DygraphOptions): [number, number] {
    var minY = null, maxY = null, y;
    var firstIdx = 0;
    var lastIdx = series.length - 1;
    for (var j = firstIdx; j <= lastIdx; j++) {
      y = series[j][1];
      if (y === null || isNaN(y))
        continue;
      var low = series[j][2][0];
      var high = series[j][2][1];
      if (low > y)
        low = y; // this can happen with custom bars,
      if (high < y)
        high = y; // e.g. in tests/custom-bars.html
      if (maxY === null || high > maxY)
        maxY = high;
      if (minY === null || low < minY)
        minY = low;
    }
    return [minY, maxY];
  }

  onLineEvaluated(points: DygraphPointType[], axis: DygraphAxisType, logscale: boolean) {
    for (const point of points) {
      // Copy over the error terms
      point.y_top = DygraphLayout.calcYNormal_(axis, point.yval_minus, logscale);
      point.y_bottom = DygraphLayout.calcYNormal_(axis, point.yval_plus, logscale);
    }
  }
}

export default BarsHandler;
