/** 
 * @fileoverview Test cases for toDomCoords/toDataCoords
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';

import Proxy from './Proxy';
import CanvasAssertions from './CanvasAssertions';
import {assertDeepCloseTo} from './custom_asserts';

describe("to-dom-coords", function() {

cleanupAfterEach();
Dygraph.setGetContext(function(canvas) {
  return new Proxy(canvas.getContext("2d"));
});

// Checks that toDomCoords and toDataCoords are inverses of one another.
var checkForInverses = function(g) {
  var x_range = g.xAxisRange();
  var y_range = g.yAxisRange();
  for (var i = 0; i <= 10; i++) {
    var x = x_range[0] + i / 10.0 * (x_range[1] - x_range[0]);
    for (var j = 0; j <= 10; j++) {
      var y = y_range[0] + j / 10.0 * (y_range[1] - y_range[0]);
      assert.equal(x, g.toDataXCoord(g.toDomXCoord(x)));
      assert.equal(y, g.toDataYCoord(g.toDomYCoord(y)));
    }
  }
};

it('testPlainChart', function() {
  var opts = {
    axes: {
      x: {
        drawAxis : false,
        drawGrid : false
      },
      y: {
        drawAxis : false,
        drawGrid : false
      }
    },
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 400,
    height: 400,
    colors: ['#ff0000'],
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assert.deepEqual([0, 100], g.toDataCoords(0, 0));
  assert.deepEqual([0, 0], g.toDataCoords(0, 400));
  assert.deepEqual([100, 100], g.toDataCoords(400, 0));
  assert.deepEqual([100, 0], g.toDataCoords(400, 400));

  checkForInverses(g);

  // TODO(konigsberg): This doesn't really belong here. Move to its own test.
  var htx = g.hidden_ctx_;
  assert.equal(1, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
});

it('testChartWithAxes', function() {
  var opts = {
    axes: {
      x: {
        drawGrid: false,
        drawAxis: true,
      },
      y: {
        drawGrid: false,
        drawAxis: true,
        axisLabelWidth: 100
      }
    },
    xAxisHeight: 50,
    axisTickSize: 0,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 450,
    colors: ['#ff0000'],
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assert.deepEqual([0, 100], g.toDataCoords(100, 0));
  assert.deepEqual([0, 0], g.toDataCoords(100, 400));
  assert.deepEqual([100, 100], g.toDataCoords(500, 0));
  assert.deepEqual([100, 0], g.toDataCoords(500, 400));

  checkForInverses(g);
});

it('testChartWithAxesAndLabels', function() {
  var opts = {
    axes: {
      x: {
        drawGrid: false,
        drawAxis: true,
      },
      y: {
        drawGrid: false,
        drawAxis: true,
        axisLabelWidth: 100
      },
    },
    xAxisHeight: 50,
    axisTickSize: 0,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 500,
    colors: ['#ff0000'],
    ylabel: 'This is the y-axis',
    xlabel: 'This is the x-axis',
    xLabelHeight: 25,
    title: 'This is the title of the chart',
    titleHeight: 25,
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assert.deepEqual([0, 100], g.toDataCoords(100, 25));
  assert.deepEqual([0, 0], g.toDataCoords(100, 425));
  assert.deepEqual([100, 100], g.toDataCoords(500, 25));
  assert.deepEqual([100, 0], g.toDataCoords(500, 425));

  checkForInverses(g);
});

it('testYAxisLabelWidth', function() {
  var opts = {
    axes: { y: { axisLabelWidth: 100 } },
    axisTickSize: 0,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 500,
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assert.deepEqual([100, 0], g.toDomCoords(0, 100));
  assert.deepEqual([500, 486], g.toDomCoords(100, 0));

  g.updateOptions({     
    axes: { y: { axisLabelWidth: 50 }},
  });
  assert.deepEqual([50, 0], g.toDomCoords(0, 100));
  assert.deepEqual([500, 486], g.toDomCoords(100, 0));
});

it('testAxisTickSize', function() {
  var opts = {
    axes: { y: { axisLabelWidth: 100 } },
    axisTickSize: 0,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 500,
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assert.deepEqual([100, 0], g.toDomCoords(0, 100));
  assert.deepEqual([500, 486], g.toDomCoords(100, 0));

  g.updateOptions({ axisTickSize : 50 });
  assert.deepEqual([200, 0], g.toDomCoords(0, 100));
  assert.deepEqual([500, 386], g.toDomCoords(100, 0));
});

it('testChartLogarithmic_YAxis', function() {
  var opts = {
    rightGap: 0,
    valueRange: [1, 4],
    dateWindow: [0, 10],
    width: 400,
    height: 400,
    colors: ['#ff0000'],
    axes: {
      x: {
        drawGrid: false,
        drawAxis: false
      },
      y: {
        drawGrid: false,
        drawAxis: false,
        logscale: true
      }
    },
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [1,1], [4,4] ], opts);

  var epsilon = 1e-8;
  assertDeepCloseTo([0, 4], g.toDataCoords(0, 0), epsilon);
  assertDeepCloseTo([0, 1], g.toDataCoords(0, 400), epsilon);
  assertDeepCloseTo([10, 4], g.toDataCoords(400, 0), epsilon);
  assertDeepCloseTo([10, 1], g.toDataCoords(400, 400), epsilon);
  assertDeepCloseTo([10, 2], g.toDataCoords(400, 200), epsilon);
  
  assert.deepEqual([0, 0], g.toDomCoords(0, 4));
  assert.deepEqual([0, 400], g.toDomCoords(0, 1));
  assert.deepEqual([400, 0], g.toDomCoords(10, 4));
  assert.deepEqual([400, 400], g.toDomCoords(10, 1));
  assert.deepEqual([400, 200], g.toDomCoords(10, 2));

  // Verify that the margins are adjusted appropriately for yRangePad.
  g.updateOptions({yRangePad: 40});
  assertDeepCloseTo([0, 4], g.toDataCoords(0, 40), epsilon);
  assertDeepCloseTo([0, 1], g.toDataCoords(0, 360), epsilon);
  assertDeepCloseTo([10, 4], g.toDataCoords(400, 40), epsilon);
  assertDeepCloseTo([10, 1], g.toDataCoords(400, 360), epsilon);
  assertDeepCloseTo([10, 2], g.toDataCoords(400, 200), epsilon);

  assertDeepCloseTo([0, 40], g.toDomCoords(0, 4), epsilon);
  assertDeepCloseTo([0, 360], g.toDomCoords(0, 1), epsilon);
  assertDeepCloseTo([400, 40], g.toDomCoords(10, 4), epsilon);
  assertDeepCloseTo([400, 360], g.toDomCoords(10, 1), epsilon);
  assertDeepCloseTo([400, 200], g.toDomCoords(10, 2), epsilon);
});

it('testChartLogarithmic_XAxis', function() {
  var opts = {
    rightGap: 0,
    valueRange: [1, 1000],
    dateWindow: [1, 1000],
    width: 400,
    height: 400,
    colors: ['#ff0000'],
    axes: {
      x: {
        drawGrid: false,
        drawAxis: false,
        logscale: true
      },
      y: {
        drawGrid: false,
        drawAxis: false
      }
    },
    labels: ['X', 'Y']
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, [ [1,1], [10, 10], [100,100], [1000,1000] ], opts);

  var epsilon = 1e-8;
  assert.closeTo(1, g.toDataXCoord(0), epsilon);
  assert.closeTo(5.623413251903489, g.toDataXCoord(100), epsilon);
  assert.closeTo(31.62277660168378, g.toDataXCoord(200), epsilon);
  assert.closeTo(177.8279410038921, g.toDataXCoord(300), epsilon);
  assert.closeTo(1000, g.toDataXCoord(400), epsilon);

  assert.closeTo(0, g.toDomXCoord(1), epsilon);
  assert.closeTo(3.6036036036036037, g.toDomXCoord(10), epsilon);
  assert.closeTo(39.63963963963964, g.toDomXCoord(100), epsilon);
  assert.closeTo(400, g.toDomXCoord(1000), epsilon);

  assert.closeTo(0, g.toPercentXCoord(1), epsilon);
  assert.closeTo(0.3333333333, g.toPercentXCoord(10), epsilon);
  assert.closeTo(0.6666666666, g.toPercentXCoord(100), epsilon);
  assert.closeTo(1, g.toPercentXCoord(1000), epsilon);
 
  // Now zoom in and ensure that the methods return reasonable values.
  g.updateOptions({dateWindow: [ 10, 100 ]});

  assert.closeTo(10, g.toDataXCoord(0), epsilon);
  assert.closeTo(17.78279410038923, g.toDataXCoord(100), epsilon);
  assert.closeTo(31.62277660168379, g.toDataXCoord(200), epsilon);
  assert.closeTo(56.23413251903491, g.toDataXCoord(300), epsilon);
  assert.closeTo(100, g.toDataXCoord(400), epsilon);

  assert.closeTo(-40, g.toDomXCoord(1), epsilon);
  assert.closeTo(0, g.toDomXCoord(10), epsilon);
  assert.closeTo(400, g.toDomXCoord(100), epsilon);
  assert.closeTo(4400, g.toDomXCoord(1000), epsilon);

  assert.closeTo(-1, g.toPercentXCoord(1), epsilon);
  assert.closeTo(0, g.toPercentXCoord(10), epsilon);
  assert.closeTo(1, g.toPercentXCoord(100), epsilon);
  assert.closeTo(2, g.toPercentXCoord(1000), epsilon);
});

});
