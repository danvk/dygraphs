// Copyright 2011 Paul Felix (paul.eric.felix@gmail.com)
// All Rights Reserved.

/**
 * @fileoverview This file contains the DygraphRangeSelector class used to provide
 * a timeline range selector widget for dygraphs.
 */

/**
 * The DygraphRangeSelector class provides a timeline range selector widget.
 * @param {Dygraph} dygraph The dygraph object
 * @constructor
 */
DygraphRangeSelector = function(dygraph) {
  this.isIE_ = /MSIE/.test(navigator.userAgent) && !window.opera;
  this.isUsingExcanvas = typeof(G_vmlCanvasManager) != 'undefined';
  this.dygraph_ = dygraph;
  this.reserveSpace_();
  this.createCanvases_();
  this.createZoomHandles_();
  this.initInteraction_();
};

/**
 * Adds the range selector to the dygraph.
 * @param {Object} graphDiv The container div for the range selector.
 * @param {DygraphLayout} layout The DygraphLayout object for this graph.
 */
DygraphRangeSelector.prototype.addToGraph = function(graphDiv, layout) {
  this.layout_ = layout;
  this.resize_();
  graphDiv.appendChild(this.bgcanvas_);
  graphDiv.appendChild(this.fgcanvas_);
  graphDiv.appendChild(this.leftZoomHandle_);
  graphDiv.appendChild(this.rightZoomHandle_);
};

/**
 * Renders the static background portion of the range selector.
 */
DygraphRangeSelector.prototype.renderStaticLayer = function() {
  this.resize_();
  this.drawStaticLayer_();
};

/**
 * Renders the interactive foreground portion of the range selector.
 */
DygraphRangeSelector.prototype.renderInteractiveLayer = function() {
  if (this.isChangingRange_) {
    return;
  }

  // The zoom handle image may not be loaded yet. May need to try again later.
  if (this.leftZoomHandle_.height == 0 && this.leftZoomHandle_.retryCount != 5) {
    var self = this;
    setTimeout(function() { self.renderInteractiveLayer(); }, 300);
    var retryCount = this.leftZoomHandle_.retryCount;
    this.leftZoomHandle_.retryCount = retryCount == undefined ? 1 : retryCount+1;
    return;
  }

  this.placeZoomHandles_();
  this.drawInteractiveLayer_();
};

/**
 * @private
 * Resizes the range selector.
 */
DygraphRangeSelector.prototype.resize_ = function() {
  function setCanvasRect(canvas, rect) {
    canvas.style.top = rect.y + 'px';
    canvas.style.left = rect.x + 'px';
    canvas.width = rect.w;
    canvas.height = rect.h;
    canvas.style.width = canvas.width + 'px';    // for IE
    canvas.style.height = canvas.height + 'px';  // for IE
  };

  var plotArea = this.layout_.plotArea;
  this.canvasRect_ = {
    x: plotArea.x,
    y: plotArea.y + plotArea.h + this.xAxisLabelHeight_,
    w: plotArea.w,
    h: this.attr_('rangeSelectorHeight')
  };

  setCanvasRect(this.bgcanvas_, this.canvasRect_);
  setCanvasRect(this.fgcanvas_, this.canvasRect_);
};

DygraphRangeSelector.prototype.attr_ = function(name) {
  return this.dygraph_.attr_(name);
};

/**
 * @private
 * Reserves space at the bottom of the graph by setting the xAxisHeight attribute.
 */
DygraphRangeSelector.prototype.reserveSpace_ = function() {
  var spacing = 2;
  this.xAxisLabelHeight_ = this.attr_('axisLabelFontSize') + 2 * this.attr_('axisTickSize') + spacing;
  this.dygraph_.attrs_.xAxisHeight = this.xAxisLabelHeight_ + this.attr_('rangeSelectorHeight') + spacing;
};

/**
 * @private
 * Creates the background and foreground canvases.
 */
DygraphRangeSelector.prototype.createCanvases_ = function() {
  this.bgcanvas_ = Dygraph.createCanvas();
  this.bgcanvas_.style.position = 'absolute';
  this.bgcanvas_ctx_ = Dygraph.getContext(this.bgcanvas_);
  this.bgcanvas_margin_ = .5;

  this.fgcanvas_ = Dygraph.createCanvas();
  this.fgcanvas_.style.position = 'absolute';
  this.fgcanvas_.style.cursor = 'default';
  this.fgcanvas_ctx_ = Dygraph.getContext(this.fgcanvas_);
  this.fgcanvas_margin_ = 1;
};

/**
 * @private
 * Creates the zoom handle elements.
 */
DygraphRangeSelector.prototype.createZoomHandles_ = function() {
  var img = new Image();
  img.className = 'dygraph_zoomhandle';
  img.style.position = 'absolute';
  img.style.visibility = 'hidden'; // Initially hidden so they don't show up in the wrong place.
  img.style.cursor = 'col-resize';
  img.src = 'data:image/png;base64,\
iVBORw0KGgoAAAANSUhEUgAAAAkAAAAQCAYAAADESFVDAAAAAXNSR0IArs4c6QAAAAZiS0dEANAA\
zwDP4Z7KegAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9sHGw0cMqdt1UwAAAAZdEVYdENv\
bW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAaElEQVQoz+3SsRFAQBCF4Z9WJM8KCDVwownl\
6YXsTmCUsyKGkZzcl7zkz3YLkypgAnreFmDEpHkIwVOMfpdi9CEEN2nGpFdwD03yEqDtOgCaun7s\
qSTDH32I1pQA2Pb9sZecAxc5r3IAb21d6878xsAAAAAASUVORK5CYII=';

  this.leftZoomHandle_ = img;
  this.leftZoomHandle_.id = 'dygraph_lzoomhandle';

  this.rightZoomHandle_ = img.cloneNode(false);
  this.rightZoomHandle_.id = 'dygraph_rzoomhandle';
};

/**
 * @private
 * Sets up the interaction for the range selector.
 */
DygraphRangeSelector.prototype.initInteraction_ = function() {
  var self = this;
  var topElem = this.isIE_ ? document : window;
  var xLast = 0;
  var handle = null;
  var isPanning = false;

  function addEvent(elem, type, fn) {
    if (elem.addEventListener) {
      elem.addEventListener(type, fn, false);
    } else {
      elem[type+fn] = function(){fn(window.event);};
      elem.attachEvent('on'+type, elem[type+fn]);
    }
  };

  function removeEvent(elem, type, fn) {
    if (elem.removeEventListener) {
      elem.removeEventListener(type, fn, false);
    } else {
      elem.detachEvent('on'+type, elem[type+fn]);
      elem[type+fn] = null;
    }
  };

  function preventDefault(e) {
    if (e.preventDefault) {
      e.preventDefault();  // Firefox, Chrome, etc.
    } else {
      e.returnValue = false;  // IE
      e.cancelBubble = true;
    }
  };

  function toXDataWindow(zoomHandleStatus) {
    var xDataLimits = self.dygraph_.xAxisExtremes();
    var fact = (xDataLimits[1] - xDataLimits[0])/self.canvasRect_.w;
    var xDataMin = xDataLimits[0] + (zoomHandleStatus.leftHandlePos - self.canvasRect_.x)*fact;
    var xDataMax = xDataLimits[0] + (zoomHandleStatus.rightHandlePos - self.canvasRect_.x)*fact;
    return [xDataMin, xDataMax];
  };

  function onZoomStart(e) {
    preventDefault(e);
    xLast = e.screenX;
    handle = e.target ? e.target : e.srcElement;
    addEvent(topElem, 'mousemove', onZoom);
    addEvent(topElem, 'mouseup', onZoomEnd);
  };

  function onZoom(e) {
    var delX = e.screenX - xLast;
    if (Math.abs(delX) < 4) {
      return;
    }
    xLast = e.screenX;
    var zoomHandleStatus = self.getZoomHandleStatus_();
    var halfHandleWidth = Math.round(handle.width/2);
    if (handle == self.leftZoomHandle_) {
      var newPos = zoomHandleStatus.leftHandlePos + delX;
      newPos = Math.min(newPos, zoomHandleStatus.rightHandlePos - handle.width - 3);
      newPos = Math.max(newPos, self.canvasRect_.x);
    } else {
      var newPos = zoomHandleStatus.rightHandlePos + delX;
      newPos = Math.min(newPos, self.canvasRect_.x + self.canvasRect_.w);
      newPos = Math.max(newPos, zoomHandleStatus.leftHandlePos + handle.width + 3);
    }
    handle.style.left = (newPos - halfHandleWidth) + 'px';
    self.drawInteractiveLayer_();

    // Zoom on the fly (if not using excanvas).
    if (!self.isUsingExcanvas) {
      doZoom();
    }
  };

  function onZoomEnd(e) {
    removeEvent(topElem, 'mousemove', onZoom);
    removeEvent(topElem, 'mouseup', onZoomEnd);

    // If using excanvas, Zoom now.
    if (self.isUsingExcanvas) {
      doZoom();
    }
  };

  function doZoom() {
    try {
      var zoomHandleStatus = self.getZoomHandleStatus_();
      self.isChangingRange_ = true;
      if (!zoomHandleStatus.isZoomed) {
        self.dygraph_.doUnzoom_();
      } else {
        var xDataWindow = toXDataWindow(zoomHandleStatus);
        self.dygraph_.doZoomXDates_(xDataWindow[0], xDataWindow[1]);
      }
    } finally {
      self.isChangingRange_ = false;
    }
  };

  function isMouseInPanZone(e) {
    // Getting clientX directly from the event is not accurate enough :(
    var clientX = self.canvasRect_.x + (e.layerX != undefined ? e.layerX : e.offsetX);
    var zoomHandleStatus = self.getZoomHandleStatus_();
    return (clientX > zoomHandleStatus.leftHandlePos && clientX < zoomHandleStatus.rightHandlePos);
  };

  function onPanStart(e) {
    if (!isPanning && isMouseInPanZone(e) && self.getZoomHandleStatus_().isZoomed) {
      preventDefault(e);
      isPanning = true;
      xLast = e.screenX;
      addEvent(topElem, 'mousemove', onPan);
      addEvent(topElem, 'mouseup', onPanEnd);
    }
  };

  function onPan(e) {
    if (!isPanning) {
      return;
    }

    var delX = e.screenX - xLast;
    if (Math.abs(delX) < 4) {
      return;
    }
    xLast = e.screenX;

    // Move range view
    var zoomHandleStatus = self.getZoomHandleStatus_();
    var leftHandlePos = zoomHandleStatus.leftHandlePos;
    var rightHandlePos = zoomHandleStatus.rightHandlePos;
    var rangeSize = rightHandlePos - leftHandlePos;
    if (leftHandlePos + delX <= self.canvasRect_.x) {
      leftHandlePos = self.canvasRect_.x;
      rightHandlePos = leftHandlePos + rangeSize;
    } else if (rightHandlePos + delX >= self.canvasRect_.x + self.canvasRect_.w) {
      rightHandlePos = self.canvasRect_.x + self.canvasRect_.w;
      leftHandlePos = rightHandlePos - rangeSize;
    } else {
      leftHandlePos += delX;
      rightHandlePos += delX;
    }
    var halfHandleWidth = Math.round(self.leftZoomHandle_.width/2);
    self.leftZoomHandle_.style.left = (leftHandlePos - halfHandleWidth) + 'px';
    self.rightZoomHandle_.style.left = (rightHandlePos - halfHandleWidth) + 'px';
    self.drawInteractiveLayer_();

    // Do pan on the fly (if not using excanvas).
    if (!self.isUsingExcanvas) {
      doPan();
    }
  };

  function onPanEnd(e) {
    if (!isPanning) {
      return;
    }
    isPanning = false;
    removeEvent(topElem, 'mousemove', onPan);
    removeEvent(topElem, 'mouseup', onPanEnd);
    // If using excanvas, do pan now.
    if (self.isUsingExcanvas) {
      doPan();
    }
  };

  function doPan() {
    try {
      self.isChangingRange_ = true;
      self.dygraph_.dateWindow_ = toXDataWindow(self.getZoomHandleStatus_());
      self.dygraph_.drawGraph_(false);
    } finally {
      self.isChangingRange_ = false;
    }
  };

  function onCanvasMouseMove(e) {
    if (isPanning) {
      return;
    }
    var cursor = isMouseInPanZone(e) ? 'move' : 'default';
    if (cursor != self.fgcanvas_.style.cursor) {
      self.fgcanvas_.style.cursor = cursor;
    }
  };

  var interactionModel = {
    mousedown: function(event, g, context) {
      context.initializeMouseDown(event, g, context);
      Dygraph.startPan(event, g, context);
    },
    mousemove: function(event, g, context) {
      if (context.isPanning) {
        Dygraph.movePan(event, g, context);
      }
    },
    mouseup: function(event, g, context) {
      if (context.isPanning) {
        Dygraph.endPan(event, g, context);
      }
    }
  };

  this.dygraph_.attrs_.interactionModel = interactionModel;
  this.dygraph_.attrs_.panEdgeFraction = .0001;

  addEvent(this.leftZoomHandle_, 'dragstart', onZoomStart);
  addEvent(this.rightZoomHandle_, 'dragstart', onZoomStart);
  addEvent(this.fgcanvas_, 'mousedown', onPanStart);
  addEvent(this.fgcanvas_, 'mousemove', onCanvasMouseMove);
};

/**
 * @private
 * Draws the static layer in the background canvas.
 */
DygraphRangeSelector.prototype.drawStaticLayer_ = function() {
  var ctx = this.bgcanvas_ctx_;
  ctx.clearRect(0, 0, this.canvasRect_.w, this.canvasRect_.h);
  var margin = this.bgcanvas_margin_;
  try {
    this.drawMiniPlot_();
  } catch(ex) {
  }
  ctx.strokeStyle = 'lightgray';
  if (false) {
    ctx.strokeRect(margin, margin, this.canvasRect_.w-margin, this.canvasRect_.h-margin);
  } else {
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, this.canvasRect_.h-margin);
    ctx.lineTo(this.canvasRect_.w-margin, this.canvasRect_.h-margin);
    ctx.lineTo(this.canvasRect_.w-margin, margin);
    ctx.stroke();
  }
};


/**
 * @private
 * Draws the mini plot in the background canvas.
 */
DygraphRangeSelector.prototype.drawMiniPlot_ = function() {
  var fillStyle = this.attr_('rangeSelectorPlotFillColor');
  var strokeStyle = this.attr_('rangeSelectorPlotStrokeColor');
  if (!fillStyle && !strokeStyle) {
    return;
  }

  var combinedSeriesData = this.computeCombinedSeriesAndLimits_();
  var yRange = combinedSeriesData.yMax - combinedSeriesData.yMin;

  // Draw the mini plot.
  var ctx = this.bgcanvas_ctx_;
  var margin = this.bgcanvas_margin_;

  var xExtremes = this.dygraph_.xAxisExtremes();
  var xRange = Math.max(xExtremes[1] - xExtremes[0], 1.e-30);
  var xFact = (this.canvasRect_.w - margin)/xRange;
  var yFact = (this.canvasRect_.h - margin)/yRange;
  var canvasWidth = this.canvasRect_.w - margin;
  var canvasHeight = this.canvasRect_.h - margin;

  ctx.beginPath();
  ctx.moveTo(margin, canvasHeight);
  for (var i = 0; i < combinedSeriesData.data.length; i++) {
    var dataPoint = combinedSeriesData.data[i];
    var x = (dataPoint[0] - xExtremes[0])*xFact;
    var y = canvasHeight - (dataPoint[1] - combinedSeriesData.yMin)*yFact;
    if (isFinite(x) && isFinite(y)) {
      ctx.lineTo(x, y);
    }
  }
  ctx.lineTo(canvasWidth, canvasHeight);
  ctx.closePath();

  if (fillStyle) {
    var lingrad = this.bgcanvas_ctx_.createLinearGradient(0, 0, 0, canvasHeight);
    lingrad.addColorStop(0, 'white');
    lingrad.addColorStop(1, fillStyle);
    this.bgcanvas_ctx_.fillStyle = lingrad;
    ctx.fill();
  }

  if (strokeStyle) {
    this.bgcanvas_ctx_.strokeStyle = strokeStyle;
    this.bgcanvas_ctx_.lineWidth = 1.5;
    ctx.stroke();
  }
};

/**
 * @private
 * Computes and returns the combinded series data along with min/max for the mini plot.
 * @return {Object} An object containing combinded series array, ymin, ymax.
 */
DygraphRangeSelector.prototype.computeCombinedSeriesAndLimits_ = function() {
  var bars = this.attr_('errorBars') || this.attr_('customBars');
  var fractions = this.attr_('fractions');
  var data = this.dygraph_.rawData_;
  var rollPeriod = Math.min(this.dygraph_.rollPeriod_, data.length);
  var logscale = this.attr_('logscale');

  // Create a combined series (average of all series values).
  var combinedSeries = [];
  var yMin = Number.MAX_VALUE;
  var yMax = -Number.MAX_VALUE;
  for (var i = 0; i < data.length; i++) {
    var dataPoint = data[i];
    var xVal = dataPoint[0];
    var sum = 0;
    var count = 0;
    for (var j = 1; j < dataPoint.length; j++) {
      if (this.dygraph_.visibility()[j-1]) {
        var y;
        if (fractions) {
          y = dataPoint[j][0]/dataPoint[j][1];
        } else if (bars) {
          y = dataPoint[j][1]; // Just use main value.
        } else {
          y = dataPoint[j];
        }
        if (y == null || isNaN(y)) continue;
        sum += y;
        count++;
      }
    }
    var yVal = sum/count;

    // Rolling average.
    if (rollPeriod > 1) {
      var sum = yVal;
      var count = 1;
      for (var j = Math.max(0, i-rollPeriod+1); j < i; j++) {
        sum += combinedSeries[j][1];
        count++;
      }
      yVal = sum/count;
    }

    combinedSeries.push([xVal, yVal]);
    if (!logscale || yVal > 0) {
      yMin = Math.min(yMin, yVal);
      yMax = Math.max(yMax, yVal);
    }
  }

  // Convert Y data to log scale if needed.
  // Also, expand the Y range to compress the mini plot a little.
  var extraPercent = .25;
  if (logscale) {
    yMax = Dygraph.log10(yMax);
    yMax += yMax*extraPercent;
    yMin = Dygraph.log10(yMin);
    for (var i = 0; i < combinedSeries.length; i++) {
      combinedSeries[i][1] = Dygraph.log10(combinedSeries[i][1]);
    }
  } else {
    var yExtra;
    yRange = yMax - yMin;
    if (yRange <= Number.MIN_VALUE) {
      yExtra = yMax*extraPercent;
    } else {
      yExtra = yRange*extraPercent;
    }
    yMax += yExtra;
    yMin -= yExtra;
  }

  return {data: combinedSeries, yMin: yMin, yMax: yMax};
};

/**
 * @private
 * Places the zoom handles in the proper position based on the current X data window.
 */
DygraphRangeSelector.prototype.placeZoomHandles_ = function() {
  var xExtremes = this.dygraph_.xAxisExtremes();
  var xWindowLimits = this.dygraph_.xAxisRange();
  var xRange = xExtremes[1] - xExtremes[0];
  var leftPercent = Math.max(0, (xWindowLimits[0] - xExtremes[0])/xRange);
  var rightPercent = Math.max(0, (xExtremes[1] - xWindowLimits[1])/xRange);
  var leftCoord = this.canvasRect_.x + this.canvasRect_.w*leftPercent;
  var rightCoord = this.canvasRect_.x + this.canvasRect_.w*(1 - rightPercent);
  var handleTop = Math.round(Math.max(this.canvasRect_.y, this.canvasRect_.y + (this.canvasRect_.h - this.leftZoomHandle_.height)/2));
  var halfHandleWidth = Math.round(this.leftZoomHandle_.width/2);
  this.leftZoomHandle_.style.left = Math.round(leftCoord - halfHandleWidth) + 'px';
  this.leftZoomHandle_.style.top = handleTop + 'px';
  this.rightZoomHandle_.style.left = Math.round(rightCoord - halfHandleWidth) + 'px';
  this.rightZoomHandle_.style.top = this.leftZoomHandle_.style.top;

  this.leftZoomHandle_.style.visibility = 'visible';
  this.rightZoomHandle_.style.visibility = 'visible';
};

/**
 * @private
 * Draws the interactive layer in the foreground canvas.
 */
DygraphRangeSelector.prototype.drawInteractiveLayer_ = function() {
  var ctx = this.fgcanvas_ctx_;
  ctx.clearRect(0, 0, this.canvasRect_.w, this.canvasRect_.h);
  var margin = this.fgcanvas_margin_;
  var width = this.canvasRect_.w - margin;
  var height = this.canvasRect_.h - margin;
  var zoomHandleStatus = this.getZoomHandleStatus_();

  ctx.strokeStyle = 'black';
  if (!zoomHandleStatus.isZoomed) {
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, margin);
    ctx.stroke();
  } else {
    leftHandleCanvasPos = Math.max(margin, zoomHandleStatus.leftHandlePos - this.canvasRect_.x);
    rightHandleCanvasPos = Math.min(width, zoomHandleStatus.rightHandlePos - this.canvasRect_.x);

    ctx.fillStyle = 'rgba(240, 240, 240, 0.6)';
    ctx.fillRect(margin, margin, leftHandleCanvasPos, height - margin);
    ctx.fillRect(rightHandleCanvasPos, margin, width - rightHandleCanvasPos, height - margin);

    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(leftHandleCanvasPos, margin);
    ctx.lineTo(leftHandleCanvasPos, height);
    ctx.lineTo(rightHandleCanvasPos, height);
    ctx.lineTo(rightHandleCanvasPos, margin);
    ctx.lineTo(width, margin);
    ctx.stroke();
  }
};

/**
 * @private
 * Returns the current zoom handle position information.
 * @return {Object} The zoom handle status.
 */
DygraphRangeSelector.prototype.getZoomHandleStatus_ = function() {
  var halfHandleWidth = Math.round(this.leftZoomHandle_.width/2);
  var leftHandlePos = parseInt(this.leftZoomHandle_.style.left) + halfHandleWidth;
  var rightHandlePos = parseInt(this.rightZoomHandle_.style.left) + halfHandleWidth;
  return {
      leftHandlePos: leftHandlePos,
      rightHandlePos: rightHandlePos,
      isZoomed: (leftHandlePos - 1 > this.canvasRect_.x || rightHandlePos + 1 < this.canvasRect_.x+this.canvasRect_.w)
  };
};
