Dygraph.DataHandlers = {};
Dygraph.DataHandlers.handlers_ = {};
Dygraph.DataHandlers.registerHandler = function(name,handler){
  if(!handler instanceof Dygraph.DataHandler)
    throw("the handler must be a prototype of Dygraph.DataHandler");
  Dygraph.DataHandlers.handlers_[name] = handler;
};

Dygraph.DataHandlers.getHandler = function(name){
  return new this.handlers_[name]();
};

Dygraph.DataHandler = function DataHandler(){
  var handler = function(){return this;};

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
  handler.prototype.rollingAverage = function(originalData, rollPeriod, dygraphs){};
  /**
   * @private
   * Computes the range of the data series (including confidence intervals).
   * @param { [Array] } series the data returned by the rollingAverage method,
   *   either [ [x1, y1], [x2, y2], ... ] or [ [x1, [y1, dev_low, dev_high]],
   *   [x2, [y2, dev_low, dev_high]], ...
   * @param [Array] dateWindow, optional window that should be regarded
   *   for the extremes computation.
   * @param boolean Whether or not this series is a step plot. Which has influence
   *   on the computation of the left and right edges.
   * @return [low, high]
   */
  handler.prototype.getExtremeYValues = function(series,dateWindow,stepPlot){};
  
  /**
   * @private
   * Formats the series data so that the x value is found at series[n][0] 
   *   and the primary y value is found at series[n][1]. Additional data
   *   may be stored at any other index of the series.
   * @param { [Array] } series the data returned by the rollingAverage method,
   *   either [ [x1, y1], [x2, y2], ... ] or [ [x1, [y1, dev_low, dev_high]],
   *   [x2, [y2, dev_low, dev_high]], ...
   * @return { [Array] } the formatted series.
   */
  handler.prototype.formatSeries = function(){};

  /**
   * @private
   * Extracts the float y value from the series value.
   * @param the y value placed in series[n][0] by the formatSeries function.
   * @return A float value or null if no float value can be extracted.
   */
  handler.prototype.getYFloatValue = function(value){};
  
  /**
   * @private
   * Callback after the series point used to plot the series is generated.
   * Here any data may be added to the seriesPoint which is needed to plot 
   *   the graph.
   * @param {} seriesPoint The point passed to the plotter.
   * @param {} yValue the actual y value from which the float value was extracted.
   * @param {} dygraphs the dygraphs instance.
   */
  handler.prototype.onPointCreated = function(seriesPoint, yValue, dygraphs){};
  
  handler.prototype.computeYIntersection = function(pointLeft, pointRight, xValue){
    var leftY = this.getYFloatValue(pointLeft[1]);
    var rightY = this.getYFloatValue(pointRight[1]);
    if (!isNaN(leftY) && !isNaN(rightY)) {
      var deltaY = rightY - leftY;
      var deltaX = pointRight[0] - pointLeft[0];
      var gradient = deltaY / deltaX;
      var growth = (xValue - pointLeft[0]) * gradient;
      return pointLeft[1] + growth;
    }
    return null;
  };
  
  handler.prototype.getIndexesInWindow = function(series, dateWindow){
    var firstIdx = 0, lastIdx = series.length - 1;
    
    if (dateWindow) {
      var idx = 0;
      var low = dateWindow[0];
      var high = dateWindow[1];
      
      // Start from each side of the array to minimize the performance needed.
      while (idx < series.length-1 && series[idx][0] < low) {
        firstIdx++;
        idx++;
      }    
      idx = series.length - 1;
      while (idx > 0 && series[idx][0] > high) {
        lastIdx--;
        idx--;
      }
    }
    return [firstIdx,lastIdx];
  };
  
  return handler;
};