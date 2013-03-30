/** 
 * @fileoverview Test cases for DygraphOptions.
 */
var DygraphOptionsTestCase = TestCase("dygraph-options-tests");

DygraphOptionsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

DygraphOptionsTestCase.prototype.tearDown = function() {
};

/*
 * Pathalogical test to ensure getSeriesNames works
 */
DygraphOptionsTestCase.prototype.testGetSeriesNames = function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y,Y2,Y3\n" +
      "0,-1,0,0";

  // Kind of annoying that you need a DOM to test the object.
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // We don't need to get at g's attributes_ object just
  // to test DygraphOptions.
  var o = new DygraphOptions(g);
  assertEquals(["Y", "Y2", "Y3"], o.seriesNames()); 
};
