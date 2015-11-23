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
 * @fileoverview Test cases that ensure Dygraphs works at all.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

import Dygraph from '../../src/dygraph';

describe("dygraphs-sanity", function() {

var DEAD_SIMPLE_DATA = 'X,Y\n10,2100';
var ZERO_TO_FIFTY = 'X,Y\n10,0\n20,50';

cleanupAfterEach();

/**
 * The sanity test of sanity tests.
 */
it('testTrue', function() {
  assert.isTrue(true);
});

/**
 * Sanity test that ensures the graph element exists.
 */
it('testGraphExists', function() {
  var graph = document.getElementById("graph");
  assert.isNotNull(graph);
});

// TODO(konigsberg): Move the following tests to a new package that
// tests all kinds of toDomCoords, toDataCoords, toPercent, et cetera.

/**
 * A sanity test of sorts, by ensuring the dygraph is created, and
 * isn't just some piece of junk object.
 */
it('testToString', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, DEAD_SIMPLE_DATA, {});
  assert.isNotNull(g);
  assert.equal("[Dygraph graph]", g.toString());
});

/**
 * Test that when no valueRange is specified, the y axis range is
 * adjusted by 10% on top.
 */
it('testYAxisRange_default', function() {
  var graph = document.getElementById("graph");
  assert.equal(0, graph.style.length);
  var g = new Dygraph(graph, ZERO_TO_FIFTY, {});
  assert.deepEqual([0, 55], g.yAxisRange(0));
});

/**
 * Test that valueRange matches the y-axis range specifically.
 */
it('testYAxisRange_custom', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY, { valueRange: [0,50] });
  assert.deepEqual([0, 50], g.yAxisRange(0));
  g.updateOptions({valueRange: null, axes: {y: {valueRange: [10, 40]}}});
  assert.deepEqual([10, 40], g.yAxisRange(0));
});

/**
 * Test that valueRange matches the y-axis range specifically.
 *
 * This is based on the assumption that 20 pixels are dedicated to the
 * axis label and tick marks.
 * TODO(konigsberg): change yAxisLabelWidth to 0 (or 20) and try again.
 */
it('testToDomYCoord', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY, { height: 70, valueRange: [0,50] });

  assert.equal(50, g.toDomYCoord(0));
  assert.equal(0, g.toDomYCoord(50));

  for (var x = 0; x <= 50; x++) {
    assert.closeTo(50 - x, g.toDomYCoord(x), 0.00001);
  }
  g.updateOptions({valueRange: null, axes: {y: {valueRange: [0, 50]}}});

  assert.equal(50, g.toDomYCoord(0));
  assert.equal(0, g.toDomYCoord(50));

  for (var x = 0; x <= 50; x++) {
    assert.closeTo(50 - x, g.toDomYCoord(x), 0.00001);
  }
});

/**
 * Test that the two-argument form of the constructor (no options) works.
 */
it('testTwoArgumentConstructor', function() {
  var graph = document.getElementById("graph");
  new Dygraph(graph, ZERO_TO_FIFTY);
});

// Here is the first of a series of tests that just ensure the graph is drawn
// without exception.
//TODO(konigsberg): Move to its own test case.
it('testFillStack1', function() {
  var graph = document.getElementById("graph");
  new Dygraph(graph, ZERO_TO_FIFTY, { stackedGraph: true });
});

it('testFillStack2', function() {
  var graph = document.getElementById("graph");
  new Dygraph(graph, ZERO_TO_FIFTY, { stackedGraph: true, fillGraph: true });
});

it('testFillStack3', function() {
  var graph = document.getElementById("graph");
  new Dygraph(graph, ZERO_TO_FIFTY, { fillGraph: true });
});

});
