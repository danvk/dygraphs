// Copyright (c) 2011 Google, Inc.
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
 * @fileoverview Test cases for drawing simple lines.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var ZERO_TO_FIFTY = [[ 10, 0 ] , [ 20, 50 ]];

var SimpleDrawingTestCase = TestCase("simple-drawing");

var _origFunc = Dygraph.getContext;
SimpleDrawingTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(_origFunc(canvas));
  }
};

SimpleDrawingTestCase.prototype.tearDown = function() {
  Dygraph.getContext = _origFunc;
};

SimpleDrawingTestCase.prototype.testDrawSimpleRangePlusOne = function() {
  var opts = {
    drawXGrid: false,
    drawYGrid: false,
    drawXAxis: false,
    drawYAxis: false,
    valueRange: [0,51] }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY, opts);
  var htx = g.hidden_ctx_;

  CanvasAssertions.assertLineDrawn(htx, [0,320], [475,6.2745], {
    strokeStyle: "#008080",
    lineWidth: 1
  });
  CanvasAssertions.assertBalancedSaveRestore(htx);
};

SimpleDrawingTestCase.prototype.testDrawWithAxis = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY);

  var htx = g.hidden_ctx_;
  CanvasAssertions.assertBalancedSaveRestore(htx);
};

/**
 * Tests that it is drawing dashes, and it remember the dash history between
 * points.
 */
SimpleDrawingTestCase.prototype.testDrawSimpleDash = function() {
  var opts = {
      drawXGrid: false,
      drawYGrid: false,
      drawXAxis: false,
      drawYAxis: false,
      'Y1': {strokePattern: [25, 7, 7, 7]},
      colors: ['#ff0000']
  };

  var graph = document.getElementById("graph");
  // Set the dims so we pass if default changes.
  graph.style.width='480px';
  graph.style.height='320px';
  var g = new Dygraph(graph, [[1, 4], [2, 5], [3, 3], [4, 7], [5, 9]], opts);
  htx = g.hidden_ctx_;

  // TODO(danvk): figure out a good way to restore this test.
  // assertEquals(29, CanvasAssertions.numLinesDrawn(htx, "#ff0000"));
  CanvasAssertions.assertBalancedSaveRestore(htx);
};
