/**
 * @fileoverview Test cases for resizing.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var ResizeTestCase = TestCase("resize");

ResizeTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

ResizeTestCase.prototype.tearDown = function() {
};

ResizeTestCase.prototype.testResizeMaintainsMouseOperations = function() {
  document.body.innerHTML =
      '<div id="graph" style="width: 640px; height: 480px;"></div>' +
      '</div>';
  var graph = document.getElementById("graph");

  var callbackCount = 0;
  var callback = function() {
    callbackCount++;
  }

  // Strum the mouse along the y-coordinate y, from 0 to x2. These are DOM values.
  var strum = function(g, y, x2) {
    DygraphOps.dispatchMouseDown_Point(g, 0, y);
    for (var x = 0; x < x2; x++) {
      DygraphOps.dispatchMouseMove_Point(g, x, y);
    }
    DygraphOps.dispatchMouseUp_Point(g, x2 - 1, y);
  }

  g = new Dygraph(graph,
      "Date,Y\n" +
      "2010/01/01,100\n" +
      "2010/02/01,200\n" +
      "2010/03/01,300\n" +
      "2010/04/01,400\n" +
      "2010/05/01,300\n" +
      "2010/06/01,100\n",
      { highlightCallback : callback });

  strum(g, 300, 640);
  assertEquals(6, callbackCount);

  document.getElementById("graph").style.width = "500px";
  g.resize();

  callbackCount = 0;
  strum(g, 300, 500);
  assertEquals(6, callbackCount);
};
