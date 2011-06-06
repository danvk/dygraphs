// Copyright 2011 Robert Konigsberg (konigsberg@google.com)
// All Rights Reserved.

/** 
 * @fileoverview The default interaction model for Dygraphs. This is kept out
 * of dygraph.js for better navigability.
 * @author Robert Konigsberg (konigsberg@google.com)
 */


/**
 * A collection of functions to facilitate build custom interaction models.
 * @class
 */
Dygraph.Interaction = {};

/**
 * Called in response to an interaction model operation that
 * should start the default panning behavior.
 *
 * It's used in the default callback for "mousedown" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the startPan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.startPan = function(event, g, context) {
  context.isPanning = true;
  var xRange = g.xAxisRange();
  context.dateRange = xRange[1] - xRange[0];
  context.initialLeftmostDate = xRange[0];
  context.xUnitsPerPixel = context.dateRange / (g.plotter_.area.w - 1);

  if (g.attr_("panEdgeFraction")) {
    var maxXPixelsToDraw = g.width_ * g.attr_("panEdgeFraction");
    var xExtremes = g.xAxisExtremes(); // I REALLY WANT TO CALL THIS xTremes!

    var boundedLeftX = g.toDomXCoord(xExtremes[0]) - maxXPixelsToDraw;
    var boundedRightX = g.toDomXCoord(xExtremes[1]) + maxXPixelsToDraw;

    var boundedLeftDate = g.toDataXCoord(boundedLeftX);
    var boundedRightDate = g.toDataXCoord(boundedRightX);
    context.boundedDates = [boundedLeftDate, boundedRightDate];

    var boundedValues = [];
    var maxYPixelsToDraw = g.height_ * g.attr_("panEdgeFraction");

    for (var i = 0; i < g.axes_.length; i++) {
      var axis = g.axes_[i];
      var yExtremes = axis.extremeRange;

      var boundedTopY = g.toDomYCoord(yExtremes[0], i) + maxYPixelsToDraw;
      var boundedBottomY = g.toDomYCoord(yExtremes[1], i) - maxYPixelsToDraw;

      var boundedTopValue = g.toDataYCoord(boundedTopY);
      var boundedBottomValue = g.toDataYCoord(boundedBottomY);

      boundedValues[i] = [boundedTopValue, boundedBottomValue];
    }
    context.boundedValues = boundedValues;
  }

  // Record the range of each y-axis at the start of the drag.
  // If any axis has a valueRange or valueWindow, then we want a 2D pan.
  context.is2DPan = false;
  for (var i = 0; i < g.axes_.length; i++) {
    var axis = g.axes_[i];
    var yRange = g.yAxisRange(i);
    // TODO(konigsberg): These values should be in |context|.
    // In log scale, initialTopValue, dragValueRange and unitsPerPixel are log scale.
    if (axis.logscale) {
      axis.initialTopValue = Dygraph.log10(yRange[1]);
      axis.dragValueRange = Dygraph.log10(yRange[1]) - Dygraph.log10(yRange[0]);
    } else {
      axis.initialTopValue = yRange[1];
      axis.dragValueRange = yRange[1] - yRange[0];
    }
    axis.unitsPerPixel = axis.dragValueRange / (g.plotter_.area.h - 1);

    // While calculating axes, set 2dpan.
    if (axis.valueWindow || axis.valueRange) context.is2DPan = true;
  }
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that pans the view.
 *
 * It's used in the default callback for "mousemove" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the movePan call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.movePan = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var minDate = context.initialLeftmostDate -
    (context.dragEndX - context.dragStartX) * context.xUnitsPerPixel;
  if (context.boundedDates) {
    minDate = Math.max(minDate, context.boundedDates[0]);
  }
  var maxDate = minDate + context.dateRange;
  if (context.boundedDates) {
    if (maxDate > context.boundedDates[1]) {
      // Adjust minDate, and recompute maxDate.
      minDate = minDate - (maxDate - context.boundedDates[1]);
      maxDate = minDate + context.dateRange;
    }
  }

  g.dateWindow_ = [minDate, maxDate];

  // y-axis scaling is automatic unless this is a full 2D pan.
  if (context.is2DPan) {
    // Adjust each axis appropriately.
    for (var i = 0; i < g.axes_.length; i++) {
      var axis = g.axes_[i];

      var pixelsDragged = context.dragEndY - context.dragStartY;
      var unitsDragged = pixelsDragged * axis.unitsPerPixel;
 
      var boundedValue = context.boundedValues ? context.boundedValues[i] : null;

      // In log scale, maxValue and minValue are the logs of those values.
      var maxValue = axis.initialTopValue + unitsDragged;
      if (boundedValue) {
        maxValue = Math.min(maxValue, boundedValue[1]);
      }
      var minValue = maxValue - axis.dragValueRange;
      if (boundedValue) {
        if (minValue < boundedValue[0]) {
          // Adjust maxValue, and recompute minValue.
          maxValue = maxValue - (minValue - boundedValue[0]);
          minValue = maxValue - axis.dragValueRange;
        }
      }
      if (axis.logscale) {
        axis.valueWindow = [ Math.pow(Dygraph.LOG_SCALE, minValue),
                             Math.pow(Dygraph.LOG_SCALE, maxValue) ];
      } else {
        axis.valueWindow = [ minValue, maxValue ];
      }
    }
  }

  g.drawGraph_(false);
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that ends panning.
 *
 * It's used in the default callback for "mouseup" operations.
 * Custom interaction model builders can use it to provide the default
 * panning behavior.
 *
 * @param { Event } event the event object which led to the startZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.endPan = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
  var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

  if (regionWidth < 2 && regionHeight < 2 &&
      g.lastx_ != undefined && g.lastx_ != -1) {
    Dygraph.Interaction.treatMouseOpAsClick(g, event, context);
  }

  // TODO(konigsberg): Clear the context data from the axis.
  // (replace with "context = {}" ?)
  // TODO(konigsberg): mouseup should just delete the
  // context object, and mousedown should create a new one.
  context.isPanning = false;
  context.is2DPan = false;
  context.initialLeftmostDate = null;
  context.dateRange = null;
  context.valueRange = null;
  context.boundedDates = null;
  context.boundedValues = null;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that starts zooming.
 *
 * It's used in the default callback for "mousedown" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the startZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.startZoom = function(event, g, context) {
  context.isZooming = true;
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that defines zoom boundaries.
 *
 * It's used in the default callback for "mousemove" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the moveZoom call.
 * @param { Dygraph} g The dygraph on which to act.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.moveZoom = function(event, g, context) {
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);

  var xDelta = Math.abs(context.dragStartX - context.dragEndX);
  var yDelta = Math.abs(context.dragStartY - context.dragEndY);

  // drag direction threshold for y axis is twice as large as x axis
  context.dragDirection = (xDelta < yDelta / 2) ? Dygraph.VERTICAL : Dygraph.HORIZONTAL;

  g.drawZoomRect_(
      context.dragDirection,
      context.dragStartX,
      context.dragEndX,
      context.dragStartY,
      context.dragEndY,
      context.prevDragDirection,
      context.prevEndX,
      context.prevEndY);

  context.prevEndX = context.dragEndX;
  context.prevEndY = context.dragEndY;
  context.prevDragDirection = context.dragDirection;
};

Dygraph.Interaction.treatMouseOpAsClick = function(g, event, context) {
  var clickCallback = g.attr_('clickCallback');
  var pointClickCallback = g.attr_('pointClickCallback');

  var selectedPoint = null;

  // Find out if the click occurs on a point. This only matters if there's a pointClickCallback.
  if (pointClickCallback) {
    var closestIdx = -1;
    var closestDistance = Number.MAX_VALUE;

    // check if the click was on a particular point.
    for (var i = 0; i < g.selPoints_.length; i++) {
      var p = g.selPoints_[i];
      var distance = Math.pow(p.canvasx - context.dragEndX, 2) +
                     Math.pow(p.canvasy - context.dragEndY, 2);
      if (closestIdx == -1 || distance < closestDistance) {
        closestDistance = distance;
        closestIdx = i;
      }
    }

    // Allow any click within two pixels of the dot.
    var radius = g.attr_('highlightCircleSize') + 2;
    if (closestDistance <= radius * radius) {
      selectedPoint = g.selPoints_[closestIdx];
    }
  }

  if (selectedPoint) {
    pointClickCallback(event, selectedPoint);
  }

  // TODO(danvk): pass along more info about the points, e.g. 'x'
  if (clickCallback) {
    clickCallback(event, g.lastx_, g.selPoints_);
  }
};

/**
 * Called in response to an interaction model operation that
 * responds to an event that performs a zoom based on previously defined
 * bounds..
 *
 * It's used in the default callback for "mouseup" operations.
 * Custom interaction model builders can use it to provide the default
 * zooming behavior.
 *
 * @param { Event } event the event object which led to the endZoom call.
 * @param { Dygraph} g The dygraph on which to end the zoom.
 * @param { Object} context The dragging context object (with
 * dragStartX/dragStartY/etc. properties). This function modifies the context.
 */
Dygraph.Interaction.endZoom = function(event, g, context) {
  context.isZooming = false;
  context.dragEndX = g.dragGetX_(event, context);
  context.dragEndY = g.dragGetY_(event, context);
  var regionWidth = Math.abs(context.dragEndX - context.dragStartX);
  var regionHeight = Math.abs(context.dragEndY - context.dragStartY);

  if (regionWidth < 2 && regionHeight < 2 &&
      g.lastx_ != undefined && g.lastx_ != -1) {
    Dygraph.Interaction.treatMouseOpAsClick(g, event, context);
  }

  if (regionWidth >= 10 && context.dragDirection == Dygraph.HORIZONTAL) {
    g.doZoomX_(Math.min(context.dragStartX, context.dragEndX),
               Math.max(context.dragStartX, context.dragEndX));
  } else if (regionHeight >= 10 && context.dragDirection == Dygraph.VERTICAL) {
    g.doZoomY_(Math.min(context.dragStartY, context.dragEndY),
               Math.max(context.dragStartY, context.dragEndY));
  } else {
    g.canvas_ctx_.clearRect(0, 0, g.canvas_.width, g.canvas_.height);
  }
  context.dragStartX = null;
  context.dragStartY = null;
};

/**
 * Default interation model for dygraphs. You can refer to specific elements of
 * this when constructing your own interaction model, e.g.:
 * g.updateOptions( {
 *   interactionModel: {
 *     mousedown: Dygraph.defaultInteractionModel.mousedown
 *   }
 * } );
 */
Dygraph.Interaction.defaultModel = {
  // Track the beginning of drag events
  mousedown: function(event, g, context) {
    context.initializeMouseDown(event, g, context);

    if (event.altKey || event.shiftKey) {
      Dygraph.startPan(event, g, context);
    } else {
      Dygraph.startZoom(event, g, context);
    }
  },

  // Draw zoom rectangles when the mouse is down and the user moves around
  mousemove: function(event, g, context) {
    if (context.isZooming) {
      Dygraph.moveZoom(event, g, context);
    } else if (context.isPanning) {
      Dygraph.movePan(event, g, context);
    }
  },

  mouseup: function(event, g, context) {
    if (context.isZooming) {
      Dygraph.endZoom(event, g, context);
    } else if (context.isPanning) {
      Dygraph.endPan(event, g, context);
    }
  },

  // Temporarily cancel the dragging event when the mouse leaves the graph
  mouseout: function(event, g, context) {
    if (context.isZooming) {
      context.dragEndX = null;
      context.dragEndY = null;
    }
  },

  // Disable zooming out if panning.
  dblclick: function(event, g, context) {
    if (event.altKey || event.shiftKey) {
      return;
    }
    // TODO(konigsberg): replace g.doUnzoom()_ with something that is
    // friendlier to public use.
    g.doUnzoom_();
  }
};

Dygraph.DEFAULT_ATTRS.interactionModel = Dygraph.Interaction.defaultModel;

// old ways of accessing these methods/properties
Dygraph.defaultInteractionModel = Dygraph.Interaction.defaultModel;
Dygraph.endZoom = Dygraph.Interaction.endZoom;
Dygraph.moveZoom = Dygraph.Interaction.moveZoom;
Dygraph.startZoom = Dygraph.Interaction.startZoom;
Dygraph.endPan = Dygraph.Interaction.endPan;
Dygraph.movePan = Dygraph.Interaction.movePan;
Dygraph.startPan = Dygraph.Interaction.startPan;

