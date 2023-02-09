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
(function _extras_hairlines_wrapper() {
  'use strict';

  var Dygraph;
  if (window.Dygraph) {
    Dygraph = window.Dygraph;
  } else if (typeof module !== 'undefined') {
    Dygraph = require('../dygraph');
    if (typeof Dygraph.NAME === 'undefined' && typeof Dygraph["default"] !== 'undefined') Dygraph = Dygraph["default"];
  }
  /* end of loader wrapper header */

  Dygraph.Plugins.Hairlines = function _extras_hairlines_closure() {
    "use strict";

    /**
     * @typedef {
     *   xval:  number,      // x-value (i.e. millis or a raw number)
     *   interpolated: bool,  // alternative is to snap to closest
     *   lineDiv: !Element    // vertical hairline div
     *   infoDiv: !Element    // div containing info about the nearest points
     *   selected: boolean    // whether this hairline is selected
     * } Hairline
     */

    // We have to wait a few ms after clicks to give the user a chance to
    // double-click to unzoom. This sets that delay period.
    var CLICK_DELAY_MS = 300;
    var hairlines = function hairlines(opt_options) {
      /** @private {!Array.<!Hairline>} */
      this.hairlines_ = [];

      // Used to detect resizes (which require the divs to be repositioned).
      this.lastWidth_ = -1;
      this.lastHeight = -1;
      this.dygraph_ = null;
      this.addTimer_ = null;
      opt_options = opt_options || {};
      this.divFiller_ = opt_options['divFiller'] || null;
    };
    hairlines.prototype.toString = function toString() {
      return "Hairlines Plugin";
    };
    hairlines.prototype.activate = function activate(g) {
      this.dygraph_ = g;
      this.hairlines_ = [];
      return {
        didDrawChart: this.didDrawChart,
        click: this.click,
        dblclick: this.dblclick,
        dataDidUpdate: this.dataDidUpdate
      };
    };
    hairlines.prototype.detachLabels = function detachLabels() {
      for (var i = 0; i < this.hairlines_.length; i++) {
        var h = this.hairlines_[i];
        $(h.lineDiv).remove();
        $(h.infoDiv).remove();
        this.hairlines_[i] = null;
      }
      this.hairlines_ = [];
    };
    hairlines.prototype.hairlineWasDragged = function hairlineWasDragged(h, event, ui) {
      var area = this.dygraph_.getArea();
      var oldXVal = h.xval;
      h.xval = this.dygraph_.toDataXCoord(ui.position.left);
      this.moveHairlineToTop(h);
      this.updateHairlineDivPositions();
      this.updateHairlineInfo();
      this.updateHairlineStyles();
      $(this).triggerHandler('hairlineMoved', {
        oldXVal: oldXVal,
        newXVal: h.xval
      });
      $(this).triggerHandler('hairlinesChanged', {});
    };

    // This creates the hairline object and returns it.
    // It does not position it and does not attach it to the chart.
    hairlines.prototype.createHairline = function createHairline(props) {
      var h;
      var self = this;
      var $lineContainerDiv = $('<div/>').css({
        'width': '6px',
        'margin-left': '-3px',
        'position': 'absolute',
        'z-index': '10'
      }).addClass('dygraph-hairline');
      var $lineDiv = $('<div/>').css({
        'width': '1px',
        'position': 'relative',
        'left': '3px',
        'background': 'black',
        'height': '100%'
      });
      $lineDiv.appendTo($lineContainerDiv);
      var $infoDiv = $('#hairline-template').clone().removeAttr('id').css({
        'position': 'absolute'
      }).show();

      // Surely there's a more jQuery-ish way to do this!
      $([$infoDiv.get(0), $lineContainerDiv.get(0)]).draggable({
        'axis': 'x',
        'drag': function dragWrapper_(event, ui) {
          self.hairlineWasDragged(h, event, ui);
        }
        // TODO(danvk): set cursor here
      });

      h = $.extend({
        interpolated: true,
        selected: false,
        lineDiv: $lineContainerDiv.get(0),
        infoDiv: $infoDiv.get(0)
      }, props);
      var that = this;
      $infoDiv.on('click', '.hairline-kill-button', function clickEvent_(e) {
        that.removeHairline(h);
        $(that).triggerHandler('hairlineDeleted', {
          xval: h.xval
        });
        $(that).triggerHandler('hairlinesChanged', {});
        e.stopPropagation(); // don't want .click() to trigger, below.
      }).on('click', function clickHandler_() {
        that.moveHairlineToTop(h);
      });
      return h;
    };

    // Moves a hairline's divs to the top of the z-ordering.
    hairlines.prototype.moveHairlineToTop = function moveHairlineToTop(h) {
      var div = this.dygraph_.graphDiv;
      $(h.infoDiv).appendTo(div);
      $(h.lineDiv).appendTo(div);
      var idx = this.hairlines_.indexOf(h);
      this.hairlines_.splice(idx, 1);
      this.hairlines_.push(h);
    };

    // Positions existing hairline divs.
    hairlines.prototype.updateHairlineDivPositions = function updateHairlineDivPositions() {
      var g = this.dygraph_;
      var layout = this.dygraph_.getArea();
      var chartLeft = layout.x,
        chartRight = layout.x + layout.w;
      var div = this.dygraph_.graphDiv;
      var pos = Dygraph.findPos(div);
      var box = [layout.x + pos.x, layout.y + pos.y];
      box.push(box[0] + layout.w);
      box.push(box[1] + layout.h);
      $.each(this.hairlines_, function iterateHairlines_(idx, h) {
        var left = g.toDomXCoord(h.xval);
        h.domX = left; // See comments in this.dataDidUpdate
        $(h.lineDiv).css({
          'left': left + 'px',
          'top': layout.y + 'px',
          'height': layout.h + 'px'
        }); // .draggable("option", "containment", box);
        $(h.infoDiv).css({
          'left': left + 'px',
          'top': layout.y + 'px'
        }).draggable("option", "containment", box);
        var visible = left >= chartLeft && left <= chartRight;
        $([h.infoDiv, h.lineDiv]).toggle(visible);
      });
    };

    // Sets styles on the hairline (i.e. "selected")
    hairlines.prototype.updateHairlineStyles = function updateHairlineStyles() {
      $.each(this.hairlines_, function iterateHairlines_(idx, h) {
        $([h.infoDiv, h.lineDiv]).toggleClass('selected', h.selected);
      });
    };

    // Find prevRow and nextRow such that
    // g.getValue(prevRow, 0) <= xval
    // g.getValue(nextRow, 0) >= xval
    // g.getValue({prev,next}Row, col) != null, NaN or undefined
    // and there's no other row such that:
    //   g.getValue(prevRow, 0) < g.getValue(row, 0) < g.getValue(nextRow, 0)
    //   g.getValue(row, col) != null, NaN or undefined.
    // Returns [prevRow, nextRow]. Either can be null (but not both).
    hairlines.findPrevNextRows = function findPrevNextRows(g, xval, col) {
      var prevRow = null,
        nextRow = null;
      var numRows = g.numRows();
      for (var row = 0; row < numRows; row++) {
        var yval = g.getValue(row, col);
        if (yval === null || yval === undefined || isNaN(yval)) continue;
        var rowXval = g.getValue(row, 0);
        if (rowXval <= xval) prevRow = row;
        if (rowXval >= xval) {
          nextRow = row;
          break;
        }
      }
      return [prevRow, nextRow];
    };

    // Fills out the info div based on current coordinates.
    hairlines.prototype.updateHairlineInfo = function updateHairlineInfo() {
      var mode = 'closest';
      var g = this.dygraph_;
      var xRange = g.xAxisRange();
      var that = this;
      $.each(this.hairlines_, function iterateHairlines_(idx, h) {
        // To use generateLegendHTML, we synthesize an array of selected points.
        var selPoints = [];
        var labels = g.getLabels();
        var row, prevRow, nextRow;
        if (!h.interpolated) {
          // "closest point" mode.
          // TODO(danvk): make findClosestRow method public
          row = g.findClosestRow(g.toDomXCoord(h.xval));
          for (var i = 1; i < g.numColumns(); i++) {
            selPoints.push({
              canvasx: 1,
              // TODO(danvk): real coordinate
              canvasy: 1,
              // TODO(danvk): real coordinate
              xval: h.xval,
              yval: g.getValue(row, i),
              name: labels[i]
            });
          }
        } else {
          // "interpolated" mode.
          for (var i = 1; i < g.numColumns(); i++) {
            var prevNextRow = hairlines.findPrevNextRows(g, h.xval, i);
            prevRow = prevNextRow[0], nextRow = prevNextRow[1];

            // For x-values outside the domain, interpolate "between" the extreme
            // point and itself.
            if (prevRow === null) prevRow = nextRow;
            if (nextRow === null) nextRow = prevRow;

            // linear interpolation
            var prevX = g.getValue(prevRow, 0),
              nextX = g.getValue(nextRow, 0),
              prevY = g.getValue(prevRow, i),
              nextY = g.getValue(nextRow, i),
              frac = prevRow == nextRow ? 0 : (h.xval - prevX) / (nextX - prevX),
              yval = frac * nextY + (1 - frac) * prevY;
            selPoints.push({
              canvasx: 1,
              // TODO(danvk): real coordinate
              canvasy: 1,
              // TODO(danvk): real coordinate
              xval: h.xval,
              yval: yval,
              prevRow: prevRow,
              nextRow: nextRow,
              name: labels[i]
            });
          }
        }
        if (that.divFiller_) {
          that.divFiller_(h.infoDiv, {
            closestRow: row,
            points: selPoints,
            hairline: that.createPublicHairline_(h),
            dygraph: g
          });
        } else {
          var html = Dygraph.Plugins.Legend.generateLegendHTML(g, h.xval, selPoints, 10);
          $('.hairline-legend', h.infoDiv).html(html);
        }
      });
    };

    // After a resize, the hairline divs can get dettached from the chart.
    // This reattaches them.
    hairlines.prototype.attachHairlinesToChart_ = function attachHairlinesToChart_() {
      var div = this.dygraph_.graphDiv;
      $.each(this.hairlines_, function iterateHairlines_(idx, h) {
        $([h.lineDiv, h.infoDiv]).appendTo(div);
      });
    };

    // Deletes a hairline and removes it from the chart.
    hairlines.prototype.removeHairline = function removeHairline(h) {
      var idx = this.hairlines_.indexOf(h);
      if (idx >= 0) {
        this.hairlines_.splice(idx, 1);
        $([h.lineDiv, h.infoDiv]).remove();
      } else {
        Dygraph.warn('Tried to remove non-existent hairline.');
      }
    };
    hairlines.prototype.didDrawChart = function didDrawChart(e) {
      var g = e.dygraph;

      // Early out in the (common) case of zero hairlines.
      if (this.hairlines_.length === 0) return;
      this.updateHairlineDivPositions();
      this.attachHairlinesToChart_();
      this.updateHairlineInfo();
      this.updateHairlineStyles();
    };
    hairlines.prototype.dataDidUpdate = function dataDidUpdate(e) {
      // When the data in the chart updates, the hairlines should stay in the same
      // position on the screen. didDrawChart stores a domX parameter for each
      // hairline. We use that to reposition them on data updates.
      var g = this.dygraph_;
      $.each(this.hairlines_, function iterateHairlines_(idx, h) {
        if (h.hasOwnProperty('domX')) {
          h.xval = g.toDataXCoord(h.domX);
        }
      });
    };
    hairlines.prototype.click = function click(e) {
      if (this.addTimer_) {
        // Another click is in progress; ignore this one.
        return;
      }
      var area = e.dygraph.getArea();
      var xval = this.dygraph_.toDataXCoord(e.canvasx);
      var that = this;
      this.addTimer_ = setTimeout(function click_tmo_() {
        that.addTimer_ = null;
        that.hairlines_.push(that.createHairline({
          xval: xval
        }));
        that.updateHairlineDivPositions();
        that.updateHairlineInfo();
        that.updateHairlineStyles();
        that.attachHairlinesToChart_();
        $(that).triggerHandler('hairlineCreated', {
          xval: xval
        });
        $(that).triggerHandler('hairlinesChanged', {});
      }, CLICK_DELAY_MS);
    };
    hairlines.prototype.dblclick = function dblclick(e) {
      if (this.addTimer_) {
        clearTimeout(this.addTimer_);
        this.addTimer_ = null;
      }
    };
    hairlines.prototype.destroy = function destroy() {
      this.detachLabels();
    };

    // Public API

    /**
     * This is a restricted view of this.hairlines_ which doesn't expose
     * implementation details like the handle divs.
     *
     * @typedef {
     *   xval:  number,       // x-value (i.e. millis or a raw number)
     *   interpolated: bool,  // alternative is to snap to closest
     *   selected: bool       // whether the hairline is selected.
     * } PublicHairline
     */

    /**
     * @param {!Hairline} h Internal hairline.
     * @return {!PublicHairline} Restricted public view of the hairline.
     */
    hairlines.prototype.createPublicHairline_ = function createPublicHairline_(h) {
      return {
        xval: h.xval,
        interpolated: h.interpolated,
        selected: h.selected
      };
    };

    /**
     * @return {!Array.<!PublicHairline>} The current set of hairlines, ordered
     *     from back to front.
     */
    hairlines.prototype.get = function get() {
      var result = [];
      for (var i = 0; i < this.hairlines_.length; i++) {
        var h = this.hairlines_[i];
        result.push(this.createPublicHairline_(h));
      }
      return result;
    };

    /**
     * Calling this will result in a hairlinesChanged event being triggered, no
     * matter whether it consists of additions, deletions, moves or no changes at
     * all.
     *
     * @param {!Array.<!PublicHairline>} hairlines The new set of hairlines,
     *     ordered from back to front.
     */
    hairlines.prototype.set = function set(hairlines) {
      // Re-use divs from the old hairlines array so far as we can.
      // They're already correctly z-ordered.
      var anyCreated = false;
      for (var i = 0; i < hairlines.length; i++) {
        var h = hairlines[i];
        if (this.hairlines_.length > i) {
          this.hairlines_[i].xval = h.xval;
          this.hairlines_[i].interpolated = h.interpolated;
          this.hairlines_[i].selected = h.selected;
        } else {
          this.hairlines_.push(this.createHairline({
            xval: h.xval,
            interpolated: h.interpolated,
            selected: h.selected
          }));
          anyCreated = true;
        }
      }

      // If there are any remaining hairlines, destroy them.
      while (hairlines.length < this.hairlines_.length) {
        this.removeHairline(this.hairlines_[hairlines.length]);
      }
      this.updateHairlineDivPositions();
      this.updateHairlineInfo();
      this.updateHairlineStyles();
      if (anyCreated) {
        this.attachHairlinesToChart_();
      }
      $(this).triggerHandler('hairlinesChanged', {});
    };
    return hairlines;
  }();

  /* loader wrapper */
  Dygraph._required('dygraphs/src/extras/hairlines.js', /* exports */{});
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX2hhaXJsaW5lc193cmFwcGVyIiwiRHlncmFwaCIsIndpbmRvdyIsIm1vZHVsZSIsInJlcXVpcmUiLCJOQU1FIiwiUGx1Z2lucyIsIkhhaXJsaW5lcyIsIl9leHRyYXNfaGFpcmxpbmVzX2Nsb3N1cmUiLCJDTElDS19ERUxBWV9NUyIsImhhaXJsaW5lcyIsIm9wdF9vcHRpb25zIiwiaGFpcmxpbmVzXyIsImxhc3RXaWR0aF8iLCJsYXN0SGVpZ2h0IiwiZHlncmFwaF8iLCJhZGRUaW1lcl8iLCJkaXZGaWxsZXJfIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJhY3RpdmF0ZSIsImciLCJkaWREcmF3Q2hhcnQiLCJjbGljayIsImRibGNsaWNrIiwiZGF0YURpZFVwZGF0ZSIsImRldGFjaExhYmVscyIsImkiLCJsZW5ndGgiLCJoIiwiJCIsImxpbmVEaXYiLCJyZW1vdmUiLCJpbmZvRGl2IiwiaGFpcmxpbmVXYXNEcmFnZ2VkIiwiZXZlbnQiLCJ1aSIsImFyZWEiLCJnZXRBcmVhIiwib2xkWFZhbCIsInh2YWwiLCJ0b0RhdGFYQ29vcmQiLCJwb3NpdGlvbiIsImxlZnQiLCJtb3ZlSGFpcmxpbmVUb1RvcCIsInVwZGF0ZUhhaXJsaW5lRGl2UG9zaXRpb25zIiwidXBkYXRlSGFpcmxpbmVJbmZvIiwidXBkYXRlSGFpcmxpbmVTdHlsZXMiLCJ0cmlnZ2VySGFuZGxlciIsIm5ld1hWYWwiLCJjcmVhdGVIYWlybGluZSIsInByb3BzIiwic2VsZiIsIiRsaW5lQ29udGFpbmVyRGl2IiwiY3NzIiwiYWRkQ2xhc3MiLCIkbGluZURpdiIsImFwcGVuZFRvIiwiJGluZm9EaXYiLCJjbG9uZSIsInJlbW92ZUF0dHIiLCJzaG93IiwiZ2V0IiwiZHJhZ2dhYmxlIiwiZHJhZ1dyYXBwZXJfIiwiZXh0ZW5kIiwiaW50ZXJwb2xhdGVkIiwic2VsZWN0ZWQiLCJ0aGF0Iiwib24iLCJjbGlja0V2ZW50XyIsImUiLCJyZW1vdmVIYWlybGluZSIsInN0b3BQcm9wYWdhdGlvbiIsImNsaWNrSGFuZGxlcl8iLCJkaXYiLCJncmFwaERpdiIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJwdXNoIiwibGF5b3V0IiwiY2hhcnRMZWZ0IiwieCIsImNoYXJ0UmlnaHQiLCJ3IiwicG9zIiwiZmluZFBvcyIsImJveCIsInkiLCJlYWNoIiwiaXRlcmF0ZUhhaXJsaW5lc18iLCJ0b0RvbVhDb29yZCIsImRvbVgiLCJ2aXNpYmxlIiwidG9nZ2xlIiwidG9nZ2xlQ2xhc3MiLCJmaW5kUHJldk5leHRSb3dzIiwiY29sIiwicHJldlJvdyIsIm5leHRSb3ciLCJudW1Sb3dzIiwicm93IiwieXZhbCIsImdldFZhbHVlIiwidW5kZWZpbmVkIiwiaXNOYU4iLCJyb3dYdmFsIiwibW9kZSIsInhSYW5nZSIsInhBeGlzUmFuZ2UiLCJzZWxQb2ludHMiLCJsYWJlbHMiLCJnZXRMYWJlbHMiLCJmaW5kQ2xvc2VzdFJvdyIsIm51bUNvbHVtbnMiLCJjYW52YXN4IiwiY2FudmFzeSIsIm5hbWUiLCJwcmV2TmV4dFJvdyIsInByZXZYIiwibmV4dFgiLCJwcmV2WSIsIm5leHRZIiwiZnJhYyIsImNsb3Nlc3RSb3ciLCJwb2ludHMiLCJoYWlybGluZSIsImNyZWF0ZVB1YmxpY0hhaXJsaW5lXyIsImR5Z3JhcGgiLCJodG1sIiwiTGVnZW5kIiwiZ2VuZXJhdGVMZWdlbmRIVE1MIiwiYXR0YWNoSGFpcmxpbmVzVG9DaGFydF8iLCJ3YXJuIiwiaGFzT3duUHJvcGVydHkiLCJzZXRUaW1lb3V0IiwiY2xpY2tfdG1vXyIsImNsZWFyVGltZW91dCIsImRlc3Ryb3kiLCJyZXN1bHQiLCJzZXQiLCJhbnlDcmVhdGVkIiwiX3JlcXVpcmVkIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4dHJhcy9oYWlybGluZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTMgRGFuIFZhbmRlcmthbSAoZGFudmRrQGdtYWlsLmNvbSlcbiAqIE1JVC1saWNlbmNlZDogaHR0cHM6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqXG4gKiBOb3RlOiBUaGlzIHBsdWdpbiByZXF1aXJlcyBqUXVlcnkgYW5kIGpRdWVyeSBVSSBEcmFnZ2FibGUuXG4gKlxuICogU2VlIGhpZ2gtbGV2ZWwgZG9jdW1lbnRhdGlvbiBhdCAuLi8uLi9kb2NzL2hhaXJsaW5lcy1hbm5vdGF0aW9ucy5wZGZcbiAqL1xuXG4vKiBsb2FkZXIgd3JhcHBlciB0byBhbGxvdyBicm93c2VyIHVzZSBhbmQgRVM2IGltcG9ydHMgKi9cbihmdW5jdGlvbiBfZXh0cmFzX2hhaXJsaW5lc193cmFwcGVyKCkge1xuJ3VzZSBzdHJpY3QnO1xudmFyIER5Z3JhcGg7XG5pZiAod2luZG93LkR5Z3JhcGgpIHtcbiAgRHlncmFwaCA9IHdpbmRvdy5EeWdyYXBoO1xufSBlbHNlIGlmICh0eXBlb2YobW9kdWxlKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgRHlncmFwaCA9IHJlcXVpcmUoJy4uL2R5Z3JhcGgnKTtcbiAgaWYgKHR5cGVvZihEeWdyYXBoLk5BTUUpID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YoRHlncmFwaC5kZWZhdWx0KSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgRHlncmFwaCA9IER5Z3JhcGguZGVmYXVsdDtcbn1cbi8qIGVuZCBvZiBsb2FkZXIgd3JhcHBlciBoZWFkZXIgKi9cblxuRHlncmFwaC5QbHVnaW5zLkhhaXJsaW5lcyA9IChmdW5jdGlvbiBfZXh0cmFzX2hhaXJsaW5lc19jbG9zdXJlKCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBAdHlwZWRlZiB7XG4gKiAgIHh2YWw6ICBudW1iZXIsICAgICAgLy8geC12YWx1ZSAoaS5lLiBtaWxsaXMgb3IgYSByYXcgbnVtYmVyKVxuICogICBpbnRlcnBvbGF0ZWQ6IGJvb2wsICAvLyBhbHRlcm5hdGl2ZSBpcyB0byBzbmFwIHRvIGNsb3Nlc3RcbiAqICAgbGluZURpdjogIUVsZW1lbnQgICAgLy8gdmVydGljYWwgaGFpcmxpbmUgZGl2XG4gKiAgIGluZm9EaXY6ICFFbGVtZW50ICAgIC8vIGRpdiBjb250YWluaW5nIGluZm8gYWJvdXQgdGhlIG5lYXJlc3QgcG9pbnRzXG4gKiAgIHNlbGVjdGVkOiBib29sZWFuICAgIC8vIHdoZXRoZXIgdGhpcyBoYWlybGluZSBpcyBzZWxlY3RlZFxuICogfSBIYWlybGluZVxuICovXG5cbi8vIFdlIGhhdmUgdG8gd2FpdCBhIGZldyBtcyBhZnRlciBjbGlja3MgdG8gZ2l2ZSB0aGUgdXNlciBhIGNoYW5jZSB0b1xuLy8gZG91YmxlLWNsaWNrIHRvIHVuem9vbS4gVGhpcyBzZXRzIHRoYXQgZGVsYXkgcGVyaW9kLlxudmFyIENMSUNLX0RFTEFZX01TID0gMzAwO1xuXG52YXIgaGFpcmxpbmVzID0gZnVuY3Rpb24gaGFpcmxpbmVzKG9wdF9vcHRpb25zKSB7XG4gIC8qKiBAcHJpdmF0ZSB7IUFycmF5LjwhSGFpcmxpbmU+fSAqL1xuICB0aGlzLmhhaXJsaW5lc18gPSBbXTtcblxuICAvLyBVc2VkIHRvIGRldGVjdCByZXNpemVzICh3aGljaCByZXF1aXJlIHRoZSBkaXZzIHRvIGJlIHJlcG9zaXRpb25lZCkuXG4gIHRoaXMubGFzdFdpZHRoXyA9IC0xO1xuICB0aGlzLmxhc3RIZWlnaHQgPSAtMTtcbiAgdGhpcy5keWdyYXBoXyA9IG51bGw7XG5cbiAgdGhpcy5hZGRUaW1lcl8gPSBudWxsO1xuICBvcHRfb3B0aW9ucyA9IG9wdF9vcHRpb25zIHx8IHt9O1xuXG4gIHRoaXMuZGl2RmlsbGVyXyA9IG9wdF9vcHRpb25zWydkaXZGaWxsZXInXSB8fCBudWxsO1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICByZXR1cm4gXCJIYWlybGluZXMgUGx1Z2luXCI7XG59O1xuXG5oYWlybGluZXMucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gYWN0aXZhdGUoZykge1xuICB0aGlzLmR5Z3JhcGhfID0gZztcbiAgdGhpcy5oYWlybGluZXNfID0gW107XG5cbiAgcmV0dXJuIHtcbiAgICBkaWREcmF3Q2hhcnQ6IHRoaXMuZGlkRHJhd0NoYXJ0LFxuICAgIGNsaWNrOiB0aGlzLmNsaWNrLFxuICAgIGRibGNsaWNrOiB0aGlzLmRibGNsaWNrLFxuICAgIGRhdGFEaWRVcGRhdGU6IHRoaXMuZGF0YURpZFVwZGF0ZVxuICB9O1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5kZXRhY2hMYWJlbHMgPSBmdW5jdGlvbiBkZXRhY2hMYWJlbHMoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oYWlybGluZXNfLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGggPSB0aGlzLmhhaXJsaW5lc19baV07XG4gICAgJChoLmxpbmVEaXYpLnJlbW92ZSgpO1xuICAgICQoaC5pbmZvRGl2KS5yZW1vdmUoKTtcbiAgICB0aGlzLmhhaXJsaW5lc19baV0gPSBudWxsO1xuICB9XG4gIHRoaXMuaGFpcmxpbmVzXyA9IFtdO1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5oYWlybGluZVdhc0RyYWdnZWQgPSBmdW5jdGlvbiBoYWlybGluZVdhc0RyYWdnZWQoaCwgZXZlbnQsIHVpKSB7XG4gIHZhciBhcmVhID0gdGhpcy5keWdyYXBoXy5nZXRBcmVhKCk7XG4gIHZhciBvbGRYVmFsID0gaC54dmFsO1xuICBoLnh2YWwgPSB0aGlzLmR5Z3JhcGhfLnRvRGF0YVhDb29yZCh1aS5wb3NpdGlvbi5sZWZ0KTtcbiAgdGhpcy5tb3ZlSGFpcmxpbmVUb1RvcChoKTtcbiAgdGhpcy51cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUhhaXJsaW5lSW5mbygpO1xuICB0aGlzLnVwZGF0ZUhhaXJsaW5lU3R5bGVzKCk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lTW92ZWQnLCB7XG4gICAgb2xkWFZhbDogb2xkWFZhbCxcbiAgICBuZXdYVmFsOiBoLnh2YWxcbiAgfSk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lc0NoYW5nZWQnLCB7fSk7XG59O1xuXG4vLyBUaGlzIGNyZWF0ZXMgdGhlIGhhaXJsaW5lIG9iamVjdCBhbmQgcmV0dXJucyBpdC5cbi8vIEl0IGRvZXMgbm90IHBvc2l0aW9uIGl0IGFuZCBkb2VzIG5vdCBhdHRhY2ggaXQgdG8gdGhlIGNoYXJ0LlxuaGFpcmxpbmVzLnByb3RvdHlwZS5jcmVhdGVIYWlybGluZSA9IGZ1bmN0aW9uIGNyZWF0ZUhhaXJsaW5lKHByb3BzKSB7XG4gIHZhciBoO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyICRsaW5lQ29udGFpbmVyRGl2ID0gJCgnPGRpdi8+JykuY3NzKHtcbiAgICAgICd3aWR0aCc6ICc2cHgnLFxuICAgICAgJ21hcmdpbi1sZWZ0JzogJy0zcHgnLFxuICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcbiAgICAgICd6LWluZGV4JzogJzEwJ1xuICAgIH0pXG4gICAgLmFkZENsYXNzKCdkeWdyYXBoLWhhaXJsaW5lJyk7XG5cbiAgdmFyICRsaW5lRGl2ID0gJCgnPGRpdi8+JykuY3NzKHtcbiAgICAnd2lkdGgnOiAnMXB4JyxcbiAgICAncG9zaXRpb24nOiAncmVsYXRpdmUnLFxuICAgICdsZWZ0JzogJzNweCcsXG4gICAgJ2JhY2tncm91bmQnOiAnYmxhY2snLFxuICAgICdoZWlnaHQnOiAnMTAwJSdcbiAgfSk7XG4gICRsaW5lRGl2LmFwcGVuZFRvKCRsaW5lQ29udGFpbmVyRGl2KTtcblxuICB2YXIgJGluZm9EaXYgPSAkKCcjaGFpcmxpbmUtdGVtcGxhdGUnKS5jbG9uZSgpLnJlbW92ZUF0dHIoJ2lkJykuY3NzKHtcbiAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZSdcbiAgICB9KVxuICAgIC5zaG93KCk7XG5cbiAgLy8gU3VyZWx5IHRoZXJlJ3MgYSBtb3JlIGpRdWVyeS1pc2ggd2F5IHRvIGRvIHRoaXMhXG4gICQoWyRpbmZvRGl2LmdldCgwKSwgJGxpbmVDb250YWluZXJEaXYuZ2V0KDApXSlcbiAgICAuZHJhZ2dhYmxlKHtcbiAgICAgICdheGlzJzogJ3gnLFxuICAgICAgJ2RyYWcnOiBmdW5jdGlvbiBkcmFnV3JhcHBlcl8oZXZlbnQsIHVpKSB7XG4gICAgICAgIHNlbGYuaGFpcmxpbmVXYXNEcmFnZ2VkKGgsIGV2ZW50LCB1aSk7XG4gICAgICB9XG4gICAgICAvLyBUT0RPKGRhbnZrKTogc2V0IGN1cnNvciBoZXJlXG4gICAgfSk7XG5cbiAgaCA9ICQuZXh0ZW5kKHtcbiAgICBpbnRlcnBvbGF0ZWQ6IHRydWUsXG4gICAgc2VsZWN0ZWQ6IGZhbHNlLFxuICAgIGxpbmVEaXY6ICRsaW5lQ29udGFpbmVyRGl2LmdldCgwKSxcbiAgICBpbmZvRGl2OiAkaW5mb0Rpdi5nZXQoMClcbiAgfSwgcHJvcHMpO1xuXG4gIHZhciB0aGF0ID0gdGhpcztcbiAgJGluZm9EaXYub24oJ2NsaWNrJywgJy5oYWlybGluZS1raWxsLWJ1dHRvbicsIGZ1bmN0aW9uIGNsaWNrRXZlbnRfKGUpIHtcbiAgICB0aGF0LnJlbW92ZUhhaXJsaW5lKGgpO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lRGVsZXRlZCcsIHtcbiAgICAgIHh2YWw6IGgueHZhbFxuICAgIH0pO1xuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lc0NoYW5nZWQnLCB7fSk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgIC8vIGRvbid0IHdhbnQgLmNsaWNrKCkgdG8gdHJpZ2dlciwgYmVsb3cuXG4gIH0pLm9uKCdjbGljaycsIGZ1bmN0aW9uIGNsaWNrSGFuZGxlcl8oKSB7XG4gICAgdGhhdC5tb3ZlSGFpcmxpbmVUb1RvcChoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGg7XG59O1xuXG4vLyBNb3ZlcyBhIGhhaXJsaW5lJ3MgZGl2cyB0byB0aGUgdG9wIG9mIHRoZSB6LW9yZGVyaW5nLlxuaGFpcmxpbmVzLnByb3RvdHlwZS5tb3ZlSGFpcmxpbmVUb1RvcCA9IGZ1bmN0aW9uIG1vdmVIYWlybGluZVRvVG9wKGgpIHtcbiAgdmFyIGRpdiA9IHRoaXMuZHlncmFwaF8uZ3JhcGhEaXY7XG4gICQoaC5pbmZvRGl2KS5hcHBlbmRUbyhkaXYpO1xuICAkKGgubGluZURpdikuYXBwZW5kVG8oZGl2KTtcblxuICB2YXIgaWR4ID0gdGhpcy5oYWlybGluZXNfLmluZGV4T2YoaCk7XG4gIHRoaXMuaGFpcmxpbmVzXy5zcGxpY2UoaWR4LCAxKTtcbiAgdGhpcy5oYWlybGluZXNfLnB1c2goaCk7XG59O1xuXG4vLyBQb3NpdGlvbnMgZXhpc3RpbmcgaGFpcmxpbmUgZGl2cy5cbmhhaXJsaW5lcy5wcm90b3R5cGUudXBkYXRlSGFpcmxpbmVEaXZQb3NpdGlvbnMgPSBmdW5jdGlvbiB1cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucygpIHtcbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuICB2YXIgbGF5b3V0ID0gdGhpcy5keWdyYXBoXy5nZXRBcmVhKCk7XG4gIHZhciBjaGFydExlZnQgPSBsYXlvdXQueCwgY2hhcnRSaWdodCA9IGxheW91dC54ICsgbGF5b3V0Lnc7XG4gIHZhciBkaXYgPSB0aGlzLmR5Z3JhcGhfLmdyYXBoRGl2O1xuICB2YXIgcG9zID0gRHlncmFwaC5maW5kUG9zKGRpdik7XG4gIHZhciBib3ggPSBbbGF5b3V0LnggKyBwb3MueCwgbGF5b3V0LnkgKyBwb3MueV07XG4gIGJveC5wdXNoKGJveFswXSArIGxheW91dC53KTtcbiAgYm94LnB1c2goYm94WzFdICsgbGF5b3V0LmgpO1xuXG4gICQuZWFjaCh0aGlzLmhhaXJsaW5lc18sIGZ1bmN0aW9uIGl0ZXJhdGVIYWlybGluZXNfKGlkeCwgaCkge1xuICAgIHZhciBsZWZ0ID0gZy50b0RvbVhDb29yZChoLnh2YWwpO1xuICAgIGguZG9tWCA9IGxlZnQ7ICAvLyBTZWUgY29tbWVudHMgaW4gdGhpcy5kYXRhRGlkVXBkYXRlXG4gICAgJChoLmxpbmVEaXYpLmNzcyh7XG4gICAgICAnbGVmdCc6IGxlZnQgKyAncHgnLFxuICAgICAgJ3RvcCc6IGxheW91dC55ICsgJ3B4JyxcbiAgICAgICdoZWlnaHQnOiBsYXlvdXQuaCArICdweCdcbiAgICB9KTsgIC8vIC5kcmFnZ2FibGUoXCJvcHRpb25cIiwgXCJjb250YWlubWVudFwiLCBib3gpO1xuICAgICQoaC5pbmZvRGl2KS5jc3Moe1xuICAgICAgJ2xlZnQnOiBsZWZ0ICsgJ3B4JyxcbiAgICAgICd0b3AnOiBsYXlvdXQueSArICdweCcsXG4gICAgfSkuZHJhZ2dhYmxlKFwib3B0aW9uXCIsIFwiY29udGFpbm1lbnRcIiwgYm94KTtcblxuICAgIHZhciB2aXNpYmxlID0gKGxlZnQgPj0gY2hhcnRMZWZ0ICYmIGxlZnQgPD0gY2hhcnRSaWdodCk7XG4gICAgJChbaC5pbmZvRGl2LCBoLmxpbmVEaXZdKS50b2dnbGUodmlzaWJsZSk7XG4gIH0pO1xufTtcblxuLy8gU2V0cyBzdHlsZXMgb24gdGhlIGhhaXJsaW5lIChpLmUuIFwic2VsZWN0ZWRcIilcbmhhaXJsaW5lcy5wcm90b3R5cGUudXBkYXRlSGFpcmxpbmVTdHlsZXMgPSBmdW5jdGlvbiB1cGRhdGVIYWlybGluZVN0eWxlcygpIHtcbiAgJC5lYWNoKHRoaXMuaGFpcmxpbmVzXywgZnVuY3Rpb24gaXRlcmF0ZUhhaXJsaW5lc18oaWR4LCBoKSB7XG4gICAgJChbaC5pbmZvRGl2LCBoLmxpbmVEaXZdKS50b2dnbGVDbGFzcygnc2VsZWN0ZWQnLCBoLnNlbGVjdGVkKTtcbiAgfSk7XG59O1xuXG4vLyBGaW5kIHByZXZSb3cgYW5kIG5leHRSb3cgc3VjaCB0aGF0XG4vLyBnLmdldFZhbHVlKHByZXZSb3csIDApIDw9IHh2YWxcbi8vIGcuZ2V0VmFsdWUobmV4dFJvdywgMCkgPj0geHZhbFxuLy8gZy5nZXRWYWx1ZSh7cHJldixuZXh0fVJvdywgY29sKSAhPSBudWxsLCBOYU4gb3IgdW5kZWZpbmVkXG4vLyBhbmQgdGhlcmUncyBubyBvdGhlciByb3cgc3VjaCB0aGF0OlxuLy8gICBnLmdldFZhbHVlKHByZXZSb3csIDApIDwgZy5nZXRWYWx1ZShyb3csIDApIDwgZy5nZXRWYWx1ZShuZXh0Um93LCAwKVxuLy8gICBnLmdldFZhbHVlKHJvdywgY29sKSAhPSBudWxsLCBOYU4gb3IgdW5kZWZpbmVkLlxuLy8gUmV0dXJucyBbcHJldlJvdywgbmV4dFJvd10uIEVpdGhlciBjYW4gYmUgbnVsbCAoYnV0IG5vdCBib3RoKS5cbmhhaXJsaW5lcy5maW5kUHJldk5leHRSb3dzID0gZnVuY3Rpb24gZmluZFByZXZOZXh0Um93cyhnLCB4dmFsLCBjb2wpIHtcbiAgdmFyIHByZXZSb3cgPSBudWxsLCBuZXh0Um93ID0gbnVsbDtcbiAgdmFyIG51bVJvd3MgPSBnLm51bVJvd3MoKTtcbiAgZm9yICh2YXIgcm93ID0gMDsgcm93IDwgbnVtUm93czsgcm93KyspIHtcbiAgICB2YXIgeXZhbCA9IGcuZ2V0VmFsdWUocm93LCBjb2wpO1xuICAgIGlmICh5dmFsID09PSBudWxsIHx8IHl2YWwgPT09IHVuZGVmaW5lZCB8fCBpc05hTih5dmFsKSkgY29udGludWU7XG5cbiAgICB2YXIgcm93WHZhbCA9IGcuZ2V0VmFsdWUocm93LCAwKTtcbiAgICBpZiAocm93WHZhbCA8PSB4dmFsKSBwcmV2Um93ID0gcm93O1xuXG4gICAgaWYgKHJvd1h2YWwgPj0geHZhbCkge1xuICAgICAgbmV4dFJvdyA9IHJvdztcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbcHJldlJvdywgbmV4dFJvd107XG59O1xuXG4vLyBGaWxscyBvdXQgdGhlIGluZm8gZGl2IGJhc2VkIG9uIGN1cnJlbnQgY29vcmRpbmF0ZXMuXG5oYWlybGluZXMucHJvdG90eXBlLnVwZGF0ZUhhaXJsaW5lSW5mbyA9IGZ1bmN0aW9uIHVwZGF0ZUhhaXJsaW5lSW5mbygpIHtcbiAgdmFyIG1vZGUgPSAnY2xvc2VzdCc7XG5cbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuICB2YXIgeFJhbmdlID0gZy54QXhpc1JhbmdlKCk7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgJC5lYWNoKHRoaXMuaGFpcmxpbmVzXywgZnVuY3Rpb24gaXRlcmF0ZUhhaXJsaW5lc18oaWR4LCBoKSB7XG4gICAgLy8gVG8gdXNlIGdlbmVyYXRlTGVnZW5kSFRNTCwgd2Ugc3ludGhlc2l6ZSBhbiBhcnJheSBvZiBzZWxlY3RlZCBwb2ludHMuXG4gICAgdmFyIHNlbFBvaW50cyA9IFtdO1xuICAgIHZhciBsYWJlbHMgPSBnLmdldExhYmVscygpO1xuICAgIHZhciByb3csIHByZXZSb3csIG5leHRSb3c7XG5cbiAgICBpZiAoIWguaW50ZXJwb2xhdGVkKSB7XG4gICAgICAvLyBcImNsb3Nlc3QgcG9pbnRcIiBtb2RlLlxuICAgICAgLy8gVE9ETyhkYW52ayk6IG1ha2UgZmluZENsb3Nlc3RSb3cgbWV0aG9kIHB1YmxpY1xuICAgICAgcm93ID0gZy5maW5kQ2xvc2VzdFJvdyhnLnRvRG9tWENvb3JkKGgueHZhbCkpO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBnLm51bUNvbHVtbnMoKTsgaSsrKSB7XG4gICAgICAgIHNlbFBvaW50cy5wdXNoKHtcbiAgICAgICAgICBjYW52YXN4OiAxLCAgLy8gVE9ETyhkYW52ayk6IHJlYWwgY29vcmRpbmF0ZVxuICAgICAgICAgIGNhbnZhc3k6IDEsICAvLyBUT0RPKGRhbnZrKTogcmVhbCBjb29yZGluYXRlXG4gICAgICAgICAgeHZhbDogaC54dmFsLFxuICAgICAgICAgIHl2YWw6IGcuZ2V0VmFsdWUocm93LCBpKSxcbiAgICAgICAgICBuYW1lOiBsYWJlbHNbaV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFwiaW50ZXJwb2xhdGVkXCIgbW9kZS5cbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgZy5udW1Db2x1bW5zKCk7IGkrKykge1xuICAgICAgICB2YXIgcHJldk5leHRSb3cgPSBoYWlybGluZXMuZmluZFByZXZOZXh0Um93cyhnLCBoLnh2YWwsIGkpO1xuICAgICAgICBwcmV2Um93ID0gcHJldk5leHRSb3dbMF0sIG5leHRSb3cgPSBwcmV2TmV4dFJvd1sxXTtcblxuICAgICAgICAvLyBGb3IgeC12YWx1ZXMgb3V0c2lkZSB0aGUgZG9tYWluLCBpbnRlcnBvbGF0ZSBcImJldHdlZW5cIiB0aGUgZXh0cmVtZVxuICAgICAgICAvLyBwb2ludCBhbmQgaXRzZWxmLlxuICAgICAgICBpZiAocHJldlJvdyA9PT0gbnVsbCkgcHJldlJvdyA9IG5leHRSb3c7XG4gICAgICAgIGlmIChuZXh0Um93ID09PSBudWxsKSBuZXh0Um93ID0gcHJldlJvdztcblxuICAgICAgICAvLyBsaW5lYXIgaW50ZXJwb2xhdGlvblxuICAgICAgICB2YXIgcHJldlggPSBnLmdldFZhbHVlKHByZXZSb3csIDApLFxuICAgICAgICAgICAgbmV4dFggPSBnLmdldFZhbHVlKG5leHRSb3csIDApLFxuICAgICAgICAgICAgcHJldlkgPSBnLmdldFZhbHVlKHByZXZSb3csIGkpLFxuICAgICAgICAgICAgbmV4dFkgPSBnLmdldFZhbHVlKG5leHRSb3csIGkpLFxuICAgICAgICAgICAgZnJhYyA9IHByZXZSb3cgPT0gbmV4dFJvdyA/IDAgOiAoaC54dmFsIC0gcHJldlgpIC8gKG5leHRYIC0gcHJldlgpLFxuICAgICAgICAgICAgeXZhbCA9IGZyYWMgKiBuZXh0WSArICgxIC0gZnJhYykgKiBwcmV2WTtcblxuICAgICAgICBzZWxQb2ludHMucHVzaCh7XG4gICAgICAgICAgY2FudmFzeDogMSwgIC8vIFRPRE8oZGFudmspOiByZWFsIGNvb3JkaW5hdGVcbiAgICAgICAgICBjYW52YXN5OiAxLCAgLy8gVE9ETyhkYW52ayk6IHJlYWwgY29vcmRpbmF0ZVxuICAgICAgICAgIHh2YWw6IGgueHZhbCxcbiAgICAgICAgICB5dmFsOiB5dmFsLFxuICAgICAgICAgIHByZXZSb3c6IHByZXZSb3csXG4gICAgICAgICAgbmV4dFJvdzogbmV4dFJvdyxcbiAgICAgICAgICBuYW1lOiBsYWJlbHNbaV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoYXQuZGl2RmlsbGVyXykge1xuICAgICAgdGhhdC5kaXZGaWxsZXJfKGguaW5mb0Rpdiwge1xuICAgICAgICBjbG9zZXN0Um93OiByb3csXG4gICAgICAgIHBvaW50czogc2VsUG9pbnRzLFxuICAgICAgICBoYWlybGluZTogdGhhdC5jcmVhdGVQdWJsaWNIYWlybGluZV8oaCksXG4gICAgICAgIGR5Z3JhcGg6IGdcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaHRtbCA9IER5Z3JhcGguUGx1Z2lucy5MZWdlbmQuZ2VuZXJhdGVMZWdlbmRIVE1MKGcsIGgueHZhbCwgc2VsUG9pbnRzLCAxMCk7XG4gICAgICAkKCcuaGFpcmxpbmUtbGVnZW5kJywgaC5pbmZvRGl2KS5odG1sKGh0bWwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vLyBBZnRlciBhIHJlc2l6ZSwgdGhlIGhhaXJsaW5lIGRpdnMgY2FuIGdldCBkZXR0YWNoZWQgZnJvbSB0aGUgY2hhcnQuXG4vLyBUaGlzIHJlYXR0YWNoZXMgdGhlbS5cbmhhaXJsaW5lcy5wcm90b3R5cGUuYXR0YWNoSGFpcmxpbmVzVG9DaGFydF8gPSBmdW5jdGlvbiBhdHRhY2hIYWlybGluZXNUb0NoYXJ0XygpIHtcbiAgdmFyIGRpdiA9IHRoaXMuZHlncmFwaF8uZ3JhcGhEaXY7XG4gICQuZWFjaCh0aGlzLmhhaXJsaW5lc18sIGZ1bmN0aW9uIGl0ZXJhdGVIYWlybGluZXNfKGlkeCwgaCkge1xuICAgICQoW2gubGluZURpdiwgaC5pbmZvRGl2XSkuYXBwZW5kVG8oZGl2KTtcbiAgfSk7XG59O1xuXG4vLyBEZWxldGVzIGEgaGFpcmxpbmUgYW5kIHJlbW92ZXMgaXQgZnJvbSB0aGUgY2hhcnQuXG5oYWlybGluZXMucHJvdG90eXBlLnJlbW92ZUhhaXJsaW5lID0gZnVuY3Rpb24gcmVtb3ZlSGFpcmxpbmUoaCkge1xuICB2YXIgaWR4ID0gdGhpcy5oYWlybGluZXNfLmluZGV4T2YoaCk7XG4gIGlmIChpZHggPj0gMCkge1xuICAgIHRoaXMuaGFpcmxpbmVzXy5zcGxpY2UoaWR4LCAxKTtcbiAgICAkKFtoLmxpbmVEaXYsIGguaW5mb0Rpdl0pLnJlbW92ZSgpO1xuICB9IGVsc2Uge1xuICAgIER5Z3JhcGgud2FybignVHJpZWQgdG8gcmVtb3ZlIG5vbi1leGlzdGVudCBoYWlybGluZS4nKTtcbiAgfVxufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5kaWREcmF3Q2hhcnQgPSBmdW5jdGlvbiBkaWREcmF3Q2hhcnQoZSkge1xuICB2YXIgZyA9IGUuZHlncmFwaDtcblxuICAvLyBFYXJseSBvdXQgaW4gdGhlIChjb21tb24pIGNhc2Ugb2YgemVybyBoYWlybGluZXMuXG4gIGlmICh0aGlzLmhhaXJsaW5lc18ubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgdGhpcy51cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucygpO1xuICB0aGlzLmF0dGFjaEhhaXJsaW5lc1RvQ2hhcnRfKCk7XG4gIHRoaXMudXBkYXRlSGFpcmxpbmVJbmZvKCk7XG4gIHRoaXMudXBkYXRlSGFpcmxpbmVTdHlsZXMoKTtcbn07XG5cbmhhaXJsaW5lcy5wcm90b3R5cGUuZGF0YURpZFVwZGF0ZSA9IGZ1bmN0aW9uIGRhdGFEaWRVcGRhdGUoZSkge1xuICAvLyBXaGVuIHRoZSBkYXRhIGluIHRoZSBjaGFydCB1cGRhdGVzLCB0aGUgaGFpcmxpbmVzIHNob3VsZCBzdGF5IGluIHRoZSBzYW1lXG4gIC8vIHBvc2l0aW9uIG9uIHRoZSBzY3JlZW4uIGRpZERyYXdDaGFydCBzdG9yZXMgYSBkb21YIHBhcmFtZXRlciBmb3IgZWFjaFxuICAvLyBoYWlybGluZS4gV2UgdXNlIHRoYXQgdG8gcmVwb3NpdGlvbiB0aGVtIG9uIGRhdGEgdXBkYXRlcy5cbiAgdmFyIGcgPSB0aGlzLmR5Z3JhcGhfO1xuICAkLmVhY2godGhpcy5oYWlybGluZXNfLCBmdW5jdGlvbiBpdGVyYXRlSGFpcmxpbmVzXyhpZHgsIGgpIHtcbiAgICBpZiAoaC5oYXNPd25Qcm9wZXJ0eSgnZG9tWCcpKSB7XG4gICAgICBoLnh2YWwgPSBnLnRvRGF0YVhDb29yZChoLmRvbVgpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5oYWlybGluZXMucHJvdG90eXBlLmNsaWNrID0gZnVuY3Rpb24gY2xpY2soZSkge1xuICBpZiAodGhpcy5hZGRUaW1lcl8pIHtcbiAgICAvLyBBbm90aGVyIGNsaWNrIGlzIGluIHByb2dyZXNzOyBpZ25vcmUgdGhpcyBvbmUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGFyZWEgPSBlLmR5Z3JhcGguZ2V0QXJlYSgpO1xuICB2YXIgeHZhbCA9IHRoaXMuZHlncmFwaF8udG9EYXRhWENvb3JkKGUuY2FudmFzeCk7XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuICB0aGlzLmFkZFRpbWVyXyA9IHNldFRpbWVvdXQoZnVuY3Rpb24gY2xpY2tfdG1vXygpIHtcbiAgICB0aGF0LmFkZFRpbWVyXyA9IG51bGw7XG4gICAgdGhhdC5oYWlybGluZXNfLnB1c2godGhhdC5jcmVhdGVIYWlybGluZSh7eHZhbDogeHZhbH0pKTtcblxuICAgIHRoYXQudXBkYXRlSGFpcmxpbmVEaXZQb3NpdGlvbnMoKTtcbiAgICB0aGF0LnVwZGF0ZUhhaXJsaW5lSW5mbygpO1xuICAgIHRoYXQudXBkYXRlSGFpcmxpbmVTdHlsZXMoKTtcbiAgICB0aGF0LmF0dGFjaEhhaXJsaW5lc1RvQ2hhcnRfKCk7XG5cbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdoYWlybGluZUNyZWF0ZWQnLCB7XG4gICAgICB4dmFsOiB4dmFsXG4gICAgfSk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignaGFpcmxpbmVzQ2hhbmdlZCcsIHt9KTtcbiAgfSwgQ0xJQ0tfREVMQVlfTVMpO1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5kYmxjbGljayA9IGZ1bmN0aW9uIGRibGNsaWNrKGUpIHtcbiAgaWYgKHRoaXMuYWRkVGltZXJfKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuYWRkVGltZXJfKTtcbiAgICB0aGlzLmFkZFRpbWVyXyA9IG51bGw7XG4gIH1cbn07XG5cbmhhaXJsaW5lcy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gIHRoaXMuZGV0YWNoTGFiZWxzKCk7XG59O1xuXG4vLyBQdWJsaWMgQVBJXG5cbi8qKlxuICogVGhpcyBpcyBhIHJlc3RyaWN0ZWQgdmlldyBvZiB0aGlzLmhhaXJsaW5lc18gd2hpY2ggZG9lc24ndCBleHBvc2VcbiAqIGltcGxlbWVudGF0aW9uIGRldGFpbHMgbGlrZSB0aGUgaGFuZGxlIGRpdnMuXG4gKlxuICogQHR5cGVkZWYge1xuICogICB4dmFsOiAgbnVtYmVyLCAgICAgICAvLyB4LXZhbHVlIChpLmUuIG1pbGxpcyBvciBhIHJhdyBudW1iZXIpXG4gKiAgIGludGVycG9sYXRlZDogYm9vbCwgIC8vIGFsdGVybmF0aXZlIGlzIHRvIHNuYXAgdG8gY2xvc2VzdFxuICogICBzZWxlY3RlZDogYm9vbCAgICAgICAvLyB3aGV0aGVyIHRoZSBoYWlybGluZSBpcyBzZWxlY3RlZC5cbiAqIH0gUHVibGljSGFpcmxpbmVcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7IUhhaXJsaW5lfSBoIEludGVybmFsIGhhaXJsaW5lLlxuICogQHJldHVybiB7IVB1YmxpY0hhaXJsaW5lfSBSZXN0cmljdGVkIHB1YmxpYyB2aWV3IG9mIHRoZSBoYWlybGluZS5cbiAqL1xuaGFpcmxpbmVzLnByb3RvdHlwZS5jcmVhdGVQdWJsaWNIYWlybGluZV8gPSBmdW5jdGlvbiBjcmVhdGVQdWJsaWNIYWlybGluZV8oaCkge1xuICByZXR1cm4ge1xuICAgIHh2YWw6IGgueHZhbCxcbiAgICBpbnRlcnBvbGF0ZWQ6IGguaW50ZXJwb2xhdGVkLFxuICAgIHNlbGVjdGVkOiBoLnNlbGVjdGVkXG4gIH07XG59O1xuXG4vKipcbiAqIEByZXR1cm4geyFBcnJheS48IVB1YmxpY0hhaXJsaW5lPn0gVGhlIGN1cnJlbnQgc2V0IG9mIGhhaXJsaW5lcywgb3JkZXJlZFxuICogICAgIGZyb20gYmFjayB0byBmcm9udC5cbiAqL1xuaGFpcmxpbmVzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhhaXJsaW5lc18ubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaCA9IHRoaXMuaGFpcmxpbmVzX1tpXTtcbiAgICByZXN1bHQucHVzaCh0aGlzLmNyZWF0ZVB1YmxpY0hhaXJsaW5lXyhoKSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsbGluZyB0aGlzIHdpbGwgcmVzdWx0IGluIGEgaGFpcmxpbmVzQ2hhbmdlZCBldmVudCBiZWluZyB0cmlnZ2VyZWQsIG5vXG4gKiBtYXR0ZXIgd2hldGhlciBpdCBjb25zaXN0cyBvZiBhZGRpdGlvbnMsIGRlbGV0aW9ucywgbW92ZXMgb3Igbm8gY2hhbmdlcyBhdFxuICogYWxsLlxuICpcbiAqIEBwYXJhbSB7IUFycmF5LjwhUHVibGljSGFpcmxpbmU+fSBoYWlybGluZXMgVGhlIG5ldyBzZXQgb2YgaGFpcmxpbmVzLFxuICogICAgIG9yZGVyZWQgZnJvbSBiYWNrIHRvIGZyb250LlxuICovXG5oYWlybGluZXMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldChoYWlybGluZXMpIHtcbiAgLy8gUmUtdXNlIGRpdnMgZnJvbSB0aGUgb2xkIGhhaXJsaW5lcyBhcnJheSBzbyBmYXIgYXMgd2UgY2FuLlxuICAvLyBUaGV5J3JlIGFscmVhZHkgY29ycmVjdGx5IHotb3JkZXJlZC5cbiAgdmFyIGFueUNyZWF0ZWQgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYWlybGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaCA9IGhhaXJsaW5lc1tpXTtcblxuICAgIGlmICh0aGlzLmhhaXJsaW5lc18ubGVuZ3RoID4gaSkge1xuICAgICAgdGhpcy5oYWlybGluZXNfW2ldLnh2YWwgPSBoLnh2YWw7XG4gICAgICB0aGlzLmhhaXJsaW5lc19baV0uaW50ZXJwb2xhdGVkID0gaC5pbnRlcnBvbGF0ZWQ7XG4gICAgICB0aGlzLmhhaXJsaW5lc19baV0uc2VsZWN0ZWQgPSBoLnNlbGVjdGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhhaXJsaW5lc18ucHVzaCh0aGlzLmNyZWF0ZUhhaXJsaW5lKHtcbiAgICAgICAgeHZhbDogaC54dmFsLFxuICAgICAgICBpbnRlcnBvbGF0ZWQ6IGguaW50ZXJwb2xhdGVkLFxuICAgICAgICBzZWxlY3RlZDogaC5zZWxlY3RlZFxuICAgICAgfSkpO1xuICAgICAgYW55Q3JlYXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSByZW1haW5pbmcgaGFpcmxpbmVzLCBkZXN0cm95IHRoZW0uXG4gIHdoaWxlIChoYWlybGluZXMubGVuZ3RoIDwgdGhpcy5oYWlybGluZXNfLmxlbmd0aCkge1xuICAgIHRoaXMucmVtb3ZlSGFpcmxpbmUodGhpcy5oYWlybGluZXNfW2hhaXJsaW5lcy5sZW5ndGhdKTtcbiAgfVxuXG4gIHRoaXMudXBkYXRlSGFpcmxpbmVEaXZQb3NpdGlvbnMoKTtcbiAgdGhpcy51cGRhdGVIYWlybGluZUluZm8oKTtcbiAgdGhpcy51cGRhdGVIYWlybGluZVN0eWxlcygpO1xuICBpZiAoYW55Q3JlYXRlZCkge1xuICAgIHRoaXMuYXR0YWNoSGFpcmxpbmVzVG9DaGFydF8oKTtcbiAgfVxuXG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lc0NoYW5nZWQnLCB7fSk7XG59O1xuXG5yZXR1cm4gaGFpcmxpbmVzO1xuXG59KSgpO1xuXG4vKiBsb2FkZXIgd3JhcHBlciAqL1xuRHlncmFwaC5fcmVxdWlyZWQoJ2R5Z3JhcGhzL3NyYy9leHRyYXMvaGFpcmxpbmVzLmpzJywgLyogZXhwb3J0cyAqLyB7fSk7XG59KSgpO1xuIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLENBQUMsU0FBU0EseUJBQXlCLEdBQUc7RUFDdEMsWUFBWTs7RUFDWixJQUFJQyxP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