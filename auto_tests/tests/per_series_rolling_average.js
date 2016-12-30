/**
 * @fileoverview Tests for per series rolling averages.
 *
 * @author Nick Hayday (nickhayday@mac.com) 
 */

import Dygraph from '../../src/dygraph';

import Util from './Util';

describe("per-series-rolling-average", function() {

cleanupAfterEach();

it('testPerSeriesRollingAverage', function() {
  var opts = {
    width: 480,
    height: 320,
      series: {
          Y: {
              rollPeriod: 1 }  
		  }
  };
  var data = "X,Y,Z\n" +
      "0,0,0\n" +
      "1,1,10\n" +
      "2,2,20\n" +
      "3,3,30\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 1 Z: 10", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 2 Z: 20", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 3 Z: 30", Util.getLegend());
  assert.equal(1, g.getOption("rollPeriod", "Y"));
  g.updateOptions({
    series: { Y: { rollPeriod: 2 } }
  });
  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5 Z: 10", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1.5 Z: 20", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 2.5 Z: 30", Util.getLegend());
  assert.equal(2, g.getOption("rollPeriod", "Y"));
  g.updateOptions({
    series: { Y: { rollPeriod: 3 },
              Z: { rollPeriod: 2 } }
  });
  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5 Z: 5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1 Z: 15", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 2 Z: 25", Util.getLegend());
  assert.equal(3, g.getOption("rollPeriod", "Y"));
  assert.equal(2, g.getOption("rollPeriod", "Z"));
  g.updateOptions({
    series: { Y: { rollPeriod: 1 },
              Z: { rollPeriod: 4 } }
  });
  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 1 Z: 5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 2 Z: 10", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 3 Z: 15", Util.getLegend());
  assert.equal(1, g.getOption("rollPeriod", "Y"));
  assert.equal(4, g.getOption("rollPeriod", "Z"));
});

it('testDefaultToGlobalRollingAverage', function() {
  var opts = {
    width: 480,
    height: 320,
    rollPeriod: 2,
      series: {
          Y: {
              rollPeriod: 1 }  
		  }
  };
  var data = "X,Y,Z\n" +
      "0,0,0\n" +
      "1,1,10\n" +
      "2,2,20\n" +
      "3,3,30\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 1 Z: 5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 2 Z: 15", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 3 Z: 25", Util.getLegend());
  assert.equal(1, g.getOption("rollPeriod", "Y"));
  assert.equal(2, g.getOption("rollPeriod", "Z"));
  assert.equal(2, g.getOption("rollPeriod"));
  g.updateOptions({
    series: { Y: { rollPeriod: 3 } }
  });
  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5 Z: 5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1 Z: 15", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 2 Z: 25", Util.getLegend());
  assert.equal(3, g.getOption("rollPeriod", "Y"));
  assert.equal(2, g.getOption("rollPeriod", "Z"));
  assert.equal(2, g.getOption("rollPeriod"));
  g.updateOptions({
     rollPeriod: 4 
  });
  g.setSelection(0); assert.equal("0: Y: 0 Z: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5 Z: 5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1 Z: 10", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 2 Z: 15", Util.getLegend());
  assert.equal(3, g.getOption("rollPeriod", "Y"));
  assert.equal(4, g.getOption("rollPeriod", "Z"));
  assert.equal(4, g.getOption("rollPeriod"));
});
});
