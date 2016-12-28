/**
 * @fileoverview Tests for data formats.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

import Dygraph from '../../src/dygraph';

describe("formats", function() {

cleanupAfterEach();

var dataString =
  "X,Y\n" +
  "0,-1\n" +
  "1,0\n" +
  "2,1\n" +
  "3,0\n";

var dataArray =
  [[0,-1],
  [1,0],
  [2,1],
  [3,0]];
var BASE_OPTS = {labels: ['X', 'Y']};

it('testCsv', function() {
  var data = dataString;
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  assertData(g);
});

it('testArray', function() {
  var data = dataArray;
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, BASE_OPTS);
  assertData(g);
});

it('testFunctionReturnsCsv', function() {
  var data = function() { return dataString; };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  assertData(g);
});

it('testFunctionDefinesArray', function() {
  var array = dataArray;
  var data = function() { return array; }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, BASE_OPTS);
  assertData(g);
});

it('testXValueParser', function() {
  var data =
    "X,Y\n" +
    "d,-1\n" +
    "e,0\n" +
    "f,1\n" +
    "g,0\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {
    xValueParser : function(str) {
      assert.equal(1, str.length);
      return str.charCodeAt(0) - "a".charCodeAt(0);
    }
  });

  assert.equal(3, g.getValue(0, 0));
  assert.equal(4, g.getValue(1, 0));
  assert.equal(5, g.getValue(2, 0));
  assert.equal(6, g.getValue(3, 0));
});

it('should throw on strings in native format', () => {
  assert.throws(() => {
    new Dygraph('graph', [['1', '10'], ['2', '20']])
  }, /expected number or date/i);

  assert.throws(() => {
    new Dygraph('graph', [[new Date(), '10'], [new Date(), '20']])
  }, /expected number or array/i);
});

var assertData = function(g) {
  var expected = dataArray;

  assert.equal(4, g.numRows());
  assert.equal(2, g.numColumns());

  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 2; j++) {
      assert.equal(expected[i][j], g.getValue(i, j));
    }
  }
};

});
