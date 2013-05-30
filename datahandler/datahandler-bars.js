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