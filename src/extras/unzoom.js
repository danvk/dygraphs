// Copyright (c) 2013 Google, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* loader wrapper to allow browser use and ES6 imports */
(function _extras_unzoom_wrapper() {
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

/**
 * @fileoverview Plug-in for providing unzoom-on-hover.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
Dygraph.Plugins.Unzoom = (function _extras_unzoom_closure() {

  "use strict";

  /**
   * Create a new instance.
   *
   * @constructor
   */
  var unzoom = function unzoom() {
    this.button_ = null;

    // True when the mouse is over the canvas. Must be tracked
    // because the unzoom button state can change even when the
    // mouse-over state hasn't.
    this.over_ = false;
  };

  unzoom.prototype.toString = function toString() {
    return 'Unzoom Plugin';
  };

  unzoom.prototype.activate = function activate(g) {
    return {
      willDrawChart: this.willDrawChart
    };
  };

  unzoom.prototype.willDrawChart = function willDrawChart(e) {
    var g = e.dygraph;

    if (this.button_ !== null) {
      // short-circuit: show the button only when we're moused over, and zoomed in.
      var showButton = g.isZoomed() && this.over_;
      this.show(showButton);
      return;
    }

    this.button_ = document.createElement('button');
    this.button_.innerHTML = 'Reset Zoom';
    this.button_.style.display = 'none';
    this.button_.style.position = 'absolute';
    var area = g.plotter_.area;
    this.button_.style.top = (area.y + 4) + 'px';
    this.button_.style.left = (area.x + 4) + 'px';
    this.button_.style.zIndex = 11;
    var parent = g.graphDiv;
    parent.insertBefore(this.button_, parent.firstChild);

    var self = this;
    this.button_.onclick = function onclick() {
      g.resetZoom();
    };

    g.addAndTrackEvent(parent, 'mouseover', function mouseover() {
      if (g.isZoomed()) {
        self.show(true);
      }
      self.over_ = true;
    });

    g.addAndTrackEvent(parent, 'mouseout', function mouseout() {
      self.show(false);
      self.over_ = false;
    });
  };

  unzoom.prototype.show = function show(enabled) {
    this.button_.style.display = enabled ? '' : 'none';
  };

  unzoom.prototype.destroy = function destroy() {
    this.button_.parentElement.removeChild(this.button_);
  };

  return unzoom;

})();

/* loader wrapper */
Dygraph._require.add('dygraphs/src/extras/unzoom.js', /* exports */ {});
})();
