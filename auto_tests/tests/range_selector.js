// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Regression tests for range selector.
 * @author paul.eric.felix@gmail.com (Paul Felix)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
import RangeSelectorPlugin from '../../src/plugins/range-selector';

import Util from './Util';
import DygraphOps from './DygraphOps';
import CanvasAssertions from './CanvasAssertions';
import Proxy from './Proxy';

describe("range-selector", function() {

cleanupAfterEach();

var restoreConsole;
var logs = {};
beforeEach(function() {
  restoreConsole = Util.captureConsole(logs);
});

afterEach(function() {
  restoreConsole();
});

it('testRangeSelector', function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
});

it('testRangeSelectorWithErrorBars', function() {
  var opts = {
    width: 480,
    height: 320,
    errorBars: true,
    showRangeSelector: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, [10, 10]],
               [2, [15, 10]],
               [3, [10, 10]],
               [4, [15, 10]],
               [5, [10, 10]],
               [6, [15, 20]],
               [7, [10, 20]],
               [8, [15, 20]],
               [9, [10, 20]]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
});

it('testRangeSelectorWithCustomBars', function() {
  var opts = {
    width: 480,
    height: 320,
    customBars: true,
    showRangeSelector: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, [10,  10, 100]],
               [2, [15,  20, 110]],
               [3, [10,  30, 100]],
               [4, [15,  40, 110]],
               [5, [10, 120, 100]],
               [6, [15,  50, 110]],
               [7, [10,  70, 100]],
               [8, [15,  90, 110]],
               [9, [10,  50, 100]]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
});

it('testRangeSelectorWithLogScale', function() {
  var opts = {
    width: 480,
    height: 320,
    logscale: true,
    showRangeSelector: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
});

it('testRangeSelectorOptions', function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    rangeSelectorHeight: 30,
    rangeSelectorPlotFillColor: 'lightyellow',
    rangeSelectorPlotFillGradientColor: 'rgba(200, 200, 42, 10)',
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
});

it('testAdditionalRangeSelectorOptions', function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    rangeSelectorHeight: 30,
    rangeSelectorBackgroundStrokeColor: 'blue',
    rangeSelectorBackgroundLineWidth: 3,
    rangeSelectorPlotLineWidth: 0.5,
    rangeSelectorForegroundStrokeColor: 'red',
    rangeSelectorForegroundLineWidth: 2,
    rangeSelectorAlpha: 0.8,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
});

it('testRangeSelectorEnablingAfterCreation', function() {
  var opts = {
    width: 480,
    height: 320,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  var initialChartHeight = g.getArea().h;
  g.updateOptions({showRangeSelector: true});
  assertGraphExistence(g, graph);
  assert(g.getArea().h < initialChartHeight);  // range selector shown

  g.updateOptions({showRangeSelector: false});
  assert.equal(g.getArea().h, initialChartHeight);  // range selector hidden
});

// The animatedZooms option does not work with the range selector. Make sure it gets turned off.
it('testRangeSelectorWithAnimatedZoomsOption', function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    animatedZooms: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
  assert.isFalse(g.getOption('animatedZooms'));
  assert.deepEqual(logs, {
    log: [], error: [],
    warn: ["Animated zooms and range selector are not compatible; disabling animatedZooms."]
  });
});

it('testRangeSelectorWithAnimatedZoomsOption2', function() {
  var opts = {
    width: 480,
    height: 320,
    animatedZooms: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  g.updateOptions({showRangeSelector: true});
  assertGraphExistence(g, graph);
  assert.isFalse(g.getOption('animatedZooms'));
  assert.deepEqual(logs, {
    log: [], error: [],
    warn: ["Animated zooms and range selector are not compatible; disabling animatedZooms."]
  });
});

it('testRangeSelectorInteraction', function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    labels: ['X', 'Y']
  };
  var data = [
               [1, 10],
               [2, 15],
               [3, 10],
               [4, 15],
               [5, 10],
               [6, 15],
               [7, 10],
               [8, 15],
               [9, 10]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertGraphExistence(g, graph);
  var zoomhandles = graph.getElementsByClassName('dygraph-rangesel-zoomhandle');

  // Move left zoomhandle in
  var xRange = g.xAxisRange().slice();

  var mouseDownEvent = DygraphOps.createEvent({
    type : 'dragstart',
    detail: 1,
    clientX : 0,
    clientY : 0
  });
  zoomhandles[0].dispatchEvent(mouseDownEvent);

  var mouseMoveEvent = DygraphOps.createEvent({
    type : 'mousemove',
    clientX : 20,
    clientY : 20
  });
  zoomhandles[0].dispatchEvent(mouseMoveEvent);

  var mouseUpEvent = DygraphOps.createEvent({
    type : 'mouseup',
    detail: 1,
    clientX : 20,
    clientY : 20
  });
  zoomhandles[0].dispatchEvent(mouseUpEvent);

  var newXRange = g.xAxisRange().slice();
  assert(newXRange[0] > xRange[0], 'left zoomhandle should have moved: '+newXRange[0]+'>'+xRange[0]);
  assert.equal(xRange[1], newXRange[1], 'right zoomhandle should not have moved');

  // Move right zoomhandle in
  xRange = newXRange;

  mouseDownEvent = DygraphOps.createEvent({
    type : 'dragstart',
    detail: 1,
    clientX : 100,
    clientY : 100
  });
  zoomhandles[1].dispatchEvent(mouseDownEvent);

  mouseMoveEvent = DygraphOps.createEvent({
    type : 'mousemove',
    clientX : 80,
    clientY : 80
  });
  zoomhandles[1].dispatchEvent(mouseMoveEvent);

  mouseUpEvent = DygraphOps.createEvent({
    type : 'mouseup',
    detail: 1,
    clientX : 80,
    clientY : 80
  });
  zoomhandles[1].dispatchEvent(mouseUpEvent);

  var newXRange = g.xAxisRange().slice();
  assert(newXRange[1] < xRange[1], 'right zoomhandle should have moved: '+newXRange[1]+'<'+xRange[1]);
  assert.equal(xRange[0], newXRange[0], 'left zoomhandle should not have moved');

  // Pan left
  xRange = newXRange;
  var fgcanvas = graph.getElementsByClassName('dygraph-rangesel-fgcanvas')[0];
  var x = parseInt(zoomhandles[0].style.left) + 20;
  var y = parseInt(zoomhandles[0].style.top);

  mouseDownEvent = DygraphOps.createEvent({
    type : 'mousedown',
    detail: 1,
    clientX : x,
    clientY : y
  });
  fgcanvas.dispatchEvent(mouseDownEvent);

  x -= 10;

  mouseMoveEvent = DygraphOps.createEvent({
    type : 'mousemove',
    clientX : x,
    clientY : y
  });
  fgcanvas.dispatchEvent(mouseMoveEvent);

  mouseUpEvent = DygraphOps.createEvent({
    type : 'mouseup',
    detail: 1,
    clientX : x,
    clientY : y
  });
  fgcanvas.dispatchEvent(mouseUpEvent);

  var newXRange = g.xAxisRange().slice();
  assert(newXRange[0] < xRange[0], newXRange[0]+'<'+xRange[0]);
  assert(newXRange[1] < xRange[1], newXRange[1]+'<'+xRange[1]);
});


it('testRangeSelectorPositionIfXAxisNotDrawn', function() {
  var opts = {
    width: 480,
    height: 100,
    xAxisHeight: 30,
    axes : { x : { drawAxis: false }},
    showRangeSelector: true,
    rangeSelectorHeight: 30,
    labels: ['X', 'Y']
  };
  var data = [
               [0, 1],
               [10, 1]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  //assert, that the range selector is at top position 70 since the 30px of the
  // xAxis shouldn't be reserved since it isn't drawn.
  assertGraphExistence(g, graph);
  var bgcanvas = graph.getElementsByClassName('dygraph-rangesel-bgcanvas')[0];
  assert.equal("70px", bgcanvas.style.top, "Range selector is not at the expected position.");
  var fgcanvas = graph.getElementsByClassName('dygraph-rangesel-fgcanvas')[0];
  assert.equal("70px", fgcanvas.style.top, "Range selector is not at the expected position.");
});

it('testMiniPlotDrawn', function() {
  // Install Proxy to track canvas calls.
  var origFunc = utils.getContext;
  var miniHtx;
  utils.getContext = function(canvas) {
    if (canvas.className != 'dygraph-rangesel-bgcanvas') {
      return origFunc(canvas);
    }
    miniHtx = new Proxy(origFunc(canvas));
    return miniHtx;
  };

  var opts = {
    width: 480,
    height: 100,
    xAxisHeight: 30,
    axes : { x : { drawAxis: false }},
    showRangeSelector: true,
    rangeSelectorHeight: 30,
    rangeSelectorPlotStrokeColor: '#ff0000',
    labels: ['X', 'Y']
  };
  var data = [
      [0, 1],
      [5, 4],
      [10, 8]
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // TODO(danvk): more precise tests.
  assert.isNotNull(miniHtx);
  assert.isTrue(0 < CanvasAssertions.numLinesDrawn(miniHtx, '#ff0000'));

  utils.getContext = origFunc;
});

// Tests data computation for the mini plot with a single series.
it('testSingleCombinedSeries', function() {
  var opts = {
    showRangeSelector: true,
    labels: ['X', 'Y1']
  };
  var data = [
      [0, 1],
      [5, 4],
      [10, 8]
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 1 - 7 * 0.25,  // 25% padding
    yMax: 8 + 7 * 0.25,
    data: [
      [0, 1],
      [5, 4],
      [10, 8]
    ]
  }, combinedSeries);
});


// Tests that multiple series are averaged for the miniplot.
it('testCombinedSeries', function() {
  var opts = {
    showRangeSelector: true,
    labels: ['X', 'Y1', 'Y2']
  };
  var data = [
      [0, 1, 3],  // average = 2
      [5, 4, 6],  // average = 5
      [10, 7, 9]  // average = 8
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 2 - 6 * 0.25,  // 25% padding on combined series range.
    yMax: 8 + 6 * 0.25,
    data: [
      [0, 2],
      [5, 5],
      [10, 8]
    ]
  }, combinedSeries);
});

// Tests selection of a specific series to average for the mini plot.
it('testSelectedCombinedSeries', function() {
  var opts = {
    showRangeSelector: true,
    labels: ['X', 'Y1', 'Y2', 'Y3', 'Y4'],
    series: {
      'Y1': { showInRangeSelector: true },
      'Y3': { showInRangeSelector: true }
    }
  };
  var data = [
      [0, 5, 8, 13, 21],  // average (first and third) = 9
      [5, 1, 3, 7, 14],   // average (first and third) = 4
      [10, 0, 19, 10, 6]  // average (first and third) = 5
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 4 - 5 * 0.25,  // 25% padding on combined series range.
    yMax: 9 + 5 * 0.25,
    data: [
      [0, 9],
      [5, 4],
      [10, 5]
    ]
  }, combinedSeries);
});

// Tests data computation for the mini plot with a single error bar series.
it('testSingleCombinedSeriesCustomBars', function() {
  var opts = {
    customBars: true,
    showRangeSelector: true,
    labels: ['X', 'Y1']
  };
  var data = [
      [0, [0, 1, 2]],  // [low, value, high]
      [5, [1, 4, 5]],
      [10, [7, 8, 9]]
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 1 - 7 * 0.25,  // 25% padding
    yMax: 8 + 7 * 0.25,
    data: [
      [0, 1],
      [5, 4],
      [10, 8]
    ]
  }, combinedSeries);
});

it('testSingleCombinedSeriesErrorBars', function() {
  var opts = {
    errorBars: true,
    showRangeSelector: true,
    labels: ['X', 'Y1']
  };
  var data = [
      [0, [1, 1]],  // [value, standard deviation]
      [5, [4, 2]],
      [10, [8, 1]]
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 1 - 7 * 0.25,  // 25% padding
    yMax: 8 + 7 * 0.25,
    data: [
      [0, 1],
      [5, 4],
      [10, 8]
    ]
  }, combinedSeries);
});

// Tests data computation for the mini plot with two custom bar series.
it('testTwoCombinedSeriesCustomBars', function() {
  var opts = {
    customBars: true,
    showRangeSelector: true,
    labels: ['X', 'Y1', 'Y2']
  };
  var data = [
      [0, [0, 1, 2], [4, 5, 6]],  // [low, value, high], avg_val = 3
      [5, [1, 4, 5], [5, 8, 9]],  // avg_val = 6
      [10, [7, 8, 9], [11, 12, 13]]  // avg_val = 10
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 3 - 7 * 0.25,  // 25% padding
    yMax: 10 + 7 * 0.25,
    data: [
      [0, 3],
      [5, 6],
      [10, 10]
    ]
  }, combinedSeries);
});

it('testHiddenSeriesExcludedFromMiniplot', function() {
  var opts = {
    showRangeSelector: true,
    labels: ['X', 'Y1', 'Y2'],
    visibility: [true, false]
  };
  var data = [
      [0, 1, 3],  // average = 2
      [5, 4, 6],  // average = 5
      [10, 7, 9]  // average = 8
    ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var rangeSelector = g.getPluginInstance_(RangeSelectorPlugin);
  assert.isNotNull(rangeSelector);

  // Invisible series (e.g. Y2) are not included in the combined series.
  var combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 1 - 6 * 0.25,  // 25% padding on single series range.
    yMax: 7 + 6 * 0.25,
    data: [
      [0, 1],
      [5, 4],
      [10, 7]
    ]
  }, combinedSeries);

  // If Y2 is explicitly marked to be included in the range selector,
  // then it will be (even if it's not visible). Since we've started being
  // explicit about marking series for inclusion, this means that Y1 is no
  // longer included.
  g.updateOptions({
    series: {
      Y2: { showInRangeSelector: true },
    }
  });
  combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 3 - 6 * 0.25,  // 25% padding on combined series range.
    yMax: 9 + 6 * 0.25,
    data: [
      [0, 3],
      [5, 6],
      [10, 9]
    ]
  }, combinedSeries);

  // If we explicitly mark Y1, too, then it also gets included.
  g.updateOptions({
    series: {
      Y1: { showInRangeSelector: true },
      Y2: { showInRangeSelector: true },
    }
  });
  combinedSeries = rangeSelector.computeCombinedSeriesAndLimits_();
  assert.deepEqual({
    yMin: 2 - 6 * 0.25,  // 25% padding on combined series range.
    yMax: 8 + 6 * 0.25,
    data: [
      [0, 2],
      [5, 5],
      [10, 8]
    ]
  }, combinedSeries);
});

var assertGraphExistence = function(g, graph) {
  assert.isNotNull(g);
  var zoomhandles = graph.getElementsByClassName('dygraph-rangesel-zoomhandle');
  assert.equal(2, zoomhandles.length);
  var bgcanvas = graph.getElementsByClassName('dygraph-rangesel-bgcanvas');
  assert.equal(1, bgcanvas.length);
  var fgcanvas = graph.getElementsByClassName('dygraph-rangesel-fgcanvas');
  assert.equal(1, fgcanvas.length);
};

});
