// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Tests for the updateOptions function.
 * @author antrob@google.com (Anthony Robledo)
 */
var UpdateOptionsTestCase = TestCase("update-options");
  
UpdateOptionsTestCase.prototype.opts = {
  width: 480,
  height: 320,
};

UpdateOptionsTestCase.prototype.data = "X,Y1,Y2\n" +
  "2011-01-01,2,3\n" +
  "2011-02-02,5,3\n" +
  "2011-03-03,6,1\n" +
  "2011-04-04,9,5\n" +
  "2011-05-05,8,3\n";

UpdateOptionsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div><div id='labels'></div>";
};

UpdateOptionsTestCase.prototype.tearDown = function() {
};

UpdateOptionsTestCase.prototype.wrap = function(g) {
  g._testDrawCalled = false;
  var oldDrawGraph = Dygraph.prototype.drawGraph_;
  Dygraph.prototype.drawGraph_ = function() {
    g._testDrawCalled = true;
    oldDrawGraph.call(g);
  }

  return oldDrawGraph;
}

UpdateOptionsTestCase.prototype.unWrap = function(oldDrawGraph) {
  Dygraph.prototype.drawGraph_ = oldDrawGraph;
}

UpdateOptionsTestCase.prototype.testStrokeAll = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, this.data, this.opts);
  var updatedOptions = { };

  updatedOptions['strokeWidth'] = 3;

  // These options will allow us to jump to renderGraph_()
  // drawGraph_() will be skipped.
  var oldDrawGraph = this.wrap(graph);
  graph.updateOptions(updatedOptions);
  this.unWrap(oldDrawGraph);
  assertFalse(graph._testDrawCalled);
};

UpdateOptionsTestCase.prototype.testStrokeSingleSeries = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, this.data, this.opts);
  var updatedOptions = { };
  var optionsForY1 = { };

  optionsForY1['strokeWidth'] = 3;
  updatedOptions['Y1'] = optionsForY1;

  // These options will allow us to jump to renderGraph_()
  // drawGraph_() will be skipped.
  var oldDrawGraph = this.wrap(graph);
  graph.updateOptions(updatedOptions);
  this.unWrap(oldDrawGraph);
  assertFalse(graph._testDrawCalled);
};
 
UpdateOptionsTestCase.prototype.testSingleSeriesRequiresNewPoints = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, this.data, this.opts);
  var updatedOptions = { };
  var optionsForY1 = { };
  var optionsForY2 = { };

  // This will not require new points.
  optionsForY1['strokeWidth'] = 2;
  updatedOptions['Y1'] = optionsForY1;

  // This will require new points.
  optionsForY2['stepPlot'] = true;
  updatedOptions['Y2'] = optionsForY2;

  // These options will not allow us to jump to renderGraph_()
  // drawGraph_() must be called
  var oldDrawGraph = this.wrap(graph);
  graph.updateOptions(updatedOptions);
  this.unWrap(oldDrawGraph);
  assertTrue(graph._testDrawCalled);
};

UpdateOptionsTestCase.prototype.testWidthChangeNeedsNewPoints = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, this.data, this.opts);
  var updatedOptions = { };

  // This will require new points.
  updatedOptions['width'] = 600;

  // These options will not allow us to jump to renderGraph_()
  // drawGraph_() must be called
  var oldDrawGraph = this.wrap(graph);
  graph.updateOptions(updatedOptions);
  this.unWrap(oldDrawGraph);
  assertTrue(graph._testDrawCalled);
};

// Test https://github.com/danvk/dygraphs/issues/87
UpdateOptionsTestCase.prototype.testUpdateLabelsDivDoesntInfiniteLoop = function() {
  var graphDiv = document.getElementById("graph");
  var labelsDiv = document.getElementById("labels");
  var graph = new Dygraph(graphDiv, this.data, this.opts);
  graph.updateOptions({labelsDiv : labelsDiv});
}

