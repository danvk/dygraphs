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


/** 
 * @fileoverview Plug-in for providing unzoom-on-hover.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
Dygraph.Plugins.Unzoom = (function() {
  
  "use strict";
  
  /**
   * Draws the unzoom box.
   *
   * @constructor
   */
  var unzoom = function() {
  };  
    
  unzoom.prototype.toString = function() {
    return "Unzoom Plugin"; 
  };

  unzoom.prototype.activate = function(g) {
    return {
      willDrawChart: this.willDrawChart
    };
  };

  unzoom.prototype.willDrawChart = function(e) {
    var g = e.dygraph;
    // API note:
    // Consider adding a context parameter to activate and willDrawChart
    // that can be used for storage so I don't have to do things like
    // use up g.unzoomButton_.
    if (g.hasOwnProperty("unzoomButton_")) {
      return;
    }

    var elem = document.createElement("button");
    elem.innerHTML = "Unzoom";
    elem.style.display="none";
    elem.style.position="absolute";
    elem.style.top = '2px';
    elem.style.left = '59px';
    elem.style.zIndex = 1000;
    var parent = g.graphDiv;
    parent.insertBefore(elem, parent.firstChild);
    elem.onclick = function() {
      // TODO(konigsberg): doUnzoom_ is private.
      g.doUnzoom_();
    }
    g.unzoomButton_ = elem;
    Dygraph.addEvent(parent, "mouseover", function() {
      g.unzoomButton_.style.display="block";
    });

    // TODO(konigsberg): Don't show unless the graph is zoomed.
    Dygraph.addEvent(parent, "mouseout", function() {
      g.unzoomButton_.style.display="none";
    });
  };

  unzoom.prototype.destroy = function() {
    delete g.unzoomButton_;
    // TODO(konigsberg): Remove events installed above.
  };

  return unzoom;

})();
