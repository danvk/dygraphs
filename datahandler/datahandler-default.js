var DefaultHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("default", DefaultHandler);

DefaultHandler.prototype.extractSeries = function(rawData, i, logScale, dygraphs) {
  // TODO(danvk): pre-allocate series here.
  var series = [];
  for (var j = 0; j < rawData.length; j++) {
    var x = rawData[j][0];
    var point = rawData[j][i];
    if (logScale) {
      // On the log scale, points less than zero do not exist.
      // This will create a gap in the chart.
      if (point <= 0) {
        point = null;
      }
    }
    series.push([x, point]);
  }
  return series;
};

DefaultHandler.prototype.rollingAverage = function(originalData, rollPeriod,
    dygraphs) {
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];

  var i, j, y, sum, num_ok;
  // Calculate the rolling average for the first rollPeriod - 1 points
  // where
  // there is not enough data to roll over the full number of points
  if (rollPeriod == 1) {
    return originalData;
  }
  for (i = 0; i < originalData.length; i++) {
    sum = 0;
    num_ok = 0;
    for (j = Math.max(0, i - rollPeriod + 1); j < i + 1; j++) {
      y = originalData[j][1];
      if (y === null || isNaN(y))
        continue;
      num_ok++;
      sum += originalData[j][1];
    }
    if (num_ok) {
      rollingData[i] = [ originalData[i][0], sum / num_ok ];
    } else {
      rollingData[i] = [ originalData[i][0], null ];
    }
  }

  return rollingData;
};
DefaultHandler.prototype.getExtremeYValues = function(series, dateWindow,
    stepPlot) {
  var minY = null, maxY = null, y;
  var firstIdx = 0, lastIdx = series.length - 1;

  if (dateWindow) {
    var x1, x2, y1, y2, intersectionY;
    var indexes = this.getIndexesInWindow(series, dateWindow);
    firstIdx = indexes[0];
    lastIdx = indexes[1];

    //XXX EBD: Fix bug not computing extremes if firstIdx 
    // or firstIdx -1 has an invalid (null or NaN) value.
    if (firstIdx != 0) {
      if (stepPlot) {
        firstIdx--;
      } else {
        // compute axis point of intersection
        x1 = series[firstIdx - 1][0];
        x2 = series[firstIdx][0];
        y1 = series[firstIdx - 1][1];
        y2 = series[firstIdx][1];

        if (y1 != null && !isNaN(y1) && y2 != null && !isNaN(y2)) {
          intersectionY = this.computeYIntersection([ x1, y1 ], [ x2, y2 ],
              dateWindow[0]);
          minY = intersectionY;
          maxY = intersectionY;
        }
      }
    }
    //XXX EBD: Fix bug not computing extremes if lastIdx 
    // or lastIdx -1 has an invalid (null or NaN) value.
    if (lastIdx != series.length - 1) {
      if (!stepPlot) {
        // compute axis point of intersection
        x1 = series[lastIdx][0];
        x2 = series[lastIdx + 1][0];
        y1 = series[lastIdx][1];
        y2 = series[lastIdx + 1][1];

        if (y1 != null && !isNaN(y1) && y2 != null && !isNaN(y2)) {
          intersectionY = this.computeYIntersection([ x1, y1 ], [ x2, y2 ],
              dateWindow[1]);
          if (minY == null || intersectionY < minY) minY = intersectionY;
          if (maxY == null || intersectionY > maxY) maxY = intersectionY;
        }
      }
    }
  }

  for ( var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1];
    if (y === null || isNaN(y))
      continue;
    if (maxY === null || y > maxY) {
      maxY = y;
    }
    if (minY === null || y < minY) {
      minY = y;
    }
  }
  return [ minY, maxY ];
};

DefaultHandler.prototype.onLineEvaluated = undefined;
