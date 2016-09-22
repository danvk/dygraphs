// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Regression test based on some strange customBars data.
 * @author danvk@google.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';

describe("css", function() {

cleanupAfterEach();

var data = "X,Y,Z\n1,2,3\n4,5,6\n";

var styleSheet;

beforeEach(function() {
  styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  document.getElementsByTagName("head")[0].appendChild(styleSheet);
});

afterEach(function() {
  styleSheet.innerHTML = '';
});

// Verifies that an unstyled, unsized dygraph gets a default size.
it('testDefaultSize', function() {
  var opts = {
  };
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assert.equal(480, graph.offsetWidth);
  assert.equal(320, graph.offsetHeight);
  assert.deepEqual({width: 480, height: 320}, g.size());
});

// Verifies that the width/height parameters work.
it('testExplicitParamSize', function() {
  var opts = {
    width: 640,
    height: 480
  };
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assert.equal(640, graph.offsetWidth);
  assert.equal(480, graph.offsetHeight);
  assert.deepEqual({width: 640, height: 480}, g.size());
});

// Verifies that setting a style on the div works.
it('testExplicitStyleSize', function() {
  var opts = {
  };
  var graph = document.getElementById("graph");
  graph.style.width = '600px';
  graph.style.height = '400px';

  var g = new Dygraph(graph, data, opts);
  assert.equal(600, graph.offsetWidth);
  assert.equal(400, graph.offsetHeight);
  assert.deepEqual({width: 600, height: 400}, g.size());
});

// Verifies that CSS pixel styles on the div trump explicit parameters.
it('testPixelStyleWins', function() {
  var opts = {
    width: 987,
    height: 654
  };
  var graph = document.getElementById("graph");
  graph.style.width = '600px';
  graph.style.height = '400px';

  var g = new Dygraph(graph, data, opts);
  assert.equal(600, graph.offsetWidth);
  assert.equal(400, graph.offsetHeight);
  assert.deepEqual({width: 600, height: 400}, g.size());
});

// Verifies that a CSS percentage size works.
it('testPercentageSize', function() {
  var testdiv = document.getElementById("graph");
  testdiv.innerHTML =
      '<div style="width: 600px; height: 400px;">' +
      '<div id="inner-graph"></div></div>';
  var opts = {
  };
  var graph = document.getElementById("inner-graph");
  graph.style.width = '50%';
  graph.style.height = '50%';

  var g = new Dygraph(graph, data, opts);
  assert.equal(300, graph.offsetWidth);
  assert.equal(200, graph.offsetHeight);
  assert.deepEqual({width: 300, height: 200}, g.size());
});

// Verifies that a CSS class size works.
it('testClassPixelSize', function() {
  styleSheet.innerHTML = '.chart { width: 456px; height: 345px; }';

  var opts = {
  };
  var graph = document.getElementById("graph");
  graph.className = "chart";
  var g = new Dygraph(graph, data, opts);
  assert.equal(456, graph.offsetWidth);
  assert.equal(345, graph.offsetHeight);
  assert.deepEqual({width: 456, height: 345}, g.size());
});

// An invisible chart div shouldn't produce an error.
it('testInvisibleChart', function() {
  graph.innerHTML =
      '<div style="display:none;">' +
      '<div id="inner-graph" style="width: 640px; height: 480px;"></div>' +
      '</div>';
  new Dygraph('inner-graph', data, {});
});

// An invisible chart div shouldn't produce an error.
it('testInvisibleChartDate', function() {
  graph.innerHTML =
      '<div style="display:none;">' +
      '<div id="inner-graph" style="width: 640px; height: 480px;"></div>' +
      '</div>';
  new Dygraph('inner-graph',
                  "Date,Y\n" +
                  "2010/01/01,100\n" +
                  "2010/02/01,200\n" +
                  "2010/03/01,300\n" +
                  "2010/04/01,400\n" +
                  "2010/05/01,300\n" +
                  "2010/06/01,100\n",
                  {});
});

// An invisible chart div that becomes visible.
it('testInvisibleThenVisibleChart', function() {
  var testdiv = document.getElementById("graph");
  testdiv.innerHTML =
      '<div id="x" style="display:none;">' +
      '<div id="inner-graph" style="width: 640px; height: 480px;"></div>' +
      '</div>';
  var graph = document.getElementById("inner-graph");
  var g = new Dygraph(graph,
                  "Date,Y\n" +
                  "2010/01/01,100\n" +
                  "2010/02/01,200\n" +
                  "2010/03/01,300\n" +
                  "2010/04/01,400\n" +
                  "2010/05/01,300\n" +
                  "2010/06/01,100\n"
                  , {});

  // g.size() is undefined here (probably 0x0)
  document.getElementById("x").style.display = "";

  // This resize() call is annoying but essential.
  // There are no DOM events to inform the dygraph that its div has changed size
  // or visibility so we need to let it know ourselves.
  g.resize();

  assert.equal(640, graph.offsetWidth);
  assert.equal(480, graph.offsetHeight);
  assert.deepEqual({width: 640, height: 480}, g.size());
});

// Verifies that a div resize gets picked up.
/*
  this one isn't quite ready yet.
it('testDivResize', function() {
  var opts = {
  };
  var graph = document.getElementById("graph");
  graph.style.width = '640px';
  graph.style.height = '480px';
  var g = new Dygraph(graph, data, opts);

  assert.equal(640, graph.offsetWidth);
  assert.equal(480, graph.offsetHeight);
  assert.deepEqual({width: 640, height: 480}, g.size());

  graph.style.width = '650px';
  graph.style.height = '490px';
  assert.equal(650, graph.offsetWidth);
  assert.equal(490, graph.offsetHeight);
  assert.deepEqual({width: 650, height: 490}, g.size());
});
*/

});
