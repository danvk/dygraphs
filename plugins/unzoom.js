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
   * Create a new instance.
   *
   * @constructor
   */
  var unzoom = function() {
    this.button_ = null;
    this.over_ = false;
  };  
    
  unzoom.prototype.toString = function() {
    return 'Unzoom Plugin'; 
  };

  unzoom.prototype.activate = function(g) {
    return {
      willDrawChart: this.willDrawChart
    };
  };

  unzoom.prototype.willDrawChart = function(e) {
    var g = e.dygraph;

    if (this.button_ != null) {
      if (g.isZoomed() && this.over_) {
        this.show(true); 
      }
      return;
    }

    this.button_ = document.createElement('button');
    this.button_.innerHTML = 'Unzoom';
    this.button_.style.display = 'none';
    this.button_.style.position = 'absolute';
    this.button_.style.top = '2px';
    this.button_.style.left = '59px';
    this.button_.style.zIndex = 1000;
    var parent = g.graphDiv;
    parent.insertBefore(this.button_, parent.firstChild);

    var self = this;
    this.button_.onclick = function() {
      // TODO(konigsberg): doUnzoom_ is private.
      g.doUnzoom_();
    }

    g.addEvent(parent, 'mouseover', function() {
      if (g.isZoomed()) {
        self.show(true);
      }
      self.over_ = true;
    });

    g.addEvent(parent, 'mouseout', function() {
      self.show(false);
      self.over_ = false;
    });
  };

  unzoom.prototype.show = function(enabled) {
    this.button_.style.display = enabled ? 'block' : 'none';
  };

  unzoom.prototype.destroy = function() {
    this.button_.parentElement.removeChild(this.button_);
  };

  return unzoom;

})();
