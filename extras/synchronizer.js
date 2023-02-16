"use strict";

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
  } else if (typeof module !== 'undefined') {
    Dygraph = require('../dygraph');
    if (typeof Dygraph.NAME === 'undefined' && typeof Dygraph["default"] !== 'undefined') Dygraph = Dygraph["default"];
  }
  /* end of loader wrapper header */

  var synchronize = function synchronize( /* dygraphs..., opts */
  ) {
    if (arguments.length === 0) {
      throw 'Invalid invocation of Dygraph.synchronize(). Need >= 1 argument.';
    }
    var OPTIONS = ['selection', 'zoom', 'range'];
    var opts = {
      selection: true,
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
        throw 'Invalid invocation of Dygraph.synchronize(). ' + 'All but the last argument must be Dygraph objects.';
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
        throw 'Invalid invocation of Dygraph.synchronize(). ' + 'Expected two arguments: array and optional options argument.';
      } // otherwise arguments.length == 1, which is fine.
    } else {
      throw 'Invalid invocation of Dygraph.synchronize(). ' + 'First parameter must be either Dygraph or list of Dygraphs.';
    }
    if (dygraphs.length < 2) {
      throw 'Invalid invocation of Dygraph.synchronize(). ' + 'Need two or more dygraphs to synchronize.';
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
            attachSelectionHandlers(dygraphs, prevCallbacks);
          }
        }
      });
    }
    return {
      detach: function detach() {
        for (var i = 0; i < dygraphs.length; i++) {
          var g = dygraphs[i];
          if (opts.zoom) {
            g.updateOptions({
              drawCallback: prevCallbacks[i].drawCallback
            });
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
  function attachZoomHandlers(gs, syncOpts, prevCallbacks) {
    var block = false;
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i];
      g.updateOptions({
        drawCallback: function synchronizer_drawCallback(me, initial) {
          if (block || initial) {
            // call the user’s drawCallback even if we are blocked
            for (var j = 0; j < gs.length; j++) {
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
          if (syncOpts.range) opts.valueRange = me.yAxisRange();
          for (var _j = 0; _j < gs.length; _j++) {
            if (gs[_j] == me) {
              if (prevCallbacks[_j] && prevCallbacks[_j].drawCallback) {
                prevCallbacks[_j].drawCallback.apply(this, arguments);
              }
              continue;
            }

            // Only redraw if there are new options
            if (arraysAreEqual(opts.dateWindow, gs[_j].getOption('dateWindow')) && (!syncOpts.range || arraysAreEqual(opts.valueRange, gs[_j].getOption('valueRange')))) {
              continue;
            }
            gs[_j].updateOptions(opts);
          }
          block = false;
        }
      }, true /* no need to redraw */);
    }
  }

  function attachSelectionHandlers(gs, prevCallbacks) {
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
            var idx = gs[i].getRowForX(x);
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
  Dygraph._require.add('dygraphs/src/extras/synchronizer.js', /* exports */{});
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0cmFzX3N5bmNocm9uaXplcl9jbG9zdXJlIiwiRHlncmFwaCIsIndpbmRvdyIsIm1vZHVsZSIsInJlcXVpcmUiLCJOQU1FIiwic3luY2hyb25pemUiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJPUFRJT05TIiwib3B0cyIsInNlbGVjdGlvbiIsInpvb20iLCJyYW5nZSIsImR5Z3JhcGhzIiwicHJldkNhbGxiYWNrcyIsInBhcnNlT3B0cyIsIm9iaiIsIk9iamVjdCIsImkiLCJvcHROYW1lIiwiaGFzT3duUHJvcGVydHkiLCJwdXNoIiwicmVhZHljb3VudCIsImciLCJyZWFkeSIsIm9uUmVhZHlfIiwiY2FsbEJhY2tUeXBlcyIsImoiLCJrIiwiZ2V0RnVuY3Rpb25PcHRpb24iLCJhdHRhY2hab29tSGFuZGxlcnMiLCJhdHRhY2hTZWxlY3Rpb25IYW5kbGVycyIsImRldGFjaCIsInVwZGF0ZU9wdGlvbnMiLCJkcmF3Q2FsbGJhY2siLCJoaWdobGlnaHRDYWxsYmFjayIsInVuaGlnaGxpZ2h0Q2FsbGJhY2siLCJhcnJheXNBcmVFcXVhbCIsImEiLCJiIiwiQXJyYXkiLCJpc0FycmF5IiwiZ3MiLCJzeW5jT3B0cyIsImJsb2NrIiwic3luY2hyb25pemVyX2RyYXdDYWxsYmFjayIsIm1lIiwiaW5pdGlhbCIsImFwcGx5IiwiZGF0ZVdpbmRvdyIsInhBeGlzUmFuZ2UiLCJ2YWx1ZVJhbmdlIiwieUF4aXNSYW5nZSIsImdldE9wdGlvbiIsInN5bmNocm9uaXplcl9oaWdobGlnaHRDYWxsYmFjayIsImV2ZW50IiwieCIsInBvaW50cyIsInJvdyIsInNlcmllc05hbWUiLCJpZHgiLCJnZXRSb3dGb3JYIiwic2V0U2VsZWN0aW9uIiwidW5kZWZpbmVkIiwic3luY2hyb25pemVyX3VuaGlnaGxpZ2h0Q2FsbGJhY2siLCJjbGVhclNlbGVjdGlvbiIsIl9yZXF1aXJlIiwiYWRkIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4dHJhcy9zeW5jaHJvbml6ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogUGFydCBvZiBkeWdyYXBocywgc2VlIHRvcC1sZXZlbCBMSUNFTlNFLnR4dCBmaWxlXG4gKiBNSVQtbGljZW5jZWQ6IGh0dHBzOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKi9cblxuLyoqXG4gKiBTeW5jaHJvbml6ZSB6b29taW5nIGFuZC9vciBzZWxlY3Rpb25zIGJldHdlZW4gYSBzZXQgb2YgZHlncmFwaHMuXG4gKlxuICogVXNhZ2U6XG4gKlxuICogICB2YXIgZzEgPSBuZXcgRHlncmFwaCguLi4pLFxuICogICAgICAgZzIgPSBuZXcgRHlncmFwaCguLi4pLFxuICogICAgICAgLi4uO1xuICogICB2YXIgc3luYyA9IER5Z3JhcGguc3luY2hyb25pemUoZzEsIGcyLCAuLi4pO1xuICogICAvLyBjaGFydHMgYXJlIG5vdyBzeW5jaHJvbml6ZWRcbiAqICAgc3luYy5kZXRhY2goKTtcbiAqICAgLy8gY2hhcnRzIGFyZSBubyBsb25nZXIgc3luY2hyb25pemVkXG4gKlxuICogWW91IGNhbiBzZXQgb3B0aW9ucyB1c2luZyB0aGUgbGFzdCBwYXJhbWV0ZXIsIGZvciBleGFtcGxlOlxuICpcbiAqICAgdmFyIHN5bmMgPSBEeWdyYXBoLnN5bmNocm9uaXplKGcxLCBnMiwgZzMsIHtcbiAqICAgICAgc2VsZWN0aW9uOiB0cnVlLFxuICogICAgICB6b29tOiB0cnVlXG4gKiAgIH0pO1xuICpcbiAqIFRoZSBkZWZhdWx0IGlzIHRvIHN5bmNocm9uaXplIGJvdGggb2YgdGhlc2UuXG4gKlxuICogSW5zdGVhZCBvZiBwYXNzaW5nIG9uZSBEeWdyYXBoIG9iamVjdCBhcyBlYWNoIHBhcmFtZXRlciwgeW91IG1heSBhbHNvIHBhc3MgYW5cbiAqIGFycmF5IG9mIGR5Z3JhcGhzOlxuICpcbiAqICAgdmFyIHN5bmMgPSBEeWdyYXBoLnN5bmNocm9uaXplKFtnMSwgZzIsIGczXSwge1xuICogICAgICBzZWxlY3Rpb246IGZhbHNlLFxuICogICAgICB6b29tOiB0cnVlXG4gKiAgIH0pO1xuICpcbiAqIFlvdSBtYXkgYWxzbyBzZXQgYHJhbmdlOiBmYWxzZWAgaWYgeW91IHdpc2ggdG8gb25seSBzeW5jIHRoZSB4LWF4aXMuXG4gKiBUaGUgYHJhbmdlYCBvcHRpb24gaGFzIG5vIGVmZmVjdCB1bmxlc3MgYHpvb21gIGlzIHRydWUgKHRoZSBkZWZhdWx0KS5cbiAqL1xuXG4vKiBsb2FkZXIgd3JhcHBlciB0byBhbGxvdyBicm93c2VyIHVzZSBhbmQgRVM2IGltcG9ydHMgKi9cbihmdW5jdGlvbiBfZXh0cmFzX3N5bmNocm9uaXplcl9jbG9zdXJlKCkge1xuJ3VzZSBzdHJpY3QnO1xudmFyIER5Z3JhcGg7XG5pZiAod2luZG93LkR5Z3JhcGgpIHtcbiAgRHlncmFwaCA9IHdpbmRvdy5EeWdyYXBoO1xufSBlbHNlIGlmICh0eXBlb2YobW9kdWxlKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgRHlncmFwaCA9IHJlcXVpcmUoJy4uL2R5Z3JhcGgnKTtcbiAgaWYgKHR5cGVvZihEeWdyYXBoLk5BTUUpID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YoRHlncmFwaC5kZWZhdWx0KSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgRHlncmFwaCA9IER5Z3JhcGguZGVmYXVsdDtcbn1cbi8qIGVuZCBvZiBsb2FkZXIgd3JhcHBlciBoZWFkZXIgKi9cblxudmFyIHN5bmNocm9uaXplID0gZnVuY3Rpb24gc3luY2hyb25pemUoLyogZHlncmFwaHMuLi4sIG9wdHMgKi8pIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyAnSW52YWxpZCBpbnZvY2F0aW9uIG9mIER5Z3JhcGguc3luY2hyb25pemUoKS4gTmVlZCA+PSAxIGFyZ3VtZW50Lic7XG4gIH1cblxuICB2YXIgT1BUSU9OUyA9IFsnc2VsZWN0aW9uJywgJ3pvb20nLCAncmFuZ2UnXTtcbiAgdmFyIG9wdHMgPSB7XG4gICAgc2VsZWN0aW9uOiB0cnVlLFxuICAgIHpvb206IHRydWUsXG4gICAgcmFuZ2U6IHRydWVcbiAgfTtcbiAgdmFyIGR5Z3JhcGhzID0gW107XG4gIHZhciBwcmV2Q2FsbGJhY2tzID0gW107XG5cbiAgdmFyIHBhcnNlT3B0cyA9IGZ1bmN0aW9uIHBhcnNlT3B0cyhvYmopIHtcbiAgICBpZiAoIShvYmogaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICB0aHJvdyAnTGFzdCBhcmd1bWVudCBtdXN0IGJlIGVpdGhlciBEeWdyYXBoIG9yIE9iamVjdC4nO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE9QVElPTlMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG9wdE5hbWUgPSBPUFRJT05TW2ldO1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KG9wdE5hbWUpKSBvcHRzW29wdE5hbWVdID0gb2JqW29wdE5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBpZiAoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgRHlncmFwaCkge1xuICAgIC8vIEFyZ3VtZW50cyBhcmUgRHlncmFwaCBvYmplY3RzLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJndW1lbnRzW2ldIGluc3RhbmNlb2YgRHlncmFwaCkge1xuICAgICAgICBkeWdyYXBocy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGkgPCBhcmd1bWVudHMubGVuZ3RoIC0gMSkge1xuICAgICAgdGhyb3cgJ0ludmFsaWQgaW52b2NhdGlvbiBvZiBEeWdyYXBoLnN5bmNocm9uaXplKCkuICcgK1xuICAgICAgICAgICAgJ0FsbCBidXQgdGhlIGxhc3QgYXJndW1lbnQgbXVzdCBiZSBEeWdyYXBoIG9iamVjdHMuJztcbiAgICB9IGVsc2UgaWYgKGkgPT0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgIHBhcnNlT3B0cyhhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCkge1xuICAgIC8vIEludm9rZWQgdy8gbGlzdCBvZiBkeWdyYXBocywgb3B0aW9uc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkeWdyYXBocy5wdXNoKGFyZ3VtZW50c1swXVtpXSk7XG4gICAgfVxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICAgIHBhcnNlT3B0cyhhcmd1bWVudHNbMV0pO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgIHRocm93ICdJbnZhbGlkIGludm9jYXRpb24gb2YgRHlncmFwaC5zeW5jaHJvbml6ZSgpLiAnICtcbiAgICAgICAgICAgICdFeHBlY3RlZCB0d28gYXJndW1lbnRzOiBhcnJheSBhbmQgb3B0aW9uYWwgb3B0aW9ucyBhcmd1bWVudC4nO1xuICAgIH0gIC8vIG90aGVyd2lzZSBhcmd1bWVudHMubGVuZ3RoID09IDEsIHdoaWNoIGlzIGZpbmUuXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgJ0ludmFsaWQgaW52b2NhdGlvbiBvZiBEeWdyYXBoLnN5bmNocm9uaXplKCkuICcgK1xuICAgICAgICAgICdGaXJzdCBwYXJhbWV0ZXIgbXVzdCBiZSBlaXRoZXIgRHlncmFwaCBvciBsaXN0IG9mIER5Z3JhcGhzLic7XG4gIH1cblxuICBpZiAoZHlncmFwaHMubGVuZ3RoIDwgMikge1xuICAgIHRocm93ICdJbnZhbGlkIGludm9jYXRpb24gb2YgRHlncmFwaC5zeW5jaHJvbml6ZSgpLiAnICtcbiAgICAgICAgICAnTmVlZCB0d28gb3IgbW9yZSBkeWdyYXBocyB0byBzeW5jaHJvbml6ZS4nO1xuICB9XG5cbiAgdmFyIHJlYWR5Y291bnQgPSBkeWdyYXBocy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZHlncmFwaHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZyA9IGR5Z3JhcGhzW2ldO1xuICAgIGcucmVhZHkoZnVuY3Rpb24gb25SZWFkeV8oKSB7XG4gICAgICBpZiAoLS1yZWFkeWNvdW50ID09IDApIHtcbiAgICAgICAgLy8gc3RvcmUgb3JpZ2luYWwgY2FsbGJhY2tzXG4gICAgICAgIHZhciBjYWxsQmFja1R5cGVzID0gWydkcmF3Q2FsbGJhY2snLCAnaGlnaGxpZ2h0Q2FsbGJhY2snLCAndW5oaWdobGlnaHRDYWxsYmFjayddO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGR5Z3JhcGhzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKCFwcmV2Q2FsbGJhY2tzW2pdKSB7XG4gICAgICAgICAgICBwcmV2Q2FsbGJhY2tzW2pdID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAodmFyIGsgPSBjYWxsQmFja1R5cGVzLmxlbmd0aCAtIDE7IGsgPj0gMDsgay0tKSB7XG4gICAgICAgICAgICBwcmV2Q2FsbGJhY2tzW2pdW2NhbGxCYWNrVHlwZXNba11dID0gZHlncmFwaHNbal0uZ2V0RnVuY3Rpb25PcHRpb24oY2FsbEJhY2tUeXBlc1trXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBkcmF3LCBoaWdobGlnaHQsIHVuaGlnaGxpZ2h0IGNhbGxiYWNrcy5cbiAgICAgICAgaWYgKG9wdHMuem9vbSkge1xuICAgICAgICAgIGF0dGFjaFpvb21IYW5kbGVycyhkeWdyYXBocywgb3B0cywgcHJldkNhbGxiYWNrcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0cy5zZWxlY3Rpb24pIHtcbiAgICAgICAgICBhdHRhY2hTZWxlY3Rpb25IYW5kbGVycyhkeWdyYXBocywgcHJldkNhbGxiYWNrcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGV0YWNoOiBmdW5jdGlvbiBkZXRhY2goKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGR5Z3JhcGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBnID0gZHlncmFwaHNbaV07XG4gICAgICAgIGlmIChvcHRzLnpvb20pIHtcbiAgICAgICAgICBnLnVwZGF0ZU9wdGlvbnMoe2RyYXdDYWxsYmFjazogcHJldkNhbGxiYWNrc1tpXS5kcmF3Q2FsbGJhY2t9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5zZWxlY3Rpb24pIHtcbiAgICAgICAgICBnLnVwZGF0ZU9wdGlvbnMoe1xuICAgICAgICAgICAgaGlnaGxpZ2h0Q2FsbGJhY2s6IHByZXZDYWxsYmFja3NbaV0uaGlnaGxpZ2h0Q2FsbGJhY2ssXG4gICAgICAgICAgICB1bmhpZ2hsaWdodENhbGxiYWNrOiBwcmV2Q2FsbGJhY2tzW2ldLnVuaGlnaGxpZ2h0Q2FsbGJhY2tcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gcmVsZWFzZSByZWZlcmVuY2VzICYgbWFrZSBzdWJzZXF1ZW50IGNhbGxzIHRocm93LlxuICAgICAgZHlncmFwaHMgPSBudWxsO1xuICAgICAgb3B0cyA9IG51bGw7XG4gICAgICBwcmV2Q2FsbGJhY2tzID0gbnVsbDtcbiAgICB9XG4gIH07XG59O1xuXG5mdW5jdGlvbiBhcnJheXNBcmVFcXVhbChhLCBiKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShhKSB8fCAhQXJyYXkuaXNBcnJheShiKSkgcmV0dXJuIGZhbHNlO1xuICB2YXIgaSA9IGEubGVuZ3RoO1xuICBpZiAoaSAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgd2hpbGUgKGktLSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGF0dGFjaFpvb21IYW5kbGVycyhncywgc3luY09wdHMsIHByZXZDYWxsYmFja3MpIHtcbiAgdmFyIGJsb2NrID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZyA9IGdzW2ldO1xuICAgIGcudXBkYXRlT3B0aW9ucyh7XG4gICAgICBkcmF3Q2FsbGJhY2s6IGZ1bmN0aW9uIHN5bmNocm9uaXplcl9kcmF3Q2FsbGJhY2sobWUsIGluaXRpYWwpIHtcbiAgICAgICAgaWYgKGJsb2NrIHx8IGluaXRpYWwpIHtcbiAgICAgICAgICAvLyBjYWxsIHRoZSB1c2Vy4oCZcyBkcmF3Q2FsbGJhY2sgZXZlbiBpZiB3ZSBhcmUgYmxvY2tlZFxuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChnc1tqXSA9PSBtZSkge1xuICAgICAgICAgICAgICBpZiAocHJldkNhbGxiYWNrc1tqXSAmJiBwcmV2Q2FsbGJhY2tzW2pdLmRyYXdDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHByZXZDYWxsYmFja3Nbal0uZHJhd0NhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJsb2NrID0gdHJ1ZTtcbiAgICAgICAgdmFyIG9wdHMgPSB7XG4gICAgICAgICAgZGF0ZVdpbmRvdzogbWUueEF4aXNSYW5nZSgpXG4gICAgICAgIH07XG4gICAgICAgIGlmIChzeW5jT3B0cy5yYW5nZSlcbiAgICAgICAgICBvcHRzLnZhbHVlUmFuZ2UgPSBtZS55QXhpc1JhbmdlKCk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmIChnc1tqXSA9PSBtZSkge1xuICAgICAgICAgICAgaWYgKHByZXZDYWxsYmFja3Nbal0gJiYgcHJldkNhbGxiYWNrc1tqXS5kcmF3Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgcHJldkNhbGxiYWNrc1tqXS5kcmF3Q2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE9ubHkgcmVkcmF3IGlmIHRoZXJlIGFyZSBuZXcgb3B0aW9uc1xuICAgICAgICAgIGlmIChhcnJheXNBcmVFcXVhbChvcHRzLmRhdGVXaW5kb3csIGdzW2pdLmdldE9wdGlvbignZGF0ZVdpbmRvdycpKSAmJlxuICAgICAgICAgICAgICAoIXN5bmNPcHRzLnJhbmdlIHx8XG4gICAgICAgICAgICAgICBhcnJheXNBcmVFcXVhbChvcHRzLnZhbHVlUmFuZ2UsIGdzW2pdLmdldE9wdGlvbigndmFsdWVSYW5nZScpKSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdzW2pdLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgYmxvY2sgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9LCB0cnVlIC8qIG5vIG5lZWQgdG8gcmVkcmF3ICovKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRhY2hTZWxlY3Rpb25IYW5kbGVycyhncywgcHJldkNhbGxiYWNrcykge1xuICB2YXIgYmxvY2sgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBnID0gZ3NbaV07XG5cbiAgICBnLnVwZGF0ZU9wdGlvbnMoe1xuICAgICAgaGlnaGxpZ2h0Q2FsbGJhY2s6IGZ1bmN0aW9uIHN5bmNocm9uaXplcl9oaWdobGlnaHRDYWxsYmFjayhldmVudCwgeCwgcG9pbnRzLCByb3csIHNlcmllc05hbWUpIHtcbiAgICAgICAgaWYgKGJsb2NrKSByZXR1cm47XG4gICAgICAgIGJsb2NrID0gdHJ1ZTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChtZSA9PSBnc1tpXSkge1xuICAgICAgICAgICAgaWYgKHByZXZDYWxsYmFja3NbaV0gJiYgcHJldkNhbGxiYWNrc1tpXS5oaWdobGlnaHRDYWxsYmFjaykge1xuICAgICAgICAgICAgICBwcmV2Q2FsbGJhY2tzW2ldLmhpZ2hsaWdodENhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGlkeCA9IGdzW2ldLmdldFJvd0ZvclgoeCk7XG4gICAgICAgICAgaWYgKGlkeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgZ3NbaV0uc2V0U2VsZWN0aW9uKGlkeCwgc2VyaWVzTmFtZSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYmxvY2sgPSBmYWxzZTtcbiAgICAgIH0sXG4gICAgICB1bmhpZ2hsaWdodENhbGxiYWNrOiBmdW5jdGlvbiBzeW5jaHJvbml6ZXJfdW5oaWdobGlnaHRDYWxsYmFjayhldmVudCkge1xuICAgICAgICBpZiAoYmxvY2spIHJldHVybjtcbiAgICAgICAgYmxvY2sgPSB0cnVlO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKG1lID09IGdzW2ldKSB7XG4gICAgICAgICAgICBpZiAocHJldkNhbGxiYWNrc1tpXSAmJiBwcmV2Q2FsbGJhY2tzW2ldLnVuaGlnaGxpZ2h0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgcHJldkNhbGxiYWNrc1tpXS51bmhpZ2hsaWdodENhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3NbaV0uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBibG9jayA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sIHRydWUgLyogbm8gbmVlZCB0byByZWRyYXcgKi8pO1xuICB9XG59XG5cbkR5Z3JhcGguc3luY2hyb25pemUgPSBzeW5jaHJvbml6ZTtcblxuLyogY2xvc3VyZSBhbmQgbG9hZGVyIHdyYXBwZXIgKi9cbkR5Z3JhcGguX3JlcXVpcmUuYWRkKCdkeWdyYXBocy9zcmMvZXh0cmFzL3N5bmNocm9uaXplci5qcycsIC8qIGV4cG9ydHMgKi8ge30pO1xufSkoKTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLENBQUMsU0FBU0EsNEJBQTRCLEdBQUc7RUFDekMsWUFBWTs7RUFDWixJQUFJQyxPQUFPO0VBQ1gsSUFBSUMsTUFBTSxDQUFDRCxPQUFPLEVBQUU7SUFDbEJBLE9BQU8sR0FBR0MsTUFBTSxDQUFDRCxPQUFPO0VBQzFCLENBQUMsTUFBTSxJQUFJLE9BQU9FLE1BQU8sS0FBSyxXQUFXLEVBQUU7SUFDekNGLE9BQU8sR0FBR0csT0FBTyxDQUFDLFlBQVksQ0FBQztJQUMvQixJQUFJLE9BQU9ILE9BQU8sQ0FBQ0ksSUFBSyxLQUFLLFdBQVcsSUFBSSxPQUFPSixPQUFPLFdBQVMsS0FBSyxXQUFXLEVBQ2pGQSxPQUFPLEdBQUdBLE9BQU8sV0FBUTtFQUM3QjtFQUNBOztFQUVBLElBQUlLLFdBQVcsR0FBRyxTQUFTQSxXQUFXLEVBQUM7RUFBQSxFQUF5QjtJQUM5RCxJQUFJQyxTQUFTLENBQUNDLE1BQU0sS0FB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