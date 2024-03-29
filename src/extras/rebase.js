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
} else if (typeof(module) !== 'undefined') {
  Dygraph = require('../dygraph');
  if (typeof(Dygraph.NAME) === 'undefined' && typeof(Dygraph.default) !== 'undefined')
    Dygraph = Dygraph.default;
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
    var minY = null, maxY = null, y;
    var firstIdx = 0, lastIdx = series.length - 1;
    var initial = series[firstIdx][1];

    for (var j = firstIdx; j <= lastIdx; j++) {
      if (j === firstIdx) {
        y = (this.baseOpt === "percent") ? 0 : this.baseOpt;
      } else {
        y = RebaseHandler.rebase(series[j][1], initial, this.baseOpt);
      }
      if (y === null || isNaN(y))
        continue;
      if (maxY === null || y > maxY) {
        maxY = y;
      }
      if (minY === null || y < minY) {
        minY = y;
      }
    }
    return [ minY, maxY ];
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
          yval = (this.baseOpt === "percent") ? 0 : this.baseOpt;
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

  Dygraph.Plugins.Rebase = (function _rebase_inner_closure() {
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
  })();

/* closure and loader wrapper */
Dygraph._require.add('dygraphs/src/extras/rebase.js', /* exports */ {});
})();
