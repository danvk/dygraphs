/**
 * @fileoverview Tests zero and one-point charts.
 * These don't have to render nicely, they just have to not crash.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */
var pathologicalCasesTestCase = TestCase("pathological-cases");

pathologicalCasesTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

pathologicalCasesTestCase.prototype.tearDown = function() {
};

pathologicalCasesTestCase.prototype.testZeroPoint = function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
};

pathologicalCasesTestCase.prototype.testOnePoint = function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n" +
             "1,2\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
};

pathologicalCasesTestCase.prototype.testNullLegend = function() {
  var opts = {
    width: 480,
    height: 320,
    labelsDiv: null
  };
  var data = "X,Y\n" +
             "1,2\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
};

pathologicalCasesTestCase.prototype.testNoWidth = function() {
  var opts = {
    height: 300,
  };
  var data = "X,Y\n" +
             "1,2\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertEquals(480, g.getOption("width"));
  assertEquals(300, g.getOption("height"));
};


pathologicalCasesTestCase.prototype.testNoHeight = function() {
  var opts = {
    width: 479,
  };
  var data = "X,Y\n" +
             "1,2\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertEquals(479, g.getOption("width"));
  assertEquals(320, g.getOption("height"));
};

pathologicalCasesTestCase.prototype.testNoWidthOrHeight = function() {
  var opts = {
  };
  var data = "X,Y\n" +
             "1,2\n";

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertEquals(480, g.getOption("width"));
  assertEquals(320, g.getOption("height"));
};
