/**
 * @fileoverview Tests for data formats.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var FormatsTestCase = TestCase("formats");

FormatsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

FormatsTestCase.prototype.tearDown = function() {
};

FormatsTestCase.prototype.dataString =
  "X,Y\n" +
  "0,-1\n" +
  "1,0\n" +
  "2,1\n" +
  "3,0\n";

FormatsTestCase.prototype.dataArray =
  [[0,-1],
  [1,0],
  [2,1],
  [3,0]];

FormatsTestCase.prototype.testCsv = function() {
  var data = this.dataString;
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  this.assertData(g);
};

FormatsTestCase.prototype.testArray = function() {
  var data = this.dataArray;
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  this.assertData(g);
};

FormatsTestCase.prototype.testFunctionReturnsCsv = function() {
  var string = this.dataString;
  var data = function() { return string; };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  // this.assertData(g);
  console.log("x");
};

FormatsTestCase.prototype.testFunctionDefinesArray = function() {
  var array = this.dataArray;
  var data = function() { return array; }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {});
  this.assertData(g);
};

FormatsTestCase.prototype.assertData = function(g) {
  var expected = this.dataArray;

  assertEquals(4, g.numRows());
  assertEquals(2, g.numColumns());

  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 2; j++) {
      assertEquals(expected[i][j], g.getValue(i, j));
    }
  }
}
