var BarsHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("bars", BarsHandler);
BarsHandler.prototype.formatSeries = function(series) {
  for ( var j = 0; j < series.length; j++) {
    series[j] = [ series[j][0], series[j][1][0], series[j][1][1],
        series[j][1][2] ];
  }
  return series;
};
BarsHandler.prototype.getExtremeYValues = function(series, dateWindow,
    stepPlot) {
  var minY = null, maxY = null, y;

  var firstIdx = 0;
  var lastIdx = series.length - 1;
  if (dateWindow) {
    var idx = 0;
    var low = dateWindow[0];
    var high = dateWindow[1];
    // Start from each side of the array to minimize the performance
    // needed.
    while (idx < series.length && series[idx][0] < low) {
      firstIdx++;
      idx++;
    }
    idx = series.length - 1;

    while (idx > 0 && series[idx][0] > high) {
      lastIdx--;
      idx--;
    }
    if (firstIdx != 0) {
      if (stepPlot) {
        firstIdx--;
      } else {
        // compute axis point of intersection
        var priorPoint = series[firstIdx - 1];
        var firstPoint = series[firstIdx];
        if (priorPoint[1] !== null && priorPoint[1][0] !== null
            && !isNaN(priorPoint[1][0]) && firstPoint[1] !== null
            && firstPoint[1][0] !== null && !isNaN(firstPoint[1][0])) {

          // Calculating the avg point of intersection
          var deltaY = firstPoint[1][0] - priorPoint[1][0];
          var deltaX = firstPoint[0] - priorPoint[0];
          var gradient = deltaY / deltaX;
          var intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValueAvg = priorPoint[1][0] + intersection;

          // Calculating the min point of intersection
          deltaY = firstPoint[1][1] - priorPoint[1][1];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValueMin = priorPoint[1][1] + intersection;
          if (intersectionValueMin > intersectionValueAvg)
            intersectionValueMin = intersectionValueAvg;

          // Calculating the max point of intersection
          deltaY = firstPoint[1][2] - priorPoint[1][2];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValueMax = priorPoint[1][2] + intersection;
          if (intersectionValueMax < intersectionValueAvg)
            intersectionValueMax = intersectionValueAvg;

          minY = intersectionValueMin;
          maxY = intersectionValueMax;
        }
      }
    }
    if (lastIdx != series.length - 1) {
      if (!stepPlot) {
        // compute axis point of intersection
        var lastPoint = series[lastIdx];
        var nextPoint = series[lastIdx + 1];

        if (nextPoint[1] !== null && nextPoint[1][0] !== null
            && !isNaN(nextPoint[1][0]) && lastPoint[1] !== null
            && lastPoint[1][0] !== null && !isNaN(lastPoint[1][0])) {

          // Calculating the avg point of intersection
          var deltaY = nextPoint[1][0] - lastPoint[1][0];
          var deltaX = nextPoint[0] - lastPoint[0];
          var gradient = (deltaY) / (deltaX);
          var intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValueAvg = lastPoint[1][0] + intersection;

          // Calculating the min point of intersection
          deltaY = nextPoint[1][1] - lastPoint[1][1];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValueMin = lastPoint[1][1] + intersection;
          if (intersectionValueMin > intersectionValueAvg)
            intersectionValueMin = intersectionValueAvg;

          // Calculating the max point of intersection
          deltaY = nextPoint[1][2] - lastPoint[1][2];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValueMax = lastPoint[1][2] + intersection;
          if (intersectionValueMax < intersectionValueAvg)
            intersectionValueMax = intersectionValueAvg;

          if (minY === null || intersectionValueMin < minY) {
            minY = intersectionValueMin;
          }
          if (maxY === null || intersectionValueMax > maxY) {
            maxY = intersectionValueMax;
          }
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
BarsHandler.prototype.rollingAverage = function(originalData, rollPeriod, dygraphs) {
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];
  var sigma = dygraphs.attr_("sigma");

  var low, high, i, j, y, sum, num_ok, stddev;
  if (dygraphs.fractions_) {
    var num = 0;
    var den = 0;  // numerator/denominator
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
          var pm = sigma * Math.sqrt(p*(1-p)/n + sigma*sigma/(4*n*n));
          var denom = 1 + sigma * sigma / den;
          low  = (p + sigma * sigma / (2 * den) - pm) / denom;
          high = (p + sigma * sigma / (2 * den) + pm) / denom;
          rollingData[i] = [date,
                            [p * mult, (p - low) * mult, (high - p) * mult]];
        } else {
          rollingData[i] = [date, [0, 0, 0]];
        }
      } else {
        stddev = den ? sigma * Math.sqrt(value * (1 - value) / den) : 1.0;
        rollingData[i] = [date, [mult * value, mult * stddev, mult * stddev]];
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
      rollingData[i] = [originalData[i][0], [y, y - data[0], data[2] - y]];

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
        rollingData[i] = [originalData[i][0], [ 1.0 * mid / count,
                                                1.0 * (mid - low) / count,
                                                1.0 * (high - mid) / count ]];
      } else {
        rollingData[i] = [originalData[i][0], [null, null, null]];
      }
    }
  } else {
    // Calculate the rolling average for the first rollPeriod - 1 points where
    // there is not enough data to roll over the full number of points
    for (i = 0; i < originalData.length; i++) {
      sum = 0;
      var variance = 0;
      num_ok = 0;
      for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
        y = originalData[j][1][0];
        if (y === null || isNaN(y)) continue;
        num_ok++;
        sum += originalData[j][1][0];
        variance += Math.pow(originalData[j][1][1], 2);
      }
      if (num_ok) {
        stddev = Math.sqrt(variance) / num_ok;
        rollingData[i] = [originalData[i][0],
                          [sum / num_ok, sigma * stddev, sigma * stddev]];
      } else {
        // This explicitly preserves NaNs to aid with "independent series".
        // See testRollingAveragePreservesNaNs.
        var v = (rollPeriod == 1) ? originalData[i][1][0] : null;
        rollingData[i] = [originalData[i][0], [v, v, v]];
      }
    }
  }
  
  return rollingData;
};
BarsHandler.prototype.onPointCreated = function(point, value, dygraphs) {
  // Nothing to do
};