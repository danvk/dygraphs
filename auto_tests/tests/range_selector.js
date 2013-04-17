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

RangeSelectorTestCase.prototype.testRangeSelectorEnablingAfterCreation = function() {
  var opts = {
    width: 480,
    height: 320
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
  this.assertGraphExistence(g, graph);
};

// The animatedZooms option does not work with the range selector. Make sure it gets turned off.
RangeSelectorTestCase.prototype.testRangeSelectorWithAnimatedZoomsOption = function() {
  var opts = {
    width: 480,
    height: 320,
    showRangeSelector: true,
    animatedZooms: true
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
  assertFalse(g.getOption('animatedZooms'));
};

RangeSelectorTestCase.prototype.testRangeSelectorWithAnimatedZoomsOption2 = function() {
  var opts = {
    width: 480,
    height: 320,
    animatedZooms: true
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
  this.assertGraphExistence(g, graph);
  assertFalse(g.getOption('animatedZooms'));
};

RangeSelectorTestCase.prototype.testRangeSelectorInteraction = function() {
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
  assert('left zoomhandle should have moved: '+newXRange[0]+'>'+xRange[0], newXRange[0] > xRange[0]);
  assertEquals('right zoomhandle should not have moved', xRange[1], newXRange[1]);

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
  assert('right zoomhandle should have moved: '+newXRange[1]+'<'+xRange[1], newXRange[1] < xRange[1]);
  assertEquals('left zoomhandle should not have moved', xRange[0], newXRange[0]);

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
  assert(newXRange[0]+'<'+xRange[0], newXRange[0] < xRange[0]);
  assert(newXRange[1]+'<'+xRange[1], newXRange[1] < xRange[1]);
};


RangeSelectorTestCase.prototype.testRangeSelectorPositionIfXAxisNotDrawn = function() {
  var opts = {
    width: 480,
    height: 100,
    xAxisHeight: 30,
    drawXAxis: false,
    showRangeSelector: true,
    rangeSelectorHeight: 30
  };
  var data = [
               [0, 1],
               [10, 1]
             ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  
  //assert, that the range selector is at top position 70 since the 30px of the
  // xAxis shouldn't be reserved since it isn't drawn.
  this.assertGraphExistence(g, graph);
  var bgcanvas = graph.getElementsByClassName('dygraph-rangesel-bgcanvas')[0];
  assertEquals("Range selector is not at the expected position.","70px", bgcanvas.style.top);
  var fgcanvas = graph.getElementsByClassName('dygraph-rangesel-fgcanvas')[0];
  assertEquals("Range selector is not at the expected position.","70px", fgcanvas.style.top);
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
