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

/*global Dygraph:false */

(function () {
  "use strict";

  // Matches DefaultHandler.parseFloat
  var parseFloat = function parseFloat(val) {
    if (val === null) return NaN;
    return val;
  };
  Dygraph.DataHandlers.RebaseHandler = function (baseOpt) {
    this.baseOpt = baseOpt;
  };
  var RebaseHandler = Dygraph.DataHandlers.RebaseHandler;
  RebaseHandler.prototype = new Dygraph.DataHandlers.DefaultHandler();
  RebaseHandler.rebase = function (value, initial, base) {
    if (base === "percent") {
      return (value / initial - 1) * 100;
    }
    return value * base / initial;
  };
  RebaseHandler.prototype.getExtremeYValues = function (series, dateWindow, options) {
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
  RebaseHandler.prototype.seriesToPoints = function (series, setName, boundaryIdStart) {
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
  Dygraph.Plugins.Rebase = function () {
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
    rebase.prototype.toString = function () {
      return "Rebase Plugin";
    };
    rebase.prototype.activate = function (g) {
      if (this.baseOpt_ === null) {
        return;
      }
      return {
        predraw: this.predraw
      };
    };
    rebase.prototype.predraw = function (e) {
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
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXJzZUZsb2F0IiwidmFsIiwiTmFOIiwiRHlncmFwaCIsIkRhdGFIYW5kbGVycyIsIlJlYmFzZUhhbmRsZXIiLCJiYXNlT3B0IiwicHJvdG90eXBlIiwiRGVmYXVsdEhhbmRsZXIiLCJyZWJhc2UiLCJ2YWx1ZSIsImluaXRpYWwiLCJiYXNlIiwiZ2V0RXh0cmVtZVlWYWx1ZXMiLCJzZXJpZXMiLCJkYXRlV2luZG93Iiwib3B0aW9ucyIsIm1pblkiLCJtYXhZIiwieSIsImZpcnN0SWR4IiwibGFzdElkeCIsImxlbmd0aCIsImoiLCJpc05hTiIsInNlcmllc1RvUG9pbnRzIiwic2V0TmFtZSIsImJvdW5kYXJ5SWRTdGFydCIsInBvaW50cyIsImkiLCJpdGVtIiwieXJhdyIsInl2YWwiLCJwb2ludCIsIngiLCJ4dmFsIiwibmFtZSIsImlkeCIsInB1c2giLCJvblBvaW50c0NyZWF0ZWRfIiwiUGx1Z2lucyIsIlJlYmFzZSIsImlzTnVtIiwidiIsInRvU3RyaW5nIiwiY2FsbCIsImJhc2VPcHRfIiwiYWN0aXZhdGUiLCJnIiwicHJlZHJhdyIsImUiLCJkeWdyYXBoIiwidXBkYXRlT3B0aW9ucyIsImF4ZXMiLCJheGlzTGFiZWxGb3JtYXR0ZXIiLCJ2YWx1ZUZvcm1hdHRlciIsIk1hdGgiLCJyb3VuZCIsImRhdGFIYW5kbGVyXyJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHRyYXMvcmViYXNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFBldHIgU2hldnRzb3YgKHBldHIuc2hldnRzb3ZAZ21haWwuY29tKVxuICogTUlULWxpY2VuY2VkOiBodHRwczovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICpcbiAqIFJlYmFzZSBwbHVnaW5cbiAqXG4gKiBPbiBwYW4vem9vbSBldmVudCwgZWFjaCBzZXJpZXMgd2lsbCByZWJhc2UgdG8gYSBzcGVjaWZpZWQgdmFsdWUgKGUuZy4gMTAwKSBhdCB0aGVcbiAqIHN0YXJ0IG9mIHRoZSBkaXNwbGF5ZWQgcGVyaW9kLlxuICpcbiAqIFNlZSBodHRwOi8vc3RhdHMub2VjZC5vcmcvZ2xvc3NhcnkvZGV0YWlsLmFzcD9JRD0yMjQ5XG4gKlxuICogT3B0aW9uczpcbiAqICBWYWx1ZSB0byByZWJhc2UuIE11c3QgYmUgZWl0aGVyIE51bWJlciBvciAncGVyY2VudCcgb3IgbnVsbC5cbiAqXG4gKiBTZWUgdGVzdHMvc3RyYXctYnJvb20uaHRtbCBmb3IgZGVtby5cbiAqL1xuXG4vKmdsb2JhbCBEeWdyYXBoOmZhbHNlICovXG5cbihmdW5jdGlvbigpIHtcblxuICBcInVzZSBzdHJpY3RcIjtcblxuICAvLyBNYXRjaGVzIERlZmF1bHRIYW5kbGVyLnBhcnNlRmxvYXRcbiAgdmFyIHBhcnNlRmxvYXQgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAodmFsID09PSBudWxsKSByZXR1cm4gTmFOO1xuICAgIHJldHVybiB2YWw7XG4gIH07XG5cbiAgRHlncmFwaC5EYXRhSGFuZGxlcnMuUmViYXNlSGFuZGxlciA9IGZ1bmN0aW9uKGJhc2VPcHQpIHtcbiAgICB0aGlzLmJhc2VPcHQgPSBiYXNlT3B0O1xuICB9O1xuXG4gIHZhciBSZWJhc2VIYW5kbGVyID0gIER5Z3JhcGguRGF0YUhhbmRsZXJzLlJlYmFzZUhhbmRsZXI7XG4gIFJlYmFzZUhhbmRsZXIucHJvdG90eXBlID0gbmV3IER5Z3JhcGguRGF0YUhhbmRsZXJzLkRlZmF1bHRIYW5kbGVyKCk7XG5cbiAgUmViYXNlSGFuZGxlci5yZWJhc2UgPSBmdW5jdGlvbih2YWx1ZSwgaW5pdGlhbCwgYmFzZSkge1xuICAgIGlmIChiYXNlID09PSBcInBlcmNlbnRcIikge1xuICAgICAgcmV0dXJuICh2YWx1ZSAvIGluaXRpYWwgLSAxKSAqIDEwMDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlICogYmFzZSAvIGluaXRpYWw7XG4gIH07XG5cbiAgUmViYXNlSGFuZGxlci5wcm90b3R5cGUuZ2V0RXh0cmVtZVlWYWx1ZXMgPSBmdW5jdGlvbihzZXJpZXMsIGRhdGVXaW5kb3csIG9wdGlvbnMpIHtcbiAgICB2YXIgbWluWSA9IG51bGwsIG1heFkgPSBudWxsLCB5O1xuICAgIHZhciBmaXJzdElkeCA9IDAsIGxhc3RJZHggPSBzZXJpZXMubGVuZ3RoIC0gMTtcbiAgICB2YXIgaW5pdGlhbCA9IHNlcmllc1tmaXJzdElkeF1bMV07XG5cbiAgICBmb3IgKHZhciBqID0gZmlyc3RJZHg7IGogPD0gbGFzdElkeDsgaisrKSB7XG4gICAgICBpZiAoaiA9PT0gZmlyc3RJZHgpIHtcbiAgICAgICAgeSA9ICh0aGlzLmJhc2VPcHQgPT09IFwicGVyY2VudFwiKSA/IDAgOiB0aGlzLmJhc2VPcHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB5ID0gUmViYXNlSGFuZGxlci5yZWJhc2Uoc2VyaWVzW2pdWzFdLCBpbml0aWFsLCB0aGlzLmJhc2VPcHQpO1xuICAgICAgfVxuICAgICAgaWYgKHkgPT09IG51bGwgfHwgaXNOYU4oeSkpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgaWYgKG1heFkgPT09IG51bGwgfHwgeSA+IG1heFkpIHtcbiAgICAgICAgbWF4WSA9IHk7XG4gICAgICB9XG4gICAgICBpZiAobWluWSA9PT0gbnVsbCB8fCB5IDwgbWluWSkge1xuICAgICAgICBtaW5ZID0geTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFsgbWluWSwgbWF4WSBdO1xuICB9O1xuXG4gIFJlYmFzZUhhbmRsZXIucHJvdG90eXBlLnNlcmllc1RvUG9pbnRzID0gZnVuY3Rpb24oc2VyaWVzLCBzZXROYW1lLCBib3VuZGFyeUlkU3RhcnQpe1xuICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICB2YXIgZmlyc3RJZHggPSAwO1xuICAgIHZhciBsYXN0SWR4ID0gc2VyaWVzLmxlbmd0aCAtIDE7XG4gICAgdmFyIGluaXRpYWwgPSBzZXJpZXNbZmlyc3RJZHhdWzFdOyAvLyBUT0RPOiBjaGVjayBmb3IgbnVsbFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGxhc3RJZHg7ICsraSkge1xuICAgICAgdmFyIGl0ZW0gPSBzZXJpZXNbaV07XG4gICAgICB2YXIgeXJhdyA9IGl0ZW1bMV07XG4gICAgICB2YXIgeXZhbCA9IHlyYXcgPT09IG51bGwgPyBudWxsIDogcGFyc2VGbG9hdCh5cmF3KTtcbiAgICAgIGlmICh5dmFsICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChpID09PSBmaXJzdElkeCkge1xuICAgICAgICAgIHl2YWwgPSAodGhpcy5iYXNlT3B0ID09PSBcInBlcmNlbnRcIikgPyAwIDogdGhpcy5iYXNlT3B0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHl2YWwgPSBSZWJhc2VIYW5kbGVyLnJlYmFzZSh5dmFsLCBpbml0aWFsLCB0aGlzLmJhc2VPcHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgcG9pbnQgPSB7XG4gICAgICAgIHg6IE5hTixcbiAgICAgICAgeTogTmFOLFxuICAgICAgICB4dmFsOiBwYXJzZUZsb2F0KGl0ZW1bMF0pLFxuICAgICAgICB5dmFsOiB5dmFsLFxuICAgICAgICBuYW1lOiBzZXROYW1lLFxuICAgICAgICBpZHg6IGkgKyBib3VuZGFyeUlkU3RhcnRcbiAgICAgIH07XG4gICAgICBwb2ludHMucHVzaChwb2ludCk7XG4gICAgfVxuICAgIHRoaXMub25Qb2ludHNDcmVhdGVkXyhzZXJpZXMsIHBvaW50cyk7XG4gICAgcmV0dXJuIHBvaW50cztcbiAgfTtcblxuICBEeWdyYXBoLlBsdWdpbnMuUmViYXNlID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciByZWJhc2UgPSBmdW5jdGlvbihiYXNlT3B0KSB7XG4gICAgICB2YXIgaXNOdW0gPSBmdW5jdGlvbih2KSB7XG4gICAgICAgIHJldHVybiAhaXNOYU4odikgJiYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJyB8fCB7fS50b1N0cmluZy5jYWxsKHYpID09PSAnW29iamVjdCBOdW1iZXJdJyk7XG4gICAgICB9O1xuICAgICAgaWYgKGJhc2VPcHQgPT09IFwicGVyY2VudFwiIHx8IGlzTnVtKGJhc2VPcHQpKSB7XG4gICAgICAgIHRoaXMuYmFzZU9wdF8gPSBiYXNlT3B0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5iYXNlT3B0XyA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJlYmFzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBcIlJlYmFzZSBQbHVnaW5cIjtcbiAgICB9O1xuXG4gICAgcmViYXNlLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKGcpIHtcbiAgICAgIGlmICh0aGlzLmJhc2VPcHRfID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByZWRyYXc6IHRoaXMucHJlZHJhd1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgcmViYXNlLnByb3RvdHlwZS5wcmVkcmF3ID0gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGcgPSBlLmR5Z3JhcGg7XG5cbiAgICAgIGlmICh0aGlzLmJhc2VPcHRfID09PSBcInBlcmNlbnRcIikge1xuICAgICAgICBnLnVwZGF0ZU9wdGlvbnMoe1xuICAgICAgICAgIGF4ZXM6IHtcbiAgICAgICAgICAgIHk6IHtcbiAgICAgICAgICAgICAgYXhpc0xhYmVsRm9ybWF0dGVyOiBmdW5jdGlvbih5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHkgKyAnJSc7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHZhbHVlRm9ybWF0dGVyOiBmdW5jdGlvbih5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoeSAqIDEwMCkgLyAxMDAgKyAnJSc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuICAgICAgfVxuXG4gICAgICBnLmRhdGFIYW5kbGVyXyA9IG5ldyBEeWdyYXBoLkRhdGFIYW5kbGVycy5SZWJhc2VIYW5kbGVyKHRoaXMuYmFzZU9wdF8pO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmViYXNlO1xuICB9KSgpO1xufSkoKTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLENBQUMsWUFBVztFQUVWLFlBQVk7O0VBRVo7RUFDQSxJQUFJQSxVQUFVLEdBQUcsU0FBYkEsVUFBVSxDQUFZQyxHQUFHLEVBQUU7SUFDN0IsSUFBSUEsR0FBRyxLQUFLLElBQUksRUFBRSxPQUFPQyxHQUFHO0lBQzVCLE9BQU9ELEdBQUc7RUFDWixDQUFDO0VBRURFLE9BQU8sQ0FBQ0MsWUFBWSxDQUFDQyxhQUFhLEdBQUcsVUFBU0MsT0FBTyxFQUFFO0lBQ3JELElBQUksQ0FBQ0EsT0FBTyxHQUFHQSxPQUFPO0VBQ3hCLENBQUM7RUFFRCxJQUFJRCxhQUFhLEdBQUlGLE9BQU8sQ0FBQ0MsWUFBWSxDQUFDQyxhQUFhO0VBQ3ZEQSxhQUFhLENBQUNFLFNBQVMsR0FBRyxJQUFJSixPQUFPLENBQUNDLFlBQVksQ0FBQ0ksY0FBYyxFQUFFO0VBRW5FSCxhQUFhLENBQUNJLE1BQU0sR0FBRyxVQUFTQyxLQUFLLEVBQUVDLE9BQU8sRUFBRUMsSUFBSSxFQUFFO0lBQ3BELElBQUlBLElBQUksS0FBSyxTQUFTLEVBQUU7TUFDdEIsT0FBTyxDQUFDRixLQUFLLEdBQUdDLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRztJQUNwQztJQUNBLE9BQU9ELEtBQUssR0FBR0UsSUFBSSxHQUFHRCxPQUFPO0VBQy9CLENBQUM7RUFFRE4sYUFBYSxDQUFDRSxTQUFTLENBQUNNLGlCQUFpQixHQUFHLFVBQVNDLE1BQU0sRUFBRUMsVUFBVSxFQUFFQyxPQUFPLEVBQUU7SUFDaEYsSUFBSUMsSUFBSSxHQUFHLElBQUk7TUFBRUMsSUFBSSxHQUFHLElBQUk7TUFBRUMsQ0FB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