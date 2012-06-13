// Copyright (c) 2012 Google, Inc.
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
 * @fileoverview Test cases for drawing lines with missing points.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var ZERO_TO_FIFTY = [[ 10, 0 ] , [ 20, 50 ]];

var MissingPointsTestCase = TestCase("missing-points");

var _origFunc = Dygraph.getContext;
MissingPointsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(_origFunc(canvas));
  }
};

MissingPointsTestCase.prototype.tearDown = function() {
  Dygraph.getContext = _origFunc;
};

MissingPointsTestCase.prototype.testSeparatedPointsDontDraw = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(
      graph,
      [[1, 10, 11],
       [2, 11, null],
       [3, 12, 13]],
      { colors: ['red', 'blue']});
  var htx = g.hidden_ctx_;
  assertEquals(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  assertEquals(0, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
}

MissingPointsTestCase.prototype.testSeparatedPointsDontDraw_expanded = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(
      graph,
      [[0, 10],
       [1, 11],
       [2, null],
       [3, 13],
       [4, 14]],
      { colors: ['blue']});
  var htx = g.hidden_ctx_;
  /*
  var num_lines = 0;
  var lines = CanvasAssertions.getLinesDrawn(htx);
  for (var idx = 0; idx < lines.length; idx++) {
    var line = lines[idx];
    var color = line[1].properties.strokeStyle;
    if (color === "#ff0000" || color === "#0000ff") {
      console.log(line[0].args, line[1].args, color);
    }
  }
  */

  assertEquals(2, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertLineDrawn(htx, [56, 275], [161, 212],
      { strokeStyle: '#0000ff', });
  CanvasAssertions.assertLineDrawn(htx, [370, 87], [475, 25],
      { strokeStyle: '#0000ff', });
}

MissingPointsTestCase.prototype.testSeparatedPointsDontDraw_expanded_connected = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(
      graph,
      [[0, 10],
       [1, 11],
       [2, null],
       [3, 13],
       [4, 14]],
      { colors: ['blue'], connectSeparatedPoints: true});
  var htx = g.hidden_ctx_;
  var num_lines = 0;
  var lines = CanvasAssertions.getLinesDrawn(htx);
  for (var idx = 0; idx < lines.length; idx++) {
    var line = lines[idx];
    var color = line[1].properties.strokeStyle;
    if (color === "#ff0000" || color === "#0000ff") {
      console.log(line[0].args, line[1].args, color);
    }
  }

  assertEquals(3, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertLineDrawn(htx, [56, 275], [161, 212],
      { strokeStyle: '#0000ff', });
  CanvasAssertions.assertLineDrawn(htx, [161, 212], [370, 87],
      { strokeStyle: '#0000ff', });
  CanvasAssertions.assertLineDrawn(htx, [370, 87], [475, 25],
      { strokeStyle: '#0000ff', });
}
