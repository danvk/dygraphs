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
    var x1, x2, y1, y2, extra1, extra2;
    var handler = this;
    var computeIntersectionExtremes = function(x1,y1,x2,y2,extremes1,extremes2, intersectionX){
      if (y1 != null && !isNaN(y1) && y2 != null && !isNaN(y2)) {
        var intersectionY;
        intersectionY = handler.computeYIntersection([ x1, y1 ], [ x2, y2 ]
        , intersectionX);
        if (minY === null || intersectionY < minY) minY = intersectionY;
        if (minY === null || intersectionY > maxY) maxY = intersectionY;

        // Calculating the min point of intersection
        intersectionY = handler.computeYIntersection([ x1, extremes1[0] ],
            [ x2, extremes2[0] ], intersectionX);
        if (intersectionY < minY) minY = intersectionY;

        // Calculating the max point of intersection
        intersectionY = handler.computeYIntersection([ x1, extremes1[1] ],
            [ x2, extremes2[1] ], intersectionX);
        if (intersectionY > maxY) maxY = intersectionY;
      }
    };

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
        extra1 = series[firstIdx - 1][2];
        extra2 = series[firstIdx][2];
        computeIntersectionExtremes(x1,y1,x2,y2,extra1,extra2,dateWindow[0]);
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
        extra1 = series[lastIdx][2];
        extra2 = series[lastIdx + 1][2];
        computeIntersectionExtremes(x1,y1,x2,y2,extra1,extra2,dateWindow[1]);
      }
    }
  }

  for ( var j = firstIdx; j <= lastIdx; j++) {
    y = series[j][1];
    if (y === null || isNaN(y)) continue;

    var low = series[j][2][0];
    var high = series[j][2][1];

    if (low > y) low = y; // this can happen with custom bars,
    if (high < y) high = y; // e.g. in tests/custom-bars.html

    if (maxY === null || high > maxY) maxY = high;
    if (minY === null || low < minY) minY = low;
  }

  return [ minY, maxY ];
};

BarsHandler.prototype.onLineEvaluated = function(seriesPoints, dataset, setName, dygraphs) {
  var logscale = dygraphs.attributes_.getForSeries("logscale", setName);
  // TODO (konigsberg): use optionsForAxis instead.
  var axis = dygraphs.axisPropertiesForSeries(setName);
  var point, sample, yv_minus, yv_plus;

  for (var j = 0; j < seriesPoints.length; j++) {
    // Copy over the error terms
    point = seriesPoints[j];
    sample = dataset[j];
    yv_minus = DygraphLayout.parseFloat_(sample[2][0]);
    yv_plus = DygraphLayout.parseFloat_(sample[2][1]);
    point.y_top = DygraphLayout._calcYNormal(axis, yv_minus, logscale);
    point.y_bottom = DygraphLayout._calcYNormal(axis, yv_plus, logscale);
  }
};