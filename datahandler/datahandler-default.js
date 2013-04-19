var DefaultHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("default", DefaultHandler);
DefaultHandler.prototype.formatSeries = function(series) {
  return series;
};

DefaultHandler.prototype.formatSeries = function(series) {
  return series;
};

DefaultHandler.prototype.getExtremeYValues = function(series, dateWindow, stepPlot) {
  var minY = null, maxY = null, y;
  var firstIdx = 0;
  var lastIdx = series.length - 1;
  if (dateWindow) {
    var idx = 0;
    var low = dateWindow[0];
    var high = dateWindow[1];
    // Start from each side of the array to minimize the performance needed.
    while (idx < series.length && series[idx][0] < low) {
      firstIdx++;
      idx++;
    }
    idx = series.length - 1;

    while (idx > 0 && series[idx][0] > high) {
      lastIdx--;
      idx--;
    }
    // check if we have to compute an intersection with the date window.
    if (firstIdx != 0) {
      if (stepPlot) {
        // Step plot on the left is as if the point would be fully displayed.
        firstIdx--;
      } else {
        // compute axis point of intersection
        var priorPoint = series[firstIdx - 1];
        var firstPoint = series[firstIdx];
        if (priorPoint[1] !== null && priorPoint[1] !== null
            && !isNaN(priorPoint[1]) && firstPoint[1] !== null
            && firstPoint[1] !== null && !isNaN(firstPoint[1])) {
          var deltaY = firstPoint[1] - priorPoint[1];
          var deltaX = firstPoint[0] - priorPoint[0];
          var gradient = deltaY / deltaX;
          var intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValue = priorPoint[1] + intersection;
          minY = intersectionValue;
          maxY = intersectionValue;
        }
      }
    }
    if (lastIdx != series.length - 1) {
      if (!stepPlot) {
        // compute axis point of intersection
        var lastPoint = series[lastIdx];
        var nextPoint = series[lastIdx + 1];
        if (nextPoint[1] !== null && nextPoint[1] !== null
            && !isNaN(nextPoint[1]) && lastPoint[1] !== null
            && lastPoint[1] !== null && !isNaN(lastPoint[1])) {
          var deltaY = nextPoint[1] - lastPoint[1];
          var deltaX = nextPoint[0] - lastPoint[0];
          var gradient = (deltaY) / (deltaX);
          var intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValue = lastPoint[1] + intersection;

          if (minY === null || intersectionValue < minY) {
            minY = intersectionValue;
          }
          if (maxY === null || intersectionValue > maxY) {
            maxY = intersectionValue;
          }
        }
        // Step plot on the right may be ignord.
      }
    }
  }

  for ( var j = firstIdx; j <= lastIdx; j++) {
      y = series[j][1];
      if (y === null || isNaN(y)) continue;
      if (maxY === null || y > maxY) {
        maxY = y;
      }
      if (minY === null || y < minY) {
        minY = y;
      }
    }
  return [ minY, maxY ];
};

DefaultHandler.prototype.getYFloatValue = function(value) {
  return DygraphLayout.parseFloat_(value);
};

DefaultHandler.prototype.rollingAverage = function(originalData, rollPeriod, dygraphs) {
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];

  var i, j, y, sum, num_ok;
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
      rollingData[i] = [date, mult * value];
    }
  } else {
    // Calculate the rolling average for the first rollPeriod - 1 points where
    // there is not enough data to roll over the full number of points
    if (rollPeriod == 1) {
      return originalData;
    }
    for (i = 0; i < originalData.length; i++) {
      sum = 0;
      num_ok = 0;
      for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
        y = originalData[j][1];
        if (y === null || isNaN(y)) continue;
        num_ok++;
        sum += originalData[j][1];
      }
      if (num_ok) {
        rollingData[i] = [originalData[i][0], sum / num_ok];
      } else {
        rollingData[i] = [originalData[i][0], null];
      }
    }
  }

  return rollingData;
};

DefaultHandler.prototype.onPointCreated = function(point, value) {
  // Nothing to do
};
