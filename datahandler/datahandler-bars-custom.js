var CustomBarsHandler = Dygraph.DataHandler();
CustomBarsHandler.prototype = Dygraph.DataHandlers.createHandler("bars");
Dygraph.DataHandlers.registerHandler("bars-custom", CustomBarsHandler);
// customBars
CustomBarsHandler.prototype.extractSeries = function(rawData, i, logScale, dygraphs) {
  // TODO(danvk): pre-allocate series here.
  var series = [];
  var x, y, point;
  for ( var j = 0; j < rawData.length; j++) {
    x = rawData[j][0];
    point = rawData[j][i];
    if (logScale) {
      // On the log scale, points less than zero do not exist.
      // This will create a gap in the chart.
      if (point <= 0) {
        point = null;
      }
    }
    // Extract to the unified data format.
    if (point !== null) {
      y = point[1];
      if (y !== null && !isNaN(y)) {
        series.push([ x, y, [ point[0], point[2] ] ]);
      } else {
        series.push([ x, y, [ y, y ] ]);
      }
    } else {
      series.push([ x, null, [ null, null ] ]);
    }
  }
  return series;
};

CustomBarsHandler.prototype.rollingAverage = function(originalData, rollPeriod,
    dygraphs) {
  rollPeriod = Math.min(rollPeriod, originalData.length);
  var rollingData = [];
  var low, high, mid,count, i, extremes;
  
  low = 0;
  mid = 0;
  high = 0;
  count = 0;
  for (i = 0; i < originalData.length; i++) {
    y = originalData[i][1];
    extremes = originalData[i][2];
    rollingData[i] = originalData[i];

    if (y !== null && !isNaN(y)) {
      low += extremes[0];
      mid += y;
      high += extremes[1];
      count += 1;
    }
    if (i - rollPeriod >= 0) {
      var prev = originalData[i - rollPeriod];
      if (prev[1] !== null && !isNaN(prev[1])) {
        low -= prev[2][0];
        mid -= prev[1];
        high -= prev[2][1];
        count -= 1;
      }
    }
    if (count) {
      rollingData[i] = [
          originalData[i][0],
          1.0 * mid / count, 
          [ 1.0 * low / count,
            1.0 * high / count ] ];
    } else {
      rollingData[i] = [ originalData[i][0], null, [ null, null ] ];
    }
  }

  return rollingData;
};