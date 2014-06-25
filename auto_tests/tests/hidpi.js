/**
 * @fileoverview Tests for window.devicePixelRatio > 1.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */
var hidpiTestCase = TestCase("hidpi");

var savePixelRatio;
hidpiTestCase.prototype.setUp = function() {
  savePixelRatio = window.devicePixelRatio;
  window.devicePixelRatio = 2;

  document.body.innerHTML = "<div id='graph'></div>";
};

hidpiTestCase.prototype.tearDown = function() {
  window.devicePixelRatio = savePixelRatio;
};

hidpiTestCase.prototype.testNameGoesHere = function() {
  var graph = document.getElementById("graph");
  graph.style.width = "70%";  // more than half.
  graph.style.height = "200px";

  var opts = {};
  var data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;

  var g = new Dygraph(graph, data, opts);

  // See http://stackoverflow.com/a/2146905/388951
  var hasHorizontalScrollbar = (document.body.scrollWidth > document.body.clientWidth);
  assertEquals(false, hasHorizontalScrollbar);
};

