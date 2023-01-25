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
(function () {
  /* global Dygraph:false */
  'use strict';

  var Dygraph;
  if (window.Dygraph) {
    Dygraph = window.Dygraph;
  } else if (typeof module !== 'undefined') {
    Dygraph = require('../dygraph');
  }
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
      g.ready(function () {
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
        drawCallback: function drawCallback(me, initial) {
          if (block || initial) return;
          block = true;
          var opts = {
            dateWindow: me.xAxisRange()
          };
          if (syncOpts.range) opts.valueRange = me.yAxisRange();
          for (var j = 0; j < gs.length; j++) {
            if (gs[j] == me) {
              if (prevCallbacks[j] && prevCallbacks[j].drawCallback) {
                prevCallbacks[j].drawCallback.apply(this, arguments);
              }
              continue;
            }

            // Only redraw if there are new options
            if (arraysAreEqual(opts.dateWindow, gs[j].getOption('dateWindow')) && arraysAreEqual(opts.valueRange, gs[j].getOption('valueRange'))) {
              continue;
            }
            gs[j].updateOptions(opts);
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
        highlightCallback: function highlightCallback(event, x, points, row, seriesName) {
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
        unhighlightCallback: function unhighlightCallback(event) {
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
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEeWdyYXBoIiwid2luZG93IiwibW9kdWxlIiwicmVxdWlyZSIsInN5bmNocm9uaXplIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiT1BUSU9OUyIsIm9wdHMiLCJzZWxlY3Rpb24iLCJ6b29tIiwicmFuZ2UiLCJkeWdyYXBocyIsInByZXZDYWxsYmFja3MiLCJwYXJzZU9wdHMiLCJvYmoiLCJPYmplY3QiLCJpIiwib3B0TmFtZSIsImhhc093blByb3BlcnR5IiwicHVzaCIsInJlYWR5Y291bnQiLCJnIiwicmVhZHkiLCJjYWxsQmFja1R5cGVzIiwiaiIsImsiLCJnZXRGdW5jdGlvbk9wdGlvbiIsImF0dGFjaFpvb21IYW5kbGVycyIsImF0dGFjaFNlbGVjdGlvbkhhbmRsZXJzIiwiZGV0YWNoIiwidXBkYXRlT3B0aW9ucyIsImRyYXdDYWxsYmFjayIsImhpZ2hsaWdodENhbGxiYWNrIiwidW5oaWdobGlnaHRDYWxsYmFjayIsImFycmF5c0FyZUVxdWFsIiwiYSIsImIiLCJBcnJheSIsImlzQXJyYXkiLCJncyIsInN5bmNPcHRzIiwiYmxvY2siLCJtZSIsImluaXRpYWwiLCJkYXRlV2luZG93IiwieEF4aXNSYW5nZSIsInZhbHVlUmFuZ2UiLCJ5QXhpc1JhbmdlIiwiYXBwbHkiLCJnZXRPcHRpb24iLCJldmVudCIsIngiLCJwb2ludHMiLCJyb3ciLCJzZXJpZXNOYW1lIiwiaWR4IiwiZ2V0Um93Rm9yWCIsInNldFNlbGVjdGlvbiIsInVuZGVmaW5lZCIsImNsZWFyU2VsZWN0aW9uIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4dHJhcy9zeW5jaHJvbml6ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogUGFydCBvZiBkeWdyYXBocywgc2VlIHRvcC1sZXZlbCBMSUNFTlNFLnR4dCBmaWxlXG4gKiBNSVQtbGljZW5jZWQ6IGh0dHBzOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKi9cbi8qKlxuICogU3luY2hyb25pemUgem9vbWluZyBhbmQvb3Igc2VsZWN0aW9ucyBiZXR3ZWVuIGEgc2V0IG9mIGR5Z3JhcGhzLlxuICpcbiAqIFVzYWdlOlxuICpcbiAqICAgdmFyIGcxID0gbmV3IER5Z3JhcGgoLi4uKSxcbiAqICAgICAgIGcyID0gbmV3IER5Z3JhcGgoLi4uKSxcbiAqICAgICAgIC4uLjtcbiAqICAgdmFyIHN5bmMgPSBEeWdyYXBoLnN5bmNocm9uaXplKGcxLCBnMiwgLi4uKTtcbiAqICAgLy8gY2hhcnRzIGFyZSBub3cgc3luY2hyb25pemVkXG4gKiAgIHN5bmMuZGV0YWNoKCk7XG4gKiAgIC8vIGNoYXJ0cyBhcmUgbm8gbG9uZ2VyIHN5bmNocm9uaXplZFxuICpcbiAqIFlvdSBjYW4gc2V0IG9wdGlvbnMgdXNpbmcgdGhlIGxhc3QgcGFyYW1ldGVyLCBmb3IgZXhhbXBsZTpcbiAqXG4gKiAgIHZhciBzeW5jID0gRHlncmFwaC5zeW5jaHJvbml6ZShnMSwgZzIsIGczLCB7XG4gKiAgICAgIHNlbGVjdGlvbjogdHJ1ZSxcbiAqICAgICAgem9vbTogdHJ1ZVxuICogICB9KTtcbiAqXG4gKiBUaGUgZGVmYXVsdCBpcyB0byBzeW5jaHJvbml6ZSBib3RoIG9mIHRoZXNlLlxuICpcbiAqIEluc3RlYWQgb2YgcGFzc2luZyBvbmUgRHlncmFwaCBvYmplY3QgYXMgZWFjaCBwYXJhbWV0ZXIsIHlvdSBtYXkgYWxzbyBwYXNzIGFuXG4gKiBhcnJheSBvZiBkeWdyYXBoczpcbiAqXG4gKiAgIHZhciBzeW5jID0gRHlncmFwaC5zeW5jaHJvbml6ZShbZzEsIGcyLCBnM10sIHtcbiAqICAgICAgc2VsZWN0aW9uOiBmYWxzZSxcbiAqICAgICAgem9vbTogdHJ1ZVxuICogICB9KTtcbiAqXG4gKiBZb3UgbWF5IGFsc28gc2V0IGByYW5nZTogZmFsc2VgIGlmIHlvdSB3aXNoIHRvIG9ubHkgc3luYyB0aGUgeC1heGlzLlxuICogVGhlIGByYW5nZWAgb3B0aW9uIGhhcyBubyBlZmZlY3QgdW5sZXNzIGB6b29tYCBpcyB0cnVlICh0aGUgZGVmYXVsdCkuXG4gKi9cbihmdW5jdGlvbigpIHtcbi8qIGdsb2JhbCBEeWdyYXBoOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBEeWdyYXBoO1xuaWYgKHdpbmRvdy5EeWdyYXBoKSB7XG4gIER5Z3JhcGggPSB3aW5kb3cuRHlncmFwaDtcbn0gZWxzZSBpZiAodHlwZW9mKG1vZHVsZSkgIT09ICd1bmRlZmluZWQnKSB7XG4gIER5Z3JhcGggPSByZXF1aXJlKCcuLi9keWdyYXBoJyk7XG59XG5cbnZhciBzeW5jaHJvbml6ZSA9IGZ1bmN0aW9uKC8qIGR5Z3JhcGhzLi4uLCBvcHRzICovKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgJ0ludmFsaWQgaW52b2NhdGlvbiBvZiBEeWdyYXBoLnN5bmNocm9uaXplKCkuIE5lZWQgPj0gMSBhcmd1bWVudC4nO1xuICB9XG5cbiAgdmFyIE9QVElPTlMgPSBbJ3NlbGVjdGlvbicsICd6b29tJywgJ3JhbmdlJ107XG4gIHZhciBvcHRzID0ge1xuICAgIHNlbGVjdGlvbjogdHJ1ZSxcbiAgICB6b29tOiB0cnVlLFxuICAgIHJhbmdlOiB0cnVlXG4gIH07XG4gIHZhciBkeWdyYXBocyA9IFtdO1xuICB2YXIgcHJldkNhbGxiYWNrcyA9IFtdO1xuXG4gIHZhciBwYXJzZU9wdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIShvYmogaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICB0aHJvdyAnTGFzdCBhcmd1bWVudCBtdXN0IGJlIGVpdGhlciBEeWdyYXBoIG9yIE9iamVjdC4nO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE9QVElPTlMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG9wdE5hbWUgPSBPUFRJT05TW2ldO1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KG9wdE5hbWUpKSBvcHRzW29wdE5hbWVdID0gb2JqW29wdE5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBpZiAoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgRHlncmFwaCkge1xuICAgIC8vIEFyZ3VtZW50cyBhcmUgRHlncmFwaCBvYmplY3RzLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJndW1lbnRzW2ldIGluc3RhbmNlb2YgRHlncmFwaCkge1xuICAgICAgICBkeWdyYXBocy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGkgPCBhcmd1bWVudHMubGVuZ3RoIC0gMSkge1xuICAgICAgdGhyb3cgJ0ludmFsaWQgaW52b2NhdGlvbiBvZiBEeWdyYXBoLnN5bmNocm9uaXplKCkuICcgK1xuICAgICAgICAgICAgJ0FsbCBidXQgdGhlIGxhc3QgYXJndW1lbnQgbXVzdCBiZSBEeWdyYXBoIG9iamVjdHMuJztcbiAgICB9IGVsc2UgaWYgKGkgPT0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgIHBhcnNlT3B0cyhhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCkge1xuICAgIC8vIEludm9rZWQgdy8gbGlzdCBvZiBkeWdyYXBocywgb3B0aW9uc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkeWdyYXBocy5wdXNoKGFyZ3VtZW50c1swXVtpXSk7XG4gICAgfVxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICAgIHBhcnNlT3B0cyhhcmd1bWVudHNbMV0pO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgIHRocm93ICdJbnZhbGlkIGludm9jYXRpb24gb2YgRHlncmFwaC5zeW5jaHJvbml6ZSgpLiAnICtcbiAgICAgICAgICAgICdFeHBlY3RlZCB0d28gYXJndW1lbnRzOiBhcnJheSBhbmQgb3B0aW9uYWwgb3B0aW9ucyBhcmd1bWVudC4nO1xuICAgIH0gIC8vIG90aGVyd2lzZSBhcmd1bWVudHMubGVuZ3RoID09IDEsIHdoaWNoIGlzIGZpbmUuXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgJ0ludmFsaWQgaW52b2NhdGlvbiBvZiBEeWdyYXBoLnN5bmNocm9uaXplKCkuICcgK1xuICAgICAgICAgICdGaXJzdCBwYXJhbWV0ZXIgbXVzdCBiZSBlaXRoZXIgRHlncmFwaCBvciBsaXN0IG9mIER5Z3JhcGhzLic7XG4gIH1cblxuICBpZiAoZHlncmFwaHMubGVuZ3RoIDwgMikge1xuICAgIHRocm93ICdJbnZhbGlkIGludm9jYXRpb24gb2YgRHlncmFwaC5zeW5jaHJvbml6ZSgpLiAnICtcbiAgICAgICAgICAnTmVlZCB0d28gb3IgbW9yZSBkeWdyYXBocyB0byBzeW5jaHJvbml6ZS4nO1xuICB9XG5cbiAgdmFyIHJlYWR5Y291bnQgPSBkeWdyYXBocy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZHlncmFwaHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZyA9IGR5Z3JhcGhzW2ldO1xuICAgIGcucmVhZHkoIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tcmVhZHljb3VudCA9PSAwKSB7XG4gICAgICAgIC8vIHN0b3JlIG9yaWdpbmFsIGNhbGxiYWNrc1xuICAgICAgICB2YXIgY2FsbEJhY2tUeXBlcyA9IFsnZHJhd0NhbGxiYWNrJywgJ2hpZ2hsaWdodENhbGxiYWNrJywgJ3VuaGlnaGxpZ2h0Q2FsbGJhY2snXTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkeWdyYXBocy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmICghcHJldkNhbGxiYWNrc1tqXSkge1xuICAgICAgICAgICAgcHJldkNhbGxiYWNrc1tqXSA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKHZhciBrID0gY2FsbEJhY2tUeXBlcy5sZW5ndGggLSAxOyBrID49IDA7IGstLSkge1xuICAgICAgICAgICAgcHJldkNhbGxiYWNrc1tqXVtjYWxsQmFja1R5cGVzW2tdXSA9IGR5Z3JhcGhzW2pdLmdldEZ1bmN0aW9uT3B0aW9uKGNhbGxCYWNrVHlwZXNba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgZHJhdywgaGlnaGxpZ2h0LCB1bmhpZ2hsaWdodCBjYWxsYmFja3MuXG4gICAgICAgIGlmIChvcHRzLnpvb20pIHtcbiAgICAgICAgICBhdHRhY2hab29tSGFuZGxlcnMoZHlncmFwaHMsIG9wdHMsIHByZXZDYWxsYmFja3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdHMuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgYXR0YWNoU2VsZWN0aW9uSGFuZGxlcnMoZHlncmFwaHMsIHByZXZDYWxsYmFja3MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRldGFjaDogZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGR5Z3JhcGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBnID0gZHlncmFwaHNbaV07XG4gICAgICAgIGlmIChvcHRzLnpvb20pIHtcbiAgICAgICAgICBnLnVwZGF0ZU9wdGlvbnMoe2RyYXdDYWxsYmFjazogcHJldkNhbGxiYWNrc1tpXS5kcmF3Q2FsbGJhY2t9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5zZWxlY3Rpb24pIHtcbiAgICAgICAgICBnLnVwZGF0ZU9wdGlvbnMoe1xuICAgICAgICAgICAgaGlnaGxpZ2h0Q2FsbGJhY2s6IHByZXZDYWxsYmFja3NbaV0uaGlnaGxpZ2h0Q2FsbGJhY2ssXG4gICAgICAgICAgICB1bmhpZ2hsaWdodENhbGxiYWNrOiBwcmV2Q2FsbGJhY2tzW2ldLnVuaGlnaGxpZ2h0Q2FsbGJhY2tcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gcmVsZWFzZSByZWZlcmVuY2VzICYgbWFrZSBzdWJzZXF1ZW50IGNhbGxzIHRocm93LlxuICAgICAgZHlncmFwaHMgPSBudWxsO1xuICAgICAgb3B0cyA9IG51bGw7XG4gICAgICBwcmV2Q2FsbGJhY2tzID0gbnVsbDtcbiAgICB9XG4gIH07XG59O1xuXG5mdW5jdGlvbiBhcnJheXNBcmVFcXVhbChhLCBiKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShhKSB8fCAhQXJyYXkuaXNBcnJheShiKSkgcmV0dXJuIGZhbHNlO1xuICB2YXIgaSA9IGEubGVuZ3RoO1xuICBpZiAoaSAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgd2hpbGUgKGktLSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGF0dGFjaFpvb21IYW5kbGVycyhncywgc3luY09wdHMsIHByZXZDYWxsYmFja3MpIHtcbiAgdmFyIGJsb2NrID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZyA9IGdzW2ldO1xuICAgIGcudXBkYXRlT3B0aW9ucyh7XG4gICAgICBkcmF3Q2FsbGJhY2s6IGZ1bmN0aW9uKG1lLCBpbml0aWFsKSB7XG4gICAgICAgIGlmIChibG9jayB8fCBpbml0aWFsKSByZXR1cm47XG4gICAgICAgIGJsb2NrID0gdHJ1ZTtcbiAgICAgICAgdmFyIG9wdHMgPSB7XG4gICAgICAgICAgZGF0ZVdpbmRvdzogbWUueEF4aXNSYW5nZSgpXG4gICAgICAgIH07XG4gICAgICAgIGlmIChzeW5jT3B0cy5yYW5nZSkgb3B0cy52YWx1ZVJhbmdlID0gbWUueUF4aXNSYW5nZSgpO1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoZ3Nbal0gPT0gbWUpIHtcbiAgICAgICAgICAgIGlmIChwcmV2Q2FsbGJhY2tzW2pdICYmIHByZXZDYWxsYmFja3Nbal0uZHJhd0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHByZXZDYWxsYmFja3Nbal0uZHJhd0NhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBPbmx5IHJlZHJhdyBpZiB0aGVyZSBhcmUgbmV3IG9wdGlvbnNcbiAgICAgICAgICBpZiAoYXJyYXlzQXJlRXF1YWwob3B0cy5kYXRlV2luZG93LCBnc1tqXS5nZXRPcHRpb24oJ2RhdGVXaW5kb3cnKSkgJiZcbiAgICAgICAgICAgICAgYXJyYXlzQXJlRXF1YWwob3B0cy52YWx1ZVJhbmdlLCBnc1tqXS5nZXRPcHRpb24oJ3ZhbHVlUmFuZ2UnKSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdzW2pdLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgYmxvY2sgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9LCB0cnVlIC8qIG5vIG5lZWQgdG8gcmVkcmF3ICovKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRhY2hTZWxlY3Rpb25IYW5kbGVycyhncywgcHJldkNhbGxiYWNrcykge1xuICB2YXIgYmxvY2sgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBnID0gZ3NbaV07XG5cbiAgICBnLnVwZGF0ZU9wdGlvbnMoe1xuICAgICAgaGlnaGxpZ2h0Q2FsbGJhY2s6IGZ1bmN0aW9uKGV2ZW50LCB4LCBwb2ludHMsIHJvdywgc2VyaWVzTmFtZSkge1xuICAgICAgICBpZiAoYmxvY2spIHJldHVybjtcbiAgICAgICAgYmxvY2sgPSB0cnVlO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKG1lID09IGdzW2ldKSB7XG4gICAgICAgICAgICBpZiAocHJldkNhbGxiYWNrc1tpXSAmJiBwcmV2Q2FsbGJhY2tzW2ldLmhpZ2hsaWdodENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHByZXZDYWxsYmFja3NbaV0uaGlnaGxpZ2h0Q2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgaWR4ID0gZ3NbaV0uZ2V0Um93Rm9yWCh4KTtcbiAgICAgICAgICBpZiAoaWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBnc1tpXS5zZXRTZWxlY3Rpb24oaWR4LCBzZXJpZXNOYW1lLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBibG9jayA9IGZhbHNlO1xuICAgICAgfSxcbiAgICAgIHVuaGlnaGxpZ2h0Q2FsbGJhY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChibG9jaykgcmV0dXJuO1xuICAgICAgICBibG9jayA9IHRydWU7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAobWUgPT0gZ3NbaV0pIHtcbiAgICAgICAgICAgIGlmIChwcmV2Q2FsbGJhY2tzW2ldICYmIHByZXZDYWxsYmFja3NbaV0udW5oaWdobGlnaHRDYWxsYmFjaykge1xuICAgICAgICAgICAgICBwcmV2Q2FsbGJhY2tzW2ldLnVuaGlnaGxpZ2h0Q2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBnc1tpXS5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGJsb2NrID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSwgdHJ1ZSAvKiBubyBuZWVkIHRvIHJlZHJhdyAqLyk7XG4gIH1cbn1cblxuRHlncmFwaC5zeW5jaHJvbml6ZSA9IHN5bmNocm9uaXplO1xuXG59KSgpO1xuIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLFlBQVc7RUFDWjtFQUNBLFlBQVk7O0VBRVosSUFBSUEsT0FBTztFQUNYLElBQUlDLE1BQU0sQ0FBQ0QsT0FBTyxFQUFFO0lBQ2xCQSxPQUFPLEdBQUdDLE1BQU0sQ0FBQ0QsT0FBTztFQUMxQixDQUFDLE1BQU0sSUFBSSxPQUFPRSxNQUFPLEtBQUssV0FBVyxFQUFFO0lBQ3pDRixPQUFPLEdBQUdHLE9BQU8sQ0FBQyxZQUFZLENBQUM7RUFDakM7RUFFQSxJQUFJQyxXQUFXLEdBQUcsU0FBZEEsV0FBVyxFQUFZO0VBQUEsRUFBeUI7SUFDbEQsSUFBSUMsU0FBUyxDQUFDQyxNQUFNLEtBQUssQ0FBQyxFQUFFO01BQzFCLE1BQU0sa0VBQWtFO0lBQzFFO0lBRUEsSUFBSUMsT0FBTyxHQUFHLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7SUFDNUMsSUFBSUMsSUFBSSxHQUFHO01BQ1RDLFNBQVMsRUFBRSxJQUFJO01BQ2ZDLElBQUksRUFBRSxJQUFJO01BQ1ZDLEtBQUssRUFBRTtJQUNULENBQUM7SUFDRCxJQUFJQyxRQUFRLEdBQUcsRUFBRTtJQUNqQixJQUFJQyxhQUFhLEdBQUcsRUFBRTtJQUV0QixJQUFJQyxTQUFTLEdBQUcsU0FBWkEsU0FBUyxDQUFZQyxHQUFH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