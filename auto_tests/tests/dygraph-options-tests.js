/** 
 * @fileoverview Test cases for DygraphOptions.
 */

import Dygraph from '../../src/dygraph';
import DygraphOptions from '../../src/dygraph-options';
import OPTIONS_REFERENCE from '../../src/dygraph-options-reference';

describe("dygraph-options-tests", function() {

cleanupAfterEach();

var graph;

beforeEach(function() {
  graph = document.getElementById("graph");
});

/*
 * Pathalogical test to ensure getSeriesNames works
 */
it('testGetSeriesNames', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y,Y2,Y3\n" +
      "0,-1,0,0";

  // Kind of annoying that you need a DOM to test the object.
  var g = new Dygraph(graph, data, opts);

  // We don't need to get at g's attributes_ object just
  // to test DygraphOptions.
  var o = new DygraphOptions(g);
  assert.deepEqual(["Y", "Y2", "Y3"], o.seriesNames()); 
});

/*
 * Ensures that even if logscale is set globally, it doesn't impact the
 * x axis.
 */
it('testGetLogscaleForX', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y,Y2,Y3\n" +
      "1,-1,2,3";

  // Kind of annoying that you need a DOM to test the object.
  var g = new Dygraph(graph, data, opts);

  assert.isFalse(!!g.getOptionForAxis('logscale', 'x'));
  assert.isFalse(!!g.getOptionForAxis('logscale', 'y'));

  g.updateOptions({ logscale : true });
  assert.isFalse(!!g.getOptionForAxis('logscale', 'x'));
  assert.isTrue(!!g.getOptionForAxis('logscale', 'y'));
});

// Helper to gather all warnings emitted by Dygraph constructor.
// Removes everything after the first open parenthesis in each warning.
// Returns them in a (possibly empty) list.
var getWarnings = function(div, data, opts) {
  var warnings = [];
  var oldWarn = console.warn;
  console.warn = function(message) {
    warnings.push(message.replace(/ \(.*/, ''));
  };
  try {
    new Dygraph(graph, data, opts);
  } catch (e) {
  }
  console.warn = oldWarn;
  return warnings;
};

it('testLogWarningForNonexistentOption', function() {
  if (!OPTIONS_REFERENCE) {
    return;  // this test won't pass in non-debug mode.
  }

  var data = "X,Y,Y2,Y3\n" +
      "1,-1,2,3";

  var expectWarning = function(opts, badOptionName) {
    DygraphOptions.resetWarnings_();
    var warnings = getWarnings(graph, data, opts);
    assert.deepEqual(['Unknown option ' + badOptionName], warnings);
  };
  var expectNoWarning = function(opts) {
    DygraphOptions.resetWarnings_();
    var warnings = getWarnings(graph, data, opts);
    assert.deepEqual([], warnings);
  };

  expectNoWarning({});
  expectWarning({nonExistentOption: true}, 'nonExistentOption');
  expectWarning({series: {Y: {nonExistentOption: true}}}, 'nonExistentOption');
  // expectWarning({Y: {nonExistentOption: true}});
  expectWarning({axes: {y: {anotherNonExistentOption: true}}}, 'anotherNonExistentOption');
  expectWarning({highlightSeriesOpts: {anotherNonExistentOption: true}}, 'anotherNonExistentOption');
  expectNoWarning({highlightSeriesOpts: {strokeWidth: 20}});
  expectNoWarning({strokeWidth: 20});
});

it('testOnlyLogsEachWarningOnce', function() {
  if (!OPTIONS_REFERENCE) {
    return;  // this test won't pass in non-debug mode.
  }

  var data = "X,Y,Y2,Y3\n" +
      "1,-1,2,3";

  var warnings1 = getWarnings(graph, data, {nonExistent: true});
  var warnings2 = getWarnings(graph, data, {nonExistent: true});
  assert.deepEqual(['Unknown option nonExistent'], warnings1);
  assert.deepEqual([], warnings2);
});

});
