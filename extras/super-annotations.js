"use strict";

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
    'use strict';

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
      var $lineDiv = $('<div />').css({
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
        if (typeof v == 'object') continue; // e.g. infoDiv or lineDiv
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX3N1cGVyQW5ub3RhdGlvbnNfd3JhcHBlciIsIkR5Z3JhcGgiLCJ3aW5kb3ciLCJtb2R1bGUiLCJyZXF1aXJlIiwiTkFNRSIsIlBsdWdpbnMiLCJTdXBlckFubm90YXRpb25zIiwiX2V4dHJhc19zdXBlckFubm90YXRpb25zX2Nsb3N1cmUiLCJhbm5vdGF0aW9ucyIsIm9wdF9vcHRpb25zIiwiYW5ub3RhdGlvbnNfIiwibGFzdFdpZHRoXyIsImxhc3RIZWlnaHQiLCJkeWdyYXBoXyIsImRlZmF1bHRBbm5vdGF0aW9uUHJvcGVydGllc18iLCIkIiwiZXh0ZW5kIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJhY3RpdmF0ZSIsImciLCJkaWREcmF3Q2hhcnQiLCJwb2ludENsaWNrIiwiZGV0YWNoTGFiZWxzIiwiaSIsImxlbmd0aCIsImEiLCJsaW5lRGl2IiwicmVtb3ZlIiwiaW5mb0RpdiIsImFubm90YXRpb25XYXNEcmFnZ2VkIiwiZXZlbnQiLCJ1aSIsImFyZWEiLCJnZXRBcmVhIiwib2xkWUZyYWMiLCJ5RnJhYyIsIm5ld1lGcmFjIiwib2Zmc2V0VG9wIiwib2Zmc2V0SGVpZ2h0IiwieSIsImgiLCJtb3ZlQW5ub3RhdGlvblRvVG9wIiwidXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucyIsInVwZGF0ZUFubm90YXRpb25JbmZvIiwidHJpZ2dlckhhbmRsZXIiLCJhbm5vdGF0aW9uIiwibWFrZUFubm90YXRpb25FZGl0YWJsZSIsImVkaXRhYmxlIiwiZWRpdGFibGVUZW1wbGF0ZURpdiIsImdldCIsImlubmVySFRNTCIsImdldFRlbXBsYXRlSFRNTCIsInRvZ2dsZUNsYXNzIiwiY3JlYXRlQW5ub3RhdGlvbiIsInNlbGYiLCJjb2xvciIsImdldENvbG9yRm9yU2VyaWVzXyIsInNlcmllcyIsIiRsaW5lRGl2IiwiY3NzIiwiYWRkQ2xhc3MiLCIkaW5mb0RpdiIsImNsb25lIiwicmVtb3ZlQXR0ciIsInNob3ciLCJ0aGF0IiwiZHJhZ2dhYmxlIiwiZHJhZ2dhYmxlU3RhcnQiLCJpc0RyYWdnaW5nIiwiZHJhZ2dhYmxlRHJhZyIsImRyYWdnYWJsZVN0b3AiLCJvbiIsImNsaWNrS2lsbCIsInJlbW92ZUFubm90YXRpb24iLCJkYmxjbGljayIsImNsaWNrVXBkYXRlIiwiZXh0cmFjdFVwZGF0ZWRQcm9wZXJ0aWVzXyIsImNsaWNrQ2FuY2VsIiwiZmluZFBvaW50SW5kZXhfIiwieHZhbCIsImNvbCIsImdldExhYmVscyIsImluZGV4T2YiLCJsb3dJZHgiLCJoaWdoSWR4IiwibnVtUm93cyIsImlkeCIsIk1hdGgiLCJmbG9vciIsInhBdElkeCIsImdldFZhbHVlIiwiY29sb3JzIiwiZ2V0Q29sb3JzIiwiZGl2IiwiZ3JhcGhEaXYiLCJhcHBlbmRUbyIsInNwbGljZSIsInB1c2giLCJsYXlvdXQiLCJjaGFydExlZnQiLCJ4IiwiY2hhcnRSaWdodCIsInciLCJjaGFydFRvcCIsImNoYXJ0Qm90dG9tIiwicG9zIiwiZmluZFBvcyIsImJveCIsImVhY2giLCJhbm5vdGF0aW9uc0xvb3BfIiwicm93X2NvbCIsImhpZGUiLCJ4eSIsInRvRG9tQ29vcmRzIiwicG9pbnRZIiwibGluZUhlaWdodCIsInVuZGVmaW5lZCIsIm1pbiIsInZpc2libGUiLCJ0b2dnbGUiLCJ0ZW1wbGF0ZURpdiIsImNyZWF0ZVB1YmxpY0Fubm90YXRpb25fIiwib3B0X3Byb3BzIiwiZGlzcGxheUFubm90YXRpb24iLCJyb3ciLCJ5T3B0VmlldyIsIm9wdGlvbnNWaWV3Rm9yQXhpc18iLCJ4T3B0VmlldyIsInh2ZiIsImdldE9wdGlvbkZvckF4aXMiLCJjYWxsIiwiZ2V0T3B0aW9uIiwiaHRtbCIsImsiLCJ2IiwicmVwbGFjZSIsIlJlZ0V4cCIsImZpbmQiLCJmaWVsZExvb3BfIiwiZWwiLCJhdHRyIiwidmFsIiwiYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XyIsIndhcm4iLCJlIiwiZHlncmFwaCIsInByZXZlbnREZWZhdWx0IiwicG9pbnQiLCJuYW1lIiwiZGVzdHJveSIsInJlc3VsdCIsInNldCIsImFueUNyZWF0ZWQiLCJvbGRBIiwiX3JlcXVpcmUiLCJhZGQiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvZXh0cmFzL3N1cGVyLWFubm90YXRpb25zLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDEzIERhbiBWYW5kZXJrYW0gKGRhbnZka0BnbWFpbC5jb20pXG4gKiBNSVQtbGljZW5jZWQ6IGh0dHBzOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKlxuICogTm90ZTogVGhpcyBwbHVnaW4gcmVxdWlyZXMgalF1ZXJ5IGFuZCBqUXVlcnkgVUkgRHJhZ2dhYmxlLlxuICpcbiAqIFNlZSBoaWdoLWxldmVsIGRvY3VtZW50YXRpb24gYXQgLi4vLi4vZG9jcy9oYWlybGluZXMtYW5ub3RhdGlvbnMucGRmXG4gKi9cblxuLyogbG9hZGVyIHdyYXBwZXIgdG8gYWxsb3cgYnJvd3NlciB1c2UgYW5kIEVTNiBpbXBvcnRzICovXG4oZnVuY3Rpb24gX2V4dHJhc19zdXBlckFubm90YXRpb25zX3dyYXBwZXIoKSB7XG4ndXNlIHN0cmljdCc7XG52YXIgRHlncmFwaDtcbmlmICh3aW5kb3cuRHlncmFwaCkge1xuICBEeWdyYXBoID0gd2luZG93LkR5Z3JhcGg7XG59IGVsc2UgaWYgKHR5cGVvZihtb2R1bGUpICE9PSAndW5kZWZpbmVkJykge1xuICBEeWdyYXBoID0gcmVxdWlyZSgnLi4vZHlncmFwaCcpO1xuICBpZiAodHlwZW9mKER5Z3JhcGguTkFNRSkgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZihEeWdyYXBoLmRlZmF1bHQpICE9PSAndW5kZWZpbmVkJylcbiAgICBEeWdyYXBoID0gRHlncmFwaC5kZWZhdWx0O1xufVxuLyogZW5kIG9mIGxvYWRlciB3cmFwcGVyIGhlYWRlciAqL1xuXG5EeWdyYXBoLlBsdWdpbnMuU3VwZXJBbm5vdGF0aW9ucyA9IChmdW5jdGlvbiBfZXh0cmFzX3N1cGVyQW5ub3RhdGlvbnNfY2xvc3VyZSgpIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZXNlIGFyZSBqdXN0IHRoZSBiYXNpYyByZXF1aXJlbWVudHMgLS0gYW5ub3RhdGlvbnMgY2FuIGhhdmUgd2hhdGV2ZXIgb3RoZXJcbiAqIHByb3BlcnRpZXMgdGhlIGNvZGUgdGhhdCBkaXNwbGF5cyB0aGVtIHdhbnRzIHRoZW0gdG8gaGF2ZS5cbiAqXG4gKiBAdHlwZWRlZiB7XG4gKiAgIHh2YWw6ICBudW1iZXIsICAgICAgLy8geC12YWx1ZSAoaS5lLiBtaWxsaXMgb3IgYSByYXcgbnVtYmVyKVxuICogICBzZXJpZXM6IHN0cmluZywgICAgIC8vIHNlcmllcyBuYW1lXG4gKiAgIHlGcmFjOiA/bnVtYmVyLCAgICAgLy8geS1wb3NpdGlvbmluZy4gRGVmYXVsdCBpcyBhIGZldyBweCBhYm92ZSB0aGUgcG9pbnQuXG4gKiAgIGxpbmVEaXY6ICFFbGVtZW50ICAgLy8gdmVydGljYWwgZGl2IGNvbm5lY3RpbmcgcG9pbnQgdG8gaW5mbyBkaXYuXG4gKiAgIGluZm9EaXY6ICFFbGVtZW50ICAgLy8gZGl2IGNvbnRhaW5pbmcgaW5mbyBhYm91dCB0aGUgYW5ub3RhdGlvbi5cbiAqIH0gQW5ub3RhdGlvblxuICovXG5cbnZhciBhbm5vdGF0aW9ucyA9IGZ1bmN0aW9uIGFubm90YXRpb25zKG9wdF9vcHRpb25zKSB7XG4gIC8qIEB0eXBlIHshQXJyYXkuPCFBbm5vdGF0aW9uPn0gKi9cbiAgdGhpcy5hbm5vdGF0aW9uc18gPSBbXTtcbiAgLy8gVXNlZCB0byBkZXRlY3QgcmVzaXplcyAod2hpY2ggcmVxdWlyZSB0aGUgZGl2cyB0byBiZSByZXBvc2l0aW9uZWQpLlxuICB0aGlzLmxhc3RXaWR0aF8gPSAtMTtcbiAgdGhpcy5sYXN0SGVpZ2h0ID0gLTE7XG4gIHRoaXMuZHlncmFwaF8gPSBudWxsO1xuXG4gIG9wdF9vcHRpb25zID0gb3B0X29wdGlvbnMgfHwge307XG4gIHRoaXMuZGVmYXVsdEFubm90YXRpb25Qcm9wZXJ0aWVzXyA9ICQuZXh0ZW5kKHtcbiAgICAndGV4dCc6ICdEZXNjcmlwdGlvbidcbiAgfSwgb3B0X29wdGlvbnNbJ2RlZmF1bHRBbm5vdGF0aW9uUHJvcGVydGllcyddKTtcbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICByZXR1cm4gXCJTdXBlckFubm90YXRpb25zIFBsdWdpblwiO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gYWN0aXZhdGUoZykge1xuICB0aGlzLmR5Z3JhcGhfID0gZztcbiAgdGhpcy5hbm5vdGF0aW9uc18gPSBbXTtcblxuICByZXR1cm4ge1xuICAgIGRpZERyYXdDaGFydDogdGhpcy5kaWREcmF3Q2hhcnQsXG4gICAgcG9pbnRDbGljazogdGhpcy5wb2ludENsaWNrICAvLyBUT0RPKGRhbnZrKTogaW1wbGVtZW50IGluIGR5Z3JhcGhzXG4gIH07XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZGV0YWNoTGFiZWxzID0gZnVuY3Rpb24gZGV0YWNoTGFiZWxzKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYW5ub3RhdGlvbnNfLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGEgPSB0aGlzLmFubm90YXRpb25zX1tpXTtcbiAgICAkKGEubGluZURpdikucmVtb3ZlKCk7XG4gICAgJChhLmluZm9EaXYpLnJlbW92ZSgpO1xuICAgIHRoaXMuYW5ub3RhdGlvbnNfW2ldID0gbnVsbDtcbiAgfVxuICB0aGlzLmFubm90YXRpb25zXyA9IFtdO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmFubm90YXRpb25XYXNEcmFnZ2VkID0gZnVuY3Rpb24gYW5ub3RhdGlvbldhc0RyYWdnZWQoYSwgZXZlbnQsIHVpKSB7XG4gIHZhciBnID0gdGhpcy5keWdyYXBoXztcbiAgdmFyIGFyZWEgPSBnLmdldEFyZWEoKTtcbiAgdmFyIG9sZFlGcmFjID0gYS55RnJhYztcblxuICB2YXIgaW5mb0RpdiA9IGEuaW5mb0RpdjtcbiAgdmFyIG5ld1lGcmFjID0gKChpbmZvRGl2Lm9mZnNldFRvcCArIGluZm9EaXYub2Zmc2V0SGVpZ2h0KSAtIGFyZWEueSkgLyBhcmVhLmg7XG4gIGlmIChuZXdZRnJhYyA9PSBvbGRZRnJhYykgcmV0dXJuO1xuXG4gIGEueUZyYWMgPSBuZXdZRnJhYztcblxuICB0aGlzLm1vdmVBbm5vdGF0aW9uVG9Ub3AoYSk7XG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25Nb3ZlZCcsIHtcbiAgICBhbm5vdGF0aW9uOiBhLFxuICAgIG9sZFlGcmFjOiBvbGRZRnJhYyxcbiAgICBuZXdZRnJhYzogYS55RnJhY1xuICB9KTtcbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbnNDaGFuZ2VkJywge30pO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLm1ha2VBbm5vdGF0aW9uRWRpdGFibGUgPSBmdW5jdGlvbiBtYWtlQW5ub3RhdGlvbkVkaXRhYmxlKGEpIHtcbiAgaWYgKGEuZWRpdGFibGUgPT0gdHJ1ZSkgcmV0dXJuO1xuICB0aGlzLm1vdmVBbm5vdGF0aW9uVG9Ub3AoYSk7XG5cbiAgLy8gTm90ZTogd2UgaGF2ZSB0byBmaWxsIG91dCB0aGUgSFRNTCBvdXJzZWx2ZXMgYmVjYXVzZVxuICAvLyB1cGRhdGVBbm5vdGF0aW9uSW5mbygpIHdvbid0IHRvdWNoIGVkaXRhYmxlIGFubm90YXRpb25zLlxuICBhLmVkaXRhYmxlID0gdHJ1ZTtcbiAgdmFyIGVkaXRhYmxlVGVtcGxhdGVEaXYgPSAkKCcjYW5ub3RhdGlvbi1lZGl0YWJsZS10ZW1wbGF0ZScpLmdldCgwKTtcbiAgYS5pbmZvRGl2LmlubmVySFRNTCA9IHRoaXMuZ2V0VGVtcGxhdGVIVE1MKGVkaXRhYmxlVGVtcGxhdGVEaXYsIGEpO1xuICAkKGEuaW5mb0RpdikudG9nZ2xlQ2xhc3MoJ2VkaXRhYmxlJywgISFhLmVkaXRhYmxlKTtcbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYmVnYW5FZGl0QW5ub3RhdGlvbicsIGEpO1xufTtcblxuLy8gVGhpcyBjcmVhdGVzIHRoZSBoYWlybGluZSBvYmplY3QgYW5kIHJldHVybnMgaXQuXG4vLyBJdCBkb2VzIG5vdCBwb3NpdGlvbiBpdCBhbmQgZG9lcyBub3QgYXR0YWNoIGl0IHRvIHRoZSBjaGFydC5cbmFubm90YXRpb25zLnByb3RvdHlwZS5jcmVhdGVBbm5vdGF0aW9uID0gZnVuY3Rpb24gY3JlYXRlQW5ub3RhdGlvbihhKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgY29sb3IgPSB0aGlzLmdldENvbG9yRm9yU2VyaWVzXyhhLnNlcmllcyk7XG5cbiAgdmFyICRsaW5lRGl2ID0gJCgnPGRpdiAvPicpLmNzcyh7XG4gICAgJ3dpZHRoJzogJzFweCcsXG4gICAgJ2xlZnQnOiAnM3B4JyxcbiAgICAnYmFja2dyb3VuZCc6ICdibGFjaycsXG4gICAgJ2hlaWdodCc6ICcxMDAlJyxcbiAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxuICAgIC8vIFRPRE8oZGFudmspOiB1c2UgYm9yZGVyLWNvbG9yIGhlcmUgZm9yIGNvbnNpc3RlbmN5P1xuICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogY29sb3IsXG4gICAgJ3otaW5kZXgnOiAxMFxuICB9KS5hZGRDbGFzcygnZHlncmFwaC1hbm5vdGF0aW9uLWxpbmUnKTtcblxuICB2YXIgJGluZm9EaXYgPSAkKCcjYW5ub3RhdGlvbi10ZW1wbGF0ZScpLmNsb25lKCkucmVtb3ZlQXR0cignaWQnKS5jc3Moe1xuICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcbiAgICAgICdib3JkZXItY29sb3InOiBjb2xvcixcbiAgICAgICd6LWluZGV4JzogMTBcbiAgICB9KVxuICAgIC5zaG93KCk7XG5cbiAgJC5leHRlbmQoYSwge1xuICAgIGxpbmVEaXY6ICRsaW5lRGl2LmdldCgwKSxcbiAgICBpbmZvRGl2OiAkaW5mb0Rpdi5nZXQoMClcbiAgfSk7XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICRpbmZvRGl2LmRyYWdnYWJsZSh7XG4gICAgJ3N0YXJ0JzogZnVuY3Rpb24gZHJhZ2dhYmxlU3RhcnQoZXZlbnQsIHVpKSB7XG4gICAgICAkKHRoaXMpLmNzcyh7J2JvdHRvbSc6ICcnfSk7XG4gICAgICBhLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgIH0sXG4gICAgJ2RyYWcnOiBmdW5jdGlvbiBkcmFnZ2FibGVEcmFnKGV2ZW50LCB1aSkge1xuICAgICAgc2VsZi5hbm5vdGF0aW9uV2FzRHJhZ2dlZChhLCBldmVudCwgdWkpO1xuICAgIH0sXG4gICAgJ3N0b3AnOiBmdW5jdGlvbiBkcmFnZ2FibGVTdG9wKGV2ZW50LCB1aSkge1xuICAgICAgJCh0aGlzKS5jc3Moeyd0b3AnOiAnJ30pO1xuICAgICAgYS5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICBzZWxmLnVwZGF0ZUFubm90YXRpb25EaXZQb3NpdGlvbnMoKTtcbiAgICB9LFxuICAgICdheGlzJzogJ3knLFxuICAgICdjb250YWlubWVudCc6ICdwYXJlbnQnXG4gIH0pO1xuXG4gIC8vIFRPRE8oZGFudmspOiB1c2UgJ29uJyBpbnN0ZWFkIG9mIGRlbGVnYXRlL2RibGNsaWNrXG4gICRpbmZvRGl2Lm9uKCdjbGljaycsICcuYW5ub3RhdGlvbi1raWxsLWJ1dHRvbicsIGZ1bmN0aW9uIGNsaWNrS2lsbCgpIHtcbiAgICB0aGF0LnJlbW92ZUFubm90YXRpb24oYSk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbkRlbGV0ZWQnLCBhKTtcbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uc0NoYW5nZWQnLCB7fSk7XG4gIH0pO1xuXG4gICRpbmZvRGl2Lm9uKCdkYmxjbGljaycsIGZ1bmN0aW9uIGRibGNsaWNrKCkge1xuICAgIHRoYXQubWFrZUFubm90YXRpb25FZGl0YWJsZShhKTtcbiAgfSk7XG4gICRpbmZvRGl2Lm9uKCdjbGljaycsICcuYW5ub3RhdGlvbi11cGRhdGUnLCBmdW5jdGlvbiBjbGlja1VwZGF0ZSgpIHtcbiAgICBzZWxmLmV4dHJhY3RVcGRhdGVkUHJvcGVydGllc18oJGluZm9EaXYuZ2V0KDApLCBhKTtcbiAgICBhLmVkaXRhYmxlID0gZmFsc2U7XG4gICAgc2VsZi51cGRhdGVBbm5vdGF0aW9uSW5mbygpO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25FZGl0ZWQnLCBhKTtcbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdhbm5vdGF0aW9uc0NoYW5nZWQnLCB7fSk7XG4gIH0pO1xuICAkaW5mb0Rpdi5vbignY2xpY2snLCAnLmFubm90YXRpb24tY2FuY2VsJywgZnVuY3Rpb24gY2xpY2tDYW5jZWwoKSB7XG4gICAgYS5lZGl0YWJsZSA9IGZhbHNlO1xuICAgIHNlbGYudXBkYXRlQW5ub3RhdGlvbkluZm8oKTtcbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdjYW5jZWxFZGl0QW5ub3RhdGlvbicsIGEpO1xuICB9KTtcblxuICByZXR1cm4gYTtcbn07XG5cbi8vIEZpbmQgdGhlIGluZGV4IG9mIGEgcG9pbnQgaW4gYSBzZXJpZXMuXG4vLyBSZXR1cm5zIGEgMi1lbGVtZW50IGFycmF5LCBbcm93LCBjb2xdLCB3aGljaCBjYW4gYmUgdXNlZCB3aXRoXG4vLyBkeWdyYXBoLmdldFZhbHVlKCkgdG8gZ2V0IHRoZSB2YWx1ZSBhdCB0aGlzIHBvaW50LlxuLy8gUmV0dXJucyBudWxsIGlmIHRoZXJlJ3Mgbm8gbWF0Y2guXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZmluZFBvaW50SW5kZXhfID0gZnVuY3Rpb24gZmluZFBvaW50SW5kZXhfKHNlcmllcywgeHZhbCkge1xuICB2YXIgY29sID0gdGhpcy5keWdyYXBoXy5nZXRMYWJlbHMoKS5pbmRleE9mKHNlcmllcyk7XG4gIGlmIChjb2wgPT0gLTEpIHJldHVybiBudWxsO1xuXG4gIHZhciBsb3dJZHggPSAwLCBoaWdoSWR4ID0gdGhpcy5keWdyYXBoXy5udW1Sb3dzKCkgLSAxO1xuICB3aGlsZSAobG93SWR4IDw9IGhpZ2hJZHgpIHtcbiAgICB2YXIgaWR4ID0gTWF0aC5mbG9vcigobG93SWR4ICsgaGlnaElkeCkgLyAyKTtcbiAgICB2YXIgeEF0SWR4ID0gdGhpcy5keWdyYXBoXy5nZXRWYWx1ZShpZHgsIDApO1xuICAgIGlmICh4QXRJZHggPT0geHZhbCkge1xuICAgICAgcmV0dXJuIFtpZHgsIGNvbF07XG4gICAgfSBlbHNlIGlmICh4QXRJZHggPCB4dmFsKSB7XG4gICAgICBsb3dJZHggPSBpZHggKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWdoSWR4ID0gaWR4IC0gMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZ2V0Q29sb3JGb3JTZXJpZXNfID0gZnVuY3Rpb24gZ2V0Q29sb3JGb3JTZXJpZXNfKHNlcmllcykge1xuICB2YXIgY29sb3JzID0gdGhpcy5keWdyYXBoXy5nZXRDb2xvcnMoKTtcbiAgdmFyIGNvbCA9IHRoaXMuZHlncmFwaF8uZ2V0TGFiZWxzKCkuaW5kZXhPZihzZXJpZXMpO1xuICBpZiAoY29sID09IC0xKSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4gY29sb3JzWyhjb2wgLSAxKSAlIGNvbG9ycy5sZW5ndGhdO1xufTtcblxuLy8gTW92ZXMgYSBoYWlybGluZSdzIGRpdnMgdG8gdGhlIHRvcCBvZiB0aGUgei1vcmRlcmluZy5cbmFubm90YXRpb25zLnByb3RvdHlwZS5tb3ZlQW5ub3RhdGlvblRvVG9wID0gZnVuY3Rpb24gbW92ZUFubm90YXRpb25Ub1RvcChhKSB7XG4gIHZhciBkaXYgPSB0aGlzLmR5Z3JhcGhfLmdyYXBoRGl2O1xuICAkKGEuaW5mb0RpdikuYXBwZW5kVG8oZGl2KTtcbiAgJChhLmxpbmVEaXYpLmFwcGVuZFRvKGRpdik7XG5cbiAgdmFyIGlkeCA9IHRoaXMuYW5ub3RhdGlvbnNfLmluZGV4T2YoYSk7XG4gIHRoaXMuYW5ub3RhdGlvbnNfLnNwbGljZShpZHgsIDEpO1xuICB0aGlzLmFubm90YXRpb25zXy5wdXNoKGEpO1xufTtcblxuLy8gUG9zaXRpb25zIGV4aXN0aW5nIGhhaXJsaW5lIGRpdnMuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucyA9IGZ1bmN0aW9uIHVwZGF0ZUFubm90YXRpb25EaXZQb3NpdGlvbnMoKSB7XG4gIHZhciBsYXlvdXQgPSB0aGlzLmR5Z3JhcGhfLmdldEFyZWEoKTtcbiAgdmFyIGNoYXJ0TGVmdCA9IGxheW91dC54LCBjaGFydFJpZ2h0ID0gbGF5b3V0LnggKyBsYXlvdXQudztcbiAgdmFyIGNoYXJ0VG9wID0gbGF5b3V0LnksIGNoYXJ0Qm90dG9tID0gbGF5b3V0LnkgKyBsYXlvdXQuaDtcbiAgdmFyIGRpdiA9IHRoaXMuZHlncmFwaF8uZ3JhcGhEaXY7XG4gIHZhciBwb3MgPSBEeWdyYXBoLmZpbmRQb3MoZGl2KTtcbiAgdmFyIGJveCA9IFtsYXlvdXQueCArIHBvcy54LCBsYXlvdXQueSArIHBvcy55XTtcbiAgYm94LnB1c2goYm94WzBdICsgbGF5b3V0LncpO1xuICBib3gucHVzaChib3hbMV0gKyBsYXlvdXQuaCk7XG5cbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuXG4gIHZhciB0aGF0ID0gdGhpcztcbiAgJC5lYWNoKHRoaXMuYW5ub3RhdGlvbnNfLCBmdW5jdGlvbiBhbm5vdGF0aW9uc0xvb3BfKGlkeCwgYSkge1xuICAgIHZhciByb3dfY29sID0gdGhhdC5maW5kUG9pbnRJbmRleF8oYS5zZXJpZXMsIGEueHZhbCk7XG4gICAgaWYgKHJvd19jb2wgPT0gbnVsbCkge1xuICAgICAgJChbYS5saW5lRGl2LCBhLmluZm9EaXZdKS5oaWRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE8oZGFudmspOiBvbmx5IGRvIHRoaXMgaWYgdGhleSdyZSBpbnZpc2libGU/XG4gICAgICAkKFthLmxpbmVEaXYsIGEuaW5mb0Rpdl0pLnNob3coKTtcbiAgICB9XG4gICAgdmFyIHh5ID0gZy50b0RvbUNvb3JkcyhhLnh2YWwsIGcuZ2V0VmFsdWUocm93X2NvbFswXSwgcm93X2NvbFsxXSkpO1xuICAgIHZhciB4ID0geHlbMF0sIHBvaW50WSA9IHh5WzFdO1xuXG4gICAgdmFyIGxpbmVIZWlnaHQgPSA2OyAgLy8gVE9ETyhkYW52ayk6IG9wdGlvbj9cblxuICAgIHZhciB5ID0gcG9pbnRZO1xuICAgIGlmIChhLnlGcmFjICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHkgPSBsYXlvdXQueSArIGxheW91dC5oICogYS55RnJhYztcbiAgICB9IGVsc2Uge1xuICAgICAgeSAtPSBsaW5lSGVpZ2h0O1xuICAgIH1cblxuICAgIHZhciBsaW5lSGVpZ2h0ID0geSA8IHBvaW50WSA/IChwb2ludFkgLSB5KSA6ICh5IC0gcG9pbnRZIC0gYS5pbmZvRGl2Lm9mZnNldEhlaWdodCk7XG4gICAgJChhLmxpbmVEaXYpLmNzcyh7XG4gICAgICAnbGVmdCc6IHggKyAncHgnLFxuICAgICAgJ3RvcCc6IE1hdGgubWluKHksIHBvaW50WSkgKyAncHgnLFxuICAgICAgJ2hlaWdodCc6IGxpbmVIZWlnaHQgKyAncHgnXG4gICAgfSk7XG4gICAgJChhLmluZm9EaXYpLmNzcyh7XG4gICAgICAnbGVmdCc6IHggKyAncHgnLFxuICAgIH0pO1xuICAgIGlmICghYS5pc0RyYWdnaW5nKSB7XG4gICAgICAvLyBqUXVlcnkgVUkgZHJhZ2dhYmxlIGxpa2VzIHRvIHNldCAndG9wJywgd2hlcmVhcyBzdXBlcmFubm90YXRpb25zIHNldHNcbiAgICAgIC8vICdib3R0b20nLiBTZXR0aW5nIGJvdGggd2lsbCBtYWtlIHRoZSBhbm5vdGF0aW9uIGdyb3cgYW5kIGNvbnRyYWN0IGFzXG4gICAgICAvLyB0aGUgdXNlciBkcmFncyBpdCwgd2hpY2ggbG9va3MgYmFkLlxuICAgICAgJChhLmluZm9EaXYpLmNzcyh7XG4gICAgICAgICdib3R0b20nOiAoZGl2Lm9mZnNldEhlaWdodCAtIHkpICsgJ3B4J1xuICAgICAgfSkgIC8vLmRyYWdnYWJsZShcIm9wdGlvblwiLCBcImNvbnRhaW5tZW50XCIsIGJveCk7XG5cbiAgICAgIHZhciB2aXNpYmxlID0gKHggPj0gY2hhcnRMZWZ0ICYmIHggPD0gY2hhcnRSaWdodCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHBvaW50WSA+PSBjaGFydFRvcCAmJiBwb2ludFkgPD0gY2hhcnRCb3R0b20pO1xuICAgICAgJChbYS5pbmZvRGl2LCBhLmxpbmVEaXZdKS50b2dnbGUodmlzaWJsZSk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8vIEZpbGxzIG91dCB0aGUgaW5mbyBkaXYgYmFzZWQgb24gY3VycmVudCBjb29yZGluYXRlcy5cbmFubm90YXRpb25zLnByb3RvdHlwZS51cGRhdGVBbm5vdGF0aW9uSW5mbyA9IGZ1bmN0aW9uIHVwZGF0ZUFubm90YXRpb25JbmZvKCkge1xuICB2YXIgZyA9IHRoaXMuZHlncmFwaF87XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuICB2YXIgdGVtcGxhdGVEaXYgPSAkKCcjYW5ub3RhdGlvbi10ZW1wbGF0ZScpLmdldCgwKTtcbiAgJC5lYWNoKHRoaXMuYW5ub3RhdGlvbnNfLCBmdW5jdGlvbiBhbm5vdGF0aW9uc0xvb3BfKGlkeCwgYSkge1xuICAgIC8vIFdlIHNob3VsZCBuZXZlciB1cGRhdGUgYW4gZWRpdGFibGUgZGl2IC0tIGRvaW5nIHNvIG1heSBraWxsIHVuc2F2ZWRcbiAgICAvLyBlZGl0cyB0byBhbiBhbm5vdGF0aW9uLlxuICAgICQoYS5pbmZvRGl2KS50b2dnbGVDbGFzcygnZWRpdGFibGUnLCAhIWEuZWRpdGFibGUpO1xuICAgIGlmIChhLmVkaXRhYmxlKSByZXR1cm47XG4gICAgYS5pbmZvRGl2LmlubmVySFRNTCA9IHRoYXQuZ2V0VGVtcGxhdGVIVE1MKHRlbXBsYXRlRGl2LCBhKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IUFubm90YXRpb259IGEgSW50ZXJuYWwgYW5ub3RhdGlvblxuICogQHJldHVybiB7IVB1YmxpY0Fubm90YXRpb259IGEgdmlldyBvZiB0aGUgYW5ub3RhdGlvbiBmb3IgdGhlIHB1YmxpYyBBUEkuXG4gKi9cbmFubm90YXRpb25zLnByb3RvdHlwZS5jcmVhdGVQdWJsaWNBbm5vdGF0aW9uXyA9IGZ1bmN0aW9uIGNyZWF0ZVB1YmxpY0Fubm90YXRpb25fKGEsIG9wdF9wcm9wcykge1xuICB2YXIgZGlzcGxheUFubm90YXRpb24gPSAkLmV4dGVuZCh7fSwgYSwgb3B0X3Byb3BzKTtcbiAgZGVsZXRlIGRpc3BsYXlBbm5vdGF0aW9uWydpbmZvRGl2J107XG4gIGRlbGV0ZSBkaXNwbGF5QW5ub3RhdGlvblsnbGluZURpdiddO1xuICBkZWxldGUgZGlzcGxheUFubm90YXRpb25bJ2lzRHJhZ2dpbmcnXTtcbiAgZGVsZXRlIGRpc3BsYXlBbm5vdGF0aW9uWydlZGl0YWJsZSddO1xuICByZXR1cm4gZGlzcGxheUFubm90YXRpb247XG59O1xuXG4vLyBGaWxsIG91dCBhIGRpdiB1c2luZyB0aGUgdmFsdWVzIGluIHRoZSBhbm5vdGF0aW9uIG9iamVjdC5cbi8vIFRoZSBkaXYncyBodG1sIGlzIGV4cGVjdGVkIHRvIGhhdmUgdGV4dCBvZiB0aGUgZm9ybSBcInt7a2V5fX1cIlxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmdldFRlbXBsYXRlSFRNTCA9IGZ1bmN0aW9uIGdldFRlbXBsYXRlSFRNTChkaXYsIGEpIHtcbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuICB2YXIgcm93X2NvbCA9IHRoaXMuZmluZFBvaW50SW5kZXhfKGEuc2VyaWVzLCBhLnh2YWwpO1xuICBpZiAocm93X2NvbCA9PSBudWxsKSByZXR1cm47ICAvLyBwZXJoYXBzIGl0J3Mgbm8gbG9uZ2VyIGEgcmVhbCBwb2ludD9cbiAgdmFyIHJvdyA9IHJvd19jb2xbMF07XG4gIHZhciBjb2wgPSByb3dfY29sWzFdO1xuXG4gIHZhciB5T3B0VmlldyA9IGcub3B0aW9uc1ZpZXdGb3JBeGlzXygneTEnKTsgIC8vIFRPRE86IHN1cHBvcnQgc2Vjb25kYXJ5LCB0b29cbiAgdmFyIHhPcHRWaWV3ID0gZy5vcHRpb25zVmlld0ZvckF4aXNfKCd4Jyk7XG4gIHZhciB4dmYgPSBnLmdldE9wdGlvbkZvckF4aXMoJ3ZhbHVlRm9ybWF0dGVyJywgJ3gnKTtcblxuICB2YXIgeCA9IHh2Zi5jYWxsKGcsIGEueHZhbCwgeE9wdFZpZXcpO1xuICB2YXIgeSA9IGcuZ2V0T3B0aW9uKCd2YWx1ZUZvcm1hdHRlcicsIGEuc2VyaWVzKS5jYWxsKFxuICAgICAgZywgZy5nZXRWYWx1ZShyb3csIGNvbCksIHlPcHRWaWV3KTtcblxuICB2YXIgZGlzcGxheUFubm90YXRpb24gPSB0aGlzLmNyZWF0ZVB1YmxpY0Fubm90YXRpb25fKGEsIHt4OngsIHk6eX0pO1xuICB2YXIgaHRtbCA9IGRpdi5pbm5lckhUTUw7XG4gIGZvciAodmFyIGsgaW4gZGlzcGxheUFubm90YXRpb24pIHtcbiAgICB2YXIgdiA9IGRpc3BsYXlBbm5vdGF0aW9uW2tdO1xuICAgIGlmICh0eXBlb2YodikgPT0gJ29iamVjdCcpIGNvbnRpbnVlOyAgLy8gZS5nLiBpbmZvRGl2IG9yIGxpbmVEaXZcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKG5ldyBSZWdFeHAoJ1xce1xceycgKyBrICsgJ1xcfVxcfScsICdnJyksIHYpO1xuICB9XG4gIHJldHVybiBodG1sO1xufTtcblxuLy8gVXBkYXRlIHRoZSBhbm5vdGF0aW9uIG9iamVjdCBieSBsb29raW5nIGZvciBlbGVtZW50cyB3aXRoIGEgJ2RnLWFubi1maWVsZCdcbi8vIGF0dHJpYnV0ZS4gRm9yIGV4YW1wbGUsIDxpbnB1dCB0eXBlPSd0ZXh0JyBkZy1hbm4tZmllbGQ9J3RleHQnIC8+IHdpbGwgaGF2ZVxuLy8gaXRzIHZhbHVlIHBsYWNlZCBpbiB0aGUgJ3RleHQnIGF0dHJpYnV0ZSBvZiB0aGUgYW5ub3RhdGlvbi5cbmFubm90YXRpb25zLnByb3RvdHlwZS5leHRyYWN0VXBkYXRlZFByb3BlcnRpZXNfID0gZnVuY3Rpb24gZXh0cmFjdFVwZGF0ZWRQcm9wZXJ0aWVzXyhkaXYsIGEpIHtcbiAgJChkaXYpLmZpbmQoJ1tkZy1hbm4tZmllbGRdJykuZWFjaChmdW5jdGlvbiBmaWVsZExvb3BfKGlkeCwgZWwpIHtcbiAgICB2YXIgayA9ICQoZWwpLmF0dHIoJ2RnLWFubi1maWVsZCcpO1xuICAgIHZhciB2ID0gJChlbCkudmFsKCk7XG4gICAgYVtrXSA9IHY7XG4gIH0pO1xufTtcblxuLy8gQWZ0ZXIgYSByZXNpemUsIHRoZSBoYWlybGluZSBkaXZzIGNhbiBnZXQgZGV0dGFjaGVkIGZyb20gdGhlIGNoYXJ0LlxuLy8gVGhpcyByZWF0dGFjaGVzIHRoZW0uXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XyA9IGZ1bmN0aW9uIGF0dGFjaEFubm90YXRpb25zVG9DaGFydF8oKSB7XG4gIHZhciBkaXYgPSB0aGlzLmR5Z3JhcGhfLmdyYXBoRGl2O1xuICAkLmVhY2godGhpcy5hbm5vdGF0aW9uc18sIGZ1bmN0aW9uIGFubm90YXRpb25zTG9vcF8oaWR4LCBhKSB7XG4gICAgLy8gUmUtYXR0YWNoaW5nIGFuIGVkaXRhYmxlIGRpdiB0byB0aGUgRE9NIGNhbiBjbGVhciBpdHMgZm9jdXMuXG4gICAgLy8gVGhpcyBtYWtlcyB0eXBpbmcgcmVhbGx5IGRpZmZpY3VsdCFcbiAgICBpZiAoYS5lZGl0YWJsZSkgcmV0dXJuO1xuXG4gICAgJChbYS5saW5lRGl2LCBhLmluZm9EaXZdKS5hcHBlbmRUbyhkaXYpO1xuICB9KTtcbn07XG5cbi8vIERlbGV0ZXMgYSBoYWlybGluZSBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBjaGFydC5cbmFubm90YXRpb25zLnByb3RvdHlwZS5yZW1vdmVBbm5vdGF0aW9uID0gZnVuY3Rpb24gcmVtb3ZlQW5ub3RhdGlvbihhKSB7XG4gIHZhciBpZHggPSB0aGlzLmFubm90YXRpb25zXy5pbmRleE9mKGEpO1xuICBpZiAoaWR4ID49IDApIHtcbiAgICB0aGlzLmFubm90YXRpb25zXy5zcGxpY2UoaWR4LCAxKTtcbiAgICAkKFthLmxpbmVEaXYsIGEuaW5mb0Rpdl0pLnJlbW92ZSgpO1xuICB9IGVsc2Uge1xuICAgIER5Z3JhcGgud2FybignVHJpZWQgdG8gcmVtb3ZlIG5vbi1leGlzdGVudCBhbm5vdGF0aW9uLicpO1xuICB9XG59O1xuXG5hbm5vdGF0aW9ucy5wcm90b3R5cGUuZGlkRHJhd0NoYXJ0ID0gZnVuY3Rpb24gZGlkRHJhd0NoYXJ0KGUpIHtcbiAgdmFyIGcgPSBlLmR5Z3JhcGg7XG5cbiAgLy8gRWFybHkgb3V0IGluIHRoZSAoY29tbW9uKSBjYXNlIG9mIHplcm8gYW5ub3RhdGlvbnMuXG4gIGlmICh0aGlzLmFubm90YXRpb25zXy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICB0aGlzLnVwZGF0ZUFubm90YXRpb25EaXZQb3NpdGlvbnMoKTtcbiAgdGhpcy5hdHRhY2hBbm5vdGF0aW9uc1RvQ2hhcnRfKCk7XG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkluZm8oKTtcbn07XG5cbmFubm90YXRpb25zLnByb3RvdHlwZS5wb2ludENsaWNrID0gZnVuY3Rpb24gcG9pbnRDbGljayhlKSB7XG4gIC8vIFByZXZlbnQgYW55IG90aGVyIGJlaGF2aW9yIGJhc2VkIG9uIHRoaXMgY2xpY2ssIGUuZy4gY3JlYXRpb24gb2YgYSBoYWlybGluZS5cbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIHZhciBhID0gJC5leHRlbmQoe30sIHRoaXMuZGVmYXVsdEFubm90YXRpb25Qcm9wZXJ0aWVzXywge1xuICAgIHNlcmllczogZS5wb2ludC5uYW1lLFxuICAgIHh2YWw6IGUucG9pbnQueHZhbFxuICB9KTtcbiAgdGhpcy5hbm5vdGF0aW9uc18ucHVzaCh0aGlzLmNyZWF0ZUFubm90YXRpb24oYSkpO1xuXG4gIHRoaXMudXBkYXRlQW5ub3RhdGlvbkRpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUFubm90YXRpb25JbmZvKCk7XG4gIHRoaXMuYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XygpO1xuXG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25DcmVhdGVkJywgYSk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2Fubm90YXRpb25zQ2hhbmdlZCcsIHt9KTtcblxuICAvLyBBbm5vdGF0aW9ucyBzaG91bGQgYmVnaW4gbGlmZSBlZGl0YWJsZS5cbiAgdGhpcy5tYWtlQW5ub3RhdGlvbkVkaXRhYmxlKGEpO1xufTtcblxuYW5ub3RhdGlvbnMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICB0aGlzLmRldGFjaExhYmVscygpO1xufTtcblxuLy8gUHVibGljIEFQSVxuXG4vKipcbiAqIFRoaXMgaXMgYSByZXN0cmljdGVkIHZpZXcgb2YgdGhpcy5hbm5vdGF0aW9uc18gd2hpY2ggZG9lc24ndCBleHBvc2VcbiAqIGltcGxlbWVudGF0aW9uIGRldGFpbHMgbGlrZSB0aGUgbGluZSAvIGluZm8gZGl2cy5cbiAqXG4gKiBAdHlwZWRlZiB7XG4gKiAgIHh2YWw6ICBudW1iZXIsICAgICAgLy8geC12YWx1ZSAoaS5lLiBtaWxsaXMgb3IgYSByYXcgbnVtYmVyKVxuICogICBzZXJpZXM6IHN0cmluZywgICAgIC8vIHNlcmllcyBuYW1lXG4gKiB9IFB1YmxpY0Fubm90YXRpb25cbiAqL1xuXG4vKipcbiAqIEByZXR1cm4geyFBcnJheS48IVB1YmxpY0Fubm90YXRpb24+fSBUaGUgY3VycmVudCBzZXQgb2YgYW5ub3RhdGlvbnMsIG9yZGVyZWRcbiAqICAgICBmcm9tIGJhY2sgdG8gZnJvbnQuXG4gKi9cbmFubm90YXRpb25zLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFubm90YXRpb25zXy5sZW5ndGg7IGkrKykge1xuICAgIHJlc3VsdC5wdXNoKHRoaXMuY3JlYXRlUHVibGljQW5ub3RhdGlvbl8odGhpcy5hbm5vdGF0aW9uc19baV0pKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDYWxsaW5nIHRoaXMgd2lsbCByZXN1bHQgaW4gYW4gYW5ub3RhdGlvbnNDaGFuZ2VkIGV2ZW50IGJlaW5nIHRyaWdnZXJlZCwgbm9cbiAqIG1hdHRlciB3aGV0aGVyIGl0IGNvbnNpc3RzIG9mIGFkZGl0aW9ucywgZGVsZXRpb25zLCBtb3ZlcyBvciBubyBjaGFuZ2VzIGF0XG4gKiBhbGwuXG4gKlxuICogQHBhcmFtIHshQXJyYXkuPCFQdWJsaWNBbm5vdGF0aW9uPn0gYW5ub3RhdGlvbnMgVGhlIG5ldyBzZXQgb2YgYW5ub3RhdGlvbnMsXG4gKiAgICAgb3JkZXJlZCBmcm9tIGJhY2sgdG8gZnJvbnQuXG4gKi9cbmFubm90YXRpb25zLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoYW5ub3RhdGlvbnMpIHtcbiAgLy8gUmUtdXNlIGRpdnMgZnJvbSB0aGUgb2xkIGFubm90YXRpb25zIGFycmF5IHNvIGZhciBhcyB3ZSBjYW4uXG4gIC8vIFRoZXkncmUgYWxyZWFkeSBjb3JyZWN0bHkgei1vcmRlcmVkLlxuICB2YXIgYW55Q3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFubm90YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGEgPSBhbm5vdGF0aW9uc1tpXTtcblxuICAgIGlmICh0aGlzLmFubm90YXRpb25zXy5sZW5ndGggPiBpKSB7XG4gICAgICAvLyBPbmx5IHRoZSBkaXZzIG5lZWQgdG8gYmUgcHJlc2VydmVkLlxuICAgICAgdmFyIG9sZEEgPSB0aGlzLmFubm90YXRpb25zX1tpXTtcbiAgICAgIHRoaXMuYW5ub3RhdGlvbnNfW2ldID0gJC5leHRlbmQoe1xuICAgICAgICBpbmZvRGl2OiBvbGRBLmluZm9EaXYsXG4gICAgICAgIGxpbmVEaXY6IG9sZEEubGluZURpdlxuICAgICAgfSwgYSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5ub3RhdGlvbnNfLnB1c2godGhpcy5jcmVhdGVBbm5vdGF0aW9uKGEpKTtcbiAgICAgIGFueUNyZWF0ZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nIGFubm90YXRpb25zLCBkZXN0cm95IHRoZW0uXG4gIHdoaWxlIChhbm5vdGF0aW9ucy5sZW5ndGggPCB0aGlzLmFubm90YXRpb25zXy5sZW5ndGgpIHtcbiAgICB0aGlzLnJlbW92ZUFubm90YXRpb24odGhpcy5hbm5vdGF0aW9uc19bYW5ub3RhdGlvbnMubGVuZ3RoXSk7XG4gIH1cblxuICB0aGlzLnVwZGF0ZUFubm90YXRpb25EaXZQb3NpdGlvbnMoKTtcbiAgdGhpcy51cGRhdGVBbm5vdGF0aW9uSW5mbygpO1xuICBpZiAoYW55Q3JlYXRlZCkge1xuICAgIHRoaXMuYXR0YWNoQW5ub3RhdGlvbnNUb0NoYXJ0XygpO1xuICB9XG5cbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignYW5ub3RhdGlvbnNDaGFuZ2VkJywge30pO1xufTtcblxucmV0dXJuIGFubm90YXRpb25zO1xuXG59KSgpO1xuXG4vKiBsb2FkZXIgd3JhcHBlciAqL1xuRHlncmFwaC5fcmVxdWlyZS5hZGQoJ2R5Z3JhcGhzL3NyYy9leHRyYXMvc3VwZXItYW5ub3RhdGlvbnMuanMnLCAvKiBleHBvcnRzICovIHt9KTtcbn0pKCk7XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQ0FBQyxTQUFTQSxnQ0FBZ0NBLENBQUEsRUFBRztFQUM3QyxZQUFZOztFQUNaLElBQUlDLE9BQU87RUFDWCxJQUFJQyxNQUFNLENBQUNELE9BQU8sRUFBRTtJQUNsQkEsT0FBTyxHQUFHQyxNQUFNLENBQUNELE9BQU87RUFDMUIsQ0FBQyxNQUFNLElBQUksT0FBT0UsTUFBTyxLQUFLLFdBQVcsRUFBRTtJQUN6Q0YsT0FB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