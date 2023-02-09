"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
/**
 * @license
 * Copyright 2013 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licenced: https://opensource.org/licenses/MIT
 *
 * Note: This plugin requires jQuery and jQuery UI Draggable.
 *
 * See high-level documentation at ../../docs/hairlines-annotations.pdf
 */

/* loader wrapper to allow browser use and ES6 imports */
(function _extras_superAnnotations_wrapper() {
  'use strict';

  var Dygraph;
  if (window.Dygraph) {
    Dygraph = window.Dygraph;
  } else if (typeof module !== 'undefined') {
    Dygraph = require('../dygraph');
    if (typeof Dygraph.NAME === 'undefined' && typeof Dygraph["default"] !== 'undefined') Dygraph = Dygraph["default"];
  }
  /* end of loader wrapper header */

  Dygraph.Plugins.SuperAnnotations = function _extras_superAnnotations_closure() {
    "use strict";

    /**
     * These are just the basic requirements -- annotations can have whatever other
     * properties the code that displays them wants them to have.
     *
     * @typedef {
     *   xval:  number,      // x-value (i.e. millis or a raw number)
     *   series: string,     // series name
     *   yFrac: ?number,     // y-positioning. Default is a few px above the point.
     *   lineDiv: !Element   // vertical div connecting point to info div.
     *   infoDiv: !Element   // div containing info about the annotation.
     * } Annotation
     */
    var annotations = function annotations(opt_options) {
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
    annotations.prototype.toString = function toString() {
      return "SuperAnnotations Plugin";
    };
    annotations.prototype.activate = function activate(g) {
      this.dygraph_ = g;
      this.annotations_ = [];
      return {
        didDrawChart: this.didDrawChart,
        pointClick: this.pointClick // TODO(danvk): implement in dygraphs
      };
    };

    annotations.prototype.detachLabels = function detachLabels() {
      for (var i = 0; i < this.annotations_.length; i++) {
        var a = this.annotations_[i];
        $(a.lineDiv).remove();
        $(a.infoDiv).remove();
        this.annotations_[i] = null;
      }
      this.annotations_ = [];
    };
    annotations.prototype.annotationWasDragged = function annotationWasDragged(a, event, ui) {
      var g = this.dygraph_;
      var area = g.getArea();
      var oldYFrac = a.yFrac;
      var infoDiv = a.infoDiv;
      var newYFrac = (infoDiv.offsetTop + infoDiv.offsetHeight - area.y) / area.h;
      if (newYFrac == oldYFrac) return;
      a.yFrac = newYFrac;
      this.moveAnnotationToTop(a);
      this.updateAnnotationDivPositions();
      this.updateAnnotationInfo();
      $(this).triggerHandler('annotationMoved', {
        annotation: a,
        oldYFrac: oldYFrac,
        newYFrac: a.yFrac
      });
      $(this).triggerHandler('annotationsChanged', {});
    };
    annotations.prototype.makeAnnotationEditable = function makeAnnotationEditable(a) {
      if (a.editable == true) return;
      this.moveAnnotationToTop(a);

      // Note: we have to fill out the HTML ourselves because
      // updateAnnotationInfo() won't touch editable annotations.
      a.editable = true;
      var editableTemplateDiv = $('#annotation-editable-template').get(0);
      a.infoDiv.innerHTML = this.getTemplateHTML(editableTemplateDiv, a);
      $(a.infoDiv).toggleClass('editable', !!a.editable);
      $(this).triggerHandler('beganEditAnnotation', a);
    };

    // This creates the hairline object and returns it.
    // It does not position it and does not attach it to the chart.
    annotations.prototype.createAnnotation = function createAnnotation(a) {
      var self = this;
      var color = this.getColorForSeries_(a.series);
      var $lineDiv = $('<div/>').css({
        'width': '1px',
        'left': '3px',
        'background': 'black',
        'height': '100%',
        'position': 'absolute',
        // TODO(danvk): use border-color here for consistency?
        'background-color': color,
        'z-index': 10
      }).addClass('dygraph-annotation-line');
      var $infoDiv = $('#annotation-template').clone().removeAttr('id').css({
        'position': 'absolute',
        'border-color': color,
        'z-index': 10
      }).show();
      $.extend(a, {
        lineDiv: $lineDiv.get(0),
        infoDiv: $infoDiv.get(0)
      });
      var that = this;
      $infoDiv.draggable({
        'start': function draggableStart(event, ui) {
          $(this).css({
            'bottom': ''
          });
          a.isDragging = true;
        },
        'drag': function draggableDrag(event, ui) {
          self.annotationWasDragged(a, event, ui);
        },
        'stop': function draggableStop(event, ui) {
          $(this).css({
            'top': ''
          });
          a.isDragging = false;
          self.updateAnnotationDivPositions();
        },
        'axis': 'y',
        'containment': 'parent'
      });

      // TODO(danvk): use 'on' instead of delegate/dblclick
      $infoDiv.on('click', '.annotation-kill-button', function clickKill() {
        that.removeAnnotation(a);
        $(that).triggerHandler('annotationDeleted', a);
        $(that).triggerHandler('annotationsChanged', {});
      });
      $infoDiv.on('dblclick', function dblclick() {
        that.makeAnnotationEditable(a);
      });
      $infoDiv.on('click', '.annotation-update', function clickUpdate() {
        self.extractUpdatedProperties_($infoDiv.get(0), a);
        a.editable = false;
        self.updateAnnotationInfo();
        $(that).triggerHandler('annotationEdited', a);
        $(that).triggerHandler('annotationsChanged', {});
      });
      $infoDiv.on('click', '.annotation-cancel', function clickCancel() {
        a.editable = false;
        self.updateAnnotationInfo();
        $(that).triggerHandler('cancelEditAnnotation', a);
      });
      return a;
    };

    // Find the index of a point in a series.
    // Returns a 2-element array, [row, col], which can be used with
    // dygraph.getValue() to get the value at this point.
    // Returns null if there's no match.
    annotations.prototype.findPointIndex_ = function findPointIndex_(series, xval) {
      var col = this.dygraph_.getLabels().indexOf(series);
      if (col == -1) return null;
      var lowIdx = 0,
        highIdx = this.dygraph_.numRows() - 1;
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
    annotations.prototype.getColorForSeries_ = function getColorForSeries_(series) {
      var colors = this.dygraph_.getColors();
      var col = this.dygraph_.getLabels().indexOf(series);
      if (col == -1) return null;
      return colors[(col - 1) % colors.length];
    };

    // Moves a hairline's divs to the top of the z-ordering.
    annotations.prototype.moveAnnotationToTop = function moveAnnotationToTop(a) {
      var div = this.dygraph_.graphDiv;
      $(a.infoDiv).appendTo(div);
      $(a.lineDiv).appendTo(div);
      var idx = this.annotations_.indexOf(a);
      this.annotations_.splice(idx, 1);
      this.annotations_.push(a);
    };

    // Positions existing hairline divs.
    annotations.prototype.updateAnnotationDivPositions = function updateAnnotationDivPositions() {
      var layout = this.dygraph_.getArea();
      var chartLeft = layout.x,
        chartRight = layout.x + layout.w;
      var chartTop = layout.y,
        chartBottom = layout.y + layout.h;
      var div = this.dygraph_.graphDiv;
      var pos = Dygraph.findPos(div);
      var box = [layout.x + pos.x, layout.y + pos.y];
      box.push(box[0] + layout.w);
      box.push(box[1] + layout.h);
      var g = this.dygraph_;
      var that = this;
      $.each(this.annotations_, function annotationsLoop_(idx, a) {
        var row_col = that.findPointIndex_(a.series, a.xval);
        if (row_col == null) {
          $([a.lineDiv, a.infoDiv]).hide();
          return;
        } else {
          // TODO(danvk): only do this if they're invisible?
          $([a.lineDiv, a.infoDiv]).show();
        }
        var xy = g.toDomCoords(a.xval, g.getValue(row_col[0], row_col[1]));
        var x = xy[0],
          pointY = xy[1];
        var lineHeight = 6; // TODO(danvk): option?

        var y = pointY;
        if (a.yFrac !== undefined) {
          y = layout.y + layout.h * a.yFrac;
        } else {
          y -= lineHeight;
        }
        var lineHeight = y < pointY ? pointY - y : y - pointY - a.infoDiv.offsetHeight;
        $(a.lineDiv).css({
          'left': x + 'px',
          'top': Math.min(y, pointY) + 'px',
          'height': lineHeight + 'px'
        });
        $(a.infoDiv).css({
          'left': x + 'px'
        });
        if (!a.isDragging) {
          // jQuery UI draggable likes to set 'top', whereas superannotations sets
          // 'bottom'. Setting both will make the annotation grow and contract as
          // the user drags it, which looks bad.
          $(a.infoDiv).css({
            'bottom': div.offsetHeight - y + 'px'
          }); //.draggable("option", "containment", box);

          var visible = x >= chartLeft && x <= chartRight && pointY >= chartTop && pointY <= chartBottom;
          $([a.infoDiv, a.lineDiv]).toggle(visible);
        }
      });
    };

    // Fills out the info div based on current coordinates.
    annotations.prototype.updateAnnotationInfo = function updateAnnotationInfo() {
      var g = this.dygraph_;
      var that = this;
      var templateDiv = $('#annotation-template').get(0);
      $.each(this.annotations_, function annotationsLoop_(idx, a) {
        // We should never update an editable div -- doing so may kill unsaved
        // edits to an annotation.
        $(a.infoDiv).toggleClass('editable', !!a.editable);
        if (a.editable) return;
        a.infoDiv.innerHTML = that.getTemplateHTML(templateDiv, a);
      });
    };

    /**
     * @param {!Annotation} a Internal annotation
     * @return {!PublicAnnotation} a view of the annotation for the public API.
     */
    annotations.prototype.createPublicAnnotation_ = function createPublicAnnotation_(a, opt_props) {
      var displayAnnotation = $.extend({}, a, opt_props);
      delete displayAnnotation['infoDiv'];
      delete displayAnnotation['lineDiv'];
      delete displayAnnotation['isDragging'];
      delete displayAnnotation['editable'];
      return displayAnnotation;
    };

    // Fill out a div using the values in the annotation object.
    // The div's html is expected to have text of the form "{{key}}"
    annotations.prototype.getTemplateHTML = function getTemplateHTML(div, a) {
      var g = this.dygraph_;
      var row_col = this.findPointIndex_(a.series, a.xval);
      if (row_col == null) return; // perhaps it's no longer a real point?
      var row = row_col[0];
      var col = row_col[1];
      var yOptView = g.optionsViewForAxis_('y1'); // TODO: support secondary, too
      var xOptView = g.optionsViewForAxis_('x');
      var xvf = g.getOptionForAxis('valueFormatter', 'x');
      var x = xvf.call(g, a.xval, xOptView);
      var y = g.getOption('valueFormatter', a.series).call(g, g.getValue(row, col), yOptView);
      var displayAnnotation = this.createPublicAnnotation_(a, {
        x: x,
        y: y
      });
      var html = div.innerHTML;
      for (var k in displayAnnotation) {
        var v = displayAnnotation[k];
        if (_typeof(v) == 'object') continue; // e.g. infoDiv or lineDiv
        html = html.replace(new RegExp('\{\{' + k + '\}\}', 'g'), v);
      }
      return html;
    };

    // Update the annotation object by looking for elements with a 'dg-ann-field'
    // attribute. For example, <input type='text' dg-ann-field='text' /> will have
    // its value placed in the 'text' attribute of the annotation.
    annotations.prototype.extractUpdatedProperties_ = function extractUpdatedProperties_(div, a) {
      $(div).find('[dg-ann-field]').each(function fieldLoop_(idx, el) {
        var k = $(el).attr('dg-ann-field');
        var v = $(el).val();
        a[k] = v;
      });
    };

    // After a resize, the hairline divs can get dettached from the chart.
    // This reattaches them.
    annotations.prototype.attachAnnotationsToChart_ = function attachAnnotationsToChart_() {
      var div = this.dygraph_.graphDiv;
      $.each(this.annotations_, function annotationsLoop_(idx, a) {
        // Re-attaching an editable div to the DOM can clear its focus.
        // This makes typing really difficult!
        if (a.editable) return;
        $([a.lineDiv, a.infoDiv]).appendTo(div);
      });
    };

    // Deletes a hairline and removes it from the chart.
    annotations.prototype.removeAnnotation = function removeAnnotation(a) {
      var idx = this.annotations_.indexOf(a);
      if (idx >= 0) {
        this.annotations_.splice(idx, 1);
        $([a.lineDiv, a.infoDiv]).remove();
      } else {
        Dygraph.warn('Tried to remove non-existent annotation.');
      }
    };
    annotations.prototype.didDrawChart = function didDrawChart(e) {
      var g = e.dygraph;

      // Early out in the (common) case of zero annotations.
      if (this.annotations_.length === 0) return;
      this.updateAnnotationDivPositions();
      this.attachAnnotationsToChart_();
      this.updateAnnotationInfo();
    };
    annotations.prototype.pointClick = function pointClick(e) {
      // Prevent any other behavior based on this click, e.g. creation of a hairline.
      e.preventDefault();
      var a = $.extend({}, this.defaultAnnotationProperties_, {
        series: e.point.name,
        xval: e.point.xval
      });
      this.annotations_.push(this.createAnnotation(a));
      this.updateAnnotationDivPositions();
      this.updateAnnotationInfo();
      this.attachAnnotationsToChart_();
      $(this).triggerHandler('annotationCreated', a);
      $(this).triggerHandler('annotationsChanged', {});

      // Annotations should begin life editable.
      this.makeAnnotationEditable(a);
    };
    annotations.prototype.destroy = function destroy() {
      this.detachLabels();
    };

    // Public API

    /**
     * This is a restricted view of this.annotations_ which doesn't expose
     * implementation details like the line / info divs.
     *
     * @typedef {
     *   xval:  number,      // x-value (i.e. millis or a raw number)
     *   series: string,     // series name
     * } PublicAnnotation
     */

    /**
     * @return {!Array.<!PublicAnnotation>} The current set of annotations, ordered
     *     from back to front.
     */
    annotations.prototype.get = function get() {
      var result = [];
      for (var i = 0; i < this.annotations_.length; i++) {
        result.push(this.createPublicAnnotation_(this.annotations_[i]));
      }
      return result;
    };

    /**
     * Calling this will result in an annotationsChanged event being triggered, no
     * matter whether it consists of additions, deletions, moves or no changes at
     * all.
     *
     * @param {!Array.<!PublicAnnotation>} annotations The new set of annotations,
     *     ordered from back to front.
     */
    annotations.prototype.set = function set(annotations) {
      // Re-use divs from the old annotations array so far as we can.
      // They're already correctly z-ordered.
      var anyCreated = false;
      for (var i = 0; i < annotations.length; i++) {
        var a = annotations[i];
        if (this.annotations_.length > i) {
          // Only the divs need to be preserved.
          var oldA = this.annotations_[i];
          this.annotations_[i] = $.extend({
            infoDiv: oldA.infoDiv,
            lineDiv: oldA.lineDiv
          }, a);
        } else {
          this.annotations_.push(this.createAnnotation(a));
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
  }();

  /* loader wrapper */
  Dygraph._required('dygraphs/src/extras/super-annotations.js', /* exports */{});
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX3N1cGVyQW5ub3RhdGlvbnNfd3JhcHBlciIsIkR5Z3JhcGgiLCJ3aW5kb3ciLCJtb2R1bGUiLCJyZXF1aXJlIiwiTkFNRSIsIlBsdWdpbnMiLCJTdXBlckFubm90YXRpb25zIiwiX2V4dHJhc19zdXBlckFubm90YXRpb25zX2Nsb3N1cmUiLCJhbm5vdGF0aW9ucyIsIm9wdF9vcHRpb25zIiwiYW5ub3RhdGlvbnNfIiwibGFzdFdpZHRoXyIsImxhc3RIZWlnaHQiLCJkeWdyYXBoXyIsImRlZmF1bHRBbm5vdGF0aW9uUHJvcGVydGllc18iLCIkIiwiZXh0ZW5kIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJhY3RpdmF0ZSIsImciLCJkaWREcmF3Q2hhcnQiLCJwb2ludENsaWNrIiwiZGV0YWNoTGFiZWxzIiwiaSIsImxlbmd0aCIsImEiLCJsaW5lRGl2IiwicmVtb3ZlIiwiaW5mb0RpdiIsImFubm90YXRpb25XYXNEcmFnZ2VkIiwiZXZlbnQiLCJ1aSIsImFyZWEiLCJnZXRBcmVhIiwib2xkWUZyYWMiLCJ5RnJhYyIsIm5ld1lGcmFjIiwib2Zmc2V0VG9wIiwib2Zmc2V0SGVpZ2h0IiwieSIsImgiLCJtb3ZlQW5ub3RhdGlvblRvVG9wIiwidXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucyIsInVwZGF0ZUFubm90YXRpb25JbmZvIiwidHJpZ2dlckhhbmRsZXIiLCJhbm5vdGF0aW9uIiwibWFrZUFubm90YXRpb25FZGl0YWJsZSIsImVkaXRhYmxlIiwiZWRpdGFibGVUZW1wbGF0ZURpdiIsImdldCIsImlubmVySFRNTCIsImdldFRlbXBsYXRlSFRNTCIsInRvZ2dsZUNsYXNzIiwiY3JlYXRlQW5ub3RhdGlvbiIsInNlbGYiLCJjb2xvciIsImdldENvbG9yRm9yU2VyaWVzXyIsInNlcmllcyIsIiRsaW5lRGl2IiwiY3NzIiwiYWRkQ2xhc3MiLCIkaW5mb0RpdiIsImNsb25lIiwicmVtb3ZlQXR0ciIsInNob3ciLCJ0aGF0IiwiZHJhZ2dhYmxlIiwiZHJhZ2dhYmxlU3RhcnQiLCJpc0RyYWdnaW5nIiwiZHJhZ2dhYmxlRHJhZyIsImRyYWdnYWJsZVN0b3AiLCJvbiIsImNsaWNrS2lsbCIsInJlbW92ZUFubm90YXRpb24iLCJkYmxjbGljayIsImNsaWNrVXBkYXRlIiwiZXh0cmFjdFVwZGF0ZWRQcm9wZXJ0aWVzXyIsImNsaWNrQ2FuY2VsIiwiZmluZFBvaW50SW5kZXhfIiwieHZhbCIsImNvbCIsImdldExhYmVscyIsImluZGV4T2YiLCJsb3dJZHgiLCJoaWdoSWR4IiwibnVtUm93cyIsImlkeCIsIk1hdGgiLCJmbG9vciIsInhBdElkeCIsImdldFZhbHVlIiwiY29sb3JzIiwiZ2V0Q29sb3JzIiwiZGl2IiwiZ3JhcGhEaXYiLCJhcHBlbmRUbyIsInNwbGljZSIsInB1c2giLCJsYXlvdXQiLCJjaGFydExlZnQiLCJ4IiwiY2hhcnRSaWdodCIsInciLCJjaGFydFRvcCIsImNoYXJ0Qm90dG9tIiwicG9zIiwiZmluZFBvcyIsImJveCIsImVhY2giLCJhbm5vdGF0aW9uc0xvb3BfIiwicm93X2NvbCIsImhpZGUiLCJ4eSIsInRvRG9tQ29vcmRzIiwicG9pbnRZIiwibGluZUhlaWdodCIsInVuZGVmaW5lZCIsIm1pbiIsInZpc2libGUiLCJ0b2dnbGUiLCJ0ZW1wbGF0ZURpdiIsImNyZWF0ZVB1YmxpY0Fubm90YXRpb25fIiwib3B0X3Byb3BzIiwiZGlzcGxheUFubm90YXRpb24iLCJyb3ciLCJ5T3B0VmlldyIsIm9wdGlvbnNWaWV3Rm9yQXhpc18iLCJ4T3B0VmlldyIsInh2ZiIsImdldE9wdGlvbkZvckF4aXMiLCJjYWxsIiwiZ2V0T3B0aW9uIiwiaHRtbCIsImsiLCJ2IiwicmVwbGFjZSIsIlJlZ0V4cCIsImZpbmQiLCJmaWVsZExvb3BfIiwiZWwiLCJhdHRyIiwidmFsIiwiYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XyIsIndhcm4iLCJlIiwiZHlncmFwaCIsInByZXZlbnREZWZhdWx0IiwicG9pbnQiLCJuYW1lIiwiZGVzdHJveSIsInJlc3VsdCIsInNldCIsImFueUNyZWF0ZWQiLCJvbGRBIiwiX3JlcXVpcmVkIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4dHJhcy9zdXBlci1hbm5vdGF0aW9ucy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxMyBEYW4gVmFuZGVya2FtIChkYW52ZGtAZ21haWwuY29tKVxuICogTUlULWxpY2VuY2VkOiBodHRwczovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICpcbiAqIE5vdGU6IFRoaXMgcGx1Z2luIHJlcXVpcmVzIGpRdWVyeSBhbmQgalF1ZXJ5IFVJIERyYWdnYWJsZS5cbiAqXG4gKiBTZWUgaGlnaC1sZXZlbCBkb2N1bWVudGF0aW9uIGF0IC4uLy4uL2RvY3MvaGFpcmxpbmVzLWFubm90YXRpb25zLnBkZlxuICovXG5cbi8qIGxvYWRlciB3cmFwcGVyIHRvIGFsbG93IGJyb3dzZXIgdXNlIGFuZCBFUzYgaW1wb3J0cyAqL1xuKGZ1bmN0aW9uIF9leHRyYXNfc3VwZXJBbm5vdGF0aW9uc193cmFwcGVyKCkge1xuJ3VzZSBzdHJpY3QnO1xudmFyIER5Z3JhcGg7XG5pZiAod2luZG93LkR5Z3JhcGgpIHtcbiAgRHlncmFwaCA9IHdpbmRvdy5EeWdyYXBoO1xufSBlbHNlIGlmICh0eXBlb2YobW9kdWxlKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgRHlncmFwaCA9IHJlcXVpcmUoJy4uL2R5Z3JhcGgnKTtcbiAgaWYgKHR5cGVvZihEeWdyYXBoLk5BTUUpID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YoRHlncmFwaC5kZWZhdWx0KSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgRHlncmFwaCA9IER5Z3JhcGguZGVmYXVsdDtcbn1cbi8qIGVuZCBvZiBsb2FkZXIgd3JhcHBlciBoZWFkZXIgKi9cblxuRHlncmFwaC5QbHVnaW5zLlN1cGVyQW5ub3RhdGlvbnMgPSAoZnVuY3Rpb24gX2V4dHJhc19zdXBlckFubm90YXRpb25zX2Nsb3N1cmUoKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFRoZXNlIGFyZSBqdXN0IHRoZSBiYXNpYyByZXF1aXJlbWVudHMgLS0gYW5ub3RhdGlvbnMgY2FuIGhhdmUgd2hhdGV2ZXIgb3RoZXJcbiAqIHByb3BlcnRpZXMgdGhlIGNvZGUgdGhhdCBkaXNwbGF5cyB0aGVtIHdhbnRzIHRoZW0gdG8gaGF2ZS5cbiAqXG4gKiBAdHlwZWRlZiB7XG4gKiAgIHh2YWw6ICBudW1iZXIsICAgICAgLy8geC12YWx1ZSAoaS5lLiBtaWxsaXMgb3IgYSByYXcgbnVtYmVyKVxuICogICBzZXJpZXM6IHN0cmluZywgICAgIC8vIHNlcmllcyBuYW1lXG4gKiAgIHlGcmFjOiA/bnVtYmVyLCAgICAgLy8geS1wb3NpdGlvbmluZy4gRGVmYXVsdCBpcyBhIGZldyBweCBhYm92ZSB0aGUgcG9pbnQuXG4gKiAgIGxpbmVEaXY6ICFFbGVtZW50ICAgLy8gdmVydGljYWwgZGl2IGNvbm5lY3RpbmcgcG9pbnQgdG8gaW5mbyBkaXYuXG4gKiAgIGluZm9EaXY6ICFFbGVtZW50ICAgLy8gZGl2IGNvbnRhaW5pbmcgaW5mbyBhYm91dCB0aGUgYW5ub3RhdGlvbi5cbiAqIH0gQW5ub3RhdGlvblxuICovXG5cbnZhciBhbm5vdGF0aW9ucyA9IGZ1bmN0aW9uIGFubm90YXRpb25zKG9wdF9vcHRpb25zKSB7XG4gIC8qIEB0eXBlIHshQXJyYXkuPCFBbm5vdGF0aW9uPn0gKi9cbiAgdGhpcy5hbm5vdGF0aW9uc18gPSBbXTtcbiAgLy8gVXNlZCB0byBkZXRlY3QgcmVzaXplcyAod2hpY2ggcmVxdWlyZSB0aGUgZGl2cyB0byBiZSByZXBvc2l0aW9uZWQpLlxuICB0aGlzLmxhc3RXaWR0aF8gPSAtMTtcbiAgdGhpcy5sYXN0SGVpZ2h0ID0gLTE7XG4gIHRoaXMuZHlncmFwaF8gPSBudWxsO1xuXG4gIG9wdF9vcHRpb25zID0gb3B0X29wdGlvbnMgfHwge307XG4gIHRoaXMuZGVmYXVsdEFubm90YXRpb25Qcm9wZXJ0aWVzXyA9ICQuZXh0ZW5kKHtcbiAgICAndGV4dCc6ICdEZXNjcmlwdGlvbidcbiAgfSwgb3B0X29wdGlvbnNbJ2RlZmF1bHRBbm5vdGF0aW9uUHJvcGVydGllcyddKTtcbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICByZXR1cm4gXCJTdXBlckFubm90YXRpb25zIFBsdWdpblwiO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gYWN0aXZhdGUoZykge1xuICB0aGlzLmR5Z3JhcGhfID0gZztcbiAgdGhpcy5hbm5vdGF0aW9uc18gPSBbXTtcblxuICByZXR1cm4ge1xuICAgIGRpZERyYXdDaGFydDogdGhpcy5kaWREcmF3Q2hhcnQsXG4gICAgcG9pbnRDbGljazogdGhpcy5wb2ludENsaWNrICAvLyBUT0RPKGRhbnZrKTogaW1wbGVtZW50IGluIGR5Z3JhcGhzXG4gIH07XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZGV0YWNoTGFiZWxzID0gZnVuY3Rpb24gZGV0YWNoTGFiZWxzKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYW5ub3RhdGlvbnNfLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGEgPSB0aGlzLmFubm90YXRpb25zX1tpXTtcbiAgICAkKGEubGluZURpdikucmVtb3ZlKCk7XG4gICAgJChhLmluZm9EaXYpLnJlbW92ZSgpO1xuICAgIHRoaXMuYW5ub3RhdGlvbnNfW2ldID0gbnVsbDtcbiAgfVxuICB0aGlzLmFubm90YXRpb25zXyA9IFtdO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmFubm90YXRpb25XYXNEcmFnZ2VkID0gZnVuY3Rpb24gYW5ub3RhdGlvbldhc0RyYWdnZWQoYSwgZXZlbnQsIHVpKSB7XG4gIHZhciBnID0gdGhpcy5keWdyYXBoXztcbiAgdmFyIGFyZWEgPSBnLmdldEFyZWEoKTtcbiAgdmFyIG9sZFlGcmFjID0gYS55RnJhYztcblxuICB2YXIgaW5mb0RpdiA9IGEuaW5mb0RpdjtcbiAgdmFyIG5ld1lGcmFjID0gKChpbmZvRGl2Lm9mZnNldFRvcCArIGluZm9EaXYub2Zmc2V0SGVpZ2h0KSAtIGFyZWEueSkgLyBhcmVhLmg7XG4gIGlmIChuZXdZRnJhYyA9PSBvbGRZRnJhYykgcmV0dXJuO1xuXG4gIGEueUZyYWMgPSBuZXdZRnJhYztcblxuICB0aGlzLm1vdmVBbm5vdGF0aW9uVG9Ub3AoYSk7XG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25Nb3ZlZCcsIHtcbiAgICBhbm5vdGF0aW9uOiBhLFxuICAgIG9sZFlGcmFjOiBvbGRZRnJhYyxcbiAgICBuZXdZRnJhYzogYS55RnJhY1xuICB9KTtcbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbnNDaGFuZ2VkJywge30pO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLm1ha2VBbm5vdGF0aW9uRWRpdGFibGUgPSBmdW5jdGlvbiBtYWtlQW5ub3RhdGlvbkVkaXRhYmxlKGEpIHtcbiAgaWYgKGEuZWRpdGFibGUgPT0gdHJ1ZSkgcmV0dXJuO1xuICB0aGlzLm1vdmVBbm5vdGF0aW9uVG9Ub3AoYSk7XG5cbiAgLy8gTm90ZTogd2UgaGF2ZSB0byBmaWxsIG91dCB0aGUgSFRNTCBvdXJzZWx2ZXMgYmVjYXVzZVxuICAvLyB1cGRhdGVBbm5vdGF0aW9uSW5mbygpIHdvbid0IHRvdWNoIGVkaXRhYmxlIGFubm90YXRpb25zLlxuICBhLmVkaXRhYmxlID0gdHJ1ZTtcbiAgdmFyIGVkaXRhYmxlVGVtcGxhdGVEaXYgPSAkKCcjYW5ub3RhdGlvbi1lZGl0YWJsZS10ZW1wbGF0ZScpLmdldCgwKTtcbiAgYS5pbmZvRGl2LmlubmVySFRNTCA9IHRoaXMuZ2V0VGVtcGxhdGVIVE1MKGVkaXRhYmxlVGVtcGxhdGVEaXYsIGEpO1xuICAkKGEuaW5mb0RpdikudG9nZ2xlQ2xhc3MoJ2VkaXRhYmxlJywgISFhLmVkaXRhYmxlKTtcbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYmVnYW5FZGl0QW5ub3RhdGlvbicsIGEpO1xufTtcblxuLy8gVGhpcyBjcmVhdGVzIHRoZSBoYWlybGluZSBvYmplY3QgYW5kIHJldHVybnMgaXQuXG4vLyBJdCBkb2VzIG5vdCBwb3NpdGlvbiBpdCBhbmQgZG9lcyBub3QgYXR0YWNoIGl0IHRvIHRoZSBjaGFydC5cbmFubm90YXRpb25zLnByb3RvdHlwZS5jcmVhdGVBbm5vdGF0aW9uID0gZnVuY3Rpb24gY3JlYXRlQW5ub3RhdGlvbihhKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgY29sb3IgPSB0aGlzLmdldENvbG9yRm9yU2VyaWVzXyhhLnNlcmllcyk7XG5cbiAgdmFyICRsaW5lRGl2ID0gJCgnPGRpdi8+JykuY3NzKHtcbiAgICAnd2lkdGgnOiAnMXB4JyxcbiAgICAnbGVmdCc6ICczcHgnLFxuICAgICdiYWNrZ3JvdW5kJzogJ2JsYWNrJyxcbiAgICAnaGVpZ2h0JzogJzEwMCUnLFxuICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXG4gICAgLy8gVE9ETyhkYW52ayk6IHVzZSBib3JkZXItY29sb3IgaGVyZSBmb3IgY29uc2lzdGVuY3k/XG4gICAgJ2JhY2tncm91bmQtY29sb3InOiBjb2xvcixcbiAgICAnei1pbmRleCc6IDEwXG4gIH0pLmFkZENsYXNzKCdkeWdyYXBoLWFubm90YXRpb24tbGluZScpO1xuXG4gIHZhciAkaW5mb0RpdiA9ICQoJyNhbm5vdGF0aW9uLXRlbXBsYXRlJykuY2xvbmUoKS5yZW1vdmVBdHRyKCdpZCcpLmNzcyh7XG4gICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxuICAgICAgJ2JvcmRlci1jb2xvcic6IGNvbG9yLFxuICAgICAgJ3otaW5kZXgnOiAxMFxuICAgIH0pXG4gICAgLnNob3coKTtcblxuICAkLmV4dGVuZChhLCB7XG4gICAgbGluZURpdjogJGxpbmVEaXYuZ2V0KDApLFxuICAgIGluZm9EaXY6ICRpbmZvRGl2LmdldCgwKVxuICB9KTtcblxuICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgJGluZm9EaXYuZHJhZ2dhYmxlKHtcbiAgICAnc3RhcnQnOiBmdW5jdGlvbiBkcmFnZ2FibGVTdGFydChldmVudCwgdWkpIHtcbiAgICAgICQodGhpcykuY3NzKHsnYm90dG9tJzogJyd9KTtcbiAgICAgIGEuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgfSxcbiAgICAnZHJhZyc6IGZ1bmN0aW9uIGRyYWdnYWJsZURyYWcoZXZlbnQsIHVpKSB7XG4gICAgICBzZWxmLmFubm90YXRpb25XYXNEcmFnZ2VkKGEsIGV2ZW50LCB1aSk7XG4gICAgfSxcbiAgICAnc3RvcCc6IGZ1bmN0aW9uIGRyYWdnYWJsZVN0b3AoZXZlbnQsIHVpKSB7XG4gICAgICAkKHRoaXMpLmNzcyh7J3RvcCc6ICcnfSk7XG4gICAgICBhLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgIHNlbGYudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpO1xuICAgIH0sXG4gICAgJ2F4aXMnOiAneScsXG4gICAgJ2NvbnRhaW5tZW50JzogJ3BhcmVudCdcbiAgfSk7XG5cbiAgLy8gVE9ETyhkYW52ayk6IHVzZSAnb24nIGluc3RlYWQgb2YgZGVsZWdhdGUvZGJsY2xpY2tcbiAgJGluZm9EaXYub24oJ2NsaWNrJywgJy5hbm5vdGF0aW9uLWtpbGwtYnV0dG9uJywgZnVuY3Rpb24gY2xpY2tLaWxsKCkge1xuICAgIHRoYXQucmVtb3ZlQW5ub3RhdGlvbihhKTtcbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uRGVsZXRlZCcsIGEpO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25zQ2hhbmdlZCcsIHt9KTtcbiAgfSk7XG5cbiAgJGluZm9EaXYub24oJ2RibGNsaWNrJywgZnVuY3Rpb24gZGJsY2xpY2soKSB7XG4gICAgdGhhdC5tYWtlQW5ub3RhdGlvbkVkaXRhYmxlKGEpO1xuICB9KTtcbiAgJGluZm9EaXYub24oJ2NsaWNrJywgJy5hbm5vdGF0aW9uLXVwZGF0ZScsIGZ1bmN0aW9uIGNsaWNrVXBkYXRlKCkge1xuICAgIHNlbGYuZXh0cmFjdFVwZGF0ZWRQcm9wZXJ0aWVzXygkaW5mb0Rpdi5nZXQoMCksIGEpO1xuICAgIGEuZWRpdGFibGUgPSBmYWxzZTtcbiAgICBzZWxmLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbkVkaXRlZCcsIGEpO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25zQ2hhbmdlZCcsIHt9KTtcbiAgfSk7XG4gICRpbmZvRGl2Lm9uKCdjbGljaycsICcuYW5ub3RhdGlvbi1jYW5jZWwnLCBmdW5jdGlvbiBjbGlja0NhbmNlbCgpIHtcbiAgICBhLmVkaXRhYmxlID0gZmFsc2U7XG4gICAgc2VsZi51cGRhdGVBbm5vdGF0aW9uSW5mbygpO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2NhbmNlbEVkaXRBbm5vdGF0aW9uJywgYSk7XG4gIH0pO1xuXG4gIHJldHVybiBhO1xufTtcblxuLy8gRmluZCB0aGUgaW5kZXggb2YgYSBwb2ludCBpbiBhIHNlcmllcy5cbi8vIFJldHVybnMgYSAyLWVsZW1lbnQgYXJyYXksIFtyb3csIGNvbF0sIHdoaWNoIGNhbiBiZSB1c2VkIHdpdGhcbi8vIGR5Z3JhcGguZ2V0VmFsdWUoKSB0byBnZXQgdGhlIHZhbHVlIGF0IHRoaXMgcG9pbnQuXG4vLyBSZXR1cm5zIG51bGwgaWYgdGhlcmUncyBubyBtYXRjaC5cbmFubm90YXRpb25zLnByb3RvdHlwZS5maW5kUG9pbnRJbmRleF8gPSBmdW5jdGlvbiBmaW5kUG9pbnRJbmRleF8oc2VyaWVzLCB4dmFsKSB7XG4gIHZhciBjb2wgPSB0aGlzLmR5Z3JhcGhfLmdldExhYmVscygpLmluZGV4T2Yoc2VyaWVzKTtcbiAgaWYgKGNvbCA9PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgdmFyIGxvd0lkeCA9IDAsIGhpZ2hJZHggPSB0aGlzLmR5Z3JhcGhfLm51bVJvd3MoKSAtIDE7XG4gIHdoaWxlIChsb3dJZHggPD0gaGlnaElkeCkge1xuICAgIHZhciBpZHggPSBNYXRoLmZsb29yKChsb3dJZHggKyBoaWdoSWR4KSAvIDIpO1xuICAgIHZhciB4QXRJZHggPSB0aGlzLmR5Z3JhcGhfLmdldFZhbHVlKGlkeCwgMCk7XG4gICAgaWYgKHhBdElkeCA9PSB4dmFsKSB7XG4gICAgICByZXR1cm4gW2lkeCwgY29sXTtcbiAgICB9IGVsc2UgaWYgKHhBdElkeCA8IHh2YWwpIHtcbiAgICAgIGxvd0lkeCA9IGlkeCArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZ2hJZHggPSBpZHggLSAxO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS5nZXRDb2xvckZvclNlcmllc18gPSBmdW5jdGlvbiBnZXRDb2xvckZvclNlcmllc18oc2VyaWVzKSB7XG4gIHZhciBjb2xvcnMgPSB0aGlzLmR5Z3JhcGhfLmdldENvbG9ycygpO1xuICB2YXIgY29sID0gdGhpcy5keWdyYXBoXy5nZXRMYWJlbHMoKS5pbmRleE9mKHNlcmllcyk7XG4gIGlmIChjb2wgPT0gLTEpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiBjb2xvcnNbKGNvbCAtIDEpICUgY29sb3JzLmxlbmd0aF07XG59O1xuXG4vLyBNb3ZlcyBhIGhhaXJsaW5lJ3MgZGl2cyB0byB0aGUgdG9wIG9mIHRoZSB6LW9yZGVyaW5nLlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLm1vdmVBbm5vdGF0aW9uVG9Ub3AgPSBmdW5jdGlvbiBtb3ZlQW5ub3RhdGlvblRvVG9wKGEpIHtcbiAgdmFyIGRpdiA9IHRoaXMuZHlncmFwaF8uZ3JhcGhEaXY7XG4gICQoYS5pbmZvRGl2KS5hcHBlbmRUbyhkaXYpO1xuICAkKGEubGluZURpdikuYXBwZW5kVG8oZGl2KTtcblxuICB2YXIgaWR4ID0gdGhpcy5hbm5vdGF0aW9uc18uaW5kZXhPZihhKTtcbiAgdGhpcy5hbm5vdGF0aW9uc18uc3BsaWNlKGlkeCwgMSk7XG4gIHRoaXMuYW5ub3RhdGlvbnNfLnB1c2goYSk7XG59O1xuXG4vLyBQb3NpdGlvbnMgZXhpc3RpbmcgaGFpcmxpbmUgZGl2cy5cbmFubm90YXRpb25zLnByb3RvdHlwZS51cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zID0gZnVuY3Rpb24gdXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpIHtcbiAgdmFyIGxheW91dCA9IHRoaXMuZHlncmFwaF8uZ2V0QXJlYSgpO1xuICB2YXIgY2hhcnRMZWZ0ID0gbGF5b3V0LngsIGNoYXJ0UmlnaHQgPSBsYXlvdXQueCArIGxheW91dC53O1xuICB2YXIgY2hhcnRUb3AgPSBsYXlvdXQueSwgY2hhcnRCb3R0b20gPSBsYXlvdXQueSArIGxheW91dC5oO1xuICB2YXIgZGl2ID0gdGhpcy5keWdyYXBoXy5ncmFwaERpdjtcbiAgdmFyIHBvcyA9IER5Z3JhcGguZmluZFBvcyhkaXYpO1xuICB2YXIgYm94ID0gW2xheW91dC54ICsgcG9zLngsIGxheW91dC55ICsgcG9zLnldO1xuICBib3gucHVzaChib3hbMF0gKyBsYXlvdXQudyk7XG4gIGJveC5wdXNoKGJveFsxXSArIGxheW91dC5oKTtcblxuICB2YXIgZyA9IHRoaXMuZHlncmFwaF87XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuICAkLmVhY2godGhpcy5hbm5vdGF0aW9uc18sIGZ1bmN0aW9uIGFubm90YXRpb25zTG9vcF8oaWR4LCBhKSB7XG4gICAgdmFyIHJvd19jb2wgPSB0aGF0LmZpbmRQb2ludEluZGV4XyhhLnNlcmllcywgYS54dmFsKTtcbiAgICBpZiAocm93X2NvbCA9PSBudWxsKSB7XG4gICAgICAkKFthLmxpbmVEaXYsIGEuaW5mb0Rpdl0pLmhpZGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETyhkYW52ayk6IG9ubHkgZG8gdGhpcyBpZiB0aGV5J3JlIGludmlzaWJsZT9cbiAgICAgICQoW2EubGluZURpdiwgYS5pbmZvRGl2XSkuc2hvdygpO1xuICAgIH1cbiAgICB2YXIgeHkgPSBnLnRvRG9tQ29vcmRzKGEueHZhbCwgZy5nZXRWYWx1ZShyb3dfY29sWzBdLCByb3dfY29sWzFdKSk7XG4gICAgdmFyIHggPSB4eVswXSwgcG9pbnRZID0geHlbMV07XG5cbiAgICB2YXIgbGluZUhlaWdodCA9IDY7ICAvLyBUT0RPKGRhbnZrKTogb3B0aW9uP1xuXG4gICAgdmFyIHkgPSBwb2ludFk7XG4gICAgaWYgKGEueUZyYWMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgeSA9IGxheW91dC55ICsgbGF5b3V0LmggKiBhLnlGcmFjO1xuICAgIH0gZWxzZSB7XG4gICAgICB5IC09IGxpbmVIZWlnaHQ7XG4gICAgfVxuXG4gICAgdmFyIGxpbmVIZWlnaHQgPSB5IDwgcG9pbnRZID8gKHBvaW50WSAtIHkpIDogKHkgLSBwb2ludFkgLSBhLmluZm9EaXYub2Zmc2V0SGVpZ2h0KTtcbiAgICAkKGEubGluZURpdikuY3NzKHtcbiAgICAgICdsZWZ0JzogeCArICdweCcsXG4gICAgICAndG9wJzogTWF0aC5taW4oeSwgcG9pbnRZKSArICdweCcsXG4gICAgICAnaGVpZ2h0JzogbGluZUhlaWdodCArICdweCdcbiAgICB9KTtcbiAgICAkKGEuaW5mb0RpdikuY3NzKHtcbiAgICAgICdsZWZ0JzogeCArICdweCcsXG4gICAgfSk7XG4gICAgaWYgKCFhLmlzRHJhZ2dpbmcpIHtcbiAgICAgIC8vIGpRdWVyeSBVSSBkcmFnZ2FibGUgbGlrZXMgdG8gc2V0ICd0b3AnLCB3aGVyZWFzIHN1cGVyYW5ub3RhdGlvbnMgc2V0c1xuICAgICAgLy8gJ2JvdHRvbScuIFNldHRpbmcgYm90aCB3aWxsIG1ha2UgdGhlIGFubm90YXRpb24gZ3JvdyBhbmQgY29udHJhY3QgYXNcbiAgICAgIC8vIHRoZSB1c2VyIGRyYWdzIGl0LCB3aGljaCBsb29rcyBiYWQuXG4gICAgICAkKGEuaW5mb0RpdikuY3NzKHtcbiAgICAgICAgJ2JvdHRvbSc6IChkaXYub2Zmc2V0SGVpZ2h0IC0geSkgKyAncHgnXG4gICAgICB9KSAgLy8uZHJhZ2dhYmxlKFwib3B0aW9uXCIsIFwiY29udGFpbm1lbnRcIiwgYm94KTtcblxuICAgICAgdmFyIHZpc2libGUgPSAoeCA+PSBjaGFydExlZnQgJiYgeCA8PSBjaGFydFJpZ2h0KSAmJlxuICAgICAgICAgICAgICAgICAgICAocG9pbnRZID49IGNoYXJ0VG9wICYmIHBvaW50WSA8PSBjaGFydEJvdHRvbSk7XG4gICAgICAkKFthLmluZm9EaXYsIGEubGluZURpdl0pLnRvZ2dsZSh2aXNpYmxlKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLy8gRmlsbHMgb3V0IHRoZSBpbmZvIGRpdiBiYXNlZCBvbiBjdXJyZW50IGNvb3JkaW5hdGVzLlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLnVwZGF0ZUFubm90YXRpb25JbmZvID0gZnVuY3Rpb24gdXBkYXRlQW5ub3RhdGlvbkluZm8oKSB7XG4gIHZhciBnID0gdGhpcy5keWdyYXBoXztcblxuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHZhciB0ZW1wbGF0ZURpdiA9ICQoJyNhbm5vdGF0aW9uLXRlbXBsYXRlJykuZ2V0KDApO1xuICAkLmVhY2godGhpcy5hbm5vdGF0aW9uc18sIGZ1bmN0aW9uIGFubm90YXRpb25zTG9vcF8oaWR4LCBhKSB7XG4gICAgLy8gV2Ugc2hvdWxkIG5ldmVyIHVwZGF0ZSBhbiBlZGl0YWJsZSBkaXYgLS0gZG9pbmcgc28gbWF5IGtpbGwgdW5zYXZlZFxuICAgIC8vIGVkaXRzIHRvIGFuIGFubm90YXRpb24uXG4gICAgJChhLmluZm9EaXYpLnRvZ2dsZUNsYXNzKCdlZGl0YWJsZScsICEhYS5lZGl0YWJsZSk7XG4gICAgaWYgKGEuZWRpdGFibGUpIHJldHVybjtcbiAgICBhLmluZm9EaXYuaW5uZXJIVE1MID0gdGhhdC5nZXRUZW1wbGF0ZUhUTUwodGVtcGxhdGVEaXYsIGEpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshQW5ub3RhdGlvbn0gYSBJbnRlcm5hbCBhbm5vdGF0aW9uXG4gKiBAcmV0dXJuIHshUHVibGljQW5ub3RhdGlvbn0gYSB2aWV3IG9mIHRoZSBhbm5vdGF0aW9uIGZvciB0aGUgcHVibGljIEFQSS5cbiAqL1xuYW5ub3RhdGlvbnMucHJvdG90eXBlLmNyZWF0ZVB1YmxpY0Fubm90YXRpb25fID0gZnVuY3Rpb24gY3JlYXRlUHVibGljQW5ub3RhdGlvbl8oYSwgb3B0X3Byb3BzKSB7XG4gIHZhciBkaXNwbGF5QW5ub3RhdGlvbiA9ICQuZXh0ZW5kKHt9LCBhLCBvcHRfcHJvcHMpO1xuICBkZWxldGUgZGlzcGxheUFubm90YXRpb25bJ2luZm9EaXYnXTtcbiAgZGVsZXRlIGRpc3BsYXlBbm5vdGF0aW9uWydsaW5lRGl2J107XG4gIGRlbGV0ZSBkaXNwbGF5QW5ub3RhdGlvblsnaXNEcmFnZ2luZyddO1xuICBkZWxldGUgZGlzcGxheUFubm90YXRpb25bJ2VkaXRhYmxlJ107XG4gIHJldHVybiBkaXNwbGF5QW5ub3RhdGlvbjtcbn07XG5cbi8vIEZpbGwgb3V0IGEgZGl2IHVzaW5nIHRoZSB2YWx1ZXMgaW4gdGhlIGFubm90YXRpb24gb2JqZWN0LlxuLy8gVGhlIGRpdidzIGh0bWwgaXMgZXhwZWN0ZWQgdG8gaGF2ZSB0ZXh0IG9mIHRoZSBmb3JtIFwie3trZXl9fVwiXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZ2V0VGVtcGxhdGVIVE1MID0gZnVuY3Rpb24gZ2V0VGVtcGxhdGVIVE1MKGRpdiwgYSkge1xuICB2YXIgZyA9IHRoaXMuZHlncmFwaF87XG4gIHZhciByb3dfY29sID0gdGhpcy5maW5kUG9pbnRJbmRleF8oYS5zZXJpZXMsIGEueHZhbCk7XG4gIGlmIChyb3dfY29sID09IG51bGwpIHJldHVybjsgIC8vIHBlcmhhcHMgaXQncyBubyBsb25nZXIgYSByZWFsIHBvaW50P1xuICB2YXIgcm93ID0gcm93X2NvbFswXTtcbiAgdmFyIGNvbCA9IHJvd19jb2xbMV07XG5cbiAgdmFyIHlPcHRWaWV3ID0gZy5vcHRpb25zVmlld0ZvckF4aXNfKCd5MScpOyAgLy8gVE9ETzogc3VwcG9ydCBzZWNvbmRhcnksIHRvb1xuICB2YXIgeE9wdFZpZXcgPSBnLm9wdGlvbnNWaWV3Rm9yQXhpc18oJ3gnKTtcbiAgdmFyIHh2ZiA9IGcuZ2V0T3B0aW9uRm9yQXhpcygndmFsdWVGb3JtYXR0ZXInLCAneCcpO1xuXG4gIHZhciB4ID0geHZmLmNhbGwoZywgYS54dmFsLCB4T3B0Vmlldyk7XG4gIHZhciB5ID0gZy5nZXRPcHRpb24oJ3ZhbHVlRm9ybWF0dGVyJywgYS5zZXJpZXMpLmNhbGwoXG4gICAgICBnLCBnLmdldFZhbHVlKHJvdywgY29sKSwgeU9wdFZpZXcpO1xuXG4gIHZhciBkaXNwbGF5QW5ub3RhdGlvbiA9IHRoaXMuY3JlYXRlUHVibGljQW5ub3RhdGlvbl8oYSwge3g6eCwgeTp5fSk7XG4gIHZhciBodG1sID0gZGl2LmlubmVySFRNTDtcbiAgZm9yICh2YXIgayBpbiBkaXNwbGF5QW5ub3RhdGlvbikge1xuICAgIHZhciB2ID0gZGlzcGxheUFubm90YXRpb25ba107XG4gICAgaWYgKHR5cGVvZih2KSA9PSAnb2JqZWN0JykgY29udGludWU7ICAvLyBlLmcuIGluZm9EaXYgb3IgbGluZURpdlxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UobmV3IFJlZ0V4cCgnXFx7XFx7JyArIGsgKyAnXFx9XFx9JywgJ2cnKSwgdik7XG4gIH1cbiAgcmV0dXJuIGh0bWw7XG59O1xuXG4vLyBVcGRhdGUgdGhlIGFubm90YXRpb24gb2JqZWN0IGJ5IGxvb2tpbmcgZm9yIGVsZW1lbnRzIHdpdGggYSAnZGctYW5uLWZpZWxkJ1xuLy8gYXR0cmlidXRlLiBGb3IgZXhhbXBsZSwgPGlucHV0IHR5cGU9J3RleHQnIGRnLWFubi1maWVsZD0ndGV4dCcgLz4gd2lsbCBoYXZlXG4vLyBpdHMgdmFsdWUgcGxhY2VkIGluIHRoZSAndGV4dCcgYXR0cmlidXRlIG9mIHRoZSBhbm5vdGF0aW9uLlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmV4dHJhY3RVcGRhdGVkUHJvcGVydGllc18gPSBmdW5jdGlvbiBleHRyYWN0VXBkYXRlZFByb3BlcnRpZXNfKGRpdiwgYSkge1xuICAkKGRpdikuZmluZCgnW2RnLWFubi1maWVsZF0nKS5lYWNoKGZ1bmN0aW9uIGZpZWxkTG9vcF8oaWR4LCBlbCkge1xuICAgIHZhciBrID0gJChlbCkuYXR0cignZGctYW5uLWZpZWxkJyk7XG4gICAgdmFyIHYgPSAkKGVsKS52YWwoKTtcbiAgICBhW2tdID0gdjtcbiAgfSk7XG59O1xuXG4vLyBBZnRlciBhIHJlc2l6ZSwgdGhlIGhhaXJsaW5lIGRpdnMgY2FuIGdldCBkZXR0YWNoZWQgZnJvbSB0aGUgY2hhcnQuXG4vLyBUaGlzIHJlYXR0YWNoZXMgdGhlbS5cbmFubm90YXRpb25zLnByb3RvdHlwZS5hdHRhY2hBbm5vdGF0aW9uc1RvQ2hhcnRfID0gZnVuY3Rpb24gYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XygpIHtcbiAgdmFyIGRpdiA9IHRoaXMuZHlncmFwaF8uZ3JhcGhEaXY7XG4gICQuZWFjaCh0aGlzLmFubm90YXRpb25zXywgZnVuY3Rpb24gYW5ub3RhdGlvbnNMb29wXyhpZHgsIGEpIHtcbiAgICAvLyBSZS1hdHRhY2hpbmcgYW4gZWRpdGFibGUgZGl2IHRvIHRoZSBET00gY2FuIGNsZWFyIGl0cyBmb2N1cy5cbiAgICAvLyBUaGlzIG1ha2VzIHR5cGluZyByZWFsbHkgZGlmZmljdWx0IVxuICAgIGlmIChhLmVkaXRhYmxlKSByZXR1cm47XG5cbiAgICAkKFthLmxpbmVEaXYsIGEuaW5mb0Rpdl0pLmFwcGVuZFRvKGRpdik7XG4gIH0pO1xufTtcblxuLy8gRGVsZXRlcyBhIGhhaXJsaW5lIGFuZCByZW1vdmVzIGl0IGZyb20gdGhlIGNoYXJ0LlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLnJlbW92ZUFubm90YXRpb24gPSBmdW5jdGlvbiByZW1vdmVBbm5vdGF0aW9uKGEpIHtcbiAgdmFyIGlkeCA9IHRoaXMuYW5ub3RhdGlvbnNfLmluZGV4T2YoYSk7XG4gIGlmIChpZHggPj0gMCkge1xuICAgIHRoaXMuYW5ub3RhdGlvbnNfLnNwbGljZShpZHgsIDEpO1xuICAgICQoW2EubGluZURpdiwgYS5pbmZvRGl2XSkucmVtb3ZlKCk7XG4gIH0gZWxzZSB7XG4gICAgRHlncmFwaC53YXJuKCdUcmllZCB0byByZW1vdmUgbm9uLWV4aXN0ZW50IGFubm90YXRpb24uJyk7XG4gIH1cbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS5kaWREcmF3Q2hhcnQgPSBmdW5jdGlvbiBkaWREcmF3Q2hhcnQoZSkge1xuICB2YXIgZyA9IGUuZHlncmFwaDtcblxuICAvLyBFYXJseSBvdXQgaW4gdGhlIChjb21tb24pIGNhc2Ugb2YgemVybyBhbm5vdGF0aW9ucy5cbiAgaWYgKHRoaXMuYW5ub3RhdGlvbnNfLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpO1xuICB0aGlzLmF0dGFjaEFubm90YXRpb25zVG9DaGFydF8oKTtcbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uSW5mbygpO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLnBvaW50Q2xpY2sgPSBmdW5jdGlvbiBwb2ludENsaWNrKGUpIHtcbiAgLy8gUHJldmVudCBhbnkgb3RoZXIgYmVoYXZpb3IgYmFzZWQgb24gdGhpcyBjbGljaywgZS5nLiBjcmVhdGlvbiBvZiBhIGhhaXJsaW5lLlxuICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgdmFyIGEgPSAkLmV4dGVuZCh7fSwgdGhpcy5kZWZhdWx0QW5ub3RhdGlvblByb3BlcnRpZXNfLCB7XG4gICAgc2VyaWVzOiBlLnBvaW50Lm5hbWUsXG4gICAgeHZhbDogZS5wb2ludC54dmFsXG4gIH0pO1xuICB0aGlzLmFubm90YXRpb25zXy5wdXNoKHRoaXMuY3JlYXRlQW5ub3RhdGlvbihhKSk7XG5cbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zKCk7XG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkluZm8oKTtcbiAgdGhpcy5hdHRhY2hBbm5vdGF0aW9uc1RvQ2hhcnRfKCk7XG5cbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbkNyZWF0ZWQnLCBhKTtcbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbnNDaGFuZ2VkJywge30pO1xuXG4gIC8vIEFubm90YXRpb25zIHNob3VsZCBiZWdpbiBsaWZlIGVkaXRhYmxlLlxuICB0aGlzLm1ha2VBbm5vdGF0aW9uRWRpdGFibGUoYSk7XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gIHRoaXMuZGV0YWNoTGFiZWxzKCk7XG59O1xuXG4vLyBQdWJsaWMgQVBJXG5cbi8qKlxuICogVGhpcyBpcyBhIHJlc3RyaWN0ZWQgdmlldyBvZiB0aGlzLmFubm90YXRpb25zXyB3aGljaCBkb2Vzbid0IGV4cG9zZVxuICogaW1wbGVtZW50YXRpb24gZGV0YWlscyBsaWtlIHRoZSBsaW5lIC8gaW5mbyBkaXZzLlxuICpcbiAqIEB0eXBlZGVmIHtcbiAqICAgeHZhbDogIG51bWJlciwgICAgICAvLyB4LXZhbHVlIChpLmUuIG1pbGxpcyBvciBhIHJhdyBudW1iZXIpXG4gKiAgIHNlcmllczogc3RyaW5nLCAgICAgLy8gc2VyaWVzIG5hbWVcbiAqIH0gUHVibGljQW5ub3RhdGlvblxuICovXG5cbi8qKlxuICogQHJldHVybiB7IUFycmF5LjwhUHVibGljQW5ub3RhdGlvbj59IFRoZSBjdXJyZW50IHNldCBvZiBhbm5vdGF0aW9ucywgb3JkZXJlZFxuICogICAgIGZyb20gYmFjayB0byBmcm9udC5cbiAqL1xuYW5ub3RhdGlvbnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYW5ub3RhdGlvbnNfLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzdWx0LnB1c2godGhpcy5jcmVhdGVQdWJsaWNBbm5vdGF0aW9uXyh0aGlzLmFubm90YXRpb25zX1tpXSkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGxpbmcgdGhpcyB3aWxsIHJlc3VsdCBpbiBhbiBhbm5vdGF0aW9uc0NoYW5nZWQgZXZlbnQgYmVpbmcgdHJpZ2dlcmVkLCBub1xuICogbWF0dGVyIHdoZXRoZXIgaXQgY29uc2lzdHMgb2YgYWRkaXRpb25zLCBkZWxldGlvbnMsIG1vdmVzIG9yIG5vIGNoYW5nZXMgYXRcbiAqIGFsbC5cbiAqXG4gKiBAcGFyYW0geyFBcnJheS48IVB1YmxpY0Fubm90YXRpb24+fSBhbm5vdGF0aW9ucyBUaGUgbmV3IHNldCBvZiBhbm5vdGF0aW9ucyxcbiAqICAgICBvcmRlcmVkIGZyb20gYmFjayB0byBmcm9udC5cbiAqL1xuYW5ub3RhdGlvbnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldChhbm5vdGF0aW9ucykge1xuICAvLyBSZS11c2UgZGl2cyBmcm9tIHRoZSBvbGQgYW5ub3RhdGlvbnMgYXJyYXkgc28gZmFyIGFzIHdlIGNhbi5cbiAgLy8gVGhleSdyZSBhbHJlYWR5IGNvcnJlY3RseSB6LW9yZGVyZWQuXG4gIHZhciBhbnlDcmVhdGVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYW5ub3RhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYSA9IGFubm90YXRpb25zW2ldO1xuXG4gICAgaWYgKHRoaXMuYW5ub3RhdGlvbnNfLmxlbmd0aCA+IGkpIHtcbiAgICAgIC8vIE9ubHkgdGhlIGRpdnMgbmVlZCB0byBiZSBwcmVzZXJ2ZWQuXG4gICAgICB2YXIgb2xkQSA9IHRoaXMuYW5ub3RhdGlvbnNfW2ldO1xuICAgICAgdGhpcy5hbm5vdGF0aW9uc19baV0gPSAkLmV4dGVuZCh7XG4gICAgICAgIGluZm9EaXY6IG9sZEEuaW5mb0RpdixcbiAgICAgICAgbGluZURpdjogb2xkQS5saW5lRGl2XG4gICAgICB9LCBhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbm5vdGF0aW9uc18ucHVzaCh0aGlzLmNyZWF0ZUFubm90YXRpb24oYSkpO1xuICAgICAgYW55Q3JlYXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSByZW1haW5pbmcgYW5ub3RhdGlvbnMsIGRlc3Ryb3kgdGhlbS5cbiAgd2hpbGUgKGFubm90YXRpb25zLmxlbmd0aCA8IHRoaXMuYW5ub3RhdGlvbnNfLmxlbmd0aCkge1xuICAgIHRoaXMucmVtb3ZlQW5ub3RhdGlvbih0aGlzLmFubm90YXRpb25zX1thbm5vdGF0aW9ucy5sZW5ndGhdKTtcbiAgfVxuXG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG4gIGlmIChhbnlDcmVhdGVkKSB7XG4gICAgdGhpcy5hdHRhY2hBbm5vdGF0aW9uc1RvQ2hhcnRfKCk7XG4gIH1cblxuICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uc0NoYW5nZWQnLCB7fSk7XG59O1xuXG5yZXR1cm4gYW5ub3RhdGlvbnM7XG5cbn0pKCk7XG5cbi8qIGxvYWRlciB3cmFwcGVyICovXG5EeWdyYXBoLl9yZXF1aXJlZCgnZHlncmFwaHMvc3JjL2V4dHJhcy9zdXBlci1hbm5vdGF0aW9ucy5qcycsIC8qIGV4cG9ydHMgKi8ge30pO1xufSkoKTtcbiJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQ0FBQyxTQUFTQSxnQ0FBZ0MsR0FBRztFQUM3QyxZQUFZOztFQUNaLElBQUlDLE9BQU87RUFDWCxJQUFJQyxNQUFNLENBQUNELE9BQU8sRUFBRTtJQUNsQkEsT0FBTyxHQUFHQyxNQUFNLENBQUNELE9BQU87RUFDMUIsQ0FBQyxNQUFNLElBQUksT0FBT0UsTUFBTyxLQUFLLFdBQVcsRUFBRTtJQUN6Q0YsT0FBTyxHQUFHRyxPQUFP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