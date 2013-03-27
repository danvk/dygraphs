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

MissingPointsTestCase._origFunc = Dygraph.getContext;
MissingPointsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(MissingPointsTestCase._origFunc(canvas));
  }
};

MissingPointsTestCase.prototype.tearDown = function() {
  Dygraph.getContext = MissingPointsTestCase._origFunc;
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

  assertEquals(3, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx, 
      [[56, 275], [161, 212], [370, 87], [475, 25]],
      { strokeStyle: '#0000ff' });
}

/**
 * At the time of writing this test, the blue series is only points, and not lines.
 */
MissingPointsTestCase.prototype.testConnectSeparatedPoints = function() {
  var g = new Dygraph(
    document.getElementById("graph"),
    [
      [1, null, 3],
      [2, 2, null],
      [3, null, 7],
      [4, 5, null],
      [5, null, 5],
      [6, 3, null]
    ],
    {
      connectSeparatedPoints: true,
      drawPoints: true,
      colors: ['red', 'blue']
    }
  );

  var htx = g.hidden_ctx_;

  assertEquals(2, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx, 
      [[56, 225], [223, 25], [391, 125]],
      { strokeStyle: '#0000ff' });

  assertEquals(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx, 
      [[140, 275], [307, 125], [475, 225]],
      { strokeStyle: '#ff0000' });
}

/**
 * At the time of writing this test, the blue series is only points, and not lines.
 */
MissingPointsTestCase.prototype.testConnectSeparatedPointsWithNan = function() {
  var g = new Dygraph(
    document.getElementById("graph"),
    "x,A,B  \n" +
    "1,,3   \n" +
    "2,2,   \n" +
    "3,,5   \n" +
    "4,4,   \n" +
    "5,,7   \n" +
    "6,NaN, \n" +
    "8,8,   \n" +
    "10,10, \n",
    {
      connectSeparatedPoints: true,
      drawPoints: true,
      colors: ['red', 'blue']
    }
  );

  var htx = g.hidden_ctx_;

  // Red has two disconnected line segments
  assertEquals(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  CanvasAssertions.assertLineDrawn(htx, [102, 275], [195, 212], { strokeStyle: '#ff0000' });
  CanvasAssertions.assertLineDrawn(htx, [381, 87], [475, 25], { strokeStyle: '#ff0000' });

  // Blue's lines are consecutive, however.
  assertEquals(2, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx, 
      [[56, 244], [149, 181], [242, 118]],
      { strokeStyle: '#0000ff' });
}

/* These lines contain awesome powa!  
  var lines = CanvasAssertions.getLinesDrawn(htx, {strokeStyle: "#0000ff"});
  for (var idx = 0; idx < lines.length; idx++) {
    var line = lines[idx];
    console.log(line[0].args, line[1].args, line[0].properties.strokeStyle);
  }
*/
