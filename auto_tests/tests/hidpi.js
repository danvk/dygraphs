/**
 * @fileoverview Tests for window.devicePixelRatio > 1.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';

describe("hidpi", function() {

cleanupAfterEach();

var savePixelRatio;
beforeEach(function() {
  savePixelRatio = window.devicePixelRatio;
  window.devicePixelRatio = 2;
});

afterEach(function() {
  window.devicePixelRatio = savePixelRatio;
});

it('testDoesntCreateScrollbars', function() {
  var sw = document.body.scrollWidth;
  var cw = document.body.clientWidth;

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

  // Adding the graph shouldn't cause the width of the page to change.
  // (essentially, we're checking that we don't end up with a scrollbar)
  // See http://stackoverflow.com/a/2146905/388951
  assert.equal(cw, document.body.clientWidth);
  assert.equal(sw, document.body.scrollWidth);
});

it('should be influenced by options.pixelRatio', function () {
  var graph = document.getElementById("graph");

  // make sure devicePixelRatio is still setup to not 1.
  assert(devicePixelRatio > 1.5, 'devicePixelRatio is not much greater than 1.');

  var data = "X,Y\n" +
    "0,-1\n" +
    "1,0\n" +
    "2,1\n" +
    "3,0\n";

  // first try a default one
  var g1 = new Dygraph(graph, data, {});
  var area1 = g1.getArea();

  var g2 = new Dygraph(graph, data, { pixelRatio: 1 });
  var area2 = g2.getArea();

  var g3 = new Dygraph(graph, data, { pixelRatio: 3 });
  var area3 = g3.getArea();

  assert.deepEqual(area1, area2, 'areas 1 and 2 are not the same');
  assert.deepEqual(area2, area3, 'areas 2 and 3 are not the same');

  assert.notEqual(g1.canvas_.width, g2.canvas_.width,
    'Expected, for devicePixelRatio != 1, '
    + 'that setting options.pixelRatio would change the canvas width');
  assert.equal(g2.canvas_.width * 3, g3.canvas_.width,
    'Expected that pixelRatio of 3 vs 1 would triple the canvas width.');
});

});
