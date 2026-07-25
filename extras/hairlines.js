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
    'use strict';

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
      var $lineContainerDiv = $('<div />').css({
        'width': '6px',
        'margin-left': '-3px',
        'position': 'absolute',
        'z-index': '10'
      }).addClass('dygraph-hairline');
      var $lineDiv = $('<div />').css({
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
  Dygraph._require.add('dygraphs/src/extras/hairlines.js', /* exports */{});
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX2hhaXJsaW5lc193cmFwcGVyIiwiRHlncmFwaCIsIndpbmRvdyIsIm1vZHVsZSIsInJlcXVpcmUiLCJOQU1FIiwiUGx1Z2lucyIsIkhhaXJsaW5lcyIsIl9leHRyYXNfaGFpcmxpbmVzX2Nsb3N1cmUiLCJDTElDS19ERUxBWV9NUyIsImhhaXJsaW5lcyIsIm9wdF9vcHRpb25zIiwiaGFpcmxpbmVzXyIsImxhc3RXaWR0aF8iLCJsYXN0SGVpZ2h0IiwiZHlncmFwaF8iLCJhZGRUaW1lcl8iLCJkaXZGaWxsZXJfIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJhY3RpdmF0ZSIsImciLCJkaWREcmF3Q2hhcnQiLCJjbGljayIsImRibGNsaWNrIiwiZGF0YURpZFVwZGF0ZSIsImRldGFjaExhYmVscyIsImkiLCJsZW5ndGgiLCJoIiwiJCIsImxpbmVEaXYiLCJyZW1vdmUiLCJpbmZvRGl2IiwiaGFpcmxpbmVXYXNEcmFnZ2VkIiwiZXZlbnQiLCJ1aSIsImFyZWEiLCJnZXRBcmVhIiwib2xkWFZhbCIsInh2YWwiLCJ0b0RhdGFYQ29vcmQiLCJwb3NpdGlvbiIsImxlZnQiLCJtb3ZlSGFpcmxpbmVUb1RvcCIsInVwZGF0ZUhhaXJsaW5lRGl2UG9zaXRpb25zIiwidXBkYXRlSGFpcmxpbmVJbmZvIiwidXBkYXRlSGFpcmxpbmVTdHlsZXMiLCJ0cmlnZ2VySGFuZGxlciIsIm5ld1hWYWwiLCJjcmVhdGVIYWlybGluZSIsInByb3BzIiwic2VsZiIsIiRsaW5lQ29udGFpbmVyRGl2IiwiY3NzIiwiYWRkQ2xhc3MiLCIkbGluZURpdiIsImFwcGVuZFRvIiwiJGluZm9EaXYiLCJjbG9uZSIsInJlbW92ZUF0dHIiLCJzaG93IiwiZ2V0IiwiZHJhZ2dhYmxlIiwiZHJhZ1dyYXBwZXJfIiwiZXh0ZW5kIiwiaW50ZXJwb2xhdGVkIiwic2VsZWN0ZWQiLCJ0aGF0Iiwib24iLCJjbGlja0V2ZW50XyIsImUiLCJyZW1vdmVIYWlybGluZSIsInN0b3BQcm9wYWdhdGlvbiIsImNsaWNrSGFuZGxlcl8iLCJkaXYiLCJncmFwaERpdiIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJwdXNoIiwibGF5b3V0IiwiY2hhcnRMZWZ0IiwieCIsImNoYXJ0UmlnaHQiLCJ3IiwicG9zIiwiZmluZFBvcyIsImJveCIsInkiLCJlYWNoIiwiaXRlcmF0ZUhhaXJsaW5lc18iLCJ0b0RvbVhDb29yZCIsImRvbVgiLCJ2aXNpYmxlIiwidG9nZ2xlIiwidG9nZ2xlQ2xhc3MiLCJmaW5kUHJldk5leHRSb3dzIiwiY29sIiwicHJldlJvdyIsIm5leHRSb3ciLCJudW1Sb3dzIiwicm93IiwieXZhbCIsImdldFZhbHVlIiwidW5kZWZpbmVkIiwiaXNOYU4iLCJyb3dYdmFsIiwibW9kZSIsInhSYW5nZSIsInhBeGlzUmFuZ2UiLCJzZWxQb2ludHMiLCJsYWJlbHMiLCJnZXRMYWJlbHMiLCJmaW5kQ2xvc2VzdFJvdyIsIm51bUNvbHVtbnMiLCJjYW52YXN4IiwiY2FudmFzeSIsIm5hbWUiLCJwcmV2TmV4dFJvdyIsInByZXZYIiwibmV4dFgiLCJwcmV2WSIsIm5leHRZIiwiZnJhYyIsImNsb3Nlc3RSb3ciLCJwb2ludHMiLCJoYWlybGluZSIsImNyZWF0ZVB1YmxpY0hhaXJsaW5lXyIsImR5Z3JhcGgiLCJodG1sIiwiTGVnZW5kIiwiZ2VuZXJhdGVMZWdlbmRIVE1MIiwiYXR0YWNoSGFpcmxpbmVzVG9DaGFydF8iLCJ3YXJuIiwiaGFzT3duUHJvcGVydHkiLCJzZXRUaW1lb3V0IiwiY2xpY2tfdG1vXyIsImNsZWFyVGltZW91dCIsImRlc3Ryb3kiLCJyZXN1bHQiLCJzZXQiLCJhbnlDcmVhdGVkIiwiX3JlcXVpcmUiLCJhZGQiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvZXh0cmFzL2hhaXJsaW5lcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxMyBEYW4gVmFuZGVya2FtIChkYW52ZGtAZ21haWwuY29tKVxuICogTUlULWxpY2VuY2VkOiBodHRwczovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICpcbiAqIE5vdGU6IFRoaXMgcGx1Z2luIHJlcXVpcmVzIGpRdWVyeSBhbmQgalF1ZXJ5IFVJIERyYWdnYWJsZS5cbiAqXG4gKiBTZWUgaGlnaC1sZXZlbCBkb2N1bWVudGF0aW9uIGF0IC4uLy4uL2RvY3MvaGFpcmxpbmVzLWFubm90YXRpb25zLnBkZlxuICovXG5cbi8qIGxvYWRlciB3cmFwcGVyIHRvIGFsbG93IGJyb3dzZXIgdXNlIGFuZCBFUzYgaW1wb3J0cyAqL1xuKGZ1bmN0aW9uIF9leHRyYXNfaGFpcmxpbmVzX3dyYXBwZXIoKSB7XG4ndXNlIHN0cmljdCc7XG52YXIgRHlncmFwaDtcbmlmICh3aW5kb3cuRHlncmFwaCkge1xuICBEeWdyYXBoID0gd2luZG93LkR5Z3JhcGg7XG59IGVsc2UgaWYgKHR5cGVvZihtb2R1bGUpICE9PSAndW5kZWZpbmVkJykge1xuICBEeWdyYXBoID0gcmVxdWlyZSgnLi4vZHlncmFwaCcpO1xuICBpZiAodHlwZW9mKER5Z3JhcGguTkFNRSkgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZihEeWdyYXBoLmRlZmF1bHQpICE9PSAndW5kZWZpbmVkJylcbiAgICBEeWdyYXBoID0gRHlncmFwaC5kZWZhdWx0O1xufVxuLyogZW5kIG9mIGxvYWRlciB3cmFwcGVyIGhlYWRlciAqL1xuXG5EeWdyYXBoLlBsdWdpbnMuSGFpcmxpbmVzID0gKGZ1bmN0aW9uIF9leHRyYXNfaGFpcmxpbmVzX2Nsb3N1cmUoKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAdHlwZWRlZiB7XG4gKiAgIHh2YWw6ICBudW1iZXIsICAgICAgLy8geC12YWx1ZSAoaS5lLiBtaWxsaXMgb3IgYSByYXcgbnVtYmVyKVxuICogICBpbnRlcnBvbGF0ZWQ6IGJvb2wsICAvLyBhbHRlcm5hdGl2ZSBpcyB0byBzbmFwIHRvIGNsb3Nlc3RcbiAqICAgbGluZURpdjogIUVsZW1lbnQgICAgLy8gdmVydGljYWwgaGFpcmxpbmUgZGl2XG4gKiAgIGluZm9EaXY6ICFFbGVtZW50ICAgIC8vIGRpdiBjb250YWluaW5nIGluZm8gYWJvdXQgdGhlIG5lYXJlc3QgcG9pbnRzXG4gKiAgIHNlbGVjdGVkOiBib29sZWFuICAgIC8vIHdoZXRoZXIgdGhpcyBoYWlybGluZSBpcyBzZWxlY3RlZFxuICogfSBIYWlybGluZVxuICovXG5cbi8vIFdlIGhhdmUgdG8gd2FpdCBhIGZldyBtcyBhZnRlciBjbGlja3MgdG8gZ2l2ZSB0aGUgdXNlciBhIGNoYW5jZSB0b1xuLy8gZG91YmxlLWNsaWNrIHRvIHVuem9vbS4gVGhpcyBzZXRzIHRoYXQgZGVsYXkgcGVyaW9kLlxudmFyIENMSUNLX0RFTEFZX01TID0gMzAwO1xuXG52YXIgaGFpcmxpbmVzID0gZnVuY3Rpb24gaGFpcmxpbmVzKG9wdF9vcHRpb25zKSB7XG4gIC8qKiBAcHJpdmF0ZSB7IUFycmF5LjwhSGFpcmxpbmU+fSAqL1xuICB0aGlzLmhhaXJsaW5lc18gPSBbXTtcblxuICAvLyBVc2VkIHRvIGRldGVjdCByZXNpemVzICh3aGljaCByZXF1aXJlIHRoZSBkaXZzIHRvIGJlIHJlcG9zaXRpb25lZCkuXG4gIHRoaXMubGFzdFdpZHRoXyA9IC0xO1xuICB0aGlzLmxhc3RIZWlnaHQgPSAtMTtcbiAgdGhpcy5keWdyYXBoXyA9IG51bGw7XG5cbiAgdGhpcy5hZGRUaW1lcl8gPSBudWxsO1xuICBvcHRfb3B0aW9ucyA9IG9wdF9vcHRpb25zIHx8IHt9O1xuXG4gIHRoaXMuZGl2RmlsbGVyXyA9IG9wdF9vcHRpb25zWydkaXZGaWxsZXInXSB8fCBudWxsO1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICByZXR1cm4gXCJIYWlybGluZXMgUGx1Z2luXCI7XG59O1xuXG5oYWlybGluZXMucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gYWN0aXZhdGUoZykge1xuICB0aGlzLmR5Z3JhcGhfID0gZztcbiAgdGhpcy5oYWlybGluZXNfID0gW107XG5cbiAgcmV0dXJuIHtcbiAgICBkaWREcmF3Q2hhcnQ6IHRoaXMuZGlkRHJhd0NoYXJ0LFxuICAgIGNsaWNrOiB0aGlzLmNsaWNrLFxuICAgIGRibGNsaWNrOiB0aGlzLmRibGNsaWNrLFxuICAgIGRhdGFEaWRVcGRhdGU6IHRoaXMuZGF0YURpZFVwZGF0ZVxuICB9O1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5kZXRhY2hMYWJlbHMgPSBmdW5jdGlvbiBkZXRhY2hMYWJlbHMoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oYWlybGluZXNfLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGggPSB0aGlzLmhhaXJsaW5lc19baV07XG4gICAgJChoLmxpbmVEaXYpLnJlbW92ZSgpO1xuICAgICQoaC5pbmZvRGl2KS5yZW1vdmUoKTtcbiAgICB0aGlzLmhhaXJsaW5lc19baV0gPSBudWxsO1xuICB9XG4gIHRoaXMuaGFpcmxpbmVzXyA9IFtdO1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5oYWlybGluZVdhc0RyYWdnZWQgPSBmdW5jdGlvbiBoYWlybGluZVdhc0RyYWdnZWQoaCwgZXZlbnQsIHVpKSB7XG4gIHZhciBhcmVhID0gdGhpcy5keWdyYXBoXy5nZXRBcmVhKCk7XG4gIHZhciBvbGRYVmFsID0gaC54dmFsO1xuICBoLnh2YWwgPSB0aGlzLmR5Z3JhcGhfLnRvRGF0YVhDb29yZCh1aS5wb3NpdGlvbi5sZWZ0KTtcbiAgdGhpcy5tb3ZlSGFpcmxpbmVUb1RvcChoKTtcbiAgdGhpcy51cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUhhaXJsaW5lSW5mbygpO1xuICB0aGlzLnVwZGF0ZUhhaXJsaW5lU3R5bGVzKCk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lTW92ZWQnLCB7XG4gICAgb2xkWFZhbDogb2xkWFZhbCxcbiAgICBuZXdYVmFsOiBoLnh2YWxcbiAgfSk7XG4gICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lc0NoYW5nZWQnLCB7fSk7XG59O1xuXG4vLyBUaGlzIGNyZWF0ZXMgdGhlIGhhaXJsaW5lIG9iamVjdCBhbmQgcmV0dXJucyBpdC5cbi8vIEl0IGRvZXMgbm90IHBvc2l0aW9uIGl0IGFuZCBkb2VzIG5vdCBhdHRhY2ggaXQgdG8gdGhlIGNoYXJ0LlxuaGFpcmxpbmVzLnByb3RvdHlwZS5jcmVhdGVIYWlybGluZSA9IGZ1bmN0aW9uIGNyZWF0ZUhhaXJsaW5lKHByb3BzKSB7XG4gIHZhciBoO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyICRsaW5lQ29udGFpbmVyRGl2ID0gJCgnPGRpdiAvPicpLmNzcyh7XG4gICAgICAnd2lkdGgnOiAnNnB4JyxcbiAgICAgICdtYXJnaW4tbGVmdCc6ICctM3B4JyxcbiAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXG4gICAgICAnei1pbmRleCc6ICcxMCdcbiAgICB9KVxuICAgIC5hZGRDbGFzcygnZHlncmFwaC1oYWlybGluZScpO1xuXG4gIHZhciAkbGluZURpdiA9ICQoJzxkaXYgLz4nKS5jc3Moe1xuICAgICd3aWR0aCc6ICcxcHgnLFxuICAgICdwb3NpdGlvbic6ICdyZWxhdGl2ZScsXG4gICAgJ2xlZnQnOiAnM3B4JyxcbiAgICAnYmFja2dyb3VuZCc6ICdibGFjaycsXG4gICAgJ2hlaWdodCc6ICcxMDAlJ1xuICB9KTtcbiAgJGxpbmVEaXYuYXBwZW5kVG8oJGxpbmVDb250YWluZXJEaXYpO1xuXG4gIHZhciAkaW5mb0RpdiA9ICQoJyNoYWlybGluZS10ZW1wbGF0ZScpLmNsb25lKCkucmVtb3ZlQXR0cignaWQnKS5jc3Moe1xuICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJ1xuICAgIH0pXG4gICAgLnNob3coKTtcblxuICAvLyBTdXJlbHkgdGhlcmUncyBhIG1vcmUgalF1ZXJ5LWlzaCB3YXkgdG8gZG8gdGhpcyFcbiAgJChbJGluZm9EaXYuZ2V0KDApLCAkbGluZUNvbnRhaW5lckRpdi5nZXQoMCldKVxuICAgIC5kcmFnZ2FibGUoe1xuICAgICAgJ2F4aXMnOiAneCcsXG4gICAgICAnZHJhZyc6IGZ1bmN0aW9uIGRyYWdXcmFwcGVyXyhldmVudCwgdWkpIHtcbiAgICAgICAgc2VsZi5oYWlybGluZVdhc0RyYWdnZWQoaCwgZXZlbnQsIHVpKTtcbiAgICAgIH1cbiAgICAgIC8vIFRPRE8oZGFudmspOiBzZXQgY3Vyc29yIGhlcmVcbiAgICB9KTtcblxuICBoID0gJC5leHRlbmQoe1xuICAgIGludGVycG9sYXRlZDogdHJ1ZSxcbiAgICBzZWxlY3RlZDogZmFsc2UsXG4gICAgbGluZURpdjogJGxpbmVDb250YWluZXJEaXYuZ2V0KDApLFxuICAgIGluZm9EaXY6ICRpbmZvRGl2LmdldCgwKVxuICB9LCBwcm9wcyk7XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuICAkaW5mb0Rpdi5vbignY2xpY2snLCAnLmhhaXJsaW5lLWtpbGwtYnV0dG9uJywgZnVuY3Rpb24gY2xpY2tFdmVudF8oZSkge1xuICAgIHRoYXQucmVtb3ZlSGFpcmxpbmUoaCk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignaGFpcmxpbmVEZWxldGVkJywge1xuICAgICAgeHZhbDogaC54dmFsXG4gICAgfSk7XG4gICAgJCh0aGF0KS50cmlnZ2VySGFuZGxlcignaGFpcmxpbmVzQ2hhbmdlZCcsIHt9KTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAgLy8gZG9uJ3Qgd2FudCAuY2xpY2soKSB0byB0cmlnZ2VyLCBiZWxvdy5cbiAgfSkub24oJ2NsaWNrJywgZnVuY3Rpb24gY2xpY2tIYW5kbGVyXygpIHtcbiAgICB0aGF0Lm1vdmVIYWlybGluZVRvVG9wKGgpO1xuICB9KTtcblxuICByZXR1cm4gaDtcbn07XG5cbi8vIE1vdmVzIGEgaGFpcmxpbmUncyBkaXZzIHRvIHRoZSB0b3Agb2YgdGhlIHotb3JkZXJpbmcuXG5oYWlybGluZXMucHJvdG90eXBlLm1vdmVIYWlybGluZVRvVG9wID0gZnVuY3Rpb24gbW92ZUhhaXJsaW5lVG9Ub3AoaCkge1xuICB2YXIgZGl2ID0gdGhpcy5keWdyYXBoXy5ncmFwaERpdjtcbiAgJChoLmluZm9EaXYpLmFwcGVuZFRvKGRpdik7XG4gICQoaC5saW5lRGl2KS5hcHBlbmRUbyhkaXYpO1xuXG4gIHZhciBpZHggPSB0aGlzLmhhaXJsaW5lc18uaW5kZXhPZihoKTtcbiAgdGhpcy5oYWlybGluZXNfLnNwbGljZShpZHgsIDEpO1xuICB0aGlzLmhhaXJsaW5lc18ucHVzaChoKTtcbn07XG5cbi8vIFBvc2l0aW9ucyBleGlzdGluZyBoYWlybGluZSBkaXZzLlxuaGFpcmxpbmVzLnByb3RvdHlwZS51cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucyA9IGZ1bmN0aW9uIHVwZGF0ZUhhaXJsaW5lRGl2UG9zaXRpb25zKCkge1xuICB2YXIgZyA9IHRoaXMuZHlncmFwaF87XG4gIHZhciBsYXlvdXQgPSB0aGlzLmR5Z3JhcGhfLmdldEFyZWEoKTtcbiAgdmFyIGNoYXJ0TGVmdCA9IGxheW91dC54LCBjaGFydFJpZ2h0ID0gbGF5b3V0LnggKyBsYXlvdXQudztcbiAgdmFyIGRpdiA9IHRoaXMuZHlncmFwaF8uZ3JhcGhEaXY7XG4gIHZhciBwb3MgPSBEeWdyYXBoLmZpbmRQb3MoZGl2KTtcbiAgdmFyIGJveCA9IFtsYXlvdXQueCArIHBvcy54LCBsYXlvdXQueSArIHBvcy55XTtcbiAgYm94LnB1c2goYm94WzBdICsgbGF5b3V0LncpO1xuICBib3gucHVzaChib3hbMV0gKyBsYXlvdXQuaCk7XG5cbiAgJC5lYWNoKHRoaXMuaGFpcmxpbmVzXywgZnVuY3Rpb24gaXRlcmF0ZUhhaXJsaW5lc18oaWR4LCBoKSB7XG4gICAgdmFyIGxlZnQgPSBnLnRvRG9tWENvb3JkKGgueHZhbCk7XG4gICAgaC5kb21YID0gbGVmdDsgIC8vIFNlZSBjb21tZW50cyBpbiB0aGlzLmRhdGFEaWRVcGRhdGVcbiAgICAkKGgubGluZURpdikuY3NzKHtcbiAgICAgICdsZWZ0JzogbGVmdCArICdweCcsXG4gICAgICAndG9wJzogbGF5b3V0LnkgKyAncHgnLFxuICAgICAgJ2hlaWdodCc6IGxheW91dC5oICsgJ3B4J1xuICAgIH0pOyAgLy8gLmRyYWdnYWJsZShcIm9wdGlvblwiLCBcImNvbnRhaW5tZW50XCIsIGJveCk7XG4gICAgJChoLmluZm9EaXYpLmNzcyh7XG4gICAgICAnbGVmdCc6IGxlZnQgKyAncHgnLFxuICAgICAgJ3RvcCc6IGxheW91dC55ICsgJ3B4JyxcbiAgICB9KS5kcmFnZ2FibGUoXCJvcHRpb25cIiwgXCJjb250YWlubWVudFwiLCBib3gpO1xuXG4gICAgdmFyIHZpc2libGUgPSAobGVmdCA+PSBjaGFydExlZnQgJiYgbGVmdCA8PSBjaGFydFJpZ2h0KTtcbiAgICAkKFtoLmluZm9EaXYsIGgubGluZURpdl0pLnRvZ2dsZSh2aXNpYmxlKTtcbiAgfSk7XG59O1xuXG4vLyBTZXRzIHN0eWxlcyBvbiB0aGUgaGFpcmxpbmUgKGkuZS4gXCJzZWxlY3RlZFwiKVxuaGFpcmxpbmVzLnByb3RvdHlwZS51cGRhdGVIYWlybGluZVN0eWxlcyA9IGZ1bmN0aW9uIHVwZGF0ZUhhaXJsaW5lU3R5bGVzKCkge1xuICAkLmVhY2godGhpcy5oYWlybGluZXNfLCBmdW5jdGlvbiBpdGVyYXRlSGFpcmxpbmVzXyhpZHgsIGgpIHtcbiAgICAkKFtoLmluZm9EaXYsIGgubGluZURpdl0pLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcsIGguc2VsZWN0ZWQpO1xuICB9KTtcbn07XG5cbi8vIEZpbmQgcHJldlJvdyBhbmQgbmV4dFJvdyBzdWNoIHRoYXRcbi8vIGcuZ2V0VmFsdWUocHJldlJvdywgMCkgPD0geHZhbFxuLy8gZy5nZXRWYWx1ZShuZXh0Um93LCAwKSA+PSB4dmFsXG4vLyBnLmdldFZhbHVlKHtwcmV2LG5leHR9Um93LCBjb2wpICE9IG51bGwsIE5hTiBvciB1bmRlZmluZWRcbi8vIGFuZCB0aGVyZSdzIG5vIG90aGVyIHJvdyBzdWNoIHRoYXQ6XG4vLyAgIGcuZ2V0VmFsdWUocHJldlJvdywgMCkgPCBnLmdldFZhbHVlKHJvdywgMCkgPCBnLmdldFZhbHVlKG5leHRSb3csIDApXG4vLyAgIGcuZ2V0VmFsdWUocm93LCBjb2wpICE9IG51bGwsIE5hTiBvciB1bmRlZmluZWQuXG4vLyBSZXR1cm5zIFtwcmV2Um93LCBuZXh0Um93XS4gRWl0aGVyIGNhbiBiZSBudWxsIChidXQgbm90IGJvdGgpLlxuaGFpcmxpbmVzLmZpbmRQcmV2TmV4dFJvd3MgPSBmdW5jdGlvbiBmaW5kUHJldk5leHRSb3dzKGcsIHh2YWwsIGNvbCkge1xuICB2YXIgcHJldlJvdyA9IG51bGwsIG5leHRSb3cgPSBudWxsO1xuICB2YXIgbnVtUm93cyA9IGcubnVtUm93cygpO1xuICBmb3IgKHZhciByb3cgPSAwOyByb3cgPCBudW1Sb3dzOyByb3crKykge1xuICAgIHZhciB5dmFsID0gZy5nZXRWYWx1ZShyb3csIGNvbCk7XG4gICAgaWYgKHl2YWwgPT09IG51bGwgfHwgeXZhbCA9PT0gdW5kZWZpbmVkIHx8IGlzTmFOKHl2YWwpKSBjb250aW51ZTtcblxuICAgIHZhciByb3dYdmFsID0gZy5nZXRWYWx1ZShyb3csIDApO1xuICAgIGlmIChyb3dYdmFsIDw9IHh2YWwpIHByZXZSb3cgPSByb3c7XG5cbiAgICBpZiAocm93WHZhbCA+PSB4dmFsKSB7XG4gICAgICBuZXh0Um93ID0gcm93O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtwcmV2Um93LCBuZXh0Um93XTtcbn07XG5cbi8vIEZpbGxzIG91dCB0aGUgaW5mbyBkaXYgYmFzZWQgb24gY3VycmVudCBjb29yZGluYXRlcy5cbmhhaXJsaW5lcy5wcm90b3R5cGUudXBkYXRlSGFpcmxpbmVJbmZvID0gZnVuY3Rpb24gdXBkYXRlSGFpcmxpbmVJbmZvKCkge1xuICB2YXIgbW9kZSA9ICdjbG9zZXN0JztcblxuICB2YXIgZyA9IHRoaXMuZHlncmFwaF87XG4gIHZhciB4UmFuZ2UgPSBnLnhBeGlzUmFuZ2UoKTtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICAkLmVhY2godGhpcy5oYWlybGluZXNfLCBmdW5jdGlvbiBpdGVyYXRlSGFpcmxpbmVzXyhpZHgsIGgpIHtcbiAgICAvLyBUbyB1c2UgZ2VuZXJhdGVMZWdlbmRIVE1MLCB3ZSBzeW50aGVzaXplIGFuIGFycmF5IG9mIHNlbGVjdGVkIHBvaW50cy5cbiAgICB2YXIgc2VsUG9pbnRzID0gW107XG4gICAgdmFyIGxhYmVscyA9IGcuZ2V0TGFiZWxzKCk7XG4gICAgdmFyIHJvdywgcHJldlJvdywgbmV4dFJvdztcblxuICAgIGlmICghaC5pbnRlcnBvbGF0ZWQpIHtcbiAgICAgIC8vIFwiY2xvc2VzdCBwb2ludFwiIG1vZGUuXG4gICAgICAvLyBUT0RPKGRhbnZrKTogbWFrZSBmaW5kQ2xvc2VzdFJvdyBtZXRob2QgcHVibGljXG4gICAgICByb3cgPSBnLmZpbmRDbG9zZXN0Um93KGcudG9Eb21YQ29vcmQoaC54dmFsKSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGcubnVtQ29sdW1ucygpOyBpKyspIHtcbiAgICAgICAgc2VsUG9pbnRzLnB1c2goe1xuICAgICAgICAgIGNhbnZhc3g6IDEsICAvLyBUT0RPKGRhbnZrKTogcmVhbCBjb29yZGluYXRlXG4gICAgICAgICAgY2FudmFzeTogMSwgIC8vIFRPRE8oZGFudmspOiByZWFsIGNvb3JkaW5hdGVcbiAgICAgICAgICB4dmFsOiBoLnh2YWwsXG4gICAgICAgICAgeXZhbDogZy5nZXRWYWx1ZShyb3csIGkpLFxuICAgICAgICAgIG5hbWU6IGxhYmVsc1tpXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gXCJpbnRlcnBvbGF0ZWRcIiBtb2RlLlxuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBnLm51bUNvbHVtbnMoKTsgaSsrKSB7XG4gICAgICAgIHZhciBwcmV2TmV4dFJvdyA9IGhhaXJsaW5lcy5maW5kUHJldk5leHRSb3dzKGcsIGgueHZhbCwgaSk7XG4gICAgICAgIHByZXZSb3cgPSBwcmV2TmV4dFJvd1swXSwgbmV4dFJvdyA9IHByZXZOZXh0Um93WzFdO1xuXG4gICAgICAgIC8vIEZvciB4LXZhbHVlcyBvdXRzaWRlIHRoZSBkb21haW4sIGludGVycG9sYXRlIFwiYmV0d2VlblwiIHRoZSBleHRyZW1lXG4gICAgICAgIC8vIHBvaW50IGFuZCBpdHNlbGYuXG4gICAgICAgIGlmIChwcmV2Um93ID09PSBudWxsKSBwcmV2Um93ID0gbmV4dFJvdztcbiAgICAgICAgaWYgKG5leHRSb3cgPT09IG51bGwpIG5leHRSb3cgPSBwcmV2Um93O1xuXG4gICAgICAgIC8vIGxpbmVhciBpbnRlcnBvbGF0aW9uXG4gICAgICAgIHZhciBwcmV2WCA9IGcuZ2V0VmFsdWUocHJldlJvdywgMCksXG4gICAgICAgICAgICBuZXh0WCA9IGcuZ2V0VmFsdWUobmV4dFJvdywgMCksXG4gICAgICAgICAgICBwcmV2WSA9IGcuZ2V0VmFsdWUocHJldlJvdywgaSksXG4gICAgICAgICAgICBuZXh0WSA9IGcuZ2V0VmFsdWUobmV4dFJvdywgaSksXG4gICAgICAgICAgICBmcmFjID0gcHJldlJvdyA9PSBuZXh0Um93ID8gMCA6IChoLnh2YWwgLSBwcmV2WCkgLyAobmV4dFggLSBwcmV2WCksXG4gICAgICAgICAgICB5dmFsID0gZnJhYyAqIG5leHRZICsgKDEgLSBmcmFjKSAqIHByZXZZO1xuXG4gICAgICAgIHNlbFBvaW50cy5wdXNoKHtcbiAgICAgICAgICBjYW52YXN4OiAxLCAgLy8gVE9ETyhkYW52ayk6IHJlYWwgY29vcmRpbmF0ZVxuICAgICAgICAgIGNhbnZhc3k6IDEsICAvLyBUT0RPKGRhbnZrKTogcmVhbCBjb29yZGluYXRlXG4gICAgICAgICAgeHZhbDogaC54dmFsLFxuICAgICAgICAgIHl2YWw6IHl2YWwsXG4gICAgICAgICAgcHJldlJvdzogcHJldlJvdyxcbiAgICAgICAgICBuZXh0Um93OiBuZXh0Um93LFxuICAgICAgICAgIG5hbWU6IGxhYmVsc1tpXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhhdC5kaXZGaWxsZXJfKSB7XG4gICAgICB0aGF0LmRpdkZpbGxlcl8oaC5pbmZvRGl2LCB7XG4gICAgICAgIGNsb3Nlc3RSb3c6IHJvdyxcbiAgICAgICAgcG9pbnRzOiBzZWxQb2ludHMsXG4gICAgICAgIGhhaXJsaW5lOiB0aGF0LmNyZWF0ZVB1YmxpY0hhaXJsaW5lXyhoKSxcbiAgICAgICAgZHlncmFwaDogZ1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBodG1sID0gRHlncmFwaC5QbHVnaW5zLkxlZ2VuZC5nZW5lcmF0ZUxlZ2VuZEhUTUwoZywgaC54dmFsLCBzZWxQb2ludHMsIDEwKTtcbiAgICAgICQoJy5oYWlybGluZS1sZWdlbmQnLCBoLmluZm9EaXYpLmh0bWwoaHRtbCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8vIEFmdGVyIGEgcmVzaXplLCB0aGUgaGFpcmxpbmUgZGl2cyBjYW4gZ2V0IGRldHRhY2hlZCBmcm9tIHRoZSBjaGFydC5cbi8vIFRoaXMgcmVhdHRhY2hlcyB0aGVtLlxuaGFpcmxpbmVzLnByb3RvdHlwZS5hdHRhY2hIYWlybGluZXNUb0NoYXJ0XyA9IGZ1bmN0aW9uIGF0dGFjaEhhaXJsaW5lc1RvQ2hhcnRfKCkge1xuICB2YXIgZGl2ID0gdGhpcy5keWdyYXBoXy5ncmFwaERpdjtcbiAgJC5lYWNoKHRoaXMuaGFpcmxpbmVzXywgZnVuY3Rpb24gaXRlcmF0ZUhhaXJsaW5lc18oaWR4LCBoKSB7XG4gICAgJChbaC5saW5lRGl2LCBoLmluZm9EaXZdKS5hcHBlbmRUbyhkaXYpO1xuICB9KTtcbn07XG5cbi8vIERlbGV0ZXMgYSBoYWlybGluZSBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBjaGFydC5cbmhhaXJsaW5lcy5wcm90b3R5cGUucmVtb3ZlSGFpcmxpbmUgPSBmdW5jdGlvbiByZW1vdmVIYWlybGluZShoKSB7XG4gIHZhciBpZHggPSB0aGlzLmhhaXJsaW5lc18uaW5kZXhPZihoKTtcbiAgaWYgKGlkeCA+PSAwKSB7XG4gICAgdGhpcy5oYWlybGluZXNfLnNwbGljZShpZHgsIDEpO1xuICAgICQoW2gubGluZURpdiwgaC5pbmZvRGl2XSkucmVtb3ZlKCk7XG4gIH0gZWxzZSB7XG4gICAgRHlncmFwaC53YXJuKCdUcmllZCB0byByZW1vdmUgbm9uLWV4aXN0ZW50IGhhaXJsaW5lLicpO1xuICB9XG59O1xuXG5oYWlybGluZXMucHJvdG90eXBlLmRpZERyYXdDaGFydCA9IGZ1bmN0aW9uIGRpZERyYXdDaGFydChlKSB7XG4gIHZhciBnID0gZS5keWdyYXBoO1xuXG4gIC8vIEVhcmx5IG91dCBpbiB0aGUgKGNvbW1vbikgY2FzZSBvZiB6ZXJvIGhhaXJsaW5lcy5cbiAgaWYgKHRoaXMuaGFpcmxpbmVzXy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICB0aGlzLnVwZGF0ZUhhaXJsaW5lRGl2UG9zaXRpb25zKCk7XG4gIHRoaXMuYXR0YWNoSGFpcmxpbmVzVG9DaGFydF8oKTtcbiAgdGhpcy51cGRhdGVIYWlybGluZUluZm8oKTtcbiAgdGhpcy51cGRhdGVIYWlybGluZVN0eWxlcygpO1xufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5kYXRhRGlkVXBkYXRlID0gZnVuY3Rpb24gZGF0YURpZFVwZGF0ZShlKSB7XG4gIC8vIFdoZW4gdGhlIGRhdGEgaW4gdGhlIGNoYXJ0IHVwZGF0ZXMsIHRoZSBoYWlybGluZXMgc2hvdWxkIHN0YXkgaW4gdGhlIHNhbWVcbiAgLy8gcG9zaXRpb24gb24gdGhlIHNjcmVlbi4gZGlkRHJhd0NoYXJ0IHN0b3JlcyBhIGRvbVggcGFyYW1ldGVyIGZvciBlYWNoXG4gIC8vIGhhaXJsaW5lLiBXZSB1c2UgdGhhdCB0byByZXBvc2l0aW9uIHRoZW0gb24gZGF0YSB1cGRhdGVzLlxuICB2YXIgZyA9IHRoaXMuZHlncmFwaF87XG4gICQuZWFjaCh0aGlzLmhhaXJsaW5lc18sIGZ1bmN0aW9uIGl0ZXJhdGVIYWlybGluZXNfKGlkeCwgaCkge1xuICAgIGlmIChoLmhhc093blByb3BlcnR5KCdkb21YJykpIHtcbiAgICAgIGgueHZhbCA9IGcudG9EYXRhWENvb3JkKGguZG9tWCk7XG4gICAgfVxuICB9KTtcbn07XG5cbmhhaXJsaW5lcy5wcm90b3R5cGUuY2xpY2sgPSBmdW5jdGlvbiBjbGljayhlKSB7XG4gIGlmICh0aGlzLmFkZFRpbWVyXykge1xuICAgIC8vIEFub3RoZXIgY2xpY2sgaXMgaW4gcHJvZ3Jlc3M7IGlnbm9yZSB0aGlzIG9uZS5cbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYXJlYSA9IGUuZHlncmFwaC5nZXRBcmVhKCk7XG4gIHZhciB4dmFsID0gdGhpcy5keWdyYXBoXy50b0RhdGFYQ29vcmQoZS5jYW52YXN4KTtcblxuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHRoaXMuYWRkVGltZXJfID0gc2V0VGltZW91dChmdW5jdGlvbiBjbGlja190bW9fKCkge1xuICAgIHRoYXQuYWRkVGltZXJfID0gbnVsbDtcbiAgICB0aGF0LmhhaXJsaW5lc18ucHVzaCh0aGF0LmNyZWF0ZUhhaXJsaW5lKHt4dmFsOiB4dmFsfSkpO1xuXG4gICAgdGhhdC51cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucygpO1xuICAgIHRoYXQudXBkYXRlSGFpcmxpbmVJbmZvKCk7XG4gICAgdGhhdC51cGRhdGVIYWlybGluZVN0eWxlcygpO1xuICAgIHRoYXQuYXR0YWNoSGFpcmxpbmVzVG9DaGFydF8oKTtcblxuICAgICQodGhhdCkudHJpZ2dlckhhbmRsZXIoJ2hhaXJsaW5lQ3JlYXRlZCcsIHtcbiAgICAgIHh2YWw6IHh2YWxcbiAgICB9KTtcbiAgICAkKHRoYXQpLnRyaWdnZXJIYW5kbGVyKCdoYWlybGluZXNDaGFuZ2VkJywge30pO1xuICB9LCBDTElDS19ERUxBWV9NUyk7XG59O1xuXG5oYWlybGluZXMucHJvdG90eXBlLmRibGNsaWNrID0gZnVuY3Rpb24gZGJsY2xpY2soZSkge1xuICBpZiAodGhpcy5hZGRUaW1lcl8pIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5hZGRUaW1lcl8pO1xuICAgIHRoaXMuYWRkVGltZXJfID0gbnVsbDtcbiAgfVxufTtcblxuaGFpcmxpbmVzLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgdGhpcy5kZXRhY2hMYWJlbHMoKTtcbn07XG5cbi8vIFB1YmxpYyBBUElcblxuLyoqXG4gKiBUaGlzIGlzIGEgcmVzdHJpY3RlZCB2aWV3IG9mIHRoaXMuaGFpcmxpbmVzXyB3aGljaCBkb2Vzbid0IGV4cG9zZVxuICogaW1wbGVtZW50YXRpb24gZGV0YWlscyBsaWtlIHRoZSBoYW5kbGUgZGl2cy5cbiAqXG4gKiBAdHlwZWRlZiB7XG4gKiAgIHh2YWw6ICBudW1iZXIsICAgICAgIC8vIHgtdmFsdWUgKGkuZS4gbWlsbGlzIG9yIGEgcmF3IG51bWJlcilcbiAqICAgaW50ZXJwb2xhdGVkOiBib29sLCAgLy8gYWx0ZXJuYXRpdmUgaXMgdG8gc25hcCB0byBjbG9zZXN0XG4gKiAgIHNlbGVjdGVkOiBib29sICAgICAgIC8vIHdoZXRoZXIgdGhlIGhhaXJsaW5lIGlzIHNlbGVjdGVkLlxuICogfSBQdWJsaWNIYWlybGluZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHshSGFpcmxpbmV9IGggSW50ZXJuYWwgaGFpcmxpbmUuXG4gKiBAcmV0dXJuIHshUHVibGljSGFpcmxpbmV9IFJlc3RyaWN0ZWQgcHVibGljIHZpZXcgb2YgdGhlIGhhaXJsaW5lLlxuICovXG5oYWlybGluZXMucHJvdG90eXBlLmNyZWF0ZVB1YmxpY0hhaXJsaW5lXyA9IGZ1bmN0aW9uIGNyZWF0ZVB1YmxpY0hhaXJsaW5lXyhoKSB7XG4gIHJldHVybiB7XG4gICAgeHZhbDogaC54dmFsLFxuICAgIGludGVycG9sYXRlZDogaC5pbnRlcnBvbGF0ZWQsXG4gICAgc2VsZWN0ZWQ6IGguc2VsZWN0ZWRcbiAgfTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7IUFycmF5LjwhUHVibGljSGFpcmxpbmU+fSBUaGUgY3VycmVudCBzZXQgb2YgaGFpcmxpbmVzLCBvcmRlcmVkXG4gKiAgICAgZnJvbSBiYWNrIHRvIGZyb250LlxuICovXG5oYWlybGluZXMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGFpcmxpbmVzXy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBoID0gdGhpcy5oYWlybGluZXNfW2ldO1xuICAgIHJlc3VsdC5wdXNoKHRoaXMuY3JlYXRlUHVibGljSGFpcmxpbmVfKGgpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDYWxsaW5nIHRoaXMgd2lsbCByZXN1bHQgaW4gYSBoYWlybGluZXNDaGFuZ2VkIGV2ZW50IGJlaW5nIHRyaWdnZXJlZCwgbm9cbiAqIG1hdHRlciB3aGV0aGVyIGl0IGNvbnNpc3RzIG9mIGFkZGl0aW9ucywgZGVsZXRpb25zLCBtb3ZlcyBvciBubyBjaGFuZ2VzIGF0XG4gKiBhbGwuXG4gKlxuICogQHBhcmFtIHshQXJyYXkuPCFQdWJsaWNIYWlybGluZT59IGhhaXJsaW5lcyBUaGUgbmV3IHNldCBvZiBoYWlybGluZXMsXG4gKiAgICAgb3JkZXJlZCBmcm9tIGJhY2sgdG8gZnJvbnQuXG4gKi9cbmhhaXJsaW5lcy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KGhhaXJsaW5lcykge1xuICAvLyBSZS11c2UgZGl2cyBmcm9tIHRoZSBvbGQgaGFpcmxpbmVzIGFycmF5IHNvIGZhciBhcyB3ZSBjYW4uXG4gIC8vIFRoZXkncmUgYWxyZWFkeSBjb3JyZWN0bHkgei1vcmRlcmVkLlxuICB2YXIgYW55Q3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGhhaXJsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBoID0gaGFpcmxpbmVzW2ldO1xuXG4gICAgaWYgKHRoaXMuaGFpcmxpbmVzXy5sZW5ndGggPiBpKSB7XG4gICAgICB0aGlzLmhhaXJsaW5lc19baV0ueHZhbCA9IGgueHZhbDtcbiAgICAgIHRoaXMuaGFpcmxpbmVzX1tpXS5pbnRlcnBvbGF0ZWQgPSBoLmludGVycG9sYXRlZDtcbiAgICAgIHRoaXMuaGFpcmxpbmVzX1tpXS5zZWxlY3RlZCA9IGguc2VsZWN0ZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGFpcmxpbmVzXy5wdXNoKHRoaXMuY3JlYXRlSGFpcmxpbmUoe1xuICAgICAgICB4dmFsOiBoLnh2YWwsXG4gICAgICAgIGludGVycG9sYXRlZDogaC5pbnRlcnBvbGF0ZWQsXG4gICAgICAgIHNlbGVjdGVkOiBoLnNlbGVjdGVkXG4gICAgICB9KSk7XG4gICAgICBhbnlDcmVhdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBoYWlybGluZXMsIGRlc3Ryb3kgdGhlbS5cbiAgd2hpbGUgKGhhaXJsaW5lcy5sZW5ndGggPCB0aGlzLmhhaXJsaW5lc18ubGVuZ3RoKSB7XG4gICAgdGhpcy5yZW1vdmVIYWlybGluZSh0aGlzLmhhaXJsaW5lc19baGFpcmxpbmVzLmxlbmd0aF0pO1xuICB9XG5cbiAgdGhpcy51cGRhdGVIYWlybGluZURpdlBvc2l0aW9ucygpO1xuICB0aGlzLnVwZGF0ZUhhaXJsaW5lSW5mbygpO1xuICB0aGlzLnVwZGF0ZUhhaXJsaW5lU3R5bGVzKCk7XG4gIGlmIChhbnlDcmVhdGVkKSB7XG4gICAgdGhpcy5hdHRhY2hIYWlybGluZXNUb0NoYXJ0XygpO1xuICB9XG5cbiAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignaGFpcmxpbmVzQ2hhbmdlZCcsIHt9KTtcbn07XG5cbnJldHVybiBoYWlybGluZXM7XG5cbn0pKCk7XG5cbi8qIGxvYWRlciB3cmFwcGVyICovXG5EeWdyYXBoLl9yZXF1aXJlLmFkZCgnZHlncmFwaHMvc3JjL2V4dHJhcy9oYWlybGluZXMuanMnLCAvKiBleHBvcnRzICovIHt9KTtcbn0pKCk7XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQ0FBQyxTQUFTQSx5QkFBeUJBLENBQUEsRUFBRztFQUN0QyxZQUFZ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