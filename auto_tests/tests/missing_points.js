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

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
import Proxy from './Proxy';
import CanvasAssertions from './CanvasAssertions';
import Util from './Util';

var ZERO_TO_FIFTY = [[ 10, 0 ] , [ 20, 50 ]];

describe("missing-points", function() {

cleanupAfterEach();
useProxyCanvas(utils, Proxy);

it('testSeparatedPointsDontDraw', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(
      graph,
      [[1, 10, 11],
       [2, 11, null],
       [3, 12, 13]],
      {
        colors: ['red', 'blue'],
        labels: ['X', 'Y1', 'Y2']
      });
  var htx = g.hidden_ctx_;
  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  assert.equal(0, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
});

it('testSeparatedPointsDontDraw_expanded', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(
      graph,
      [[0, 10],
       [1, 11],
       [2, null],
       [3, 13],
       [4, 14]],
      { colors: ['blue'], labels: ['X', 'Y']});
  var htx = g.hidden_ctx_;

  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertLineDrawn(htx, [56, 275], [161, 212],
      { strokeStyle: '#0000ff', });
  CanvasAssertions.assertLineDrawn(htx, [370, 87], [475, 25],
      { strokeStyle: '#0000ff', });
});

it('testSeparatedPointsDontDraw_expanded_connected', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(
      graph,
      [[0, 10],
       [1, 11],
       [2, null],
       [3, 13],
       [4, 14]],
      {
        colors: ['blue'],
        connectSeparatedPoints: true,
        labels: ['X', 'Y']
      });
  var htx = g.hidden_ctx_;
  var num_lines = 0;

  assert.equal(3, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [[56, 275], [161, 212], [370, 87], [475, 25]],
      { strokeStyle: '#0000ff' });
});

/**
 * At the time of writing this test, the blue series is only points, and not lines.
 */
it('testConnectSeparatedPoints', function() {
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
      colors: ['red', 'blue'],
      labels: ['X', 'Y1', 'Y2']
    }
  );

  var htx = g.hidden_ctx_;

  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [[56, 225], [223, 25], [391, 125]],
      { strokeStyle: '#0000ff' });

  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [[140, 275], [307, 125], [475, 225]],
      { strokeStyle: '#ff0000' });
});

/**
 * At the time of writing this test, the blue series is only points, and not lines.
 */
it('testConnectSeparatedPointsWithNan', function() {
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
  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  CanvasAssertions.assertLineDrawn(htx, [102, 275], [195, 212], { strokeStyle: '#ff0000' });
  CanvasAssertions.assertLineDrawn(htx, [381, 87], [475, 25], { strokeStyle: '#ff0000' });

  // Blue's lines are consecutive, however.
  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [[56, 244], [149, 181], [242, 118]],
      { strokeStyle: '#0000ff' });
});

/* These lines contain awesome powa!
  var lines = CanvasAssertions.getLinesDrawn(htx, {strokeStyle: "#0000ff"});
  for (var idx = 0; idx < lines.length; idx++) {
    var line = lines[idx];
    console.log(line[0].args, line[1].args, line[0].properties.strokeStyle);
  }
*/

it('testErrorBarsWithMissingPoints', function() {
  var data = [
              [1, [2,1]],
              [2, [3,1]],
              [3, null],
              [4, [5,1]],
              [5, [4,1]],
              [6, [null,null]],
             ];
  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      errorBars: true,
      colors: ['red'],
      labels: ['X', 'Y']
    }
  );

  var htx = g.hidden_ctx_;

  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));

  var p0 = g.toDomCoords(data[0][0], data[0][1][0]);
  var p1 = g.toDomCoords(data[1][0], data[1][1][0]);
  var p2 = g.toDomCoords(data[3][0], data[3][1][0]);
  var p3 = g.toDomCoords(data[4][0], data[4][1][0]);
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [p0, p1], { strokeStyle: '#ff0000' });
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [p2, p3], { strokeStyle: '#ff0000' });
});

it('testErrorBarsWithMissingPointsConnected', function() {
  var data = [
              [1, [null,1]],
              [2, [2,1]],
              [3, null],
              [4, [5,1]],
              [5, [null,null]],
              [6, [3,1]]
             ];
  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      connectSeparatedPoints: true,
      drawPoints: true,
      errorBars: true,
      colors: ['red'],
      labels: ['X', 'Y']
    }
  );

  var htx = g.hidden_ctx_;

  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));

  var p1 = g.toDomCoords(data[1][0], data[1][1][0]);
  var p2 = g.toDomCoords(data[3][0], data[3][1][0]);
  var p3 = g.toDomCoords(data[5][0], data[5][1][0]);
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [p1, p2, p3],
      { strokeStyle: '#ff0000' });
});
it('testCustomBarsWithMissingPoints', function() {
  var data = [
              [1, [1,2,3]],
              [2, [2,3,4]],
              [3, null],
              [4, [4,5,6]],
              [5, [3,4,5]],
              [6, [null,null,null]],
              [7, [2,3,4]],
              [8, [1,2,3]],
              [9, NaN],
              [10, [2,3,4]],
              [11, [3,4,5]],
              [12, [NaN,NaN,NaN]]
             ];
  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      customBars: true,
      colors: ['red'],
      labels: ['X', 'Y']
    }
  );

  var htx = g.hidden_ctx_;

  assert.equal(4, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));

  var p0 = g.toDomCoords(data[0][0], data[0][1][1]);
  var p1 = g.toDomCoords(data[1][0], data[1][1][1]);
  CanvasAssertions.assertLineDrawn(htx, p0, p1, { strokeStyle: '#ff0000' });

  p0 = g.toDomCoords(data[3][0], data[3][1][1]);
  p1 = g.toDomCoords(data[4][0], data[4][1][1]);
  CanvasAssertions.assertLineDrawn(htx, p0, p1, { strokeStyle: '#ff0000' });

  p0 = g.toDomCoords(data[6][0], data[6][1][1]);
  p1 = g.toDomCoords(data[7][0], data[7][1][1]);
  CanvasAssertions.assertLineDrawn(htx, p0, p1, { strokeStyle: '#ff0000' });;

  p0 = g.toDomCoords(data[9][0], data[9][1][1]);
  p1 = g.toDomCoords(data[10][0], data[10][1][1]);
  CanvasAssertions.assertLineDrawn(htx, p0, p1, { strokeStyle: '#ff0000' });
});

it('testCustomBarsWithMissingPointsConnected', function() {
  var data = [
              [1, [1,null,1]],
              [2, [1,2,3]],
              [3, null],
              [4, [4,5,6]],
              [5, [null,null,null]],
              [6, [2,3,4]]
             ];
  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      connectSeparatedPoints: true,
      drawPoints: true,
      customBars: true,
      colors: ['red'],
      labels: ['X', 'Y']
    }
  );

  var htx = g.hidden_ctx_;

  assert.equal(2, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));

  var p1 = g.toDomCoords(data[1][0], data[1][1][1]);
  var p2 = g.toDomCoords(data[3][0], data[3][1][1]);
  var p3 = g.toDomCoords(data[5][0], data[5][1][1]);
  CanvasAssertions.assertConsecutiveLinesDrawn(htx,
      [p1, p2, p3],
      { strokeStyle: '#ff0000' });
});

it('testLeftBoundaryWithMisingPoints', function() {
  var data = [
              [1, null, 3],
              [2, 1, null],
              [3, 0, 5],
              [4, 2, 1],
              [5, 4, null],
              [6, 3, 2]
             ];
  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      connectSeparatedPoints: true,
      drawPoints: true,
      colors: ['red','blue'],
      labels: ['X', 'Y1', 'Y2']
    }
  );
  g.updateOptions({ dateWindow : [ 2.5, 4.5 ] });
  assert.equal(1, g.getLeftBoundary_(0));
  assert.equal(0, g.getLeftBoundary_(1));

  var domX = g.toDomXCoord(1.9);
  var closestRow = g.findClosestRow(domX);
  assert.equal(1, closestRow);

  g.setSelection(closestRow);
  assert.equal(1, g.selPoints_.length);
  assert.equal(1, g.selPoints_[0].yval);

  g.setSelection(3);
  assert.equal(2, g.selPoints_.length);
  assert.equal(g.selPoints_[0].xval, g.selPoints_[1].xval);
  assert.equal(2, g.selPoints_[0].yval);
  assert.equal(1, g.selPoints_[1].yval);
});

// Regression test for issue #411
it('testEmptySeries', function() {
  var graphDiv = document.getElementById("graph");
  var g = new Dygraph(
       graphDiv,
       "Time,Empty Series,Series 1,Series 2\n" +
       "1381134460,,0,100\n" +
       "1381134461,,1,99\n" +
       "1381134462,,2,98\n" +
       "1381134463,,3,97\n" +
       "1381134464,,4,96\n" +
       "1381134465,,5,95\n" +
       "1381134466,,6,94\n" +
       "1381134467,,7,93\n" +
       "1381134468,,8,92\n" +
       "1381134469,,9,91\n", {
           visibility: [true, false, true],
           dateWindow: [1381134465, 1381134467]
       });

  g.setSelection(6);
  assert.equal("1381134466: Series 2: 94", Util.getLegend(graphDiv));
});

// Regression test for issue #485
it('testMissingFill', function() {
  var graphDiv = document.getElementById("graph");
  var N = null;
  var g = new Dygraph(
      graphDiv,
      [
        [1, [8, 10, 12]],
        [2, [3, 5,7]   ],
        [3,     N,     ],
        [4, [9, N, 2]  ],  // Note: nulls in arrays are not technically valid.
        [5, [N, 2, N]  ],  // see dygraphs.com/data.html.
        [6, [2, 3, 6]  ]
      ],
      {
        customBars: true,
        connectSeparatedPoints: false,
        labels: [ "X", "Series1"]
      }
  );

  // Make sure there are no 'NaN' line segments.
  var htx = g.hidden_ctx_;
  for (var i = 0; i < htx.calls__.length; i++) {
    var call = htx.calls__[i];
    if ((call.name == 'moveTo' || call.name == 'lineTo') && call.args) {
      for (var j = 0; j < call.args.length; j++) {
        assert.isFalse(isNaN(call.args[j]));
      }
    }
  }
});

});
