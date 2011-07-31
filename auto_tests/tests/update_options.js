// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Regression test based on some strange customBars data.
 * @author antrob@google.com (Anthony Robledo)
 */
var UpdateOptionsTestCase = TestCase("update-options");
  
var opts = {
  width: 480,
  height: 320,
};
var data = "X,Y1,Y2\n" +
  "1,2,3\n" +
  "2,5,3\n" +
  "3,6,1\n" +
  "4,9,5\n" +
  "5,3,3\n" +
  "6,1,7\n" +
  "7,8,6\n" +
  "8,4,2\n" +
  "9,5,6\n" +
  "10,7,8\n" +
  "11,9,2\n" +
  "12,3,7\n" +
  "13,7,4\n" +
  "14,6,6\n" +
  "15,8,3\n";

UpdateOptionsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

UpdateOptionsTestCase.prototype.testEasy = function() {
};

UpdateOptionsTestCase.prototype.testStrokeAll = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, data, opts);
  var updatedOptions = { };

  updatedOptions['strokeWidth'] = 3;

  // These options will allow us to jump to renderGraph_()
  graph.updateOptions(updatedOptions);
};

UpdateOptionsTestCase.prototype.testStrokeSingleSeries = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, data, opts);
  var updatedOptions = { };
  var optionsForY1 = { };

  optionsForY1['strokeWidth'] = 3;
  updatedOptions['Y1'] = optionsForY1;

  // These options will allow us to jump to renderGraph_()
  graph.updateOptions(updatedOptions);
};
 
UpdateOptionsTestCase.prototype.testSingleSeriesRequiresNewPoints = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, data, opts);
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
  graph.updateOptions(updatedOptions);
};

UpdateOptionsTestCase.prototype.testWidthChangeNeedsNewPoints = function() {
  var graphDiv = document.getElementById("graph");
  var graph = new Dygraph(graphDiv, data, opts);
  var updatedOptions = { };

  // This will require new points.
  updatedOptions['width'] = 600;

  // These options will not allow us to jump to renderGraph_()
  // drawGraph_() must be called
  graph.updateOptions(updatedOptions);
};
