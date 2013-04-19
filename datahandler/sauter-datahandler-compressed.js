var CompressedHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("sauter-compressed", CompressedHandler);

CompressedHandler.prototype.rollingAverage = function(originalData, rollPeriod) {
  return originalData;
};
CompressedHandler.prototype.getExtremeYValues = function(series, dateWindow,
    stepPlot) {
  var minY = null, maxY = null, avgY = null, y;

  var firstIdx = 0, lastIdx = series.length - 1;
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
        if (y1 != null && y1.value != null && y1.value[0] != null
            && !isNaN(y1.value[0]) && y2 != null && y2.value != null
            && y2.value[0] && !isNaN(y2.value)) {
          intersectionY = this.computeYIntersection([ x1, y1.value[0] ], [ x2,
              y2.value[0] ], dateWindow[0]);
          minY = intersectionY;
          maxY = intersectionY;

          // Calculating the min point of intersection
          intersectionY = this.computeYIntersection([ x1, y1.value[1] ], [ x2,
              y2.value[1] ], dateWindow[0]);
          if (intersectionY < minY)
            minY = intersectionY;

          // Calculating the max point of intersection
          intersectionY = this.computeYIntersection([ x1, y1.value[2] ], [ x2,
              y2.value[2] ], dateWindow[0]);
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
        if (y1 != null && y1.value != null && y1.value[0] != null
            && !isNaN(y1.value[0]) && y2 != null && y2.value != null
            && y2.value[0] && !isNaN(y2.value)) {
          intersectionY = this.computeYIntersection([ x1, y1.value[0] ], [ x2,
              y2.value[0] ], dateWindow[0]);
          if (minY == 0 || intersectionY < minY)
            minY = intersectionY;
          if (maxY == 0 || intersectionY > maxY)
            maxY = intersectionY;

          // Calculating the min point of intersection
          intersectionY = this.computeYIntersection([ x1, y1.value[1] ], [ x2,
              y2.value[1] ], dateWindow[0]);
          if (intersectionY < minY)
            minY = intersectionY;

          // Calculating the max point of intersection
          intersectionY = this.computeYIntersection([ x1, y1.value[2] ], [ x2,
              y2.value[2] ], dateWindow[0]);
          if (intersectionY > maxY)
            maxY = intersectionY;
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
CompressedHandler.prototype.formatSeries = function(series) {
  return series;
};
CompressedHandler.prototype.getYFloatValue = function(value) {

  if (value === null || value === undefined) {
    return null;
  }
  return DygraphLayout.parseFloat_(value.value[0]);

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
