var RawHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("sauter-raw", RawHandler);
RawHandler.prototype.formatSeries = function(series) {
  return series;
};

RawHandler.prototype.formatSeries = function(series) {
  return series;
};

RawHandler.prototype.getExtremeYValues = function(series, dateWindow, stepPlot) {
  var minY = null, maxY = null, y;
  // XXX datewindow is always defined
  // TODO compare dateWindow times with total times (start and end of the log)
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
    if (firstIdx != 0) {
      if (stepPlot) {
        firstIdx--;
      } else {
        // compute axis point of intersection
        var priorPoint = series[firstIdx - 1];
        var firstPoint = series[firstIdx];
        if (priorPoint[1] !== null && priorPoint[1].value !== null
            && !isNaN(priorPoint[1].value) && firstPoint[1] !== null
            && firstPoint[1].value !== null && !isNaN(firstPoint[1].value)) {
          var deltaY = firstPoint[1].value - priorPoint[1].value;
          var deltaX = firstPoint[0] - priorPoint[0];
          var gradient = deltaY / deltaX;
          var intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValue = priorPoint[1].value + intersection;
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
        if (nextPoint[1] !== null && nextPoint[1].value !== null
            && !isNaN(nextPoint[1].value) && lastPoint[1] !== null
            && lastPoint[1].value !== null && !isNaN(lastPoint[1].value)) {
          var deltaY = nextPoint[1].value - lastPoint[1].value;
          var deltaX = nextPoint[0] - lastPoint[0];
          var gradient = (deltaY) / (deltaX);
          var intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValue = lastPoint[1].value + intersection;

          if (minY === null || intersectionValue < minY) {
            minY = intersectionValue;
          }
          if (maxY === null || intersectionValue > maxY) {
            maxY = intersectionValue;
          }
        }
      }
    }
  }

  for ( var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1];
    if (y === null)
      continue;
    y = y.value;
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

RawHandler.prototype.getYFloatValue = function(value) {
  if (value === null || value === undefined) {
    return null;
  } else {
    return DygraphLayout.parseFloat_(value.value);
  }
};

RawHandler.prototype.rollingAverage = function(originalData, rollPeriod) {
  return originalData;
};

RawHandler.prototype.onPointCreated = function(point, value) {

};
