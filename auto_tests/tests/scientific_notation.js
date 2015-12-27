/**
 * @fileoverview Tests input data which uses scientific notation.
 * This is a regression test for
 * http://code.google.com/p/dygraphs/issues/detail?id=186
 *
 * @author danvk@google.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';
import {assertDeepCloseTo} from './custom_asserts';

describe("scientific-notation", function() {

cleanupAfterEach();

function getXValues(g) {
  var xs = [];
  for (var i = 0; i < g.numRows(); i++) {
    xs.push(g.getValue(i, 0));
  }
  return xs;
}

it('testScientificInput', function() {
  var data = "X,Y\n" +
      "1.0e1,-1\n" +
      "2.0e1,0\n" +
      "3.0e1,1\n" +
      "4.0e1,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  assertDeepCloseTo([10, 20, 30, 40], getXValues(g), 1e-6);
});

it('testScientificInputPlus', function() {
  var data = "X,Y\n" +
      "1.0e+1,-1\n" +
      "2.0e+1,0\n" +
      "3.0e+1,1\n" +
      "4.0e+1,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  assertDeepCloseTo([10, 20, 30, 40], getXValues(g), 1e-6);
});

it('testScientificInputMinus', function() {
  var data = "X,Y\n" +
      "1.0e-1,-1\n" +
      "2.0e-1,0\n" +
      "3.0e-1,1\n" +
      "4.0e-1,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  assertDeepCloseTo([0.1, 0.2, 0.3, 0.4], getXValues(g), 1e-6);
});

it('testScientificInputMinusCap', function() {
  var data = "X,Y\n" +
      "1.0E-1,-1\n" +
      "2.0E-1,0\n" +
      "3.0E-1,1\n" +
      "4.0E-1,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  assertDeepCloseTo([0.1, 0.2, 0.3, 0.4], getXValues(g), 1e-6);
});

});
