/**
 * @license
 * Copyright 2013 David Eberlein (david.eberlein@ch.sauter-bc.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview This file contains the managment of data handlers
 * @author David Eberlein (david.eberlein@ch.sauter-bc.com)
 *
 * The idea is to define a common, generic data format that works for all data
 * structures supported by dygraphs. To make this possible, the DataHandler
 * interface is introduced. This makes it possible, that dygraph itself can work
 * with the same logic for every data type independent of the actual format and
 * the DataHandler takes care of the data format specific jobs.
 * DataHandlers are implemented for all data types supported by Dygraphs and
 * return Dygraphs compliant formats.
 * By default the correct DataHandler is chosen based on the options set.
 * Optionally the user may use his own DataHandler (similar to the plugin
 * system).
 *
 *
 * The unified data format returend by each handler is defined as so:
 * series[n][point] = [x,y,(extras)]
 *
 * This format contains the common basis that is needed to draw a simple line
 * series extended by optional extras for more complex graphing types. It
 * contains a primitive x value as first array entry, a primitive y value as
 * second array entry and an optional extras object for additional data needed.
 *
 * x must always be a number.
 * y must always be a number, NaN of type number or null.
 * extras is optional and must be interpreted by the DataHandler. It may be of
 * any type.
 *
 * In practice this might look something like this:
 * default: [x, yVal]
 * errorBar / customBar: [x, yVal, [yTopVariance, yBottomVariance] ]
 *
 */

"use strict";

import { DygraphOptions, DygraphPointType } from "../dygraph-types";

/** "unified data format": x, y, extras */
export type UnifiedPoint<T=any> = [number, number|null, T];

/**
 * The data handler is responsible for all data specific operations. All of the
 * series data it receives and returns is always in the unified data format.
 * Initially the unified data is created by the extractSeries method
 */
class DygraphDataHandler {
  constructor() {
  }

  /**
   * Extracts one series from the raw data (a 2D array) into an array of the
   * unified data format.
   * This is where undesirable points (i.e. negative values on log scales and
   * missing values through which we wish to connect lines) are dropped.
   * TODO(danvk): the "missing values" bit above doesn't seem right.
   *
   * @param rawData The raw data passed into dygraphs where
   *     rawData[i] = [x,ySeries1,...,ySeriesN].
   * @param seriesIndex Index of the series to extract. All other
   *     series should be ignored.
   * @param options Dygraph options.
   * @return The series in the unified data format where series[i] = [x,y,{extras}].
   */
  extractSeries(rawData: string[][], seriesIndex: number, options: DygraphOptions): UnifiedPoint[] {
    throw new Error('Not imlemented');
  }

  /**
   * Converts a series to a Point array.  The resulting point array must be
   * returned in increasing order of idx property.
   *
   * @param series The series in the unified
   *          data format where series[i] = [x,y,{extras}].
   * @param setName Name of the series.
   * @param boundaryIdStart Index offset of the first point, equal to the
   *          number of skipped points left of the date window minimum (if any).
   * @return List of points for this series.
   */
  seriesToPoints(series: UnifiedPoint[], setName: string, boundaryIdStart: number): DygraphPointType[] {
    // TODO(bhs): these loops are a hot-spot for high-point-count charts. In
    // fact,
    // on chrome+linux, they are 6 times more expensive than iterating through
    // the
    // points and drawing the lines. The brunt of the cost comes from allocating
    // the |point| structures.
    var points: DygraphPointType[] = [];
    for (var i = 0; i < series.length; ++i) {
      var item = series[i];
      var yraw = item[1];
      var yval = yraw === null ? null : DygraphDataHandler.parseFloat(yraw);
      var point = {
        x: NaN,
        y: NaN,
        xval: DygraphDataHandler.parseFloat(item[0]),
        yval: yval,
        name: setName,
        idx: i + boundaryIdStart,
        canvasx: NaN,
        canvasy: NaN,
      };
      points.push(point);
    }
    this.onPointsCreated_(series, points);
    return points;
  }

  /**
   * Callback called for each series after the series points have been generated
   * which will later be used by the plotters to draw the graph.
   * Here data may be added to the seriesPoints which is needed by the plotters.
   * The indexes of series and points are in sync meaning the original data
   * sample for series[i] is points[i].
   *
   * @param series The series in the unified
   *     data format where series[i] = [x,y,{extras}].
   * @param points The corresponding points passed to the plotter.
   * @protected
   */
  onPointsCreated_(series: UnifiedPoint[], points: DygraphPointType[]) {
  }

  /**
   * Calculates the rolling average of a data set.
   *
   * @param series The series in the unified
   *          data format where series[i] = [x,y,{extras}].
   * @param rollPeriod The number of points over which to average the data
   * @param options The dygraph options.
   */
  rollingAverage(series: UnifiedPoint[], rollPeriod: number, options: DygraphOptions): UnifiedPoint[] {
    throw new Error('Not implemented');
  }

  /**
   * Computes the range of the data series (including confidence intervals).
   *
   * @param series The series in the unified
   *     data format where series[i] = [x, y, {extras}].
   * @param dateWindow The x-value range to display with the format: [min, max].
   * @param options The dygraph options.
   * @return The low and high extremes of the series in the
   *     given window with the format: [low, high].
   */
  getExtremeYValues(series: UnifiedPoint[], dateWindow: [number, number], options: DygraphOptions): [number, number] {
    throw new Error('Not implemented');
  }

  /**
   * Callback called for each series after the layouting data has been
   * calculated before the series is drawn. Here normalized positioning data
   * should be calculated for the extras of each point.
   *
   * @param points The points passed to the plotter.
   * @param axis The axis on which the series will be plotted.
   * @param logscale Weather or not to use a logscale.
   */
  onLineEvaluated(points: DygraphPointType[], axis: object, logscale: boolean) {
  }

  /**
   * Optimized replacement for parseFloat, which was way too slow when almost
   * all values were type number, with few edge cases, none of which were strings.
   */
  static parseFloat(val: number | null): number {
    // parseFloat(null) is NaN
    if (val === null) {
      return NaN;
    }
    // Assume it's a number or NaN. If it's something else, I'll be shocked.
    return val;
  }
}

export default DygraphDataHandler;
