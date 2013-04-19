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

        if (y1 != null && y1.value != null && !isNaN(y1.value) && y2 != null
            && y2.value != null && !isNaN(y2.value)) {
          intersectionY = this.computeYIntersection([ x1, y1.value ], [ x2,
              y2.value ], dateWindow[0]);
          minY = intersectionY;
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

        if (y1 != null && y1.value != null && !isNaN(y1.value) && y2 != null
            && y2.value != null && !isNaN(y2.value)) {
          intersectionY = this.computeYIntersection([ x1, y1.value ], [ x2,
              y2.value ], dateWindow[1]);
          if (minY == null || intersectionY < minY)
            minY = intersectionY;
          if (maxY == null || intersectionY > maxY)
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
    return NaN;
  } else {
    return DygraphLayout.parseFloat_(value.value);
  }
};

RawHandler.prototype.rollingAverage = function(originalData, rollPeriod) {
  return originalData;
};

RawHandler.prototype.onPointCreated = function(point, value) {

};
