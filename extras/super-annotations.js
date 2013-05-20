/**
 * @license
 * Copyright 2013 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 *
 * Note: This plugin requires jQuery and jQuery UI Draggable.
 */

/*global Dygraph:false */

Dygraph.Plugins.SuperAnnotations = (function() {

"use strict";

/**
 * These are just the basic requirements -- annotations can have whatever other
 * properties the code that displays them wants them to have.
 *
 * @typedef {
 *   xval:  number,      // x-value (i.e. millis or a raw number)
 *   series: string,     // series name
 *   lineDiv: !Element   // vertical div connecting point to info div.
 *   infoDiv: !Element   // div containing info about the annotation.
 * } Annotation
 */

var annotations = function(opt_options) {
  /* @type {!Array.<!Annotation>} */
  this.annotations_ = [];
  // Used to detect resizes (which require the divs to be repositioned).
  this.lastWidth_ = -1;
  this.lastHeight = -1;
  this.dygraph_ = null;

  opt_options = opt_options || {};
  this.defaultAnnotationProperties_ = $.extend({
    'text': 'Description'
  }, opt_options['defaultAnnotationProperties']);
};

annotations.prototype.toString = function() {
  return "SuperAnnotations Plugin";
};

annotations.prototype.activate = function(g) {
  this.dygraph_ = g;
  this.annotations_ = [];

  return {
    didDrawChart: this.didDrawChart,
    pointClick: this.pointClick  // TODO(danvk): implement in dygraphs
  };
};

annotations.prototype.detachLabels = function() {
  for (var i = 0; i < this.annotations_.length; i++) {
    var a = this.annotations_[i];
    $(a.lineDiv).remove();
    $(a.infoDiv).remove();
    this.annotations_[i] = null;
  }
  this.annotations_ = [];
};

annotations.prototype.annotationWasDragged = function(a, event, ui) {
  var g = this.dygraph_;
  var area = g.getArea();
  var oldXVal = a.xval;

  // TODO(danvk): find closest point
  // - area.x  ?
  var row = g.findClosestRow(ui.position.left);
  a.xval = g.getValue(row, 0);
  g.setSelection(row, a.series);

  this.moveAnnotationToTop(a);
  this.updateAnnotationDivPositions();
  this.updateAnnotationInfo();
  // $(this).triggerHandler('hairlineMoved', {
  //   // TODO(danvk): fill in
  // });
  // $(this).triggerHandler('annotationsChanged', {});
};

// This creates the hairline object and returns it.
// It does not position it and does not attach it to the chart.
annotations.prototype.createAnnotation = function(series, xval) {
  var a;
  var self = this;

  var color = this.getColorForSeries_(series);

  var $lineDiv = $('<div/>').css({
    'width': '1px',
    'left': '3px',
    'background': 'black',
    'height': '100%',
    'position': 'absolute',
    // TODO(danvk): use border-color here for consistency?
    'background-color': color
  });

  var $infoDiv = $('#annotation-template').clone().removeAttr('id').css({
      'position': 'absolute',
      'border-color': color
    })
    .show();

  a = {
    xval: xval,
    series: series,
    lineDiv: $lineDiv.get(0),
    infoDiv: $infoDiv.get(0)
  };
  $.extend(a, this.defaultAnnotationProperties_);

  var that = this;

  $infoDiv.draggable({
    'start': function(event, ui) {
      $(this).css({'bottom': ''});
    },
    'drag': function(event, ui) {
      self.annotationWasDragged(a, event, ui);
    },
    'stop': function(event, ui) {
      $(this).css({'top': ''});
      self.updateAnnotationDivPositions();
    }
  });

  // TODO(danvk): use 'on' instead of 
  $infoDiv.delegate('.annotation-kill-button', 'click', function() {
    that.removeAnnotation(a);
    $(that).triggerHandler('annotationDeleted', a);
    $(that).triggerHandler('annotationsChanged', {});
  });

  $infoDiv.dblclick(function() {
    if (a.editable == true) return;
    a.editable = true;
    self.updateAnnotationInfo();
  });
  $infoDiv.delegate('.annotation-update', 'click', function() {
    self.extractUpdatedProperties_($infoDiv.get(0), a);
    a.editable = false;
    self.updateAnnotationInfo();
  });
  $infoDiv.delegate('.annotation-cancel', 'click', function() {
    a.editable = false;
    self.updateAnnotationInfo();
  });

  return a;
};

// Find the index of a point in a series.
// Returns a 2-element array, [row, col], which can be used with
// dygraph.getValue() to get the value at this point.
// Returns null if there's no match.
annotations.prototype.findPointIndex_ = function(series, xval) {
  var col = this.dygraph_.getLabels().indexOf(series);
  if (col == -1) return null;

  var lowIdx = 0, highIdx = this.dygraph_.numRows() - 1;
  while (lowIdx <= highIdx) {
    var idx = Math.floor((lowIdx + highIdx) / 2);
    var xAtIdx = this.dygraph_.getValue(idx, 0);
    if (xAtIdx == xval) {
      return [idx, col];
    } else if (xAtIdx < xval) {
      lowIdx = idx + 1;
    } else {
      highIdx = idx - 1;
    }
  }
  return null;
};

annotations.prototype.getColorForSeries_ = function(series) {
  var colors = this.dygraph_.getColors();
  var col = this.dygraph_.getLabels().indexOf(series);
  if (col == -1) return null;

  return colors[(col - 1) % colors.length];
};

// Moves a hairline's divs to the top of the z-ordering.
annotations.prototype.moveAnnotationToTop = function(a) {
  var div = this.dygraph_.graphDiv;
  $(a.infoDiv).appendTo(div);
  $(a.lineDiv).appendTo(div);

  var idx = this.annotations_.indexOf(a);
  this.annotations_.splice(idx, 1);
  this.annotations_.push(a);
};

// Positions existing hairline divs.
annotations.prototype.updateAnnotationDivPositions = function() {
  var layout = this.dygraph_.getArea();
  var div = this.dygraph_.graphDiv;
  var box = [layout.x + Dygraph.findPosX(div),
             layout.y + Dygraph.findPosY(div)];
  box.push(box[0] + layout.w);
  box.push(box[1] + layout.h);

  var g = this.dygraph_;

  var that = this;
  $.each(this.annotations_, function(idx, a) {
    // TODO(danvk): cache this information for each annotation
    var row_col = that.findPointIndex_(a.series, a.xval);
    var xy = g.toDomCoords(a.xval, g.getValue(row_col[0], row_col[1]));
    var x = xy[0], y = xy[1];

    var lineHeight = 6;

    $(a.lineDiv).css({
      'left': x + 'px',
      'top': (y - lineHeight) + 'px',
      'height': lineHeight + 'px'
    });
    $(a.infoDiv).css({
      'left': x + 'px',
      'bottom': (div.offsetHeight - (y - lineHeight)) + 'px'
    })  //.draggable("option", "containment", box);
  });
};

// Fills out the info div based on current coordinates.
annotations.prototype.updateAnnotationInfo = function() {
  var g = this.dygraph_;

  var that = this;
  var templateDiv = $('#annotation-template').get(0);
  var editableTemplateDiv = $('#annotation-editable-template').get(0);
  $.each(this.annotations_, function(idx, a) {
    var div = a.editable ? editableTemplateDiv : templateDiv;
    a.infoDiv.innerHTML = that.getTemplateHTML(div, a);
  });
};

// Fill out a div using the values in the annotation object.
// The div's html is expected to have text of the form "{{key}}"
annotations.prototype.getTemplateHTML = function(div, a) {
  var g = this.dygraph_;
  var row_col = this.findPointIndex_(a.series, a.xval);
  var row = row_col[0];
  var col = row_col[1];

  var yOptView = g.optionsViewForAxis_('y1');  // TODO: support secondary, too
  var xvf = g.getOptionForAxis('valueFormatter', 'x');

  var x = xvf(a.xval);
  var y = g.getOption('valueFormatter', a.series)(
      g.getValue(row, col), yOptView);
  var displayAnnotation = $.extend({}, a, {
    x: x,
    y: y
  });

  var html = div.innerHTML;
  for (var k in displayAnnotation) {
    var v = displayAnnotation[k];
    if (typeof(v) == 'object') continue;  // e.g. infoDiv or lineDiv
    html = html.replace(new RegExp('\{\{' + k + '\}\}', 'g'), v);
  }
  return html;
};

// Update the annotation object by looking for elements with a 'dg-ann-field'
// attribute. For example, <input type='text' dg-ann-field='text' /> will have
// its value placed in the 'text' attribute of the annotation.
annotations.prototype.extractUpdatedProperties_ = function(div, a) {
  $(div).find('[dg-ann-field]').each(function(idx, el) {
    var k = $(el).attr('dg-ann-field');
    var v = $(el).val();
    a[k] = v;
  });
};

// After a resize, the hairline divs can get dettached from the chart.
// This reattaches them.
annotations.prototype.attachAnnotationsToChart_ = function() {
  var div = this.dygraph_.graphDiv;
  $.each(this.annotations_, function(idx, a) {
    $([a.lineDiv, a.infoDiv]).appendTo(div);
  });
};

// Deletes a hairline and removes it from the chart.
annotations.prototype.removeAnnotation = function(a) {
  var idx = this.annotations_.indexOf(a);
  if (idx >= 0) {
    this.annotations_.splice(idx, 1);
    $([a.lineDiv, a.infoDiv]).remove();
  } else {
    Dygraph.warn('Tried to remove non-existent annotation.');
  }
};

annotations.prototype.didDrawChart = function(e) {
  var g = e.dygraph;

  // Early out in the (common) case of zero annotations.
  if (this.annotations_.length === 0) return;

  this.updateAnnotationDivPositions();
  this.attachAnnotationsToChart_();
  this.updateAnnotationInfo();
};

annotations.prototype.pointClick = function(e) {
  // Prevent any other behavior based on this click, e.g. creation of a hairline.
  e.preventDefault();

  this.annotations_.push(this.createAnnotation(e.point.name, e.point.xval));

  this.updateAnnotationDivPositions();
  this.updateAnnotationInfo();
  this.attachAnnotationsToChart_();

  $(this).triggerHandler('hairlineCreated', {
    // TODO
    // xFraction: xFraction
  });
  $(this).triggerHandler('annotationsChanged', {});
};

annotations.prototype.destroy = function() {
  this.detachLabels();
};


// Public API

/**
 * This is a restricted view of this.annotations_ which doesn't expose
 * implementation details like the handle divs.
 *
 * @typedef {
 *   xFraction: number,   // invariant across resize
 *   interpolated: bool   // alternative is to snap to closest
 * } PublicAnnotation
 */

/**
 * @return {!Array.<!PublicAnnotation>} The current set of annotations, ordered
 *     from back to front.
 */
annotations.prototype.get = function() {
  var result = [];
  for (var i = 0; i < this.annotations_.length; i++) {
    var h = this.annotations_[i];
    result.push({
      xFraction: h.xFraction,
      interpolated: h.interpolated
    });
  }
  return result;
};

/**
 * Calling this will result in a annotationsChanged event being triggered, no
 * matter whether it consists of additions, deletions, moves or no changes at
 * all.
 *
 * @param {!Array.<!PublicAnnotation>} annotations The new set of annotations,
 *     ordered from back to front.
 */
annotations.prototype.set = function(annotations) {
  // Re-use divs from the old annotations array so far as we can.
  // They're already correctly z-ordered.
  var anyCreated = false;
  for (var i = 0; i < annotations.length; i++) {
    var h = annotations[i];

    if (this.annotations_.length > i) {
      this.annotations_[i].xFraction = h.xFraction;
      this.annotations_[i].interpolated = h.interpolated;
    } else {
      // TODO(danvk): pass in |interpolated| value.
      this.annotations_.push(this.createAnnotation(h.xFraction));
      anyCreated = true;
    }
  }

  // If there are any remaining annotations, destroy them.
  while (annotations.length < this.annotations_.length) {
    this.removeAnnotation(this.annotations_[annotations.length]);
  }

  this.updateAnnotationDivPositions();
  this.updateAnnotationInfo();
  if (anyCreated) {
    this.attachAnnotationsToChart_();
  }

  $(this).triggerHandler('annotationsChanged', {});
};

return annotations;

})();
