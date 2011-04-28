// Copyright (c)  2011 Google, Inc.
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
 * @fileoverview Utility functions for Dygraphs.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var DygraphOps = {};

DygraphOps.dispatchDoubleClick = function(g, func) {
  var evt = document.createEvent('MouseEvents');
  evt.initMouseEvent( 
      'dblclick', 
      true, true, document.defaultView,
      2, 0, 0, 0, 0,
      false, false, false, false, 0, null);
  if (func) {
    func(evt);
  }
  g.canvas_.dispatchEvent(evt);
};

DygraphOps.dispatchMouseDown = function(g, x, y, func) {
  var px = Dygraph.findPosX(g.canvas_);
  var py = Dygraph.findPosY(g.canvas_);

  var pageX = px + g.toDomXCoord(x);
  var pageY = py + g.toDomYCoord(y);

  var evt = document.createEvent('MouseEvents');
  evt.initMouseEvent( 
      'mousedown', 
      true, true, document.defaultView,
      1, pageX, pageY, pageX, pageY,
      false, false, false, false, 0, null);
  if (func) {
    func(evt);
  }
  g.canvas_.dispatchEvent(evt);
};

DygraphOps.dispatchMouseMove = function(g, x, y, func) {
  var px = Dygraph.findPosX(g.canvas_);
  var py = Dygraph.findPosY(g.canvas_);

  var pageX = px + g.toDomXCoord(x);
  var pageY = py + g.toDomYCoord(y);

  var evt = document.createEvent('MouseEvents');
  evt.initMouseEvent( 
      'mousemove', 
      true, true, document.defaultView,
      0, pageX, pageY, pageX, pageY,
      false, false, false, false, 0, null);
  if (func) {
    func(evt);
  }
  g.canvas_.dispatchEvent(evt);
};

DygraphOps.dispatchMouseUp = function(g, x, y, func) {
  var px = Dygraph.findPosX(g.canvas_);
  var py = Dygraph.findPosY(g.canvas_);

  var pageX = px + g.toDomXCoord(x);
  var pageY = py + g.toDomYCoord(y);

  var evt = document.createEvent('MouseEvents');
  evt.initMouseEvent( 
      'mouseup', 
      true, true, document.defaultView,
      0, pageX, pageY, pageX, pageY,
      false, false, false, false, 0, null);
  if (func) {
    func(evt);
  }
  g.canvas_.dispatchEvent(evt);
};
