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


});
