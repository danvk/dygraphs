/**
 * @license
 * Copyright 2015 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview These functions determine the actual points to include
 * in the selection set.  Any exported functions will automatically be
 * registered on Dygraph.SelectionModes (defined in dygraph.js).
 *
 * @name dygraph-selection-modes.js
 * @author musicist288@gmail.com (Joseph Rossi)
 */

/**
 * The default selection mode returns points from the selected row. If the
 * value for that point is undefined, this mode does not attempt to find an
 * alternate value for the selection.
 *
 * @param {Array<Array<Dygraph.PointType>>} seriesPoints, An array of series
       points
 * @param {number} closestRowIndex, The index of the closest row for the selection.
 * @returns {Array<Dygraph.PointType>} An array of points to act as the new
 *     selection
 */
export var selectByRow = function (seriesPoints, closestRowIndex) {
  var selection = [];
  var point;
  for (var setIdx = 0; setIdx < seriesPoints.length; ++setIdx) {
    var points = seriesPoints[setIdx];
    // Check if the point at the appropriate index is the point we're looking
    // for.  If it is, just use it, otherwise search the array for a point
    // in the proper place.
    var setRow = closestRowIndex - this.getLeftBoundary_(setIdx);
    if (setRow < points.length && points[setRow].idx == closestRowIndex) {
      point = points[setRow];
      if (point.yval !== null) selection.push(point);
    } else {
      for (var pointIdx = 0; pointIdx < points.length; ++pointIdx) {
        point = points[pointIdx];
        if (point.idx == closestRowIndex) {
          if (point.yval !== null) {
            selection.push(point);
          }
          break;
        }
      }
    }
  }

  return selection;
};

/**
 * Tries to match point strictly based on the selected row. If a point's value
 * is not defined for the selected row, the closest point from each series
 * less than the selected row will be included in the selection.
 *
 * @param {Array<Array<Dygraph.PointType>>} seriesPoints, An array of series
       points
 * @param {number} closestRowIndex, The index of the closest row for the selection.
 * @returns {Array<Dygraph.PointType>} An array of points to act as the new
 *     selection
 */
export var selectByClosestX = function (seriesPoints, closestRowIndex) {
  var selection = [];
  var point;
  for (var setIdx = 0; setIdx < seriesPoints.length; ++setIdx) {
    var points = seriesPoints[setIdx];
    var setRow = closestRowIndex - this.getLeftBoundary_(setIdx);
    if (setRow < points.length && points[setRow].idx == closestRowIndex) {
      point = points[setRow];
      if (point.yval !== null && point.yval !== undefined && !isNaN(point.yval)) {
        selection.push(point);
      } else {
        for (var i = setRow - 1; i >= 0; i--) {
          point = points[i];
          if (point.yval !== null && point.yval !== undefined && !isNaN(point.yval)) {
            selection.push(point);
            break;
          }
        }
      }
    } else {
      for (var pointIdx = 0; pointIdx < points.length; ++pointIdx) {
        point = points[pointIdx];
        if (point.idx == closestRowIndex) {
          if (point.yval !== null) {
            selection.push(point);
          }
          break;
        }
      }
    }
  }

  return selection;
};
