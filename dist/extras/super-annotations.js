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
  Dygraph._require.add('dygraphs/src/extras/super-annotations.js', /* exports */{});
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX3N1cGVyQW5ub3RhdGlvbnNfd3JhcHBlciIsIkR5Z3JhcGgiLCJ3aW5kb3ciLCJtb2R1bGUiLCJyZXF1aXJlIiwiTkFNRSIsIlBsdWdpbnMiLCJTdXBlckFubm90YXRpb25zIiwiX2V4dHJhc19zdXBlckFubm90YXRpb25zX2Nsb3N1cmUiLCJhbm5vdGF0aW9ucyIsIm9wdF9vcHRpb25zIiwiYW5ub3RhdGlvbnNfIiwibGFzdFdpZHRoXyIsImxhc3RIZWlnaHQiLCJkeWdyYXBoXyIsImRlZmF1bHRBbm5vdGF0aW9uUHJvcGVydGllc18iLCIkIiwiZXh0ZW5kIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJhY3RpdmF0ZSIsImciLCJkaWREcmF3Q2hhcnQiLCJwb2ludENsaWNrIiwiZGV0YWNoTGFiZWxzIiwiaSIsImxlbmd0aCIsImEiLCJsaW5lRGl2IiwicmVtb3ZlIiwiaW5mb0RpdiIsImFubm90YXRpb25XYXNEcmFnZ2VkIiwiZXZlbnQiLCJ1aSIsImFyZWEiLCJnZXRBcmVhIiwib2xkWUZyYWMiLCJ5RnJhYyIsIm5ld1lGcmFjIiwib2Zmc2V0VG9wIiwib2Zmc2V0SGVpZ2h0IiwieSIsImgiLCJtb3ZlQW5ub3RhdGlvblRvVG9wIiwidXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucyIsInVwZGF0ZUFubm90YXRpb25JbmZvIiwidHJpZ2dlckhhbmRsZXIiLCJhbm5vdGF0aW9uIiwibWFrZUFubm90YXRpb25FZGl0YWJsZSIsImVkaXRhYmxlIiwiZWRpdGFibGVUZW1wbGF0ZURpdiIsImdldCIsImlubmVySFRNTCIsImdldFRlbXBsYXRlSFRNTCIsInRvZ2dsZUNsYXNzIiwiY3JlYXRlQW5ub3RhdGlvbiIsInNlbGYiLCJjb2xvciIsImdldENvbG9yRm9yU2VyaWVzXyIsInNlcmllcyIsIiRsaW5lRGl2IiwiY3NzIiwiYWRkQ2xhc3MiLCIkaW5mb0RpdiIsImNsb25lIiwicmVtb3ZlQXR0ciIsInNob3ciLCJ0aGF0IiwiZHJhZ2dhYmxlIiwiZHJhZ2dhYmxlU3RhcnQiLCJpc0RyYWdnaW5nIiwiZHJhZ2dhYmxlRHJhZyIsImRyYWdnYWJsZVN0b3AiLCJvbiIsImNsaWNrS2lsbCIsInJlbW92ZUFubm90YXRpb24iLCJkYmxjbGljayIsImNsaWNrVXBkYXRlIiwiZXh0cmFjdFVwZGF0ZWRQcm9wZXJ0aWVzXyIsImNsaWNrQ2FuY2VsIiwiZmluZFBvaW50SW5kZXhfIiwieHZhbCIsImNvbCIsImdldExhYmVscyIsImluZGV4T2YiLCJsb3dJZHgiLCJoaWdoSWR4IiwibnVtUm93cyIsImlkeCIsIk1hdGgiLCJmbG9vciIsInhBdElkeCIsImdldFZhbHVlIiwiY29sb3JzIiwiZ2V0Q29sb3JzIiwiZGl2IiwiZ3JhcGhEaXYiLCJhcHBlbmRUbyIsInNwbGljZSIsInB1c2giLCJsYXlvdXQiLCJjaGFydExlZnQiLCJ4IiwiY2hhcnRSaWdodCIsInciLCJjaGFydFRvcCIsImNoYXJ0Qm90dG9tIiwicG9zIiwiZmluZFBvcyIsImJveCIsImVhY2giLCJhbm5vdGF0aW9uc0xvb3BfIiwicm93X2NvbCIsImhpZGUiLCJ4eSIsInRvRG9tQ29vcmRzIiwicG9pbnRZIiwibGluZUhlaWdodCIsInVuZGVmaW5lZCIsIm1pbiIsInZpc2libGUiLCJ0b2dnbGUiLCJ0ZW1wbGF0ZURpdiIsImNyZWF0ZVB1YmxpY0Fubm90YXRpb25fIiwib3B0X3Byb3BzIiwiZGlzcGxheUFubm90YXRpb24iLCJyb3ciLCJ5T3B0VmlldyIsIm9wdGlvbnNWaWV3Rm9yQXhpc18iLCJ4T3B0VmlldyIsInh2ZiIsImdldE9wdGlvbkZvckF4aXMiLCJjYWxsIiwiZ2V0T3B0aW9uIiwiaHRtbCIsImsiLCJ2IiwicmVwbGFjZSIsIlJlZ0V4cCIsImZpbmQiLCJmaWVsZExvb3BfIiwiZWwiLCJhdHRyIiwidmFsIiwiYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XyIsIndhcm4iLCJlIiwiZHlncmFwaCIsInByZXZlbnREZWZhdWx0IiwicG9pbnQiLCJuYW1lIiwiZGVzdHJveSIsInJlc3VsdCIsInNldCIsImFueUNyZWF0ZWQiLCJvbGRBIiwiX3JlcXVpcmUiLCJhZGQiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvZXh0cmFzL3N1cGVyLWFubm90YXRpb25zLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDEzIERhbiBWYW5kZXJrYW0gKGRhbnZka0BnbWFpbC5jb20pXG4gKiBNSVQtbGljZW5jZWQ6IGh0dHBzOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKlxuICogTm90ZTogVGhpcyBwbHVnaW4gcmVxdWlyZXMgalF1ZXJ5IGFuZCBqUXVlcnkgVUkgRHJhZ2dhYmxlLlxuICpcbiAqIFNlZSBoaWdoLWxldmVsIGRvY3VtZW50YXRpb24gYXQgLi4vLi4vZG9jcy9oYWlybGluZXMtYW5ub3RhdGlvbnMucGRmXG4gKi9cblxuLyogbG9hZGVyIHdyYXBwZXIgdG8gYWxsb3cgYnJvd3NlciB1c2UgYW5kIEVTNiBpbXBvcnRzICovXG4oZnVuY3Rpb24gX2V4dHJhc19zdXBlckFubm90YXRpb25zX3dyYXBwZXIoKSB7XG4ndXNlIHN0cmljdCc7XG52YXIgRHlncmFwaDtcbmlmICh3aW5kb3cuRHlncmFwaCkge1xuICBEeWdyYXBoID0gd2luZG93LkR5Z3JhcGg7XG59IGVsc2UgaWYgKHR5cGVvZihtb2R1bGUpICE9PSAndW5kZWZpbmVkJykge1xuICBEeWdyYXBoID0gcmVxdWlyZSgnLi4vZHlncmFwaCcpO1xuICBpZiAodHlwZW9mKER5Z3JhcGguTkFNRSkgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZihEeWdyYXBoLmRlZmF1bHQpICE9PSAndW5kZWZpbmVkJylcbiAgICBEeWdyYXBoID0gRHlncmFwaC5kZWZhdWx0O1xufVxuLyogZW5kIG9mIGxvYWRlciB3cmFwcGVyIGhlYWRlciAqL1xuXG5EeWdyYXBoLlBsdWdpbnMuU3VwZXJBbm5vdGF0aW9ucyA9IChmdW5jdGlvbiBfZXh0cmFzX3N1cGVyQW5ub3RhdGlvbnNfY2xvc3VyZSgpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVGhlc2UgYXJlIGp1c3QgdGhlIGJhc2ljIHJlcXVpcmVtZW50cyAtLSBhbm5vdGF0aW9ucyBjYW4gaGF2ZSB3aGF0ZXZlciBvdGhlclxuICogcHJvcGVydGllcyB0aGUgY29kZSB0aGF0IGRpc3BsYXlzIHRoZW0gd2FudHMgdGhlbSB0byBoYXZlLlxuICpcbiAqIEB0eXBlZGVmIHtcbiAqICAgeHZhbDogIG51bWJlciwgICAgICAvLyB4LXZhbHVlIChpLmUuIG1pbGxpcyBvciBhIHJhdyBudW1iZXIpXG4gKiAgIHNlcmllczogc3RyaW5nLCAgICAgLy8gc2VyaWVzIG5hbWVcbiAqICAgeUZyYWM6ID9udW1iZXIsICAgICAvLyB5LXBvc2l0aW9uaW5nLiBEZWZhdWx0IGlzIGEgZmV3IHB4IGFib3ZlIHRoZSBwb2ludC5cbiAqICAgbGluZURpdjogIUVsZW1lbnQgICAvLyB2ZXJ0aWNhbCBkaXYgY29ubmVjdGluZyBwb2ludCB0byBpbmZvIGRpdi5cbiAqICAgaW5mb0RpdjogIUVsZW1lbnQgICAvLyBkaXYgY29udGFpbmluZyBpbmZvIGFib3V0IHRoZSBhbm5vdGF0aW9uLlxuICogfSBBbm5vdGF0aW9uXG4gKi9cblxudmFyIGFubm90YXRpb25zID0gZnVuY3Rpb24gYW5ub3RhdGlvbnMob3B0X29wdGlvbnMpIHtcbiAgLyogQHR5cGUgeyFBcnJheS48IUFubm90YXRpb24+fSAqL1xuICB0aGlzLmFubm90YXRpb25zXyA9IFtdO1xuICAvLyBVc2VkIHRvIGRldGVjdCByZXNpemVzICh3aGljaCByZXF1aXJlIHRoZSBkaXZzIHRvIGJlIHJlcG9zaXRpb25lZCkuXG4gIHRoaXMubGFzdFdpZHRoXyA9IC0xO1xuICB0aGlzLmxhc3RIZWlnaHQgPSAtMTtcbiAgdGhpcy5keWdyYXBoXyA9IG51bGw7XG5cbiAgb3B0X29wdGlvbnMgPSBvcHRfb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5kZWZhdWx0QW5ub3RhdGlvblByb3BlcnRpZXNfID0gJC5leHRlbmQoe1xuICAgICd0ZXh0JzogJ0Rlc2NyaXB0aW9uJ1xuICB9LCBvcHRfb3B0aW9uc1snZGVmYXVsdEFubm90YXRpb25Qcm9wZXJ0aWVzJ10pO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gIHJldHVybiBcIlN1cGVyQW5ub3RhdGlvbnMgUGx1Z2luXCI7XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiBhY3RpdmF0ZShnKSB7XG4gIHRoaXMuZHlncmFwaF8gPSBnO1xuICB0aGlzLmFubm90YXRpb25zXyA9IFtdO1xuXG4gIHJldHVybiB7XG4gICAgZGlkRHJhd0NoYXJ0OiB0aGlzLmRpZERyYXdDaGFydCxcbiAgICBwb2ludENsaWNrOiB0aGlzLnBvaW50Q2xpY2sgIC8vIFRPRE8oZGFudmspOiBpbXBsZW1lbnQgaW4gZHlncmFwaHNcbiAgfTtcbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS5kZXRhY2hMYWJlbHMgPSBmdW5jdGlvbiBkZXRhY2hMYWJlbHMoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hbm5vdGF0aW9uc18ubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYSA9IHRoaXMuYW5ub3RhdGlvbnNfW2ldO1xuICAgICQoYS5saW5lRGl2KS5yZW1vdmUoKTtcbiAgICAkKGEuaW5mb0RpdikucmVtb3ZlKCk7XG4gICAgdGhpcy5hbm5vdGF0aW9uc19baV0gPSBudWxsO1xuICB9XG4gIHRoaXMuYW5ub3RhdGlvbnNfID0gW107XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuYW5ub3RhdGlvbldhc0RyYWdnZWQgPSBmdW5jdGlvbiBhbm5vdGF0aW9uV2FzRHJhZ2dlZChhLCBldmVudCwgdWkpIHtcbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuICB2YXIgYXJlYSA9IGcuZ2V0QXJlYSgpO1xuICB2YXIgb2xkWUZyYWMgPSBhLnlGcmFjO1xuXG4gIHZhciBpbmZvRGl2ID0gYS5pbmZvRGl2O1xuICB2YXIgbmV3WUZyYWMgPSAoKGluZm9EaXYub2Zmc2V0VG9wICsgaW5mb0Rpdi5vZmZzZXRIZWlnaHQpIC0gYXJlYS55KSAvIGFyZWEuaDtcbiAgaWYgKG5ld1lGcmFjID09IG9sZFlGcmFjKSByZXR1cm47XG5cbiAgYS55RnJhYyA9IG5ld1lGcmFjO1xuXG4gIHRoaXMubW92ZUFubm90YXRpb25Ub1RvcChhKTtcbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zKCk7XG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkluZm8oKTtcbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbk1vdmVkJywge1xuICAgIGFubm90YXRpb246IGEsXG4gICAgb2xkWUZyYWM6IG9sZFlGcmFjLFxuICAgIG5ld1lGcmFjOiBhLnlGcmFjXG4gIH0pO1xuICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uc0NoYW5nZWQnLCB7fSk7XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUubWFrZUFubm90YXRpb25FZGl0YWJsZSA9IGZ1bmN0aW9uIG1ha2VBbm5vdGF0aW9uRWRpdGFibGUoYSkge1xuICBpZiAoYS5lZGl0YWJsZSA9PSB0cnVlKSByZXR1cm47XG4gIHRoaXMubW92ZUFubm90YXRpb25Ub1RvcChhKTtcblxuICAvLyBOb3RlOiB3ZSBoYXZlIHRvIGZpbGwgb3V0IHRoZSBIVE1MIG91cnNlbHZlcyBiZWNhdXNlXG4gIC8vIHVwZGF0ZUFubm90YXRpb25JbmZvKCkgd29uJ3QgdG91Y2ggZWRpdGFibGUgYW5ub3RhdGlvbnMuXG4gIGEuZWRpdGFibGUgPSB0cnVlO1xuICB2YXIgZWRpdGFibGVUZW1wbGF0ZURpdiA9ICQoJyNhbm5vdGF0aW9uLWVkaXRhYmxlLXRlbXBsYXRlJykuZ2V0KDApO1xuICBhLmluZm9EaXYuaW5uZXJIVE1MID0gdGhpcy5nZXRUZW1wbGF0ZUhUTUwoZWRpdGFibGVUZW1wbGF0ZURpdiwgYSk7XG4gICQoYS5pbmZvRGl2KS50b2dnbGVDbGFzcygnZWRpdGFibGUnLCAhIWEuZWRpdGFibGUpO1xuICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdiZWdhbkVkaXRBbm5vdGF0aW9uJywgYSk7XG59O1xuXG4vLyBUaGlzIGNyZWF0ZXMgdGhlIGhhaXJsaW5lIG9iamVjdCBhbmQgcmV0dXJucyBpdC5cbi8vIEl0IGRvZXMgbm90IHBvc2l0aW9uIGl0IGFuZCBkb2VzIG5vdCBhdHRhY2ggaXQgdG8gdGhlIGNoYXJ0LlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmNyZWF0ZUFubm90YXRpb24gPSBmdW5jdGlvbiBjcmVhdGVBbm5vdGF0aW9uKGEpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBjb2xvciA9IHRoaXMuZ2V0Q29sb3JGb3JTZXJpZXNfKGEuc2VyaWVzKTtcblxuICB2YXIgJGxpbmVEaXYgPSAkKCc8ZGl2Lz4nKS5jc3Moe1xuICAgICd3aWR0aCc6ICcxcHgnLFxuICAgICdsZWZ0JzogJzNweCcsXG4gICAgJ2JhY2tncm91bmQnOiAnYmxhY2snLFxuICAgICdoZWlnaHQnOiAnMTAwJScsXG4gICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcbiAgICAvLyBUT0RPKGRhbnZrKTogdXNlIGJvcmRlci1jb2xvciBoZXJlIGZvciBjb25zaXN0ZW5jeT9cbiAgICAnYmFja2dyb3VuZC1jb2xvcic6IGNvbG9yLFxuICAgICd6LWluZGV4JzogMTBcbiAgfSkuYWRkQ2xhc3MoJ2R5Z3JhcGgtYW5ub3RhdGlvbi1saW5lJyk7XG5cbiAgdmFyICRpbmZvRGl2ID0gJCgnI2Fubm90YXRpb24tdGVtcGxhdGUnKS5jbG9uZSgpLnJlbW92ZUF0dHIoJ2lkJykuY3NzKHtcbiAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXG4gICAgICAnYm9yZGVyLWNvbG9yJzogY29sb3IsXG4gICAgICAnei1pbmRleCc6IDEwXG4gICAgfSlcbiAgICAuc2hvdygpO1xuXG4gICQuZXh0ZW5kKGEsIHtcbiAgICBsaW5lRGl2OiAkbGluZURpdi5nZXQoMCksXG4gICAgaW5mb0RpdjogJGluZm9EaXYuZ2V0KDApXG4gIH0pO1xuXG4gIHZhciB0aGF0ID0gdGhpcztcblxuICAkaW5mb0Rpdi5kcmFnZ2FibGUoe1xuICAgICdzdGFydCc6IGZ1bmN0aW9uIGRyYWdnYWJsZVN0YXJ0KGV2ZW50LCB1aSkge1xuICAgICAgJCh0aGlzKS5jc3Moeydib3R0b20nOiAnJ30pO1xuICAgICAgYS5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICB9LFxuICAgICdkcmFnJzogZnVuY3Rpb24gZHJhZ2dhYmxlRHJhZyhldmVudCwgdWkpIHtcbiAgICAgIHNlbGYuYW5ub3RhdGlvbldhc0RyYWdnZWQoYSwgZXZlbnQsIHVpKTtcbiAgICB9LFxuICAgICdzdG9wJzogZnVuY3Rpb24gZHJhZ2dhYmxlU3RvcChldmVudCwgdWkpIHtcbiAgICAgICQodGhpcykuY3NzKHsndG9wJzogJyd9KTtcbiAgICAgIGEuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgc2VsZi51cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zKCk7XG4gICAgfSxcbiAgICAnYXhpcyc6ICd5JyxcbiAgICAnY29udGFpbm1lbnQnOiAncGFyZW50J1xuICB9KTtcblxuICAvLyBUT0RPKGRhbnZrKTogdXNlICdvbicgaW5zdGVhZCBvZiBkZWxlZ2F0ZS9kYmxjbGlja1xuICAkaW5mb0Rpdi5vbignY2xpY2snLCAnLmFubm90YXRpb24ta2lsbC1idXR0b24nLCBmdW5jdGlvbiBjbGlja0tpbGwoKSB7XG4gICAgdGhhdC5yZW1vdmVBbm5vdGF0aW9uKGEpO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25EZWxldGVkJywgYSk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbnNDaGFuZ2VkJywge30pO1xuICB9KTtcblxuICAkaW5mb0Rpdi5vbignZGJsY2xpY2snLCBmdW5jdGlvbiBkYmxjbGljaygpIHtcbiAgICB0aGF0Lm1ha2VBbm5vdGF0aW9uRWRpdGFibGUoYSk7XG4gIH0pO1xuICAkaW5mb0Rpdi5vbignY2xpY2snLCAnLmFubm90YXRpb24tdXBkYXRlJywgZnVuY3Rpb24gY2xpY2tVcGRhdGUoKSB7XG4gICAgc2VsZi5leHRyYWN0VXBkYXRlZFByb3BlcnRpZXNfKCRpbmZvRGl2LmdldCgwKSwgYSk7XG4gICAgYS5lZGl0YWJsZSA9IGZhbHNlO1xuICAgIHNlbGYudXBkYXRlQW5ub3RhdGlvbkluZm8oKTtcbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uRWRpdGVkJywgYSk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbnNDaGFuZ2VkJywge30pO1xuICB9KTtcbiAgJGluZm9EaXYub24oJ2NsaWNrJywgJy5hbm5vdGF0aW9uLWNhbmNlbCcsIGZ1bmN0aW9uIGNsaWNrQ2FuY2VsKCkge1xuICAgIGEuZWRpdGFibGUgPSBmYWxzZTtcbiAgICBzZWxmLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignY2FuY2VsRWRpdEFubm90YXRpb24nLCBhKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGE7XG59O1xuXG4vLyBGaW5kIHRoZSBpbmRleCBvZiBhIHBvaW50IGluIGEgc2VyaWVzLlxuLy8gUmV0dXJucyBhIDItZWxlbWVudCBhcnJheSwgW3JvdywgY29sXSwgd2hpY2ggY2FuIGJlIHVzZWQgd2l0aFxuLy8gZHlncmFwaC5nZXRWYWx1ZSgpIHRvIGdldCB0aGUgdmFsdWUgYXQgdGhpcyBwb2ludC5cbi8vIFJldHVybnMgbnVsbCBpZiB0aGVyZSdzIG5vIG1hdGNoLlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmZpbmRQb2ludEluZGV4XyA9IGZ1bmN0aW9uIGZpbmRQb2ludEluZGV4XyhzZXJpZXMsIHh2YWwpIHtcbiAgdmFyIGNvbCA9IHRoaXMuZHlncmFwaF8uZ2V0TGFiZWxzKCkuaW5kZXhPZihzZXJpZXMpO1xuICBpZiAoY29sID09IC0xKSByZXR1cm4gbnVsbDtcblxuICB2YXIgbG93SWR4ID0gMCwgaGlnaElkeCA9IHRoaXMuZHlncmFwaF8ubnVtUm93cygpIC0gMTtcbiAgd2hpbGUgKGxvd0lkeCA8PSBoaWdoSWR4KSB7XG4gICAgdmFyIGlkeCA9IE1hdGguZmxvb3IoKGxvd0lkeCArIGhpZ2hJZHgpIC8gMik7XG4gICAgdmFyIHhBdElkeCA9IHRoaXMuZHlncmFwaF8uZ2V0VmFsdWUoaWR4LCAwKTtcbiAgICBpZiAoeEF0SWR4ID09IHh2YWwpIHtcbiAgICAgIHJldHVybiBbaWR4LCBjb2xdO1xuICAgIH0gZWxzZSBpZiAoeEF0SWR4IDwgeHZhbCkge1xuICAgICAgbG93SWR4ID0gaWR4ICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlnaElkeCA9IGlkeCAtIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmdldENvbG9yRm9yU2VyaWVzXyA9IGZ1bmN0aW9uIGdldENvbG9yRm9yU2VyaWVzXyhzZXJpZXMpIHtcbiAgdmFyIGNvbG9ycyA9IHRoaXMuZHlncmFwaF8uZ2V0Q29sb3JzKCk7XG4gIHZhciBjb2wgPSB0aGlzLmR5Z3JhcGhfLmdldExhYmVscygpLmluZGV4T2Yoc2VyaWVzKTtcbiAgaWYgKGNvbCA9PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgcmV0dXJuIGNvbG9yc1soY29sIC0gMSkgJSBjb2xvcnMubGVuZ3RoXTtcbn07XG5cbi8vIE1vdmVzIGEgaGFpcmxpbmUncyBkaXZzIHRvIHRoZSB0b3Agb2YgdGhlIHotb3JkZXJpbmcuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUubW92ZUFubm90YXRpb25Ub1RvcCA9IGZ1bmN0aW9uIG1vdmVBbm5vdGF0aW9uVG9Ub3AoYSkge1xuICB2YXIgZGl2ID0gdGhpcy5keWdyYXBoXy5ncmFwaERpdjtcbiAgJChhLmluZm9EaXYpLmFwcGVuZFRvKGRpdik7XG4gICQoYS5saW5lRGl2KS5hcHBlbmRUbyhkaXYpO1xuXG4gIHZhciBpZHggPSB0aGlzLmFubm90YXRpb25zXy5pbmRleE9mKGEpO1xuICB0aGlzLmFubm90YXRpb25zXy5zcGxpY2UoaWR4LCAxKTtcbiAgdGhpcy5hbm5vdGF0aW9uc18ucHVzaChhKTtcbn07XG5cbi8vIFBvc2l0aW9ucyBleGlzdGluZyBoYWlybGluZSBkaXZzLlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLnVwZGF0ZUFubm90YXRpb25EaXZQb3NpdGlvbnMgPSBmdW5jdGlvbiB1cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zKCkge1xuICB2YXIgbGF5b3V0ID0gdGhpcy5keWdyYXBoXy5nZXRBcmVhKCk7XG4gIHZhciBjaGFydExlZnQgPSBsYXlvdXQueCwgY2hhcnRSaWdodCA9IGxheW91dC54ICsgbGF5b3V0Lnc7XG4gIHZhciBjaGFydFRvcCA9IGxheW91dC55LCBjaGFydEJvdHRvbSA9IGxheW91dC55ICsgbGF5b3V0Lmg7XG4gIHZhciBkaXYgPSB0aGlzLmR5Z3JhcGhfLmdyYXBoRGl2O1xuICB2YXIgcG9zID0gRHlncmFwaC5maW5kUG9zKGRpdik7XG4gIHZhciBib3ggPSBbbGF5b3V0LnggKyBwb3MueCwgbGF5b3V0LnkgKyBwb3MueV07XG4gIGJveC5wdXNoKGJveFswXSArIGxheW91dC53KTtcbiAgYm94LnB1c2goYm94WzFdICsgbGF5b3V0LmgpO1xuXG4gIHZhciBnID0gdGhpcy5keWdyYXBoXztcblxuICB2YXIgdGhhdCA9IHRoaXM7XG4gICQuZWFjaCh0aGlzLmFubm90YXRpb25zXywgZnVuY3Rpb24gYW5ub3RhdGlvbnNMb29wXyhpZHgsIGEpIHtcbiAgICB2YXIgcm93X2NvbCA9IHRoYXQuZmluZFBvaW50SW5kZXhfKGEuc2VyaWVzLCBhLnh2YWwpO1xuICAgIGlmIChyb3dfY29sID09IG51bGwpIHtcbiAgICAgICQoW2EubGluZURpdiwgYS5pbmZvRGl2XSkuaGlkZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPKGRhbnZrKTogb25seSBkbyB0aGlzIGlmIHRoZXkncmUgaW52aXNpYmxlP1xuICAgICAgJChbYS5saW5lRGl2LCBhLmluZm9EaXZdKS5zaG93KCk7XG4gICAgfVxuICAgIHZhciB4eSA9IGcudG9Eb21Db29yZHMoYS54dmFsLCBnLmdldFZhbHVlKHJvd19jb2xbMF0sIHJvd19jb2xbMV0pKTtcbiAgICB2YXIgeCA9IHh5WzBdLCBwb2ludFkgPSB4eVsxXTtcblxuICAgIHZhciBsaW5lSGVpZ2h0ID0gNjsgIC8vIFRPRE8oZGFudmspOiBvcHRpb24/XG5cbiAgICB2YXIgeSA9IHBvaW50WTtcbiAgICBpZiAoYS55RnJhYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB5ID0gbGF5b3V0LnkgKyBsYXlvdXQuaCAqIGEueUZyYWM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHkgLT0gbGluZUhlaWdodDtcbiAgICB9XG5cbiAgICB2YXIgbGluZUhlaWdodCA9IHkgPCBwb2ludFkgPyAocG9pbnRZIC0geSkgOiAoeSAtIHBvaW50WSAtIGEuaW5mb0Rpdi5vZmZzZXRIZWlnaHQpO1xuICAgICQoYS5saW5lRGl2KS5jc3Moe1xuICAgICAgJ2xlZnQnOiB4ICsgJ3B4JyxcbiAgICAgICd0b3AnOiBNYXRoLm1pbih5LCBwb2ludFkpICsgJ3B4JyxcbiAgICAgICdoZWlnaHQnOiBsaW5lSGVpZ2h0ICsgJ3B4J1xuICAgIH0pO1xuICAgICQoYS5pbmZvRGl2KS5jc3Moe1xuICAgICAgJ2xlZnQnOiB4ICsgJ3B4JyxcbiAgICB9KTtcbiAgICBpZiAoIWEuaXNEcmFnZ2luZykge1xuICAgICAgLy8galF1ZXJ5IFVJIGRyYWdnYWJsZSBsaWtlcyB0byBzZXQgJ3RvcCcsIHdoZXJlYXMgc3VwZXJhbm5vdGF0aW9ucyBzZXRzXG4gICAgICAvLyAnYm90dG9tJy4gU2V0dGluZyBib3RoIHdpbGwgbWFrZSB0aGUgYW5ub3RhdGlvbiBncm93IGFuZCBjb250cmFjdCBhc1xuICAgICAgLy8gdGhlIHVzZXIgZHJhZ3MgaXQsIHdoaWNoIGxvb2tzIGJhZC5cbiAgICAgICQoYS5pbmZvRGl2KS5jc3Moe1xuICAgICAgICAnYm90dG9tJzogKGRpdi5vZmZzZXRIZWlnaHQgLSB5KSArICdweCdcbiAgICAgIH0pICAvLy5kcmFnZ2FibGUoXCJvcHRpb25cIiwgXCJjb250YWlubWVudFwiLCBib3gpO1xuXG4gICAgICB2YXIgdmlzaWJsZSA9ICh4ID49IGNoYXJ0TGVmdCAmJiB4IDw9IGNoYXJ0UmlnaHQpICYmXG4gICAgICAgICAgICAgICAgICAgIChwb2ludFkgPj0gY2hhcnRUb3AgJiYgcG9pbnRZIDw9IGNoYXJ0Qm90dG9tKTtcbiAgICAgICQoW2EuaW5mb0RpdiwgYS5saW5lRGl2XSkudG9nZ2xlKHZpc2libGUpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vLyBGaWxscyBvdXQgdGhlIGluZm8gZGl2IGJhc2VkIG9uIGN1cnJlbnQgY29vcmRpbmF0ZXMuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUudXBkYXRlQW5ub3RhdGlvbkluZm8gPSBmdW5jdGlvbiB1cGRhdGVBbm5vdGF0aW9uSW5mbygpIHtcbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuXG4gIHZhciB0aGF0ID0gdGhpcztcbiAgdmFyIHRlbXBsYXRlRGl2ID0gJCgnI2Fubm90YXRpb24tdGVtcGxhdGUnKS5nZXQoMCk7XG4gICQuZWFjaCh0aGlzLmFubm90YXRpb25zXywgZnVuY3Rpb24gYW5ub3RhdGlvbnNMb29wXyhpZHgsIGEpIHtcbiAgICAvLyBXZSBzaG91bGQgbmV2ZXIgdXBkYXRlIGFuIGVkaXRhYmxlIGRpdiAtLSBkb2luZyBzbyBtYXkga2lsbCB1bnNhdmVkXG4gICAgLy8gZWRpdHMgdG8gYW4gYW5ub3RhdGlvbi5cbiAgICAkKGEuaW5mb0RpdikudG9nZ2xlQ2xhc3MoJ2VkaXRhYmxlJywgISFhLmVkaXRhYmxlKTtcbiAgICBpZiAoYS5lZGl0YWJsZSkgcmV0dXJuO1xuICAgIGEuaW5mb0Rpdi5pbm5lckhUTUwgPSB0aGF0LmdldFRlbXBsYXRlSFRNTCh0ZW1wbGF0ZURpdiwgYSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyFBbm5vdGF0aW9ufSBhIEludGVybmFsIGFubm90YXRpb25cbiAqIEByZXR1cm4geyFQdWJsaWNBbm5vdGF0aW9ufSBhIHZpZXcgb2YgdGhlIGFubm90YXRpb24gZm9yIHRoZSBwdWJsaWMgQVBJLlxuICovXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuY3JlYXRlUHVibGljQW5ub3RhdGlvbl8gPSBmdW5jdGlvbiBjcmVhdGVQdWJsaWNBbm5vdGF0aW9uXyhhLCBvcHRfcHJvcHMpIHtcbiAgdmFyIGRpc3BsYXlBbm5vdGF0aW9uID0gJC5leHRlbmQoe30sIGEsIG9wdF9wcm9wcyk7XG4gIGRlbGV0ZSBkaXNwbGF5QW5ub3RhdGlvblsnaW5mb0RpdiddO1xuICBkZWxldGUgZGlzcGxheUFubm90YXRpb25bJ2xpbmVEaXYnXTtcbiAgZGVsZXRlIGRpc3BsYXlBbm5vdGF0aW9uWydpc0RyYWdnaW5nJ107XG4gIGRlbGV0ZSBkaXNwbGF5QW5ub3RhdGlvblsnZWRpdGFibGUnXTtcbiAgcmV0dXJuIGRpc3BsYXlBbm5vdGF0aW9uO1xufTtcblxuLy8gRmlsbCBvdXQgYSBkaXYgdXNpbmcgdGhlIHZhbHVlcyBpbiB0aGUgYW5ub3RhdGlvbiBvYmplY3QuXG4vLyBUaGUgZGl2J3MgaHRtbCBpcyBleHBlY3RlZCB0byBoYXZlIHRleHQgb2YgdGhlIGZvcm0gXCJ7e2tleX19XCJcbmFubm90YXRpb25zLnByb3RvdHlwZS5nZXRUZW1wbGF0ZUhUTUwgPSBmdW5jdGlvbiBnZXRUZW1wbGF0ZUhUTUwoZGl2LCBhKSB7XG4gIHZhciBnID0gdGhpcy5keWdyYXBoXztcbiAgdmFyIHJvd19jb2wgPSB0aGlzLmZpbmRQb2ludEluZGV4XyhhLnNlcmllcywgYS54dmFsKTtcbiAgaWYgKHJvd19jb2wgPT0gbnVsbCkgcmV0dXJuOyAgLy8gcGVyaGFwcyBpdCdzIG5vIGxvbmdlciBhIHJlYWwgcG9pbnQ/XG4gIHZhciByb3cgPSByb3dfY29sWzBdO1xuICB2YXIgY29sID0gcm93X2NvbFsxXTtcblxuICB2YXIgeU9wdFZpZXcgPSBnLm9wdGlvbnNWaWV3Rm9yQXhpc18oJ3kxJyk7ICAvLyBUT0RPOiBzdXBwb3J0IHNlY29uZGFyeSwgdG9vXG4gIHZhciB4T3B0VmlldyA9IGcub3B0aW9uc1ZpZXdGb3JBeGlzXygneCcpO1xuICB2YXIgeHZmID0gZy5nZXRPcHRpb25Gb3JBeGlzKCd2YWx1ZUZvcm1hdHRlcicsICd4Jyk7XG5cbiAgdmFyIHggPSB4dmYuY2FsbChnLCBhLnh2YWwsIHhPcHRWaWV3KTtcbiAgdmFyIHkgPSBnLmdldE9wdGlvbigndmFsdWVGb3JtYXR0ZXInLCBhLnNlcmllcykuY2FsbChcbiAgICAgIGcsIGcuZ2V0VmFsdWUocm93LCBjb2wpLCB5T3B0Vmlldyk7XG5cbiAgdmFyIGRpc3BsYXlBbm5vdGF0aW9uID0gdGhpcy5jcmVhdGVQdWJsaWNBbm5vdGF0aW9uXyhhLCB7eDp4LCB5Onl9KTtcbiAgdmFyIGh0bWwgPSBkaXYuaW5uZXJIVE1MO1xuICBmb3IgKHZhciBrIGluIGRpc3BsYXlBbm5vdGF0aW9uKSB7XG4gICAgdmFyIHYgPSBkaXNwbGF5QW5ub3RhdGlvbltrXTtcbiAgICBpZiAodHlwZW9mKHYpID09ICdvYmplY3QnKSBjb250aW51ZTsgIC8vIGUuZy4gaW5mb0RpdiBvciBsaW5lRGl2XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZShuZXcgUmVnRXhwKCdcXHtcXHsnICsgayArICdcXH1cXH0nLCAnZycpLCB2KTtcbiAgfVxuICByZXR1cm4gaHRtbDtcbn07XG5cbi8vIFVwZGF0ZSB0aGUgYW5ub3RhdGlvbiBvYmplY3QgYnkgbG9va2luZyBmb3IgZWxlbWVudHMgd2l0aCBhICdkZy1hbm4tZmllbGQnXG4vLyBhdHRyaWJ1dGUuIEZvciBleGFtcGxlLCA8aW5wdXQgdHlwZT0ndGV4dCcgZGctYW5uLWZpZWxkPSd0ZXh0JyAvPiB3aWxsIGhhdmVcbi8vIGl0cyB2YWx1ZSBwbGFjZWQgaW4gdGhlICd0ZXh0JyBhdHRyaWJ1dGUgb2YgdGhlIGFubm90YXRpb24uXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZXh0cmFjdFVwZGF0ZWRQcm9wZXJ0aWVzXyA9IGZ1bmN0aW9uIGV4dHJhY3RVcGRhdGVkUHJvcGVydGllc18oZGl2LCBhKSB7XG4gICQoZGl2KS5maW5kKCdbZGctYW5uLWZpZWxkXScpLmVhY2goZnVuY3Rpb24gZmllbGRMb29wXyhpZHgsIGVsKSB7XG4gICAgdmFyIGsgPSAkKGVsKS5hdHRyKCdkZy1hbm4tZmllbGQnKTtcbiAgICB2YXIgdiA9ICQoZWwpLnZhbCgpO1xuICAgIGFba10gPSB2O1xuICB9KTtcbn07XG5cbi8vIEFmdGVyIGEgcmVzaXplLCB0aGUgaGFpcmxpbmUgZGl2cyBjYW4gZ2V0IGRldHRhY2hlZCBmcm9tIHRoZSBjaGFydC5cbi8vIFRoaXMgcmVhdHRhY2hlcyB0aGVtLlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmF0dGFjaEFubm90YXRpb25zVG9DaGFydF8gPSBmdW5jdGlvbiBhdHRhY2hBbm5vdGF0aW9uc1RvQ2hhcnRfKCkge1xuICB2YXIgZGl2ID0gdGhpcy5keWdyYXBoXy5ncmFwaERpdjtcbiAgJC5lYWNoKHRoaXMuYW5ub3RhdGlvbnNfLCBmdW5jdGlvbiBhbm5vdGF0aW9uc0xvb3BfKGlkeCwgYSkge1xuICAgIC8vIFJlLWF0dGFjaGluZyBhbiBlZGl0YWJsZSBkaXYgdG8gdGhlIERPTSBjYW4gY2xlYXIgaXRzIGZvY3VzLlxuICAgIC8vIFRoaXMgbWFrZXMgdHlwaW5nIHJlYWxseSBkaWZmaWN1bHQhXG4gICAgaWYgKGEuZWRpdGFibGUpIHJldHVybjtcblxuICAgICQoW2EubGluZURpdiwgYS5pbmZvRGl2XSkuYXBwZW5kVG8oZGl2KTtcbiAgfSk7XG59O1xuXG4vLyBEZWxldGVzIGEgaGFpcmxpbmUgYW5kIHJlbW92ZXMgaXQgZnJvbSB0aGUgY2hhcnQuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUucmVtb3ZlQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIHJlbW92ZUFubm90YXRpb24oYSkge1xuICB2YXIgaWR4ID0gdGhpcy5hbm5vdGF0aW9uc18uaW5kZXhPZihhKTtcbiAgaWYgKGlkeCA+PSAwKSB7XG4gICAgdGhpcy5hbm5vdGF0aW9uc18uc3BsaWNlKGlkeCwgMSk7XG4gICAgJChbYS5saW5lRGl2LCBhLmluZm9EaXZdKS5yZW1vdmUoKTtcbiAgfSBlbHNlIHtcbiAgICBEeWdyYXBoLndhcm4oJ1RyaWVkIHRvIHJlbW92ZSBub24tZXhpc3RlbnQgYW5ub3RhdGlvbi4nKTtcbiAgfVxufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmRpZERyYXdDaGFydCA9IGZ1bmN0aW9uIGRpZERyYXdDaGFydChlKSB7XG4gIHZhciBnID0gZS5keWdyYXBoO1xuXG4gIC8vIEVhcmx5IG91dCBpbiB0aGUgKGNvbW1vbikgY2FzZSBvZiB6ZXJvIGFubm90YXRpb25zLlxuICBpZiAodGhpcy5hbm5vdGF0aW9uc18ubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zKCk7XG4gIHRoaXMuYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XygpO1xuICB0aGlzLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUucG9pbnRDbGljayA9IGZ1bmN0aW9uIHBvaW50Q2xpY2soZSkge1xuICAvLyBQcmV2ZW50IGFueSBvdGhlciBiZWhhdmlvciBiYXNlZCBvbiB0aGlzIGNsaWNrLCBlLmcuIGNyZWF0aW9uIG9mIGEgaGFpcmxpbmUuXG4gIGUucHJldmVudERlZmF1bHQoKTtcblxuICB2YXIgYSA9ICQuZXh0ZW5kKHt9LCB0aGlzLmRlZmF1bHRBbm5vdGF0aW9uUHJvcGVydGllc18sIHtcbiAgICBzZXJpZXM6IGUucG9pbnQubmFtZSxcbiAgICB4dmFsOiBlLnBvaW50Lnh2YWxcbiAgfSk7XG4gIHRoaXMuYW5ub3RhdGlvbnNfLnB1c2godGhpcy5jcmVhdGVBbm5vdGF0aW9uKGEpKTtcblxuICB0aGlzLnVwZGF0ZUFubm90YXRpb25EaXZQb3NpdGlvbnMoKTtcbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uSW5mbygpO1xuICB0aGlzLmF0dGFjaEFubm90YXRpb25zVG9DaGFydF8oKTtcblxuICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uQ3JlYXRlZCcsIGEpO1xuICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uc0NoYW5nZWQnLCB7fSk7XG5cbiAgLy8gQW5ub3RhdGlvbnMgc2hvdWxkIGJlZ2luIGxpZmUgZWRpdGFibGUuXG4gIHRoaXMubWFrZUFubm90YXRpb25FZGl0YWJsZShhKTtcbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgdGhpcy5kZXRhY2hMYWJlbHMoKTtcbn07XG5cbi8vIFB1YmxpYyBBUElcblxuLyoqXG4gKiBUaGlzIGlzIGEgcmVzdHJpY3RlZCB2aWV3IG9mIHRoaXMuYW5ub3RhdGlvbnNfIHdoaWNoIGRvZXNuJ3QgZXhwb3NlXG4gKiBpbXBsZW1lbnRhdGlvbiBkZXRhaWxzIGxpa2UgdGhlIGxpbmUgLyBpbmZvIGRpdnMuXG4gKlxuICogQHR5cGVkZWYge1xuICogICB4dmFsOiAgbnVtYmVyLCAgICAgIC8vIHgtdmFsdWUgKGkuZS4gbWlsbGlzIG9yIGEgcmF3IG51bWJlcilcbiAqICAgc2VyaWVzOiBzdHJpbmcsICAgICAvLyBzZXJpZXMgbmFtZVxuICogfSBQdWJsaWNBbm5vdGF0aW9uXG4gKi9cblxuLyoqXG4gKiBAcmV0dXJuIHshQXJyYXkuPCFQdWJsaWNBbm5vdGF0aW9uPn0gVGhlIGN1cnJlbnQgc2V0IG9mIGFubm90YXRpb25zLCBvcmRlcmVkXG4gKiAgICAgZnJvbSBiYWNrIHRvIGZyb250LlxuICovXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KCkge1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hbm5vdGF0aW9uc18ubGVuZ3RoOyBpKyspIHtcbiAgICByZXN1bHQucHVzaCh0aGlzLmNyZWF0ZVB1YmxpY0Fubm90YXRpb25fKHRoaXMuYW5ub3RhdGlvbnNfW2ldKSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsbGluZyB0aGlzIHdpbGwgcmVzdWx0IGluIGFuIGFubm90YXRpb25zQ2hhbmdlZCBldmVudCBiZWluZyB0cmlnZ2VyZWQsIG5vXG4gKiBtYXR0ZXIgd2hldGhlciBpdCBjb25zaXN0cyBvZiBhZGRpdGlvbnMsIGRlbGV0aW9ucywgbW92ZXMgb3Igbm8gY2hhbmdlcyBhdFxuICogYWxsLlxuICpcbiAqIEBwYXJhbSB7IUFycmF5LjwhUHVibGljQW5ub3RhdGlvbj59IGFubm90YXRpb25zIFRoZSBuZXcgc2V0IG9mIGFubm90YXRpb25zLFxuICogICAgIG9yZGVyZWQgZnJvbSBiYWNrIHRvIGZyb250LlxuICovXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KGFubm90YXRpb25zKSB7XG4gIC8vIFJlLXVzZSBkaXZzIGZyb20gdGhlIG9sZCBhbm5vdGF0aW9ucyBhcnJheSBzbyBmYXIgYXMgd2UgY2FuLlxuICAvLyBUaGV5J3JlIGFscmVhZHkgY29ycmVjdGx5IHotb3JkZXJlZC5cbiAgdmFyIGFueUNyZWF0ZWQgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBhID0gYW5ub3RhdGlvbnNbaV07XG5cbiAgICBpZiAodGhpcy5hbm5vdGF0aW9uc18ubGVuZ3RoID4gaSkge1xuICAgICAgLy8gT25seSB0aGUgZGl2cyBuZWVkIHRvIGJlIHByZXNlcnZlZC5cbiAgICAgIHZhciBvbGRBID0gdGhpcy5hbm5vdGF0aW9uc19baV07XG4gICAgICB0aGlzLmFubm90YXRpb25zX1tpXSA9ICQuZXh0ZW5kKHtcbiAgICAgICAgaW5mb0Rpdjogb2xkQS5pbmZvRGl2LFxuICAgICAgICBsaW5lRGl2OiBvbGRBLmxpbmVEaXZcbiAgICAgIH0sIGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFubm90YXRpb25zXy5wdXNoKHRoaXMuY3JlYXRlQW5ub3RhdGlvbihhKSk7XG4gICAgICBhbnlDcmVhdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBhbm5vdGF0aW9ucywgZGVzdHJveSB0aGVtLlxuICB3aGlsZSAoYW5ub3RhdGlvbnMubGVuZ3RoIDwgdGhpcy5hbm5vdGF0aW9uc18ubGVuZ3RoKSB7XG4gICAgdGhpcy5yZW1vdmVBbm5vdGF0aW9uKHRoaXMuYW5ub3RhdGlvbnNfW2Fubm90YXRpb25zLmxlbmd0aF0pO1xuICB9XG5cbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uRGl2UG9zaXRpb25zKCk7XG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkluZm8oKTtcbiAgaWYgKGFueUNyZWF0ZWQpIHtcbiAgICB0aGlzLmF0dGFjaEFubm90YXRpb25zVG9DaGFydF8oKTtcbiAgfVxuXG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25zQ2hhbmdlZCcsIHt9KTtcbn07XG5cbnJldHVybiBhbm5vdGF0aW9ucztcblxufSkoKTtcblxuLyogbG9hZGVyIHdyYXBwZXIgKi9cbkR5Z3JhcGguX3JlcXVpcmUuYWRkKCdkeWdyYXBocy9zcmMvZXh0cmFzL3N1cGVyLWFubm90YXRpb25zLmpzJywgLyogZXhwb3J0cyAqLyB7fSk7XG59KSgpO1xuIl0sIm1hcHBpbmdzIjoiOzs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxDQUFDLFNBQVNBLGdDQUFnQyxHQUFHO0VBQzdDLFlBQVk7O0VBQ1osSUFBSUMsT0FBTztFQUNYLElBQUlDLE1BQU0sQ0FBQ0QsT0FBTyxFQUFFO0lBQ2xCQSxPQUFPLEdBQUdDLE1BQU0sQ0FBQ0QsT0FBTztFQUMxQixDQUFDLE1BQU0sSUFBSSxPQUFPRSxNQUFPLEtBQUssV0FBVyxFQUFFO0lBQ3pDRixPQUFPLEdBQUdHLE9BQU8sQ0FBQyxZQUFZLENBQUM7SUFDL0IsSUFBSSxPQUFPSCxPQUFPLENBQUNJLElBQUssS0FBSyxXQUFXLElBQUksT0FBT0osT0FBTyxXQUFTLEtBQUssV0FBVyxFQUNqRkEsT0FBTyxHQUFHQSxPQUFPLFdBQVE7RUFDN0I7RUFDQTs7RUFFQUEsT0FBTyxDQUFDSyxPQUFPLENBQUNDLGdCQUFnQixHQUFJLFNBQVNDLGdDQUFnQyxHQUFHO0lBRWhGLFlBQVk7O0lBRVo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBRUEsSUFBSUMsV0FBVyxHQUFHLFNBQVNBLFdBQVcsQ0FBQ0MsV0FBVyxFQUFFO01BQ2xEO01BQ0EsSUFBSSxDQUFDQyxZQUFZLEdBQUcsRUFBRTtNQUN0QjtNQUNBLElBQUksQ0FBQ0MsVUFBVSxHQUFHLENBQUMsQ0FBQztNQUNwQixJQUFJLENBQUNDLFVBQVUsR0FBRyxDQUFDLENBQUM7TUFDcEIsSUFBSSxDQUFDQyxRQUFRLEdBQUcsSUFBSTtNQUVwQkosV0FBVyxHQUFHQSxXQUFXLElBQUksQ0FBQyxDQUFDO01BQy9CLElBQUksQ0FBQ0ssNEJBQTRCLEdBQUdDLENBQUMsQ0FBQ0MsTUFBTSxDQUFDO1FBQzNDLE1BQU0sRUFBRTtNQUNWLENBQUMsRUFBRVAsV0FBVyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVERCxXQUFXLENBQUNTLFNBQVMsQ0FBQ0MsUUFBUSxHQUFHLFNBQVNBLFFBQVEsR0FBRztNQUNuRCxPQUFPLHlCQUF5QjtJQUNsQyxDQUFDO0lBRURWLFdBQVcsQ0FBQ1MsU0FBUyxDQUFDRSxRQUFRLEdBQUcsU0FBU0EsUUFBUSxDQUFDQyxDQUFDLEVBQUU7TUFDcEQsSUFBSSxDQUFDUCxRQUFRLEdBQUdPLENBQUM7TUFDakIsSUFBSSxDQUFDVixZQUFZLEdBQUcsRUFBRTtNQUV0QixPQUFPO1FBQ0xXLFlBQVksRUFBRSxJQUFJLENBQUNBLFlBQVk7UUFDL0JDLFVBQVUsRUFBRSxJQUFJLENBQUNBLFVBQVUsQ0FBRTtNQUMvQixDQUFDO0lBQ0gsQ0FBQzs7SUFFRGQsV0FBVyxDQUFDUyxTQUFTLENBQUNNLFlBQVksR0FBRyxTQUFTQSxZQUFZLEdBQUc7TUFDM0QsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcsSUFBSSxDQUFDZCxZQUFZLENBQUNlLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUU7UUFDakQsSUFBSUUsQ0FBQyxHQUFHLElBQUksQ0FBQ2hCLFlBQVksQ0FBQ2MsQ0FBQyxDQUFDO1FBQzVCVCxDQUFDLENBQUNXLENBQUMsQ0FBQ0MsT0FBTyxDQUFDLENBQUNDLE1BQU0sRUFBRTtRQUNyQmIsQ0FBQyxDQUFDVyxDQUFDLENBQUNHLE9BQU8sQ0FBQyxDQUFDRCxNQUFNLEVBQUU7UUFDckIsSUFBSSxDQUFDbEIsWUFBWSxDQUFDYyxDQUFDLENBQUMsR0FBRyxJQUFJO01BQzdCO01BQ0EsSUFBSSxDQUFDZCxZQUFZLEdBQUcsRUFBRTtJQUN4QixDQUFDO0lBRURGLFdBQVcsQ0FBQ1MsU0FBUyxDQUFDYSxvQkFBb0IsR0FBRyxTQUFTQSxvQkFBb0IsQ0FBQ0osQ0FBQyxFQUFFSyxLQUFLLEVBQUVDLEVBQUUsRUFBRTtNQUN2RixJQUFJWixDQUFDLEdBQUcsSUFBSSxDQUFDUCxRQUFRO01BQ3JCLElBQUlvQixJQUFJLEdBQUdiLENBQUMsQ0FBQ2MsT0FBTyxFQUFFO01BQ3RCLElBQUlDLFFBQVEsR0FBR1QsQ0FBQyxDQUFDVSxLQUFLO01BRXRCLElBQUlQLE9BQU8sR0FBR0gsQ0FBQyxDQUFDRyxPQUFPO01BQ3ZCLElBQUlRLFFBQVEsR0FBRyxDQUFFUixPQUFPLENBQUNTLFNBQVMsR0FBR1QsT0FBTyxDQUFDVSxZQUFZLEdBQUlOLElBQUksQ0FBQ08sQ0FBQyxJQUFJUCxJQUFJLENBQUNRLENBQUM7TUFDN0UsSUFBSUosUUFBUSxJQUFJRixRQUFRLEVBQUU7TUFFMUJULENBQUMsQ0FBQ1UsS0FBSyxHQUFHQyxRQUFRO01BRWxCLElBQUksQ0FBQ0ssbUJBQW1CLENBQUNoQixDQUFDLENBQUM7TUFDM0IsSUFBSSxDQUFDaUIsNEJBQTRCLEVBQUU7TUFDbkMsSUFBSSxDQUFDQyxvQkFBb0IsRUFBRTtNQUMzQjdCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzhCLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRTtRQUN4Q0MsVUFBVSxFQUFFcEIsQ0FBQztRQUNiUyxRQUFRLEVBQUVBLFFBQVE7UUFDbEJFLFFBQVEsRUFBRVgsQ0FBQyxDQUFDVTtNQUNkLENBQUMsQ0FBQztNQUNGckIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDOEIsY0FBYyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRHJDLFdBQVcsQ0FBQ1MsU0FBUyxDQUFDOEIsc0JBQXNCLEdBQUcsU0FBU0Esc0JBQXNCLENBQUNyQixDQUFDLEVBQUU7TUFDaEYsSUFBSUEsQ0FBQyxDQUFDc0IsUUFBUSxJQUFJLElBQUksRUFBRTtNQUN4QixJQUFJLENBQUNOLG1CQUFtQixDQUFDaEIsQ0FBQyxDQUFDOztNQUUzQjtNQUNBO01BQ0FBLENBQUMsQ0FBQ3NCLFFBQVEsR0FBRyxJQUFJO01BQ2pCLElBQUlDLG1CQUFtQixHQUFHbEMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLENBQUNtQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ25FeEIsQ0FBQyxDQUFDRyxPQUFPLENBQUNzQixTQUFTLEdBQUcsSUFBSSxDQUFDQyxlQUFlLENBQUNILG1CQUFtQixFQUFFdkIsQ0FBQyxDQUFDO01BQ2xFWCxDQUFDLENBQUNXLENBQUMsQ0FBQ0csT0FBTyxDQUFDLENBQUN3QixXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQzNCLENBQUMsQ0FBQ3NCLFFBQVEsQ0FBQztNQUNsRGpDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzhCLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRW5CLENBQUMsQ0FBQztJQUNsRCxDQUFDOztJQUVEO0lBQ0E7SUFDQWxCLFdBQVcsQ0FBQ1MsU0FBUyxDQUFDcUMsZ0JBQWdCLEdBQUcsU0FBU0EsZ0JBQWdCLENBQUM1QixDQUFDLEVBQUU7TUFDcEUsSUFBSTZCLElBQUksR0FBRyxJQUFJO01BRWYsSUFBSUMsS0FBSyxHQUFHLElBQUksQ0FBQ0Msa0JBQWtCLENBQUMvQixDQUFDLENBQUNnQyxNQUFNLENBQUM7TUFFN0MsSUFBSUMsUUFBUSxHQUFHNUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDNkMsR0FBRyxDQUFDO1FBQzdCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsTUFBTSxFQUFFLEtBQUs7UUFDYixZQUFZLEVBQUUsT0FBTztRQUNyQixRQUFRLEVBQUUsTUFBTTtRQUNoQixVQUFVLEVBQUUsVUFBVTtRQUN0QjtRQUNBLGtCQUFrQixFQUFFSixLQUFLO1FBQ3pCLFNBQVMsRUFBRTtNQUNiLENBQUMsQ0FBQyxDQUFDSyxRQUFRLENBQUMseUJBQXlCLENBQUM7TUFFdEMsSUFBSUMsUUFBUSxHQUFHL0MsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUNnRCxLQUFLLEVBQUUsQ0FBQ0MsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDSixHQUFHLENBQUM7UUFDbEUsVUFBVSxFQUFFLFVBQVU7UUFDdEIsY0FBYyxFQUFFSixLQUFLO1FBQ3JCLFNBQVMsRUFBRTtNQUNiLENBQUMsQ0FBQyxDQUNEUyxJQUFJLEVBQUU7TUFFVGxELENBQUMsQ0FBQ0MsTUFBTSxDQUFDVSxDQUFDLEVBQUU7UUFDVkMsT0FBTyxFQUFFZ0MsUUFBUSxDQUFDVCxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hCckIsT0FBTyxFQUFFaUMsUUFBUSxDQUFDWixHQUFHLENBQUMsQ0FBQztNQUN6QixDQUFDLENBQUM7TUFFRixJQUFJZ0IsSUFBSSxHQUFHLElBQUk7TUFFZkosUUFBUSxDQUFDSyxTQUFTLENBQUM7UUFDakIsT0FBTyxFQUFFLFNBQVNDLGNBQWMsQ0FBQ3JDLEtBQUssRUFBRUMsRUFBRSxFQUFFO1VBQzFDakIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDNkMsR0FBRyxDQUFDO1lBQUMsUUFBUSxFQUFFO1VBQUUsQ0FBQyxDQUFDO1VBQzNCbEMsQ0FBQyxDQUFDMkMsVUFBVSxHQUFHLElBQUk7UUFDckIsQ0FBQztRQUNELE1BQU0sRUFBRSxTQUFTQyxhQUFhLENBQUN2QyxLQUFLLEVBQUVDLEVBQUUsRUFBRTtVQUN4Q3VCLElBQUksQ0FBQ3pCLG9CQUFvQixDQUFDSixDQUFDLEVBQUVLLEtBQUssRUFBRUMsRUFBRSxDQUFDO1FBQ3pDLENBQUM7UUFDRCxNQUFNLEVBQUUsU0FBU3VDLGFBQWEsQ0FBQ3hDLEtBQUssRUFBRUMsRUFBRSxFQUFFO1VBQ3hDakIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDNkMsR0FBRyxDQUFDO1lBQUMsS0FBSyxFQUFFO1VBQUUsQ0FBQyxDQUFDO1VBQ3hCbEMsQ0FBQyxDQUFDMkMsVUFBVSxHQUFHLEtBQUs7VUFDcEJkLElBQUksQ0FBQ1osNEJBQTRCLEVBQUU7UUFDckMsQ0FBQztRQUNELE1BQU0sRUFBRSxHQUFHO1FBQ1gsYUFBYSxFQUFFO01BQ2pCLENBQUMsQ0FBQzs7TUFFRjtNQUNBbUIsUUFBUSxDQUFDVSxFQUFFLENBQUMsT0FBTyxFQUFFLHlCQUF5QixFQUFFLFNBQVNDLFNBQVMsR0FBRztRQUNuRVAsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQ2hELENBQUMsQ0FBQztRQUN4QlgsQ0FBQyxDQUFDbUQsSUFBSSxDQUFDLENBQUNyQixjQUFjLENBQUMsbUJBQW1CLEVBQUVuQixDQUFDLENBQUM7UUFDOUNYLENBQUMsQ0FBQ21ELElBQUksQ0FBQyxDQUFDckIsY0FBYyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDO01BQ2xELENBQUMsQ0FBQztNQUVGaUIsUUFBUSxDQUFDVSxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVNHLFFBQVEsR0FBRztRQUMxQ1QsSUFBSSxDQUFDbkIsc0JBQXNCLENBQUNyQixDQUFDLENBQUM7TUFDaEMsQ0FBQyxDQUFDO01BQ0ZvQyxRQUFRLENBQUNVLEVBQUUsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsU0FBU0ksV0FBVyxHQUFHO1FBQ2hFckIsSUFBSSxDQUFDc0IseUJBQXlCLENBQUNmLFFBQVEsQ0FBQ1osR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFeEIsQ0FBQyxDQUFDO1FBQ2xEQSxDQUFDLENBQUNzQixRQUFRLEdBQUcsS0FBSztRQUNsQk8sSUFBSSxDQUFDWCxvQkFBb0IsRUFBRTtRQUMzQjdCLENBQUMsQ0FBQ21ELElBQUksQ0FBQyxDQUFDckIsY0FBYyxDQUFDLGtCQUFrQixFQUFFbkIsQ0FBQyxDQUFDO1FBQzdDWCxDQUFDLENBQUNtRCxJQUFJLENBQUMsQ0FBQ3JCLGNBQWMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNsRCxDQUFDLENBQUM7TUFDRmlCLFFBQVEsQ0FBQ1UsRUFBRSxDQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxTQUFTTSxXQUFXLEdBQUc7UUFDaEVwRCxDQUFDLENBQUNzQixRQUFRLEdBQUcsS0FBSztRQUNsQk8sSUFBSSxDQUFDWCxvQkFBb0IsRUFBRTtRQUMzQjdCLENBQUMsQ0FBQ21ELElBQUksQ0FBQyxDQUFDckIsY0FBYyxDQUFDLHNCQUFzQixFQUFFbkIsQ0FBQyxDQUFDO01BQ25ELENBQUMsQ0FBQztNQUVGLE9BQU9BLENBQUM7SUFDVixDQUFDOztJQUVEO0lBQ0E7SUFDQTtJQUNBO0lBQ0FsQixXQUFXLENBQUNTLFNBQVMsQ0FBQzhELGVBQWUsR0FBRyxTQUFTQSxlQUFlLENBQUNyQixNQUFNLEVBQUVzQixJQUFJLEVBQUU7TUFDN0UsSUFBSUMsR0FBRyxHQUFHLElBQUksQ0FBQ3BFLFFBQVEsQ0FBQ3FFLFNBQVMsRUFBRSxDQUFDQyxPQUFPLENBQUN6QixNQUFNLENBQUM7TUFDbkQsSUFBSXVCLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUk7TUFFMUIsSUFBSUcsTUFBTSxHQUFHLENBQUM7UUFBRUMsT0FBTyxHQUFHLElBQUksQ0FBQ3hFLFFBQVEsQ0FBQ3lFLE9BQU8sRUFBRSxHQUFHLENBQUM7TUFDckQsT0FBT0YsTUFBTSxJQUFJQyxPQUFPLEVBQUU7UUFDeEIsSUFBSUUsR0FBRyxHQUFHQyxJQUFJLENBQUNDLEtBQUssQ0FBQyxDQUFDTCxNQUFNLEdBQUdDLE9BQU8sSUFBSSxDQUFDLENBQUM7UUFDNUMsSUFBSUssTUFBTSxHQUFHLElBQUksQ0FBQzdFLFFBQVEsQ0FBQzhFLFFBQVEsQ0FBQ0osR0FBRyxFQUFFLENBQUMsQ0FBQztRQUMzQyxJQUFJRyxNQUFNLElBQUlWLElBQUksRUFBRTtVQUNsQixPQUFPLENBQUNPLEdBQUcsRUFBRU4sR0FBRyxDQUFDO1FBQ25CLENBQUMsTUFBTSxJQUFJUyxNQUFNLEdBQUdWLElBQUksRUFBRTtVQUN4QkksTUFBTSxHQUFHRyxHQUFHLEdBQUcsQ0FBQztRQUNsQixDQUFDLE1BQU07VUFDTEYsT0FBTyxHQUFHRSxHQUFHLEdBQUcsQ0FBQztRQUNuQjtNQUNGO01BQ0EsT0FBTyxJQUFJO0lBQ2IsQ0FBQztJQUVEL0UsV0FBVyxDQUFDUyxTQUFTLENBQUN3QyxrQkFBa0IsR0FBRyxTQUFTQSxrQkFBa0IsQ0FBQ0MsTUFBTSxFQUFFO01BQzdFLElBQUlrQyxNQUFNLEdBQUcsSUFBSSxDQUFDL0UsUUFBUSxDQUFDZ0YsU0FBUyxFQUFFO01BQ3RDLElBQUlaLEdBQUcsR0FBRyxJQUFJLENBQUNwRSxRQUFRLENBQUNxRSxTQUFTLEVBQUUsQ0FBQ0MsT0FBTyxDQUFDekIsTUFBTSxDQUFDO01BQ25ELElBQUl1QixHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJO01BRTFCLE9BQU9XLE1BQU0sQ0FBQyxDQUFDWCxHQUFHLEdBQUcsQ0FBQyxJQUFJVyxNQUFNLENBQUNuRSxNQUFNLENBQUM7SUFDMUMsQ0FBQzs7SUFFRDtJQUNBakIsV0FBVyxDQUFDUyxTQUFTLENBQUN5QixtQkFBbUIsR0FBRyxTQUFTQSxtQkFBbUIsQ0FBQ2hCLENBQUMsRUFBRTtNQUMxRSxJQUFJb0UsR0FBRyxHQUFHLElBQUksQ0FBQ2pGLFFBQVEsQ0FBQ2tGLFFBQVE7TUFDaENoRixDQUFDLENBQUNXLENBQUMsQ0FBQ0csT0FBTyxDQUFDLENBQUNtRSxRQUFRLENBQUNGLEdBQUcsQ0FBQztNQUMxQi9FLENBQUMsQ0FBQ1csQ0FBQyxDQUFDQyxPQUFPLENBQUMsQ0FBQ3FFLFFBQVEsQ0FBQ0YsR0FBRyxDQUFDO01BRTFCLElBQUlQLEdBQUcsR0FBRyxJQUFJLENBQUM3RSxZQUFZLENBQUN5RSxPQUFPLENBQUN6RCxDQUFDLENBQUM7TUFDdEMsSUFBSSxDQUFDaEIsWUFBWSxDQUFDdUYsTUFBTSxDQUFDVixHQUFHLEVBQUUsQ0FBQyxDQUFDO01BQ2hDLElBQUksQ0FBQzdFLFlBQVksQ0FBQ3dGLElBQUksQ0FBQ3hFLENBQUMsQ0FBQztJQUMzQixDQUFDOztJQUVEO0lBQ0FsQixXQUFXLENBQUNTLFNBQVMsQ0FBQzBCLDRCQUE0QixHQUFHLFNBQVNBLDRCQUE0QixHQUFHO01BQzNGLElBQUl3RCxNQUFNLEdBQUcsSUFBSSxDQUFDdEYsUUFBUSxDQUFDcUIsT0FBTyxFQUFFO01BQ3BDLElBQUlrRSxTQUFTLEdBQUdELE1BQU0sQ0FBQ0UsQ0FBQztRQUFFQyxVQUFVLEdBQUdILE1BQU0sQ0FBQ0UsQ0FBQyxHQUFHRixNQUFNLENBQUNJLENBQUM7TUFDMUQsSUFBSUMsUUFBUSxHQUFHTCxNQUFNLENBQUMzRCxDQUFDO1FBQUVpRSxXQUFXLEdBQUdOLE1BQU0sQ0FBQzNELENBQUMsR0FBRzJELE1BQU0sQ0FBQzFELENBQUM7TUFDMUQsSUFBSXFELEdBQUcsR0FBRyxJQUFJLENBQUNqRixRQUFRLENBQUNrRixRQUFRO01BQ2hDLElBQUlXLEdBQUcsR0FBRzFHLE9BQU8sQ0FBQzJHLE9BQU8sQ0FBQ2IsR0FBRyxDQUFDO01BQzlCLElBQUljLEdBQUcsR0FBRyxDQUFDVCxNQUFNLENBQUNFLENBQUMsR0FBR0ssR0FBRyxDQUFDTCxDQUFDLEVBQUVGLE1BQU0sQ0FBQzNELENBQUMsR0FBR2tFLEdBQUcsQ0FBQ2xFLENBQUMsQ0FBQztNQUM5Q29FLEdBQUcsQ0FBQ1YsSUFBSSxDQUFDVSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUdULE1BQU0sQ0FBQ0ksQ0FBQyxDQUFDO01BQzNCSyxHQUFHLENBQUNWLElBQUksQ0FBQ1UsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHVCxNQUFNLENBQUMxRCxDQUFDLENBQUM7TUFFM0IsSUFBSXJCLENBQUMsR0FBRyxJQUFJLENBQUNQLFFBQVE7TUFFckIsSUFBSXFELElBQUksR0FBRyxJQUFJO01BQ2ZuRCxDQUFDLENBQUM4RixJQUFJLENBQUMsSUFBSSxDQUFDbkcsWUFBWSxFQUFFLFNBQVNvRyxnQkFBZ0IsQ0FBQ3ZCLEdBQUcsRUFBRTdELENBQUMsRUFBRTtRQUMxRCxJQUFJcUYsT0FBTyxHQUFHN0MsSUFBSSxDQUFDYSxlQUFlLENBQUNyRCxDQUFDLENBQUNnQyxNQUFNLEVBQUVoQyxDQUFDLENBQUNzRCxJQUFJLENBQUM7UUFDcEQsSUFBSStCLE9BQU8sSUFBSSxJQUFJLEVBQUU7VUFDbkJoRyxDQUFDLENBQUMsQ0FBQ1csQ0FBQyxDQUFDQyxPQUFPLEVBQUVELENBQUMsQ0FBQ0csT0FBTyxDQUFDLENBQUMsQ0FBQ21GLElBQUksRUFBRTtVQUNoQztRQUNGLENBQUMsTUFBTTtVQUNMO1VBQ0FqRyxDQUFDLENBQUMsQ0FBQ1csQ0FBQyxDQUFDQyxPQUFPLEVBQUVELENBQUMsQ0FBQ0csT0FBTyxDQUFDLENBQUMsQ0FBQ29DLElBQUksRUFBRTtRQUNsQztRQUNBLElBQUlnRCxFQUFFLEdBQUc3RixDQUFDLENBQUM4RixXQUFXLENBQUN4RixDQUFDLENBQUNzRCxJQUFJLEVBQUU1RCxDQUFDLENBQUN1RSxRQUFRLENBQUNvQixPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUVBLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUlWLENBQUMsR0FBR1ksRUFBRSxDQUFDLENBQUMsQ0FBQztVQUFFRSxNQUFNLEdBQUdGLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFN0IsSUFBSUcsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFFOztRQUVyQixJQUFJNUUsQ0FBQyxHQUFHMkUsTUFBTTtRQUNkLElBQUl6RixDQUFDLENBQUNVLEtBQUssS0FBS2lGLFNBQVMsRUFBRTtVQUN6QjdFLENBQUMsR0FBRzJELE1BQU0sQ0FBQzNELENBQUMsR0FBRzJELE1BQU0sQ0FBQzFELENBQUMsR0FBR2YsQ0FBQyxDQUFDVSxLQUFLO1FBQ25DLENBQUMsTUFBTTtVQUNMSSxDQUFDLElBQUk0RSxVQUFVO1FBQ2pCO1FBRUEsSUFBSUEsVUFBVSxHQUFHNUUsQ0FBQyxHQUFHMkUsTUFBTSxHQUFJQSxNQUFNLEdBQUczRSxDQUFDLEdBQUtBLENBQUMsR0FBRzJFLE1BQU0sR0FBR3pGLENBQUMsQ0FBQ0csT0FBTyxDQUFDVSxZQUFhO1FBQ2xGeEIsQ0FBQyxDQUFDVyxDQUFDLENBQUNDLE9BQU8sQ0FBQyxDQUFDaUMsR0FBRyxDQUFDO1VBQ2YsTUFBTSxFQUFFeUMsQ0FBQyxHQUFHLElBQUk7VUFDaEIsS0FBSyxFQUFFYixJQUFJLENBQUM4QixHQUFHLENBQUM5RSxDQUFDLEVBQUUyRSxNQUFNLENBQUMsR0FBRyxJQUFJO1VBQ2pDLFFBQVEsRUFBRUMsVUFBVSxHQUFHO1FBQ3pCLENBQUMsQ0FBQztRQUNGckcsQ0FBQyxDQUFDVyxDQUFDLENBQUNHLE9BQU8sQ0FBQyxDQUFDK0IsR0FBRyxDQUFDO1VBQ2YsTUFBTSxFQUFFeUMsQ0FBQyxHQUFHO1FBQ2QsQ0FBQyxDQUFDO1FBQ0YsSUFBSSxDQUFDM0UsQ0FBQyxDQUFDMkMsVUFBVSxFQUFFO1VBQ2pCO1VBQ0E7VUFDQTtVQUNBdEQsQ0FBQyxDQUFDVyxDQUFDLENBQUNHLE9BQU8sQ0FBQyxDQUFDK0IsR0FBRyxDQUFDO1lBQ2YsUUFBUSxFQUFHa0MsR0FBRyxDQUFDdkQsWUFBWSxHQUFHQyxDQUFDLEdBQUk7VUFDckMsQ0FBQyxDQUFDLEVBQUU7O1VBRUosSUFBSStFLE9BQU8sR0FBSWxCLENBQUMsSUFBSUQsU0FBUyxJQUFJQyxDQUFDLElBQUlDLFVBQVUsSUFDakNhLE1BQU0sSUFBSVgsUUFBUSxJQUFJVyxNQUFNLElBQUlWLFdBQVk7VUFDM0QxRixDQUFDLENBQUMsQ0FBQ1csQ0FBQyxDQUFDRyxPQUFPLEVBQUVILENBQUMsQ0FBQ0MsT0FBTyxDQUFDLENBQUMsQ0FBQzZGLE1BQU0sQ0FBQ0QsT0FBTyxDQUFDO1FBQzNDO01BQ0YsQ0FBQyxDQUFDO0lBQ0osQ0FBQzs7SUFFRDtJQUNBL0csV0FBVyxDQUFDUyxTQUFTLENBQUMyQixvQkFBb0IsR0FBRyxTQUFTQSxvQkFBb0IsR0FBRztNQUMzRSxJQUFJeEIsQ0FBQyxHQUFHLElBQUksQ0FBQ1AsUUFBUTtNQUVyQixJQUFJcUQsSUFBSSxHQUFHLElBQUk7TUFDZixJQUFJdUQsV0FBVyxHQUFHMUcsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUNtQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ2xEbkMsQ0FBQyxDQUFDOEYsSUFBSSxDQUFDLElBQUksQ0FBQ25HLFlBQVksRUFBRSxTQUFTb0csZ0JBQWdCLENBQUN2QixHQUFHLEVBQUU3RCxDQUFDLEVBQUU7UUFDMUQ7UUFDQTtRQUNBWCxDQUFDLENBQUNXLENBQUMsQ0FBQ0csT0FBTyxDQUFDLENBQUN3QixXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQzNCLENBQUMsQ0FBQ3NCLFFBQVEsQ0FBQztRQUNsRCxJQUFJdEIsQ0FBQyxDQUFDc0IsUUFBUSxFQUFFO1FBQ2hCdEIsQ0FBQyxDQUFDRyxPQUFPLENBQUNzQixTQUFTLEdBQUdlLElBQUksQ0FBQ2QsZUFBZSxDQUFDcUUsV0FBVyxFQUFFL0YsQ0FBQyxDQUFDO01BQzVELENBQUMsQ0FBQztJQUNKLENBQUM7O0lBRUQ7QUFDQTtBQUNBO0FBQ0E7SUFDQWxCLFdBQVcsQ0FBQ1MsU0FBUyxDQUFDeUcsdUJBQXVCLEdBQUcsU0FBU0EsdUJBQXVCLENBQUNoRyxDQUFDLEVBQUVpRyxTQUFTLEVBQUU7TUFDN0YsSUFBSUMsaUJBQWlCLEdBQUc3RyxDQUFDLENBQUNDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRVUsQ0FBQyxFQUFFaUcsU0FBUyxDQUFDO01BQ2xELE9BQU9DLGlCQUFpQixDQUFDLFNBQVMsQ0FBQztNQUNuQyxPQUFPQSxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7TUFDbkMsT0FBT0EsaUJBQWlCLENBQUMsWUFBWSxDQUFDO01BQ3RDLE9BQU9BLGlCQUFpQixDQUFDLFVBQVUsQ0FBQztNQUNwQyxPQUFPQSxpQkFBaUI7SUFDMUIsQ0FBQzs7SUFFRDtJQUNBO0lBQ0FwSCxXQUFXLENBQUNTLFNBQVMsQ0FBQ21DLGVBQWUsR0FBRyxTQUFTQSxlQUFlLENBQUMwQyxHQUFHLEVBQUVwRSxDQUFDLEVBQUU7TUFDdkUsSUFBSU4sQ0FBQyxHQUFHLElBQUksQ0FBQ1AsUUFBUTtNQUNyQixJQUFJa0csT0FBTyxHQUFHLElBQUksQ0FBQ2hDLGVBQWUsQ0FBQ3JELENBQUMsQ0FBQ2dDLE1BQU0sRUFBRWhDLENBQUMsQ0FBQ3NELElBQUksQ0FBQztNQUNwRCxJQUFJK0IsT0FBTyxJQUFJLElBQUksRUFBRSxPQUFPLENBQUU7TUFDOUIsSUFBSWMsR0FBRyxHQUFHZCxPQUFPLENBQUMsQ0FBQyxDQUFDO01BQ3BCLElBQUk5QixHQUFHLEdBQUc4QixPQUFPLENBQUMsQ0FBQyxDQUFDO01BRXBCLElBQUllLFFBQVEsR0FBRzFHLENBQUMsQ0FBQzJHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUU7TUFDN0MsSUFBSUMsUUFBUSxHQUFHNUcsQ0FBQyxDQUFDMkcsbUJBQW1CLENBQUMsR0FBRyxDQUFDO01BQ3pDLElBQUlFLEdBQUcsR0FBRzdHLENBQUMsQ0FBQzhHLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQztNQUVuRCxJQUFJN0IsQ0FBQyxHQUFHNEIsR0FBRyxDQUFDRSxJQUFJLENBQUMvRyxDQUFDLEVBQUVNLENBQUMsQ0FBQ3NELElBQUksRUFBRWdELFFBQVEsQ0FBQztNQUNyQyxJQUFJeEYsQ0FBQyxHQUFHcEIsQ0FBQyxDQUFDZ0gsU0FBUyxDQUFDLGdCQUFnQixFQUFFMUcsQ0FBQyxDQUFDZ0MsTUFBTSxDQUFDLENBQUN5RSxJQUFJLENBQ2hEL0csQ0FBQyxFQUFFQSxDQUFDLENBQUN1RSxRQUFRLENBQUNrQyxHQUFHLEVBQUU1QyxHQUFHLENBQUMsRUFBRTZDLFFBQVEsQ0FBQztNQUV0QyxJQUFJRixpQkFBaUIsR0FBRyxJQUFJLENBQUNGLHVCQUF1QixDQUFDaEcsQ0FBQyxFQUFFO1FBQUMyRSxDQUFDLEVBQUNBLENBQUM7UUFBRTdELENBQUMsRUFBQ0E7TUFBQyxDQUFDLENBQUM7TUFDbkUsSUFBSTZGLElBQUksR0FBR3ZDLEdBQUcsQ0FBQzNDLFNBQVM7TUFDeEIsS0FBSyxJQUFJbUYsQ0FBQyxJQUFJVixpQkFBaUIsRUFBRTtRQUMvQixJQUFJVyxDQUFDLEdBQUdYLGlCQUFpQixDQUFDVSxDQUFDLENBQUM7UUFDNUIsSUFBSSxRQUFPQyxDQUFDLEtBQUssUUFBUSxFQUFFLFNBQVMsQ0FBRTtRQUN0Q0YsSUFBSSxHQUFHQSxJQUFJLENBQUNHLE9BQU8sQ0FBQyxJQUFJQyxNQUFNLENBQUMsTUFBTSxHQUFHSCxDQUFDLEdBQUcsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFQyxDQUFDLENBQUM7TUFDOUQ7TUFDQSxPQUFPRixJQUFJO0lBQ2IsQ0FBQzs7SUFFRDtJQUNBO0lBQ0E7SUFDQTdILFdBQVcsQ0FBQ1MsU0FBUyxDQUFDNEQseUJBQXlCLEdBQUcsU0FBU0EseUJBQXlCLENBQUNpQixHQUFHLEVBQUVwRSxDQUFDLEVBQUU7TUFDM0ZYLENBQUMsQ0FBQytFLEdBQUcsQ0FBQyxDQUFDNEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM3QixJQUFJLENBQUMsU0FBUzhCLFVBQVUsQ0FBQ3BELEdBQUcsRUFBRXFELEVBQUUsRUFBRTtRQUM5RCxJQUFJTixDQUFDLEdBQUd2SCxDQUFDLENBQUM2SCxFQUFFLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUNsQyxJQUFJTixDQUFDLEdBQUd4SCxDQUFDLENBQUM2SCxFQUFFLENBQUMsQ0FBQ0UsR0FBRyxFQUFFO1FBQ25CcEgsQ0FBQyxDQUFDNEcsQ0FBQyxDQUFDLEdBQUdDLENBQUM7TUFDVixDQUFDLENBQUM7SUFDSixDQUFDOztJQUVEO0lBQ0E7SUFDQS9ILFdBQVcsQ0FBQ1MsU0FBUyxDQUFDOEgseUJBQXlCLEdBQUcsU0FBU0EseUJBQXlCLEdBQUc7TUFDckYsSUFBSWpELEdBQUcsR0FBRyxJQUFJLENBQUNqRixRQUFRLENBQUNrRixRQUFRO01BQ2hDaEYsQ0FBQyxDQUFDOEYsSUFBSSxDQUFDLElBQUksQ0FBQ25HLFlBQVksRUFBRSxTQUFTb0csZ0JBQWdCLENBQUN2QixHQUFHLEVBQUU3RCxDQUFDLEVBQUU7UUFDMUQ7UUFDQTtRQUNBLElBQUlBLENBQUMsQ0FBQ3NCLFFBQVEsRUFBRTtRQUVoQmpDLENBQUMsQ0FBQyxDQUFDVyxDQUFDLENBQUNDLE9BQU8sRUFBRUQsQ0FBQyxDQUFDRyxPQUFPLENBQUMsQ0FBQyxDQUFDbUUsUUFBUSxDQUFDRixHQUFHLENBQUM7TUFDekMsQ0FBQyxDQUFDO0lBQ0osQ0FBQzs7SUFFRDtJQUNBdEYsV0FBVyxDQUFDUyxTQUFTLENBQUN5RCxnQkFBZ0IsR0FBRyxTQUFTQSxnQkFBZ0IsQ0FBQ2hELENBQUMsRUFBRTtNQUNwRSxJQUFJNkQsR0FBRyxHQUFHLElBQUksQ0FBQzdFLFlBQVksQ0FBQ3lFLE9BQU8sQ0FBQ3pELENBQUMsQ0FBQztNQUN0QyxJQUFJNkQsR0FBRyxJQUFJLENBQUMsRUFBRTtRQUNaLElBQUksQ0FBQzdFLFlBQVksQ0FBQ3VGLE1BQU0sQ0FBQ1YsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNoQ3hFLENBQUMsQ0FBQyxDQUFDVyxDQUFDLENBQUNDLE9BQU8sRUFBRUQsQ0FBQyxDQUFDRyxPQUFPLENBQUMsQ0FBQyxDQUFDRCxNQUFNLEVBQUU7TUFDcEMsQ0FBQyxNQUFNO1FBQ0w1QixPQUFPLENBQUNnSixJQUFJLENBQUMsMENBQTBDLENBQUM7TUFDMUQ7SUFDRixDQUFDO0lBRUR4SSxXQUFXLENBQUNTLFNBQVMsQ0FBQ0ksWUFBWSxHQUFHLFNBQVNBLFlBQVksQ0FBQzRILENBQUMsRUFBRTtNQUM1RCxJQUFJN0gsQ0FBQyxHQUFHNkgsQ0FBQyxDQUFDQyxPQUFPOztNQUVqQjtNQUNBLElBQUksSUFBSSxDQUFDeEksWUFBWSxDQUFDZSxNQUFNLEtBQUssQ0FBQyxFQUFFO01BRXBDLElBQUksQ0FBQ2tCLDRCQUE0QixFQUFFO01BQ25DLElBQUksQ0FBQ29HLHlCQUF5QixFQUFFO01BQ2hDLElBQUksQ0FBQ25HLG9CQUFvQixFQUFFO0lBQzdCLENBQUM7SUFFRHBDLFdBQVcsQ0FBQ1MsU0FBUyxDQUFDSyxVQUFVLEdBQUcsU0FBU0EsVUFBVSxDQUFDMkgsQ0FBQyxFQUFFO01BQ3hEO01BQ0FBLENBQUMsQ0FBQ0UsY0FBYyxFQUFFO01BRWxCLElBQUl6SCxDQUFDLEdBQUdYLENBQUMsQ0FBQ0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQ0YsNEJBQTRCLEVBQUU7UUFDdEQ0QyxNQUFNLEVBQUV1RixDQUFDLENBQUNHLEtBQUssQ0FBQ0MsSUFBSTtRQUNwQnJFLElBQUksRUFBRWlFLENBQUMsQ0FBQ0csS0FBSyxDQUFDcEU7TUFDaEIsQ0FBQyxDQUFDO01BQ0YsSUFBSSxDQUFDdEUsWUFBWSxDQUFDd0YsSUFBSSxDQUFDLElBQUksQ0FBQzVDLGdCQUFnQixDQUFDNUIsQ0FBQyxDQUFDLENBQUM7TUFFaEQsSUFBSSxDQUFDaUIsNEJBQTRCLEVBQUU7TUFDbkMsSUFBSSxDQUFDQyxvQkFBb0IsRUFBRTtNQUMzQixJQUFJLENBQUNtRyx5QkFBeUIsRUFBRTtNQUVoQ2hJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzhCLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRW5CLENBQUMsQ0FBQztNQUM5Q1gsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDOEIsY0FBYyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDOztNQUVoRDtNQUNBLElBQUksQ0FBQ0Usc0JBQXNCLENBQUNyQixDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEbEIsV0FBVyxDQUFDUyxTQUFTLENBQUNxSSxPQUFPLEdBQUcsU0FBU0EsT0FBTyxHQUFHO01BQ2pELElBQUksQ0FBQy9ILFlBQVksRUFBRTtJQUNyQixDQUFDOztJQUVEOztJQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFQTtBQUNBO0FBQ0E7QUFDQTtJQUNBZixXQUFXLENBQUNTLFNBQVMsQ0FBQ2lDLEdBQUcsR0FBRyxTQUFTQSxHQUFHLEdBQUc7TUFDekMsSUFBSXFHLE1BQU0sR0FBRyxFQUFFO01BQ2YsS0FBSyxJQUFJL0gsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHLElBQUksQ0FBQ2QsWUFBWSxDQUFDZSxNQUFNLEVBQUVELENBQUMsRUFBRSxFQUFFO1FBQ2pEK0gsTUFBTSxDQUFDckQsSUFBSSxDQUFDLElBQUksQ0FBQ3dCLHVCQUF1QixDQUFDLElBQUksQ0FBQ2hILFlBQVksQ0FBQ2MsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNqRTtNQUNBLE9BQU8rSCxNQUFNO0lBQ2YsQ0FBQzs7SUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0EvSSxXQUFXLENBQUNTLFNBQVMsQ0FBQ3VJLEdBQUcsR0FBRyxTQUFTQSxHQUFHLENBQUNoSixXQUFXLEVBQUU7TUFDcEQ7TUFDQTtNQUNBLElBQUlpSixVQUFVLEdBQUcsS0FBSztNQUN0QixLQUFLLElBQUlqSSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdoQixXQUFXLENBQUNpQixNQUFNLEVBQUVELENBQUMsRUFBRSxFQUFFO1FBQzNDLElBQUlFLENBQUMsR0FBR2xCLFdBQVcsQ0FBQ2dCLENBQUMsQ0FBQztRQUV0QixJQUFJLElBQUksQ0FBQ2QsWUFBWSxDQUFDZSxNQUFNLEdBQUdELENBQUMsRUFBRTtVQUNoQztVQUNBLElBQUlrSSxJQUFJLEdBQUcsSUFBSSxDQUFDaEosWUFBWSxDQUFDYyxDQUFDLENBQUM7VUFDL0IsSUFBSSxDQUFDZCxZQUFZLENBQUNjLENBQUMsQ0FBQyxHQUFHVCxDQUFDLENBQUNDLE1BQU0sQ0FBQztZQUM5QmEsT0FBTyxFQUFFNkgsSUFBSSxDQUFDN0gsT0FBTztZQUNyQkYsT0FBTyxFQUFFK0gsSUFBSSxDQUFDL0g7VUFDaEIsQ0FBQyxFQUFFRCxDQUFDLENBQUM7UUFDUCxDQUFDLE1BQU07VUFDTCxJQUFJLENBQUNoQixZQUFZLENBQUN3RixJQUFJLENBQUMsSUFBSSxDQUFDNUMsZ0JBQWdCLENBQUM1QixDQUFDLENBQUMsQ0FBQztVQUNoRCtILFVBQVUsR0FBRyxJQUFJO1FBQ25CO01BQ0Y7O01BRUE7TUFDQSxPQUFPakosV0FBVyxDQUFDaUIsTUFBTSxHQUFHLElBQUksQ0FBQ2YsWUFBWSxDQUFDZSxNQUFNLEVBQUU7UUFDcEQsSUFBSSxDQUFDaUQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDaEUsWUFBWSxDQUFDRixXQUFXLENBQUNpQixNQUFNLENBQUMsQ0FBQztNQUM5RDtNQUVBLElBQUksQ0FBQ2tCLDRCQUE0QixFQUFFO01BQ25DLElBQUksQ0FBQ0Msb0JBQW9CLEVBQUU7TUFDM0IsSUFBSTZHLFVBQVUsRUFBRTtRQUNkLElBQUksQ0FBQ1YseUJBQXlCLEVBQUU7TUFDbEM7TUFFQWhJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzhCLGNBQWMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsT0FBT3JDLFdBQVc7RUFFbEIsQ0FBQyxFQUFHOztFQUVKO0VBQ0FSLE9BQU8sQ0FBQzJKLFFBQVEsQ0FBQ0MsR0FBRyxDQUFDLDBDQUEwQyxFQUFFLGFBQWMsQ0FBQyxDQUFDLENBQUM7QUFDbEYsQ0FBQyxHQUFHIn0=