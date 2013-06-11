/**
 * @fileoverview Test cases for resizing.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var ResizeTestCase = TestCase("resize");

ResizeTestCase.data =
      "Date,Y\n" +
      "2010/01/01,100\n" +
      "2010/02/01,200\n" +
      "2010/03/01,300\n" +
      "2010/04/01,400\n" +
      "2010/05/01,300\n" +
      "2010/06/01,100\n";

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

  g = new Dygraph(graph, ResizeTestCase.data, {highlightCallback: callback});

  strum(g, 300, 640);
  assertEquals(6, callbackCount);

  document.getElementById("graph").style.width = "500px";
  g.resize();

  callbackCount = 0;
  strum(g, 300, 500);
  assertEquals(6, callbackCount);
};

/**
 * Tests that a graph created in a not-displayed div works as expected
 * if the graph options include height and width. Resize not needed.
 */
ResizeTestCase.prototype.testHiddenDivWithSizedGraph = function() {
  var div = document.getElementById("graph");

  div.style.display = 'none';
  var g = new Dygraph(div, ResizeTestCase.data, {width: 400, height: 300});
  div.style.display = '';

  var area = g.getArea();
  assertTrue(area.w > 0);
  assertTrue(area.h > 0);
};

/**
 * Tests that a graph created in a not-displayed div with
 * CSS-specified size but no graph height or width options works as
 * expected. The user needs to call resize() on it after displaying
 * it.
 */
ResizeTestCase.prototype.testHiddenDivWithResize = function() {
  var div = document.getElementById("graph");

  div.style.display = 'none';
  div.style.width = '400px';
  div.style.height = '300px';

  var g = new Dygraph(div, ResizeTestCase.data, {});
  div.style.display = '';

  g.resize();
  area = g.getArea();
  assertTrue(area.w > 0);
  assertTrue(area.h > 0);
};
