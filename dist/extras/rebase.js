"use strict";

/**
 * @license
 * Copyright 2015 Petr Shevtsov (petr.shevtsov@gmail.com)
 * MIT-licenced: https://opensource.org/licenses/MIT
 *
 * Rebase plugin
 *
 * On pan/zoom event, each series will rebase to a specified value (e.g. 100) at the
 * start of the displayed period.
 *
 * See http://stats.oecd.org/glossary/detail.asp?ID=2249
 *
 * Options:
 *  Value to rebase. Must be either Number or 'percent' or null.
 *
 * See tests/straw-broom.html for demo.
 */

/* loader wrapper to allow browser use and ES6 imports */
(function _extras_rebase_closure() {
  'use strict';

  var Dygraph;
  if (window.Dygraph) {
    Dygraph = window.Dygraph;
  } else if (typeof module !== 'undefined') {
    Dygraph = require('../dygraph');
    if (typeof Dygraph.NAME === 'undefined' && typeof Dygraph["default"] !== 'undefined') Dygraph = Dygraph["default"];
  }
  /* end of loader wrapper header */

  // Matches DefaultHandler.parseFloat
  var parseFloat = function parseFloat(val) {
    if (val === null) return NaN;
    return val;
  };
  Dygraph.DataHandlers.RebaseHandler = function RebaseHandler(baseOpt) {
    this.baseOpt = baseOpt;
  };
  var RebaseHandler = Dygraph.DataHandlers.RebaseHandler;
  RebaseHandler.prototype = new Dygraph.DataHandlers.DefaultHandler();
  RebaseHandler.rebase = function rebase(value, initial, base) {
    if (base === "percent") {
      return (value / initial - 1) * 100;
    }
    return value * base / initial;
  };
  RebaseHandler.prototype.getExtremeYValues = function getExtremeYValues(series, dateWindow, stepPlot) {
    var minY = null,
      maxY = null,
      y;
    var firstIdx = 0,
      lastIdx = series.length - 1;
    var initial = series[firstIdx][1];
    for (var j = firstIdx; j <= lastIdx; j++) {
      if (j === firstIdx) {
        y = this.baseOpt === "percent" ? 0 : this.baseOpt;
      } else {
        y = RebaseHandler.rebase(series[j][1], initial, this.baseOpt);
      }
      if (y === null || isNaN(y)) continue;
      if (maxY === null || y > maxY) {
        maxY = y;
      }
      if (minY === null || y < minY) {
        minY = y;
      }
    }
    return [minY, maxY];
  };
  RebaseHandler.prototype.seriesToPoints = function seriesToPoints(series, setName, boundaryIdStart) {
    var points = [];
    var firstIdx = 0;
    var lastIdx = series.length - 1;
    var initial = series[firstIdx][1]; // TODO: check for null
    for (var i = 0; i <= lastIdx; ++i) {
      var item = series[i];
      var yraw = item[1];
      var yval = yraw === null ? null : parseFloat(yraw);
      if (yval !== null) {
        if (i === firstIdx) {
          yval = this.baseOpt === "percent" ? 0 : this.baseOpt;
        } else {
          yval = RebaseHandler.rebase(yval, initial, this.baseOpt);
        }
      }
      var point = {
        x: NaN,
        y: NaN,
        xval: parseFloat(item[0]),
        yval: yval,
        name: setName,
        idx: i + boundaryIdStart
      };
      points.push(point);
    }
    this.onPointsCreated_(series, points);
    return points;
  };
  Dygraph.Plugins.Rebase = function _rebase_inner_closure() {
    var rebase = function rebase(baseOpt) {
      var isNum = function isNum(v) {
        return !isNaN(v) && (typeof v === 'number' || {}.toString.call(v) === '[object Number]');
      };
      if (baseOpt === "percent" || isNum(baseOpt)) {
        this.baseOpt_ = baseOpt;
      } else {
        this.baseOpt_ = null;
      }
    };
    rebase.prototype.toString = function toString() {
      return "Rebase Plugin";
    };
    rebase.prototype.activate = function activate(g) {
      if (this.baseOpt_ === null) {
        return;
      }
      return {
        predraw: this.predraw
      };
    };
    rebase.prototype.predraw = function predraw(e) {
      var g = e.dygraph;
      if (this.baseOpt_ === "percent") {
        g.updateOptions({
          axes: {
            y: {
              axisLabelFormatter: function axisLabelFormatter(y) {
                return y + '%';
              },
              valueFormatter: function valueFormatter(y) {
                return Math.round(y * 100) / 100 + '%';
              }
            }
          }
        }, true);
      }
      g.dataHandler_ = new Dygraph.DataHandlers.RebaseHandler(this.baseOpt_);
    };
    return rebase;
  }();

  /* closure and loader wrapper */
  Dygraph._require.add('dygraphs/src/extras/rebase.js', /* exports */{});
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX3JlYmFzZV9jbG9zdXJlIiwiRHlncmFwaCIsIndpbmRvdyIsIm1vZHVsZSIsInJlcXVpcmUiLCJOQU1FIiwicGFyc2VGbG9hdCIsInZhbCIsIk5hTiIsIkRhdGFIYW5kbGVycyIsIlJlYmFzZUhhbmRsZXIiLCJiYXNlT3B0IiwicHJvdG90eXBlIiwiRGVmYXVsdEhhbmRsZXIiLCJyZWJhc2UiLCJ2YWx1ZSIsImluaXRpYWwiLCJiYXNlIiwiZ2V0RXh0cmVtZVlWYWx1ZXMiLCJzZXJpZXMiLCJkYXRlV2luZG93Iiwic3RlcFBsb3QiLCJtaW5ZIiwibWF4WSIsInkiLCJmaXJzdElkeCIsImxhc3RJZHgiLCJsZW5ndGgiLCJqIiwiaXNOYU4iLCJzZXJpZXNUb1BvaW50cyIsInNldE5hbWUiLCJib3VuZGFyeUlkU3RhcnQiLCJwb2ludHMiLCJpIiwiaXRlbSIsInlyYXciLCJ5dmFsIiwicG9pbnQiLCJ4IiwieHZhbCIsIm5hbWUiLCJpZHgiLCJwdXNoIiwib25Qb2ludHNDcmVhdGVkXyIsIlBsdWdpbnMiLCJSZWJhc2UiLCJfcmViYXNlX2lubmVyX2Nsb3N1cmUiLCJpc051bSIsInYiLCJ0b1N0cmluZyIsImNhbGwiLCJiYXNlT3B0XyIsImFjdGl2YXRlIiwiZyIsInByZWRyYXciLCJlIiwiZHlncmFwaCIsInVwZGF0ZU9wdGlvbnMiLCJheGVzIiwiYXhpc0xhYmVsRm9ybWF0dGVyIiwidmFsdWVGb3JtYXR0ZXIiLCJNYXRoIiwicm91bmQiLCJkYXRhSGFuZGxlcl8iLCJfcmVxdWlyZSIsImFkZCJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHRyYXMvcmViYXNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFBldHIgU2hldnRzb3YgKHBldHIuc2hldnRzb3ZAZ21haWwuY29tKVxuICogTUlULWxpY2VuY2VkOiBodHRwczovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICpcbiAqIFJlYmFzZSBwbHVnaW5cbiAqXG4gKiBPbiBwYW4vem9vbSBldmVudCwgZWFjaCBzZXJpZXMgd2lsbCByZWJhc2UgdG8gYSBzcGVjaWZpZWQgdmFsdWUgKGUuZy4gMTAwKSBhdCB0aGVcbiAqIHN0YXJ0IG9mIHRoZSBkaXNwbGF5ZWQgcGVyaW9kLlxuICpcbiAqIFNlZSBodHRwOi8vc3RhdHMub2VjZC5vcmcvZ2xvc3NhcnkvZGV0YWlsLmFzcD9JRD0yMjQ5XG4gKlxuICogT3B0aW9uczpcbiAqICBWYWx1ZSB0byByZWJhc2UuIE11c3QgYmUgZWl0aGVyIE51bWJlciBvciAncGVyY2VudCcgb3IgbnVsbC5cbiAqXG4gKiBTZWUgdGVzdHMvc3RyYXctYnJvb20uaHRtbCBmb3IgZGVtby5cbiAqL1xuXG4vKiBsb2FkZXIgd3JhcHBlciB0byBhbGxvdyBicm93c2VyIHVzZSBhbmQgRVM2IGltcG9ydHMgKi9cbihmdW5jdGlvbiBfZXh0cmFzX3JlYmFzZV9jbG9zdXJlKCkge1xuJ3VzZSBzdHJpY3QnO1xudmFyIER5Z3JhcGg7XG5pZiAod2luZG93LkR5Z3JhcGgpIHtcbiAgRHlncmFwaCA9IHdpbmRvdy5EeWdyYXBoO1xufSBlbHNlIGlmICh0eXBlb2YobW9kdWxlKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgRHlncmFwaCA9IHJlcXVpcmUoJy4uL2R5Z3JhcGgnKTtcbiAgaWYgKHR5cGVvZihEeWdyYXBoLk5BTUUpID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YoRHlncmFwaC5kZWZhdWx0KSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgRHlncmFwaCA9IER5Z3JhcGguZGVmYXVsdDtcbn1cbi8qIGVuZCBvZiBsb2FkZXIgd3JhcHBlciBoZWFkZXIgKi9cblxuICAvLyBNYXRjaGVzIERlZmF1bHRIYW5kbGVyLnBhcnNlRmxvYXRcbiAgdmFyIHBhcnNlRmxvYXQgPSBmdW5jdGlvbiBwYXJzZUZsb2F0KHZhbCkge1xuICAgIGlmICh2YWwgPT09IG51bGwpIHJldHVybiBOYU47XG4gICAgcmV0dXJuIHZhbDtcbiAgfTtcblxuICBEeWdyYXBoLkRhdGFIYW5kbGVycy5SZWJhc2VIYW5kbGVyID0gZnVuY3Rpb24gUmViYXNlSGFuZGxlcihiYXNlT3B0KSB7XG4gICAgdGhpcy5iYXNlT3B0ID0gYmFzZU9wdDtcbiAgfTtcblxuICB2YXIgUmViYXNlSGFuZGxlciA9IER5Z3JhcGguRGF0YUhhbmRsZXJzLlJlYmFzZUhhbmRsZXI7XG4gIFJlYmFzZUhhbmRsZXIucHJvdG90eXBlID0gbmV3IER5Z3JhcGguRGF0YUhhbmRsZXJzLkRlZmF1bHRIYW5kbGVyKCk7XG5cbiAgUmViYXNlSGFuZGxlci5yZWJhc2UgPSBmdW5jdGlvbiByZWJhc2UodmFsdWUsIGluaXRpYWwsIGJhc2UpIHtcbiAgICBpZiAoYmFzZSA9PT0gXCJwZXJjZW50XCIpIHtcbiAgICAgIHJldHVybiAodmFsdWUgLyBpbml0aWFsIC0gMSkgKiAxMDA7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZSAqIGJhc2UgLyBpbml0aWFsO1xuICB9O1xuXG4gIFJlYmFzZUhhbmRsZXIucHJvdG90eXBlLmdldEV4dHJlbWVZVmFsdWVzID0gZnVuY3Rpb24gZ2V0RXh0cmVtZVlWYWx1ZXMoc2VyaWVzLCBkYXRlV2luZG93LCBzdGVwUGxvdCkge1xuICAgIHZhciBtaW5ZID0gbnVsbCwgbWF4WSA9IG51bGwsIHk7XG4gICAgdmFyIGZpcnN0SWR4ID0gMCwgbGFzdElkeCA9IHNlcmllcy5sZW5ndGggLSAxO1xuICAgIHZhciBpbml0aWFsID0gc2VyaWVzW2ZpcnN0SWR4XVsxXTtcblxuICAgIGZvciAodmFyIGogPSBmaXJzdElkeDsgaiA8PSBsYXN0SWR4OyBqKyspIHtcbiAgICAgIGlmIChqID09PSBmaXJzdElkeCkge1xuICAgICAgICB5ID0gKHRoaXMuYmFzZU9wdCA9PT0gXCJwZXJjZW50XCIpID8gMCA6IHRoaXMuYmFzZU9wdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHkgPSBSZWJhc2VIYW5kbGVyLnJlYmFzZShzZXJpZXNbal1bMV0sIGluaXRpYWwsIHRoaXMuYmFzZU9wdCk7XG4gICAgICB9XG4gICAgICBpZiAoeSA9PT0gbnVsbCB8fCBpc05hTih5KSlcbiAgICAgICAgY29udGludWU7XG4gICAgICBpZiAobWF4WSA9PT0gbnVsbCB8fCB5ID4gbWF4WSkge1xuICAgICAgICBtYXhZID0geTtcbiAgICAgIH1cbiAgICAgIGlmIChtaW5ZID09PSBudWxsIHx8IHkgPCBtaW5ZKSB7XG4gICAgICAgIG1pblkgPSB5O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gWyBtaW5ZLCBtYXhZIF07XG4gIH07XG5cbiAgUmViYXNlSGFuZGxlci5wcm90b3R5cGUuc2VyaWVzVG9Qb2ludHMgPSBmdW5jdGlvbiBzZXJpZXNUb1BvaW50cyhzZXJpZXMsIHNldE5hbWUsIGJvdW5kYXJ5SWRTdGFydCkge1xuICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICB2YXIgZmlyc3RJZHggPSAwO1xuICAgIHZhciBsYXN0SWR4ID0gc2VyaWVzLmxlbmd0aCAtIDE7XG4gICAgdmFyIGluaXRpYWwgPSBzZXJpZXNbZmlyc3RJZHhdWzFdOyAvLyBUT0RPOiBjaGVjayBmb3IgbnVsbFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGxhc3RJZHg7ICsraSkge1xuICAgICAgdmFyIGl0ZW0gPSBzZXJpZXNbaV07XG4gICAgICB2YXIgeXJhdyA9IGl0ZW1bMV07XG4gICAgICB2YXIgeXZhbCA9IHlyYXcgPT09IG51bGwgPyBudWxsIDogcGFyc2VGbG9hdCh5cmF3KTtcbiAgICAgIGlmICh5dmFsICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChpID09PSBmaXJzdElkeCkge1xuICAgICAgICAgIHl2YWwgPSAodGhpcy5iYXNlT3B0ID09PSBcInBlcmNlbnRcIikgPyAwIDogdGhpcy5iYXNlT3B0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHl2YWwgPSBSZWJhc2VIYW5kbGVyLnJlYmFzZSh5dmFsLCBpbml0aWFsLCB0aGlzLmJhc2VPcHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgcG9pbnQgPSB7XG4gICAgICAgIHg6IE5hTixcbiAgICAgICAgeTogTmFOLFxuICAgICAgICB4dmFsOiBwYXJzZUZsb2F0KGl0ZW1bMF0pLFxuICAgICAgICB5dmFsOiB5dmFsLFxuICAgICAgICBuYW1lOiBzZXROYW1lLFxuICAgICAgICBpZHg6IGkgKyBib3VuZGFyeUlkU3RhcnRcbiAgICAgIH07XG4gICAgICBwb2ludHMucHVzaChwb2ludCk7XG4gICAgfVxuICAgIHRoaXMub25Qb2ludHNDcmVhdGVkXyhzZXJpZXMsIHBvaW50cyk7XG4gICAgcmV0dXJuIHBvaW50cztcbiAgfTtcblxuICBEeWdyYXBoLlBsdWdpbnMuUmViYXNlID0gKGZ1bmN0aW9uIF9yZWJhc2VfaW5uZXJfY2xvc3VyZSgpIHtcbiAgICB2YXIgcmViYXNlID0gZnVuY3Rpb24gcmViYXNlKGJhc2VPcHQpIHtcbiAgICAgIHZhciBpc051bSA9IGZ1bmN0aW9uIGlzTnVtKHYpIHtcbiAgICAgICAgcmV0dXJuICFpc05hTih2KSAmJiAodHlwZW9mIHYgPT09ICdudW1iZXInIHx8IHt9LnRvU3RyaW5nLmNhbGwodikgPT09ICdbb2JqZWN0IE51bWJlcl0nKTtcbiAgICAgIH07XG4gICAgICBpZiAoYmFzZU9wdCA9PT0gXCJwZXJjZW50XCIgfHwgaXNOdW0oYmFzZU9wdCkpIHtcbiAgICAgICAgdGhpcy5iYXNlT3B0XyA9IGJhc2VPcHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJhc2VPcHRfID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmViYXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIFwiUmViYXNlIFBsdWdpblwiO1xuICAgIH07XG5cbiAgICByZWJhc2UucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gYWN0aXZhdGUoZykge1xuICAgICAgaWYgKHRoaXMuYmFzZU9wdF8gPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcHJlZHJhdzogdGhpcy5wcmVkcmF3XG4gICAgICB9O1xuICAgIH07XG5cbiAgICByZWJhc2UucHJvdG90eXBlLnByZWRyYXcgPSBmdW5jdGlvbiBwcmVkcmF3KGUpIHtcbiAgICAgIHZhciBnID0gZS5keWdyYXBoO1xuXG4gICAgICBpZiAodGhpcy5iYXNlT3B0XyA9PT0gXCJwZXJjZW50XCIpIHtcbiAgICAgICAgZy51cGRhdGVPcHRpb25zKHtcbiAgICAgICAgICBheGVzOiB7XG4gICAgICAgICAgICB5OiB7XG4gICAgICAgICAgICAgIGF4aXNMYWJlbEZvcm1hdHRlcjogZnVuY3Rpb24gYXhpc0xhYmVsRm9ybWF0dGVyKHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geSArICclJztcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdmFsdWVGb3JtYXR0ZXI6IGZ1bmN0aW9uIHZhbHVlRm9ybWF0dGVyKHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh5ICogMTAwKSAvIDEwMCArICclJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIGcuZGF0YUhhbmRsZXJfID0gbmV3IER5Z3JhcGguRGF0YUhhbmRsZXJzLlJlYmFzZUhhbmRsZXIodGhpcy5iYXNlT3B0Xyk7XG4gICAgfTtcblxuICAgIHJldHVybiByZWJhc2U7XG4gIH0pKCk7XG5cbi8qIGNsb3N1cmUgYW5kIGxvYWRlciB3cmFwcGVyICovXG5EeWdyYXBoLl9yZXF1aXJlLmFkZCgnZHlncmFwaHMvc3JjL2V4dHJhcy9yZWJhc2UuanMnLCAvKiBleHBvcnRzICovIHt9KTtcbn0pKCk7XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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