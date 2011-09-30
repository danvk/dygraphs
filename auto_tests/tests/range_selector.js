// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Regression tests for range selector.
 * @author paul.eric.felix@gmail.com (Paul Felix)
 */
var RangeSelectorTestCase = TestCase("range-selector");

RangeSelectorTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

RangeSelectorTestCase.prototype.tearDown = function() {
};

RangeSelectorTestCase.prototype.testRangeSelector = function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true
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
  this.assertGraphExistence(g, graph);
};

RangeSelectorTestCase.prototype.testRangeSelectorWithErrorBars = function() {
  var opts = {
    width: 480,
    height: 320,
    errorBars: true,
    showRangeSelector: true
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
  this.assertGraphExistence(g, graph);
};

RangeSelectorTestCase.prototype.testRangeSelectorWithCustomBars = function() {
  var opts = {
    width: 480,
    height: 320,
    customBars: true,
    showRangeSelector: true
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
  this.assertGraphExistence(g, graph);
};

RangeSelectorTestCase.prototype.testRangeSelectorWithLogScale = function() {
  var opts = {
    width: 480,
    height: 320,
    logscale: true,
    showRangeSelector: true
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
  this.assertGraphExistence(g, graph);
};

RangeSelectorTestCase.prototype.testRangeSelectorOptions = function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    rangeSelectorHeight: 30,
    rangeSelectorPlotFillColor: 'lightyellow',
    rangeSelectorPlotStyleColor: 'yellow'
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
  this.assertGraphExistence(g, graph);
};

RangeSelectorTestCase.prototype.assertGraphExistence = function(g, graph) {
  assertNotNull(g);
  var zoomhandles = graph.getElementsByClassName('dygraph-rangesel-zoomhandle');
  assertEquals(2, zoomhandles.length);
  var bgcanvas = graph.getElementsByClassName('dygraph-rangesel-bgcanvas');
  assertEquals(1, bgcanvas.length);
  var fgcanvas = graph.getElementsByClassName('dygraph-rangesel-fgcanvas');
  assertEquals(1, fgcanvas.length);
}
