var BarsHandler = Dygraph.DataHandler();
Dygraph.DataHandlers.registerHandler("bars", BarsHandler);
// errorBars
BarsHandler.prototype.extractSeries = function(rawData, i, logScale, dygraphs) {
  // Not implemented here must be extended
};

BarsHandler.prototype.rollingAverage =  function(originalData, rollPeriod,
    dygraphs) {
  // Not implemented here, must be extended.
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
        extra1 = series[firstIdx - 1][2];
        extra2 = series[firstIdx][2];
        if (y1 != null && y1[0] != null && !isNaN(y1[0]) && y2 != null && y2[0]
            && !isNaN(y2)) {
          intersectionY = this.computeYIntersection([ x1, y1 ],
              [ x2, y2[0] ], dateWindow[0]);
          minY = intersectionY;
          maxY = intersectionY;

          // Calculating the min point of intersection
          intersectionY = this.computeYIntersection([ x1, extra1[0] ],
              [ x2, extra2[0] ], dateWindow[0]);
          if (intersectionY < minY)
            minY = intersectionY;

          // Calculating the max point of intersection
          intersectionY = this.computeYIntersection([ x1, extra1[1] ],
              [ x2, extra2[1] ], dateWindow[0]);
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
        extra1 = series[firstIdx][2];
        extra2 = series[firstIdx + 1][2];
        if (y1 != null && y1[0] != null && !isNaN(y1[0]) && y2 != null && y2[0]
            && !isNaN(y2)) {
          intersectionY = this.computeYIntersection([ x1, y1[0] ],
              [ x2, y2[0] ], dateWindow[0]);
          if (minY == 0 || intersectionY < minY)
            minY = intersectionY;
          if (maxY == 0 || intersectionY > maxY)
            maxY = intersectionY;

          // Calculating the min point of intersection
          intersectionY = this.computeYIntersection([ x1, extra1[0] ],
              [ x2, extra2[0] ], dateWindow[0]);
          if (intersectionY < minY)
            minY = intersectionY;

          // Calculating the max point of intersection
          intersectionY = this.computeYIntersection([ x1, extra1[1] ],
              [ x2, extra2[1] ], dateWindow[0]);
          if (intersectionY > maxY)
            maxY = intersectionY;
        }
      }
    }
  }

  for ( var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1];
    if (y === null || isNaN(y))
      continue;
    var low = series[j][2][0];
    var high = series[j][2][1];
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

BarsHandler.prototype.onPointCreated = function(point, sample, dygraphs) {
  // Copy over the error terms
  var axis = dygraphs.axisPropertiesForSeries(point.name);
  // TODO (konigsberg): use optionsForAxis instead.
  var logscale = dygraphs.attributes_.getForSeries("logscale", point.name);
  var yv_minus = DygraphLayout.parseFloat_(sample[2][0]);
  var yv_plus = DygraphLayout.parseFloat_(sample[2][1]);
  point.y_top = DygraphLayout._calcYNormal(axis, yv_minus, logscale);
  point.y_bottom = DygraphLayout._calcYNormal(axis, yv_plus, logscale);
};