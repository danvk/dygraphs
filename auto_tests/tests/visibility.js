/**
 * @fileoverview Tests for the setVisibility function.
 * @author sergeyslepian@gmail.com
 */

import Dygraph from '../../src/dygraph';
import Util from './Util';

describe("visibility", function() {

cleanupAfterEach();

/**
 * Does a bunch of the shared busywork of setting up a graph and changing its visibility.
 * @param {boolean} startingVisibility The starting visibility of all series on the graph
 * @param {*[]} setVisibilityArgs An array of arguments to be passed directly to setVisibility()
 * @returns {string} The output of Util.getLegend() called after the visibility is set
 */
var getVisibleSeries = function(startingVisibility, setVisibilityArgs) {
  var opts = {
    width: 480,
    height: 320,
    labels: ['x', 'A', 'B', 'C', 'D', 'E'],
    legend: 'always',
    visibility: []
  };

  // set the starting visibility
  var numSeries = opts.labels.length - 1;
  for(var i = 0; i < numSeries; i++) {
    opts.visibility[i] = startingVisibility;
  }

  var data = [];
  for (var j = 0; j < 10; j++) {
    data.push([j, 1, 2, 3, 4, 5]);
  }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setVisibility.apply(g, setVisibilityArgs);

  return Util.getLegend();
};

it('testDefaultCases', function() {
  assert.equal(' A  B  C  D  E', getVisibleSeries(true, [[], true]));
  assert.equal('', getVisibleSeries(false, [[], true]));
});

it('testSingleSeriesHide', function() {
  assert.equal(' A  C  D  E', getVisibleSeries(true, [1, false]));
});

it('testSingleSeriesShow', function() {
  assert.equal(' E', getVisibleSeries(false, [4, true]));
});

it('testMultiSeriesHide', function() {
  assert.equal(' A  E', getVisibleSeries(true, [[1,2,3], false]));
});

it('testMultiSeriesShow', function() {
  assert.equal(' B  D', getVisibleSeries(false, [[1,3], true]));
});

it('testObjectSeriesShowAndHide', function() {
  assert.equal(' B  D', getVisibleSeries(false, [{1:true, 2:false, 3:true}, null]));
});

it('testBooleanArraySeriesShowAndHide', function() {
  assert.equal(' B  D', getVisibleSeries(false, [[false, true, false, true], null]));
});

});
