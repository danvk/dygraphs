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
