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
 * @fileoverview Test valueRange and dateWindow changes.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

import Dygraph from '../../src/dygraph';

import DygraphOps from './DygraphOps';
import {assertDeepCloseTo} from './custom_asserts';

var ZERO_TO_FIFTY = [[ 10, 0 ] , [ 20, 50 ]];
var ZERO_TO_FIFTY_STEPS = (function() {
  var a = [];
  var x = 10;
  var y = 0;
  var step = 0;
  for (step = 0; step <= 50; step++) {
    a.push([x + (step * .2), y + step]);
  }
  return a;
}());

var FIVE_TO_ONE_THOUSAND = [
    [ 1, 10 ], [ 2, 20 ], [ 3, 30 ], [ 4, 40 ] , [ 5, 50 ],
    [ 6, 60 ], [ 7, 70 ], [ 8, 80 ], [ 9, 90 ] , [ 10, 1000 ]];

describe("range-tests", function() {

cleanupAfterEach();

var createGraph = function(opts, data, expectRangeX, expectRangeY) {
  if (data === undefined) data = ZERO_TO_FIFTY_STEPS;
  if (expectRangeX === undefined) expectRangeX = [10, 20];
  if (expectRangeY === undefined) expectRangeY = [0, 55];
  if (!opts) opts = {};
  opts['labels'] = ['X', 'Y'];
  var g = new Dygraph('graph', data, opts);

  assertDeepCloseTo(expectRangeX, g.xAxisRange(), 0.01);
  assertDeepCloseTo(expectRangeY, g.yAxisRange(0), 0.01);

  return g;
};

/**
 * Test that changes to valueRange and dateWindow are reflected
 * appropriately.
 */
it('testRangeSetOperations', function() {
  var g = createGraph({valueRange : [ 0, 55 ]});

  g.updateOptions({ dateWindow : [ 12, 18 ] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([0, 55], g.yAxisRange(0));

  g.updateOptions({ valueRange : [ 10, 40 ] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 40], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, NaN] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 44.2], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, 40] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 40], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, null] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 44.2], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, 40] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 40], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, undefined] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 44.2], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, 40] });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 40], g.yAxisRange(0));

  g.updateOptions({  });
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([10, 40], g.yAxisRange(0));

  g.updateOptions({valueRange : null, axes: {y:{valueRange : [15, 20]}}});
  assert.deepEqual([12, 18], g.xAxisRange());
  assert.deepEqual([15, 20], g.yAxisRange(0));

  g.updateOptions({ dateWindow : null, valueRange : null, axes: null });
  assert.deepEqual([10, 20], g.xAxisRange());
  assert.deepEqual([0, 55], g.yAxisRange(0));
});

/**
 * Verify that when zoomed in by mouse operations, an empty call to
 * updateOptions doesn't change the displayed ranges.
 */
var zoom = function(g, xRange, yRange) {
  var originalXRange = g.xAxisRange();
  var originalYRange = g.yAxisRange(0);

  DygraphOps.dispatchMouseDown(g, xRange[0], yRange[0]);
  DygraphOps.dispatchMouseMove(g, xRange[1], yRange[0]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, xRange[1], yRange[0]);

  assertDeepCloseTo(xRange, g.xAxisRange(), 0.2);
  // assert.closeTo(originalYRange, g.yAxisRange(0), 0.2); // Not true, it's something in the middle.

  var midX = (xRange[1] - xRange[0]) / 2;
  DygraphOps.dispatchMouseDown(g, midX, yRange[0]);
  DygraphOps.dispatchMouseMove(g, midX, yRange[1]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, midX, yRange[1]);

  assertDeepCloseTo(xRange, g.xAxisRange(), 0.2);
  assertDeepCloseTo(yRange, g.yAxisRange(0), 0.2);
}


/**
 * Verify that when zoomed in by mouse operations, an empty call to
 * updateOptions doesn't change the displayed ranges.
 */
it('testEmptyUpdateOptions_doesntUnzoom', function() {
  var g = createGraph();
  zoom(g, [ 11, 18 ], [ 35, 40 ]);

  assertDeepCloseTo([11, 18], g.xAxisRange(), 0.1);
  assertDeepCloseTo([35, 40], g.yAxisRange(0), 0.2);

  g.updateOptions({});

  assertDeepCloseTo([11, 18], g.xAxisRange(), 0.1);
  assertDeepCloseTo([35, 40], g.yAxisRange(0), 0.2);
});

/**
 * Verify that when zoomed in by mouse operations, a call to
 * updateOptions({ dateWindow : null, valueRange : null }) fully
 * unzooms.
 */
it('testRestoreOriginalRanges_viaUpdateOptions', function() {
  var g = createGraph();
  zoom(g, [ 11, 18 ], [ 35, 40 ]);

  g.updateOptions({ dateWindow : null, valueRange : null });

  assert.deepEqual([0, 55], g.yAxisRange(0));
  assert.deepEqual([10, 20], g.xAxisRange());
});

/**
 * Verify that log scale axis range is properly specified.
 */
it('testLogScaleExcludesZero', function() {
  var g = new Dygraph("graph", FIVE_TO_ONE_THOUSAND, {
    logscale: true,
    labels: ['X', 'Y']
  });
  assert.deepEqual([10, 1099], g.yAxisRange(0));

  g.updateOptions({ logscale : false });
  assert.deepEqual([0, 1099], g.yAxisRange(0));
});

/**
 * Verify that includeZero range is properly specified.
 */
it('testIncludeZeroIncludesZero', function() {
  var g = new Dygraph("graph", [[0, 500], [500, 1000]], {
    includeZero: true,
    labels: ['X', 'Y']
  });
  assert.deepEqual([0, 1100], g.yAxisRange(0));

  g.updateOptions({ includeZero : false });
  assert.deepEqual([450, 1050], g.yAxisRange(0));
});


/**
 * Verify that includeZero range is properly specified per axis.
 */
it('testIncludeZeroPerAxis', function() {
  var g = new Dygraph("graph",
    'X,A,B\n'+
    '0,50,50\n'+
    '50,110,110\n',
    {
      drawPoints: true,
      pointSize:5,
      series:{
        A: {
          axis: 'y',
          pointSize: 10
        },
        B: {
          axis: 'y2'
        }
      },
      axes: {
        'y2': { includeZero: true }
      }
    });


  assert.deepEqual([44, 116], g.yAxisRange(0));
  assert.deepEqual([0, 121], g.yAxisRange(1));

  g.updateOptions({
    axes: {
      'y2': { includeZero: false }
    }
  });

  assert.deepEqual([44, 116], g.yAxisRange(1));
});

/**
 * Verify that very large Y ranges don't break things.
 */
it('testHugeRange', function() {
  var g = new Dygraph("graph", [[0, -1e120], [1, 1e230]], {
    includeZero: true,
    labels: ['X', 'Y']
  });
  assert.closeTo(1, -1e229 / g.yAxisRange(0)[0], 0.001);
  assert.closeTo(1, 1.1e230 / g.yAxisRange(0)[1], 0.001);
});

/**
 * Verify ranges with user-specified padding, implicit avoidMinZero.
 */
it('testPaddingAuto', function() {
  var g = createGraph({
      xRangePad: 42,
      yRangePad: 30
    }, ZERO_TO_FIFTY_STEPS, [9, 21], [-5, 55]);
});

/**
 * Verify auto range with drawAxesAtZero.
 */
it('testPaddingAutoAxisAtZero', function() {
  var g = createGraph({
      drawAxesAtZero: true,
    }, ZERO_TO_FIFTY_STEPS, [10, 20], [0, 55]);
});

/**
 * Verify user-specified range with padding and drawAxesAtZero options.
 * Try explicit range matching the auto range, should have identical results.
 */
it('testPaddingRange1', function() {
  var g = createGraph({
      valueRange: [0, 50],
      xRangePad: 42,
      yRangePad: 30,
      drawAxesAtZero: true
    }, ZERO_TO_FIFTY_STEPS, [9, 21], [-5, 55]);
});

/**
 * Verify user-specified range with padding and drawAxesAtZero options.
 * User-supplied range differs from the auto range.
 */
it('testPaddingRange2', function() {
  var g = createGraph({
      valueRange: [10, 60],
      xRangePad: 42,
      yRangePad: 30,
      drawAxesAtZero: true,
    }, ZERO_TO_FIFTY_STEPS, [9, 21], [5, 65]);
});

/**
 * Verify drawAxesAtZero and includeZero.
 */
it('testPaddingYAtZero', function() {
  var g = createGraph({
      includeZero: true,
      xRangePad: 42,
      yRangePad: 30,
      drawAxesAtZero: true,
    }, [
      [-10, 10],
      [10, 20],
      [30, 50]
    ], [-14, 34], [-5, 55]);
});

/**
 * Verify logscale, compat mode.
 */
it('testLogscaleCompat', function() {
  var g = createGraph({
      logscale: true
    },
    [[-10, 10], [10, 10], [30, 1000]],
    [-10, 30], [10, 1099]);
});

/**
 * Verify logscale, new mode.
 */
it('testLogscalePad', function() {
  var g = createGraph({
      logscale: true,
      yRangePad: 30
    },
    [[-10, 10], [10, 10], [30, 1000]],
    [-10, 30], [5.623, 1778.279]);
});

/**
 * Verify scrolling all-zero region, new-style.
 */
it('testZeroScroll2', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "X,Y\n" +
      "1,0\n" +
      "8,0\n" +
      "9,0.1\n",
      {
        animatedZooms: true,
        drawAxesAtZero: true,
        xRangePad: 4,
        yRangePad: 4
      });
});

});
