/**
 * @license
 * Part of dygraphs, see top-level LICENSE.txt file
 * MIT-licenced: https://opensource.org/licenses/MIT
 */

/**
 * Synchronize zooming and/or selections between a set of dygraphs.
 *
 * Usage:
 *
 *   var g1 = new Dygraph(...),
 *       g2 = new Dygraph(...),
 *       ...;
 *   var sync = Dygraph.synchronize(g1, g2, ...);
 *   // charts are now synchronized
 *   sync.detach();
 *   // charts are no longer synchronized
 *
 * You can set options using the last parameter, for example:
 *
 *   var sync = Dygraph.synchronize(g1, g2, g3, {
 *      selection: true,
 *      zoom: true
 *   });
 *
 * The default is to synchronize both of these.
 *
 * Instead of passing one Dygraph object as each parameter, you may also pass an
 * array of dygraphs:
 *
 *   var sync = Dygraph.synchronize([g1, g2, g3], {
 *      selection: false,
 *      zoom: true
 *   });
 *
 * You may also set `range: false` if you wish to only sync the x-axis.
 * The `range` option has no effect unless `zoom` is true (the default).
 */

/* loader wrapper to allow browser use and ES6 imports */
(function _extras_synchronizer_closure() {
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

var synchronize = function synchronize(/* dygraphs..., opts */) {
  if (arguments.length === 0) {
    throw 'Invalid invocation of Dygraph.synchronize(). Need >= 1 argument.';
  }

  var OPTIONS = ['selection', 'selectionClosest', 'zoom', 'range'];
  var opts = {
    selection: true,
    selectionClosest: false,
    zoom: true,
    range: true
  };
  var dygraphs = [];
  var prevCallbacks = [];

  var parseOpts = function parseOpts(obj) {
    if (!(obj instanceof Object)) {
      throw 'Last argument must be either Dygraph or Object.';
    } else {
      for (var i = 0; i < OPTIONS.length; i++) {
        var optName = OPTIONS[i];
        if (obj.hasOwnProperty(optName)) opts[optName] = obj[optName];
      }
    }
  };

  if (arguments[0] instanceof Dygraph) {
    // Arguments are Dygraph objects.
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] instanceof Dygraph) {
        dygraphs.push(arguments[i]);
      } else {
        break;
      }
    }
    if (i < arguments.length - 1) {
      throw 'Invalid invocation of Dygraph.synchronize(). ' +
            'All but the last argument must be Dygraph objects.';
    } else if (i == arguments.length - 1) {
      parseOpts(arguments[arguments.length - 1]);
    }
  } else if (arguments[0].length) {
    // Invoked w/ list of dygraphs, options
    for (var i = 0; i < arguments[0].length; i++) {
      dygraphs.push(arguments[0][i]);
    }
    if (arguments.length == 2) {
      parseOpts(arguments[1]);
    } else if (arguments.length > 2) {
      throw 'Invalid invocation of Dygraph.synchronize(). ' +
            'Expected two arguments: array and optional options argument.';
    }  // otherwise arguments.length == 1, which is fine.
  } else {
    throw 'Invalid invocation of Dygraph.synchronize(). ' +
          'First parameter must be either Dygraph or list of Dygraphs.';
  }

  if (dygraphs.length < 2) {
    throw 'Invalid invocation of Dygraph.synchronize(). ' +
          'Need two or more dygraphs to synchronize.';
  }

  var readycount = dygraphs.length;
  for (var i = 0; i < dygraphs.length; i++) {
    var g = dygraphs[i];
    g.ready(function onReady_() {
      if (--readycount == 0) {
        // store original callbacks
        var callBackTypes = ['drawCallback', 'highlightCallback', 'unhighlightCallback'];
        for (var j = 0; j < dygraphs.length; j++) {
          if (!prevCallbacks[j]) {
            prevCallbacks[j] = {};
          }
          for (var k = callBackTypes.length - 1; k >= 0; k--) {
            prevCallbacks[j][callBackTypes[k]] = dygraphs[j].getFunctionOption(callBackTypes[k]);
          }
        }

        // Listen for draw, highlight, unhighlight callbacks.
        if (opts.zoom) {
          attachZoomHandlers(dygraphs, opts, prevCallbacks);
        }

        if (opts.selection) {
          attachSelectionHandlers(dygraphs, opts, prevCallbacks);
        }
      }
    });
  }

  return {
    detach: function detach() {
      for (var i = 0; i < dygraphs.length; i++) {
        var g = dygraphs[i];
        if (opts.zoom) {
          g.updateOptions({drawCallback: prevCallbacks[i].drawCallback});
        }
        if (opts.selection) {
          g.updateOptions({
            highlightCallback: prevCallbacks[i].highlightCallback,
            unhighlightCallback: prevCallbacks[i].unhighlightCallback
          });
        }
      }
      // release references & make subsequent calls throw.
      dygraphs = null;
      opts = null;
      prevCallbacks = null;
    }
  };
};

function arraysAreEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  var i = a.length;
  if (i !== b.length) return false;
  while (i--) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function closestIdx(gs, x) {
  var points = gs.layout_.points[0];
  
  // if graph has no data or single entry
  var highestI = points.length - 1;
  if (highestI < 0) return null;
  if (highestI === 0) return points[0].idx;
  
  var lowestI = 0;
  
  // if values of x axis are in descending order, reverse searching borders
  if (points[0].xval > points[highestI].xval) {
    lowestI = highestI;
    highestI = 0;
  }
  
  while (true) {
    var middleI = Math.round( (lowestI + highestI) * 0.5 );
    if (middleI === lowestI || middleI === highestI) break;
    
    var middleX = points[middleI].xval;
    if (middleX === x) return points[middleI].idx;
    
    if (x < middleX) {
      highestI = middleI;
    } else {
      lowestI = middleI;
    }
  }
  
  var closestI = x - points[lowestI].xval < points[highestI].xval - x ? lowestI : highestI;
  
  return points[closestI].idx;
}

function attachZoomHandlers(gs, syncOpts, prevCallbacks) {
  var block = false;
  for (var i = 0; i < gs.length; i++) {
    var g = gs[i];
    g.updateOptions({
      drawCallback: function synchronizer_drawCallback(me, initial) {
        if (block || initial) {
          // call the user’s drawCallback even if we are blocked
          for (let j = 0; j < gs.length; j++) {
            if (gs[j] == me) {
              if (prevCallbacks[j] && prevCallbacks[j].drawCallback) {
                prevCallbacks[j].drawCallback.apply(this, arguments);
              }
              break;
            }
          }
          return;
        }

        block = true;
        var opts = {
          dateWindow: me.xAxisRange()
        };
        if (!me.isZoomed('x'))
          opts.dateWindow = null;
        if (syncOpts.range)
          opts.valueRange = me.yAxisRange();

        for (let j = 0; j < gs.length; j++) {
          if (gs[j] == me) {
            if (prevCallbacks[j] && prevCallbacks[j].drawCallback) {
              prevCallbacks[j].drawCallback.apply(this, arguments);
            }
            continue;
          }

          // Only redraw if there are new options
          if (arraysAreEqual(opts.dateWindow, gs[j].getOption('dateWindow')) &&
              (!syncOpts.range ||
               arraysAreEqual(opts.valueRange, gs[j].getOption('valueRange')))) {
            continue;
          }

          gs[j].updateOptions(opts);
        }
        block = false;
      }
    }, true /* no need to redraw */);
  }
}

function attachSelectionHandlers(gs, syncOpts, prevCallbacks) {
  var block = false;
  for (var i = 0; i < gs.length; i++) {
    var g = gs[i];

    g.updateOptions({
      highlightCallback: function synchronizer_highlightCallback(event, x, points, row, seriesName) {
        if (block) return;
        block = true;
        var me = this;
        for (var i = 0; i < gs.length; i++) {
          if (me == gs[i]) {
            if (prevCallbacks[i] && prevCallbacks[i].highlightCallback) {
              prevCallbacks[i].highlightCallback.apply(this, arguments);
            }
            continue;
          }
          var idx;
          if (!syncOpts.selectionClosest) {
            idx = gs[i].getRowForX(x);
          } else {
            idx = null;
            if (gs[i].numRows() === me.numRows()) idx = gs[i].getRowForX(x);
            if (idx === null) idx = closestIdx(gs[i], x);
          }
          if (idx !== null) {
            gs[i].setSelection(idx, seriesName, undefined, true);
          }
        }
        block = false;
      },
      unhighlightCallback: function synchronizer_unhighlightCallback(event) {
        if (block) return;
        block = true;
        var me = this;
        for (var i = 0; i < gs.length; i++) {
          if (me == gs[i]) {
            if (prevCallbacks[i] && prevCallbacks[i].unhighlightCallback) {
              prevCallbacks[i].unhighlightCallback.apply(this, arguments);
            }
            continue;
          }
          gs[i].clearSelection();
        }
        block = false;
      }
    }, true /* no need to redraw */);
  }
}

Dygraph.synchronize = synchronize;

/* closure and loader wrapper */
Dygraph._require.add('dygraphs/src/extras/synchronizer.js', /* exports */ {});
})();
