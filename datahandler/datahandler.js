Dygraph.DataHandlers = {};
Dygraph.DataHandlers.handlers_ = {};
Dygraph.DataHandlers.registerHandler = function(name,handler) {
  if (!handler instanceof Dygraph.DataHandler) {
    throw("the handler must be a prototype of Dygraph.DataHandler");
  }
  Dygraph.DataHandlers.handlers_[name] = handler;
};

Dygraph.DataHandlers.getHandler = function(name) {
  return  Dygraph.DataHandlers.handlers_[name];
};

Dygraph.DataHandlers.createHandler = function(name) {
  return new Dygraph.DataHandlers.handlers_[name]();
};

Dygraph.DataHandler = function DataHandler() {
  var handler = function() {return this;};
  //Uniform Data Format Constants
  handler.prototype.X = 0;
  handler.prototype.Y = 1;
  handler.prototype.EXTRAS = 2;

  /**
   * Extracts one series from the raw data (a 2D array) into an array of (date,
   * value) tuples.
   *
   * This is where undesirable points (i.e. negative values on log scales and
   * missing values through which we wish to connect lines) are dropped.
   * TODO(danvk): the "missing values" bit above doesn't seem right.
   *
   * @private
   */
  handler.prototype.extractSeries = function(rawData, i, logScale, dygraphs) {};
  
  /**
   * Converts a series to a Point array.
   *
   * @param {Array.<Array.<(?number|Array<?number>)>} series Array where
   *     series[row] = [x,y] or [x, [y, err]] or [x, [y, yplus, yminus]].
   * @param {string} setName Name of the series.
   * @param {number} boundaryIdStart Index offset of the first point, equal to
   *     the number of skipped points left of the date window minimum (if any).
   * @return {Array.<Dygraph.PointType>} List of points for this series.
   */
  handler.prototype.seriesToPoints = function(series, setName, boundaryIdStart) {
    //TODO(bhs): these loops are a hot-spot for high-point-count charts. In fact,
    //on chrome+linux, they are 6 times more expensive than iterating through the
    //points and drawing the lines. The brunt of the cost comes from allocating
    //the |point| structures.
    var points = [];
    for (var i = 0; i < series.length; ++i) {
      var item = series[i];
      var yraw = item[1];
      var yval = yraw === null ? null : DygraphLayout.parseFloat_(yraw);
      var point = {
        x: NaN,
        y: NaN,
        xval: DygraphLayout.parseFloat_(item[0]),
        yval: yval,
        name: setName,  // TODO(danvk): is this really necessary?
        idx: i + boundaryIdStart
      };
      points.push(point);
    }
    if(handler.prototype.onPointsCreated) {
      handler.prototype.onPointsCreated(series, points);
    }
    return points;
  };
  /**
   * @private
   * Callback called for each series after the series points have been generated 
   * which will later be used by the plotters to draw the graph.
   * Here data may be added to the seriesPoints which is needed by the plotters.<br>
   * The indexes of series and points are in sync meaning the original
   * data sample for series[i] is points[i].
   * Note: Set the callback to undefined if it is not used for better performance.
   * @param {Array} series The data samples of the series.
   * @param {Array} points The corresponding points passed to the plotter.
   */
  handler.prototype.onPointsCreated = function(series, points) {};

  /**
   * @private
   * Calculates the rolling average of a data set.
   * If originalData is [label, val], rolls the average of those.
   * If originalData is [label, [, it's interpreted as [value, stddev]
   *   and the roll is returned in the same form, with appropriately reduced
   *   stddev for each value.
   * Note that this is where fractional input (i.e. '5/10') is converted into
   *   decimal values.
   * @param {Array} originalData The data in the appropriate format (see above)
   * @param {Number} rollPeriod The number of points over which to average the
   *                            data
   * @param {} dygraphs the dygraphs instance.
   * @return the rolled series.
   */
  handler.prototype.rollingAverage = function(originalData, rollPeriod, dygraphs) {};

  /**
   * @private
   * Computes the range of the data series (including confidence intervals).
   * @param { [Array] } series the data returned by the rollingAverage method,
   *   either [ [x1, y1], [x2, y2], ... ] or [ [x1, [y1, dev_low, dev_high]],
   *   [x2, [y2, dev_low, dev_high]], ...
   * @param [min,max] dateWindow, optional window that should be regarded
   *   for the extremes computation.
   * @param boolean Whether or not this series is a step plot. Which has influence
   *   on the computation of the left and right edges.
   * @return [low, high]
   */
  handler.prototype.getExtremeYValues = function(series,dateWindow,stepPlot) {};

  /**
   * @private
   * Callback called for each series after the layouting data has been calculated
   * before the series is drawn.
   * Here normalized positioning data should be calculated for the extras of each point.<br>
   * Note: Set the callback to undefined if it is not used for better performance.
   * @param {Array} points The points passed to the plotter.
   * @param {} the axis on which the series will be rendered.
   * @param {boolean} weather or not to use a logscale.
   * @param {} dygraphs the dygraphs instance.
   */
  handler.prototype.onLineEvaluated = function(points, axis, logscale, dygraphs) {};

  /**
   * @private
   * Helper method that computes the y value of a line defined 
   *   by the points p1 and p2 and a given x value.
   * @param [x,y] p1 left point.
   * @param [x,y] p2 right point.
   * @param {} dygraphs the dygraphs instance.
   * @return number corresponding y value to x on the line defined by p1 and p2.
   */
  handler.prototype.computeYIntersection = function(p1, p2, xValue) {
    var deltaY = p2[1] - p1[1];
    var deltaX = p2[0] - p1[0];
    var gradient = deltaY / deltaX;
    var growth = (xValue - p1[0]) * gradient;
    return p1[1] + growth;
  };

  /**
   * @private
   * Helper method that returns the first and the last index of the given
   *   series that lie inside the given dateWindow.
   * @param { [Array] } series the data returned by the rollingAverage method,
   *   either [ [x1, y1], [x2, y2], ... ] or [ [x1, [y1, dev_low, dev_high]],
   *   [x2, [y2, dev_low, dev_high]], ...
   * @param [min,max] dateWindow window defining the min and max x values.
   * @return [firstIndex, lastIndex] first and last indexes lying in the date window.
   */
  handler.prototype.getIndexesInWindow = function(series, dateWindow) {
    var firstIdx = 0, lastIdx = series.length - 1;
    if (dateWindow) {
      var idx = 0;
      var low = dateWindow[0];
      var high = dateWindow[1];

      // Start from each side of the array to minimize the performance
      // needed.
      while (idx < series.length - 1 && series[idx][0] < low) {
        firstIdx++;
        idx++;
      }
      idx = series.length - 1;
      while (idx > 0 && series[idx][0] > high) {
        lastIdx--;
        idx--;
      }
    }
    if (firstIdx <= lastIdx) {
      return [ firstIdx, lastIdx ];
    } else {
      return [0,series.length - 1];
    }
  };

  return handler;
};