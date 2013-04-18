var CompressedHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("sauter-compressed",CompressedHandler);
CompressedHandler.prototype.formatSeries = function(series) {
  return series;
};
CompressedHandler.prototype.getExtremeYValues = function(series, dateWindow,
    stepPlot) {
  var minY = null, maxY = null, avgY = null, y;

  // XXX datewindow is always defined
  // TODO compare dateWindow times with total times (start and end of
  // the log)
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
        if (priorPoint[1] !== null && priorPoint[1].value !== null
            && priorPoint[1].value[0] !== null
            && !isNaN(priorPoint[1].value[0]) && firstPoint[1] !== null
            && firstPoint[1].value !== null && firstPoint[1].value[0] !== null
            && !isNaN(firstPoint[1].value[0])) {

          // Calculating the avg point of intersection
          var deltaY = firstPoint[1].value[0] - priorPoint[1].value[0];
          var deltaX = firstPoint[0] - priorPoint[0];
          var gradient = deltaY / deltaX;
          var intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValueAvg = priorPoint[1].value[0] + intersection;

          // Calculating the min point of intersection
          deltaY = firstPoint[1].value[1] - priorPoint[1].value[1];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValueMin = priorPoint[1].value[1] + intersection;
          if (intersectionValueMin > intersectionValueAvg)
            intersectionValueMin = intersectionValueAvg;

          // Calculating the max point of intersection
          deltaY = firstPoint[1].value[2] - priorPoint[1].value[2];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[0] - priorPoint[0]) * gradient;
          var intersectionValueMax = priorPoint[1].value[2] + intersection;
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

        if (nextPoint[1] !== null && nextPoint[1].value !== null
            && nextPoint[1].value[0] !== null && !isNaN(nextPoint[1].value[0])
            && lastPoint[1] !== null && lastPoint[1].value !== null
            && lastPoint[1].value[0] !== null && !isNaN(lastPoint[1].value[0])) {

          // Calculating the avg point of intersection
          var deltaY = nextPoint[1].value[0] - lastPoint[1].value[0];
          var deltaX = nextPoint[0] - lastPoint[0];
          var gradient = (deltaY) / (deltaX);
          var intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValueAvg = lastPoint[1].value[0] + intersection;

          // Calculating the min point of intersection
          deltaY = nextPoint[1].value[1] - lastPoint[1].value[1];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValueMin = lastPoint[1].value[1] + intersection;
          if (intersectionValueMin > intersectionValueAvg)
            intersectionValueMin = intersectionValueAvg;

          // Calculating the max point of intersection
          deltaY = nextPoint[1].value[2] - lastPoint[1].value[2];
          gradient = deltaY / deltaX;
          intersection = (dateWindow[1] - lastPoint[0]) * gradient;
          var intersectionValueMax = lastPoint[1].value[2] + intersection;
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
    y = series[j][1];
    if (y === null)
      continue;
    y = y.value;
    if (y === null)
      continue;
    avgY = y[0];
    if (avgY === null || isNaN(avgY))
      continue;
    if (y[1] > avgY)
      y[1] = avgY; // this can happen with custom
    // bars,
    if (y[2] < avgY)
      y[2] = avgY; // e.g. in tests/custom-bars.html
    if (maxY === null || y[2] > maxY) {
      maxY = y[2];
    }
    if (minY === null || y[1] < minY) {
      minY = y[1];
    }
  }

  return [ minY, maxY ];
};
CompressedHandler.prototype.getYFloatValue = function(value) {

  if (value === null || value === undefined) {
    return null;
  }
  return DygraphLayout.parseFloat_(value.value[0]);

};
CompressedHandler.prototype.rollingAverage = function(originalData, rollPeriod) {
  return originalData;
};
CompressedHandler.prototype.onPointCreated = function(point, value, dygraphs) {
  if (value === null || value === undefined) {
    return;
  } else {
    var axis = dygraphs.axisPropertiesForSeries(point.name);
    point.y_top = DygraphLayout._calcYNormal(axis, value.value[1]);
    point.y_bottom = DygraphLayout._calcYNormal(axis, value.value[2]);
  }

};