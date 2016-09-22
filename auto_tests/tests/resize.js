/**
 * @fileoverview Test cases for resizing.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

import Dygraph from '../../src/dygraph';

import DygraphOps from './DygraphOps';
import Util from './Util';

describe("resize", function() {

cleanupAfterEach();

var data =
      "X,Y\n" +
      "1,100\n" +
      "2,200\n" +
      "3,300\n" +
      "4,400\n" +
      "5,300\n" +
      "6,100\n";

it('testResizeMaintainsMouseOperations', function() {
  var graph = document.getElementById('graph');
  graph.setAttribute('style', 'width: 640px; height: 480px;');

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

  var g = new Dygraph(graph, data, {highlightCallback: callback});

  strum(g, 300, 640);
  assert.equal(6, callbackCount);

  graph.style.width = "500px";
  g.resize();

  callbackCount = 0;
  strum(g, 300, 500);
  assert.equal(6, callbackCount);
});

/**
 * Tests that a graph created in a not-displayed div works as expected
 * if the graph options include height and width. Resize not needed.
 */
it('testHiddenDivWithSizedGraph', function() {
  var div = document.getElementById("graph");

  div.style.display = 'none';
  var g = new Dygraph(div, data, {width: 400, height: 300});
  div.style.display = '';

  var area = g.getArea();
  assert.isTrue(area.w > 0);
  assert.isTrue(area.h > 0);
});

/**
 * Tests that a graph created in a not-displayed div with
 * CSS-specified size but no graph height or width options works as
 * expected. The user needs to call resize() on it after displaying
 * it.
 */
it('testHiddenDivWithResize', function() {
  var div = document.getElementById("graph");

  div.style.display = 'none';
  div.style.width = '400px';
  div.style.height = '300px';

  // Setting strokeWidth 3 removes any ambiguitiy from the pixel sampling
  // request, below.
  var g = new Dygraph(div, data, {strokeWidth: 3});
  div.style.display = '';

  g.resize();
  var area = g.getArea();
  assert.isTrue(area.w > 0);
  assert.isTrue(area.h > 0);

  // Regression test: check that graph remains visible after no-op resize.
  g.resize();
  var x = Math.floor(g.toDomXCoord(2));
  var y = Math.floor(g.toDomYCoord(200));
  assert.deepEqual([0, 128, 128, 255], Util.samplePixel(g.hidden_, x, y),
                   "Unexpected grid color found at pixel: x: " + x + " y: " + y);
});

});
