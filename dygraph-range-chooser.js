/*
 * @license
 * Copyright 2012 Matthew Lohbihler (ml@serotoninsoftware.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview This file contains the DygraphRangeChooser class used to provide
 * a timeline range chooser widget for dygraphs.
 */

/*jshint globalstrict: true */
/*global Dygraph:false */
"use strict";

/**
 * The DygraphRangeChooser class provides handles on the chart for selecting a time range.
 * @param {Dygraph} dygraph The dygraph object
 * @constructor
 */
var DygraphRangeChooser = function(dygraph) {
  this.isIE_ = /MSIE/.test(navigator.userAgent) && !window.opera;
  this.dygraph_ = dygraph;
  this.hasTouchInterface_ = typeof(TouchEvent) != 'undefined';
  this.isMobileDevice_ = /mobile|android/gi.test(navigator.appVersion);
  this.createChooserHandles_();
  this.initInteraction_();
  this.labelFormatter_ = this.attr_("rangeChooserLabelFormatter");
  if (!this.labelFormatter_)
    this.labelFormatter_ = function(time) { return time.strftime('%H:%M'); };
};

/**
 * Adds the range choosers to the dygraph.
 * @param {Object} graphDiv The container div for the range chooser.
 * @param {DygraphLayout} layout The DygraphLayout object for this graph.
 */
DygraphRangeChooser.prototype.addToGraph = function(graphDiv, layout) {
  this.layout_ = layout;
  this.resize_();
  graphDiv.appendChild(this.leftSliderHandle_);
  graphDiv.appendChild(this.rightSliderHandle_);
  
  // Quick lookup for tooltip.
  this.setToolTip_(this.leftSliderHandle_);
  this.setToolTip_(this.rightSliderHandle_);
  
  // Put the tooltip for the right handle on the left side.
  this.rightSliderHandle_.tooltip.style.right = this.rightSliderHandle_.tooltip.style.left;
  this.rightSliderHandle_.tooltip.style.left = null;
};

DygraphRangeChooser.prototype.setToolTip_ = function(handle) {
  if (handle.getElementsByClassName)
    handle.tooltip = handle.getElementsByClassName("tooltip")[0];
  else {
    // IE support
    var children = handle.childNodes;
	for (var i=0; i<children.length; i++) {
      if (children[i].className == "tooltip") {
        handle.tooltip = children[i];
        break;
      }
	}
  }
};

/**
 * Renders the static background portion of the range chooser.
 */
DygraphRangeChooser.prototype.renderStaticLayer = function() {
  this.resize_();
};

/**
 * Renders the interactive foreground portion of the range chooser.
 */
DygraphRangeChooser.prototype.renderInteractiveLayer = function() {
  var xExtremes = this.dygraph_.xAxisExtremes();
  var xWindowLimits = this.dygraph_.xAxisRange();
  var xWindowRange = xWindowLimits[1] - xWindowLimits[0];
  
  if (!this.leftSliderHandle_.xValue) {
	// Initialization.
    this.leftSliderHandle_.xValue = xExtremes[0];
    this.rightSliderHandle_.xValue = xExtremes[1];
    
    if (this.attr_("rangeChooserCallback"))
      this.attr_("rangeChooserCallback")(null, this.leftSliderHandle_.xValue, this.rightSliderHandle_.xValue);
  }

  if (xWindowLimits[0] == xExtremes[0] && xWindowLimits[1] == xExtremes[1]) {
	// Window range reset. Ensure that the handles are not out of range.
    this.leftSliderHandle_.xValue = Math.max(xExtremes[0], this.leftSliderHandle_.xValue);
    this.rightSliderHandle_.xValue = Math.min(xExtremes[1], this.rightSliderHandle_.xValue);
  }

  var leftRatio = (this.leftSliderHandle_.xValue - xWindowLimits[0]) / xWindowRange;
  var rightRatio = (this.rightSliderHandle_.xValue - xWindowLimits[0]) / xWindowRange;
  var leftCoord = this.canvasRect_.x + this.canvasRect_.w*leftRatio;
  var rightCoord = this.canvasRect_.x + this.canvasRect_.w*rightRatio;
  
  var handleTop = Math.max(this.canvasRect_.y, this.canvasRect_.y + (this.canvasRect_.h - this.sliderHandleDim_.h)/2);
  var halfHandleWidth = this.sliderHandleDim_.w/2;
  
  this.leftSliderHandle_.style.left = (leftCoord - halfHandleWidth) + 'px';
  this.leftSliderHandle_.style.paddingTop = handleTop + 'px';
  this.rightSliderHandle_.style.left = (rightCoord - halfHandleWidth) + 'px';
  this.rightSliderHandle_.style.paddingTop = this.leftSliderHandle_.style.paddingTop;
  
  this.leftSliderHandle_.style.height = Math.max(0, this.canvasRect_.h - this.canvasRect_.y - handleTop) +"px";
  this.rightSliderHandle_.style.height = this.leftSliderHandle_.style.height;
  
  if (leftRatio < 0 || leftRatio > 1)
    this.leftSliderHandle_.style.visibility = 'hidden';
  else
    this.leftSliderHandle_.style.visibility = 'visible';
  
  if (rightRatio < 0 || rightRatio > 1)
    this.rightSliderHandle_.style.visibility = 'hidden';
  else
    this.rightSliderHandle_.style.visibility = 'visible';
};

/**
 * @private
 * Resizes the range chooser.
 */
DygraphRangeChooser.prototype.resize_ = function() {
  this.canvasRect_ = this.layout_.getPlotArea();
};

DygraphRangeChooser.prototype.attr_ = function(name) {
  return this.dygraph_.user_attrs_[name];
};

/**
 * @private
 * Creates the chooser handle elements.
 */
DygraphRangeChooser.prototype.createChooserHandles_ = function() {
  var img = new Image();

  if (/MSIE 7/.test(navigator.userAgent)) { // IE7 doesn't support embedded src data.
    img.width = 7;
    img.height = 14;
    img.style.backgroundColor = 'white';
    img.style.border = '1px solid #333333'; // Just show box in IE7.
  } else {
    img.width = 9;
    img.height = 16;
    img.src = 'data:image/png;base64,' +
'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAQCAYAAADESFVDAAAAAXNSR0IArs4c6QAAAAZiS0dEANAA' +
'zwDP4Z7KegAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9sHGw0cMqdt1UwAAAAZdEVYdENv' +
'bW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAaElEQVQoz+3SsRFAQBCF4Z9WJM8KCDVwownl' +
'6YXsTmCUsyKGkZzcl7zkz3YLkypgAnreFmDEpHkIwVOMfpdi9CEEN2nGpFdwD03yEqDtOgCaun7s' +
'qSTDH32I1pQA2Pb9sZecAxc5r3IAb21d6878xsAAAAAASUVORK5CYII=';
  }
  img.style.position = "relative"; // Keeps the needle from drawing over the image.
  img.style.cursor = 'col-resize';

  if (this.isMobileDevice_) {
    img.width *= 2;
    img.height *= 2;
  }
  this.sliderHandleDim_ = { w: img.width, h: img.height };

  var div = document.createElement("div");
  div.className = 'dygraph-rangeChooser-handle';
  div.style.position = 'absolute';
  div.style.zIndex = 10;
  div.style.visibility = 'hidden'; // Initially hidden so they don't show up in the wrong place.
  
  var needle = document.createElement("div");
  var needleWidth = 1;
  needle.className = 'needle';
  needle.style.width = needleWidth +"px";
  needle.style.position = "absolute"; // Makes positioning insensitive to parent padding.
  needle.style.left = ((img.width - needleWidth) / 2) +"px";
  needle.style.top = 0;
  needle.style.height = "100%";
  needle.style.backgroundColor = "#c00";
  
  var tooltip = document.createElement("div");
  tooltip.className = 'tooltip';
  tooltip.style.position = "absolute";
  tooltip.style.left = img.width +"px";
  tooltip.style.backgroundColor = "#eee";
  tooltip.style.visibility = "hidden";
  
  div.appendChild(needle);
  div.appendChild(img);
  div.appendChild(tooltip);
  
  this.leftSliderHandle_ = div;
  this.rightSliderHandle_ = div.cloneNode(true);
};

/**
 * @private
 * Sets up the interaction for the range chooser.
 */
DygraphRangeChooser.prototype.initInteraction_ = function() {
  var self = this;
  var topElem = this.isIE_ ? document : window;
  var xStart = 0;
  var handle = null;
  var isSliding = false;

  // functions, defined below.  Defining them this way (rather than with
  // "function foo() {...}" makes JSHint happy.
  var onSliderOver, onSlideStart, onSlide, onSlideEnd, onSliderOut, updateTooltip, getSliderPosition, calculateSliderXValue;

  // Touch event functions
  var onSliderHandleTouchEvent, addTouchEvents;

  onSliderOver = function(e) {
	if (isSliding)
		return;
	
    handle = e.target ? e.target : e.srcElement;
    while (handle && handle != self.leftSliderHandle_ && handle != self.rightSliderHandle_)
      handle = handle.parentNode;
    if (!handle)
      return;
    
    // Show the slider status.
	updateTooltip(handle);
  };
  
  onSlideStart = function(e) {
    isSliding = true;
    
    var handlePosition = getSliderPosition(handle);
    xStart = handlePosition - e.screenX;

    Dygraph.cancelEvent(e);
    self.dygraph_.addEvent(topElem, 'mousemove', onSlide);
    self.dygraph_.addEvent(topElem, 'mouseup', onSlideEnd);
    return true;
  };

  onSlide = function(e) {
    if (!isSliding)
      return false;
    
    Dygraph.cancelEvent(e);
    if (e.screenX === 0)
      // First iPad move event seems to have screenX = 0
      return true;
    
    // Move handle.
    var sliderHandleStatus = self.getSliderHandleStatus_();
    var newPos;
    if (handle == self.leftSliderHandle_) {
      newPos = xStart + e.screenX;
      newPos = Math.min(newPos, sliderHandleStatus.rightHandlePos - self.sliderHandleDim_.w - 3);
      newPos = Math.max(newPos, self.canvasRect_.x);
    }
    else {
      newPos = xStart + e.screenX;
      newPos = Math.min(newPos, self.canvasRect_.x + self.canvasRect_.w);
      newPos = Math.max(newPos, sliderHandleStatus.leftHandlePos + self.sliderHandleDim_.w + 3);
    }
    
    var halfHandleWidth = self.sliderHandleDim_.w/2;
    handle.style.left = (newPos - halfHandleWidth) + 'px';
    
    handle.xValue = calculateSliderXValue(handle);
	updateTooltip(handle);
    
    return true;
  };

  onSlideEnd = function(e) {
    if (!isSliding)
      return false;
    
    // Calculate the xValue of where the slider ended up.
	updateTooltip(handle);
    
    // Callback.
    if (self.attr_("rangeChooserCallback"))
      self.attr_("rangeChooserCallback")(handle == self.leftSliderHandle_ ? "from" : "to",
          self.leftSliderHandle_.xValue, self.rightSliderHandle_.xValue);
    
    isSliding = false;
    Dygraph.removeEvent(topElem, 'mousemove', onSlide);
    Dygraph.removeEvent(topElem, 'mouseup', onSlideEnd);

    return true;
  };
  
  onSliderOut = function(e) {
	handle.tooltip.style.visibility = "hidden";
  };
  
  updateTooltip = function(handle) {
	handle.tooltip.style.visibility = "visible";
    handle.tooltip.innerHTML = self.labelFormatter_(new Date(handle.xValue));
  };

  onSliderHandleTouchEvent = function(e) {
    if (e.type == 'touchstart' && e.targetTouches.length == 1) {
      if (onSlideStart(e.targetTouches[0]))
        Dygraph.cancelEvent(e);
    }
    else if (e.type == 'touchmove' && e.targetTouches.length == 1) {
      if (onSlide(e.targetTouches[0]))
        Dygraph.cancelEvent(e);
    }
    else
      onSlideEnd(e);
  };

  addTouchEvents = function(elem, fn) {
    var types = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];
    for (var i = 0; i < types.length; i++) {
      self.dygraph_.addEvent(elem, types[i], fn);
    }
  };
  
  getSliderPosition = function(handle) {
    return parseInt(handle.style.left, 10) + self.sliderHandleDim_.w/2;
  };
  
  calculateSliderXValue = function(handle) {
    var handlePosition = getSliderPosition(handle);
    var xWindowLimits = self.dygraph_.xAxisRange();
    var xWindowRange = xWindowLimits[1] - xWindowLimits[0];
    var ratio = (handlePosition - self.canvasRect_.x) / self.canvasRect_.w;
    return ratio * xWindowRange + xWindowLimits[0];
  };

  // Hover events
  this.dygraph_.addEvent(this.leftSliderHandle_, "mouseover", onSliderOver);
  this.dygraph_.addEvent(this.leftSliderHandle_, "mouseout", onSliderOut);
  this.dygraph_.addEvent(this.rightSliderHandle_, "mouseover", onSliderOver);
  this.dygraph_.addEvent(this.rightSliderHandle_, "mouseout", onSliderOut);

  // Drag events
  var dragStartEvent = window.opera ? 'mousedown' : 'dragstart';
  this.dygraph_.addEvent(this.leftSliderHandle_, dragStartEvent, onSlideStart);
  this.dygraph_.addEvent(this.rightSliderHandle_, dragStartEvent, onSlideStart);
  
  // Touch events
  if (this.hasTouchInterface_) {
    addTouchEvents(this.leftSliderHandle_, onSliderHandleTouchEvent);
    addTouchEvents(this.rightSliderHandle_, onSliderHandleTouchEvent);
  }
};

/**
 * @private
 * Returns the current slider handle position information.
 * @return {Object} The slider handle status.
 */
DygraphRangeChooser.prototype.getSliderHandleStatus_ = function() {
  var halfHandleWidth = this.sliderHandleDim_.w/2;
  var leftHandlePos = parseInt(this.leftSliderHandle_.style.left, 10) + halfHandleWidth;
  var rightHandlePos = parseInt(this.rightSliderHandle_.style.left, 10) + halfHandleWidth;
  return {
    leftHandlePos: leftHandlePos,
    rightHandlePos: rightHandlePos
  };
};
