var BarsHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("bars", BarsHandler);
BarsHandler.prototype.rollingAverage = function(originalData, rollPeriod,
    dygraphs) {
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];
  var sigma = dygraphs.attr_("sigma");

  var low, high, i, j, y, sum, num_ok, stddev;
  if (dygraphs.fractions_) {
    var num = 0;
    var den = 0; // numerator/denominator
    var mult = 100.0;
    for (i = 0; i < originalData.length; i++) {
      num += originalData[i][1][0];
      den += originalData[i][1][1];
      if (i - rollPeriod >= 0) {
        num -= originalData[i - rollPeriod][1][0];
        den -= originalData[i - rollPeriod][1][1];
      }

      var date = originalData[i][0];
      var value = den ? num / den : 0.0;
      if (dygraphs.attr_("wilsonInterval")) {
        // For more details on this confidence interval, see:
        // http://en.wikipedia.org/wiki/Binomial_confidence_interval
        if (den) {
          var p = value < 0 ? 0 : value, n = den;
          var pm = sigma
              * Math.sqrt(p * (1 - p) / n + sigma * sigma / (4 * n * n));
          var denom = 1 + sigma * sigma / den;
          low = (p + sigma * sigma / (2 * den) - pm) / denom;
          high = (p + sigma * sigma / (2 * den) + pm) / denom;
          rollingData[i] = [ date,
              [ p * mult, (p - low) * mult, (high - p) * mult ] ];
        } else {
          rollingData[i] = [ date, [ 0, 0, 0 ] ];
        }
      } else {
        stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
        rollingData[i] = [ date, [ mult * value, mult * stddev, mult * stddev ] ];
      }
    }
  } else if (dygraphs.attr_("customBars")) {
    low = 0;
    var mid = 0;
    high = 0;
    var count = 0;
    for (i = 0; i < originalData.length; i++) {
      var data = originalData[i][1];
      y = data[1];
      rollingData[i] = [ originalData[i][0], [ y, y - data[0], data[2] - y ] ];

      if (y !== null && !isNaN(y)) {
        low += data[0];
        mid += y;
        high += data[2];
        count += 1;
      }
      if (i - rollPeriod >= 0) {
        var prev = originalData[i - rollPeriod];
        if (prev[1][1] !== null && !isNaN(prev[1][1])) {
          low -= prev[1][0];
          mid -= prev[1][1];
          high -= prev[1][2];
          count -= 1;
        }
      }
      if (count) {
        rollingData[i] = [
            originalData[i][0],
            [ 1.0 * mid / count, 1.0 * (mid - low) / count,
                1.0 * (high - mid) / count ] ];
      } else {
        rollingData[i] = [ originalData[i][0], [ null, null, null ] ];
      }
    }
  } else {
    // Calculate the rolling average for the first rollPeriod - 1 points
    // where
    // there is not enough data to roll over the full number of points
    for (i = 0; i < originalData.length; i++) {
      sum = 0;
      var variance = 0;
      num_ok = 0;
      for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
        y = originalData[j][1][0];
        if (y === null || isNaN(y))
          continue;
        num_ok++;
        sum += originalData[j][1][0];
        variance += Math.pow(originalData[j][1][1], 2);
      }
      if (num_ok) {
        stddev = Math.sqrt(variance) / num_ok;
        rollingData[i] = [ originalData[i][0],
            [ sum / num_ok, sigma * stddev, sigma * stddev ] ];
      } else {
        // This explicitly preserves NaNs to aid with "independent
        // series".
        // See testRollingAveragePreservesNaNs.
        var v = (rollPeriod == 1) ? originalData[i][1][0] : null;
        rollingData[i] = [ originalData[i][0], [ v, v, v ] ];
      }
    }
  }

  return rollingData;
};
BarsHandler.prototype.getExtremeYValues = function(series, dateWindow, stepPlot) {
  var minY = null, maxY = null, y;

  var firstIdx = 0;
  var lastIdx = series.length - 1;
  if (dateWindow) {
    var x1, x2, y1, y2, intersectionY;
    var indexes = this.getIndexesInWindow(series, dateWindow);
    firstIdx = indexes[0];
    lastIdx = indexes[1];

    if (firstIdx != 0) {
      if (stepPlot) {
        firstIdx--;
      } else {
        // compute axis point of intersection
        x1 = series[firstIdx - 1][0];
        x2 = series[firstIdx][0];
        y1 = series[firstIdx - 1][1];
        y2 = series[firstIdx][1];
        if (y1 != null && y1[0] != null && !isNaN(y1[0]) && y2 != null && y2[0]
            && !isNaN(y2)) {
          intersectionY = this.computeYIntersection([ x1, y1[0] ],
              [ x2, y2[0] ], dateWindow[0]);
          minY = intersectionY;
          maxY = intersectionY;

          // Calculating the min point of intersection
          intersectionY = this.computeYIntersection([ x1, y1[1] ],
              [ x2, y2[1] ], dateWindow[0]);
          if (intersectionY < minY)
            minY = intersectionY;

          // Calculating the max point of intersection
          intersectionY = this.computeYIntersection([ x1, y1[2] ],
              [ x2, y2[2] ], dateWindow[0]);
          if (intersectionY > maxY)
            maxY = intersectionY;
        }
      }
    }
    if (lastIdx != series.length - 1) {
      if (!stepPlot) {
        // compute axis point of intersection
        x1 = series[lastIdx][0];
        x2 = series[lastIdx + 1][0];
        y1 = series[lastIdx][1];
        y2 = series[lastIdx + 1][1];
        if (y1 != null && y1[0] != null && !isNaN(y1[0]) && y2 != null && y2[0]
            && !isNaN(y2)) {
          intersectionY = this.computeYIntersection([ x1, y1[0] ],
              [ x2, y2[0] ], dateWindow[0]);
          if (minY == 0 || intersectionY < minY)
            minY = intersectionY;
          if (maxY == 0 || intersectionY > maxY)
            maxY = intersectionY;

          // Calculating the min point of intersection
          intersectionY = this.computeYIntersection([ x1, y1[1] ],
              [ x2, y2[1] ], dateWindow[0]);
          if (intersectionY < minY)
            minY = intersectionY;

          // Calculating the max point of intersection
          intersectionY = this.computeYIntersection([ x1, y1[2] ],
              [ x2, y2[2] ], dateWindow[0]);
          if (intersectionY > maxY)
            maxY = intersectionY;
        }
      }
    }
  }

  for ( var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1][0];
    if (y === null || isNaN(y))
      continue;
    var low = y - series[j][1][1];
    var high = y + series[j][1][2];
    if (low > y)
      low = y; // this can happen with custom bars,
    if (high < y)
      high = y; // e.g. in tests/custom-bars.html
    if (maxY === null || high > maxY) {
      maxY = high;
    }
    if (minY === null || low < minY) {
      minY = low;
    }
  }

  return [ minY, maxY ];
};
BarsHandler.prototype.getYFloatValue = function(value) {
  return DygraphLayout.parseFloat_(value);
};
BarsHandler.prototype.formatSeries = function(series) {
  for ( var j = 0; j < series.length; j++) {
    series[j] = [ series[j][0], series[j][1][0], series[j][1][1],
        series[j][1][2] ];
  }
  return series;
};
BarsHandler.prototype.onPointCreated = function(point, sample, dygraphs) {
  // Copy over the error terms
  var axis = dygraphs.axisPropertiesForSeries(point.name);
  // TODO (konigsberg): use optionsForAxis instead.
  var logscale = dygraphs.attributes_.getForSeries("logscale", point.name);
  var errorMinus = DygraphLayout.parseFloat_(sample[2]);
  var errorPlus = DygraphLayout.parseFloat_(sample[3]);
  var yv_minus = point.yval - errorMinus;
  var yv_plus = point.yval + errorPlus;
  point.y_top = DygraphLayout._calcYNormal(axis, yv_minus, logscale);
  point.y_bottom = DygraphLayout._calcYNormal(axis, yv_plus, logscale);
};