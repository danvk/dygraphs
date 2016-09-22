/**
 * @fileoverview Tests for rolling averages.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';

import Util from './Util';

describe("rolling-average", function() {

cleanupAfterEach();

it('testRollingAverage', function() {
  var opts = {
    width: 480,
    height: 320,
    rollPeriod: 1,
    showRoller: true
  };
  var data = "X,Y\n" +
      "0,0\n" +
      "1,1\n" +
      "2,2\n" +
      "3,3\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setSelection(0); assert.equal("0: Y: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 1", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 2", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 3", Util.getLegend());
  assert.equal(1, g.rollPeriod());

  g.updateOptions({rollPeriod: 2});
  g.setSelection(0); assert.equal("0: Y: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1.5", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 2.5", Util.getLegend());
  assert.equal(2, g.rollPeriod());

  g.updateOptions({rollPeriod: 3});
  g.setSelection(0); assert.equal("0: Y: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 2", Util.getLegend());
  assert.equal(3, g.rollPeriod());

  g.updateOptions({rollPeriod: 4});
  g.setSelection(0); assert.equal("0: Y: 0", Util.getLegend());
  g.setSelection(1); assert.equal("1: Y: 0.5", Util.getLegend());
  g.setSelection(2); assert.equal("2: Y: 1", Util.getLegend());
  g.setSelection(3); assert.equal("3: Y: 1.5", Util.getLegend());
  assert.equal(4, g.rollPeriod());
});

it('testRollBoxDoesntDisapper', function() {
  var opts = {
    showRoller: true
  };
  var data = "X,Y\n" +
      "0,0\n" +
      "1,1\n" +
      "2,2\n" +
      "3,3\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var roll_box = graph.getElementsByTagName("input");
  assert.equal(1, roll_box.length);
  assert.equal("1", roll_box[0].value);

  graph.style.width = "500px";
  g.resize();
  assert.equal(1, roll_box.length);
  assert.equal("1", roll_box[0].value);
});

// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=426
it('testRollShortFractions', function() {
  var opts = {
    customBars: true,
    labels: ['x', 'A', 'B']
  };
  var data1 = [ [1, 10, [1, 20]] ];
  var data2 = [ [1, 10, [1, 20]],
                [2, 20, [1, 30]],
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data2, opts);

  var rolled1 = g.dataHandler_.rollingAverage(data1, 1, g);
  var rolled2 = g.dataHandler_.rollingAverage(data2, 1, g);

  assert.deepEqual(rolled1[0], rolled2[0]);
});

it('testRollCustomBars', function() {
  var opts = {
    customBars: true,
    rollPeriod: 2,
    labels: ['x', 'A']
  };
  var data = [ [1, [1, 10, 20]],
               [2, [1, 20, 30]],
               [3, [1, 30, 40]],
               [4, [1, 40, 50]]
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  var rolled = getRolledData(g, data, 1, 2);
  assert.deepEqual([1, 10, [1, 20]], rolled[0]);
  assert.deepEqual([2, 15, [1, 25]], rolled[1]);
  assert.deepEqual([3, 25, [1, 35]], rolled[2]);
  assert.deepEqual([4, 35, [1, 45]], rolled[3]);
});

it('testRollErrorBars', function() {
  var opts = {
    errorBars: true,
    rollPeriod: 2,
    labels: ['x', 'A']
  };
  var data = [ [1, [10, 1]],
               [2, [20, 1]],
               [3, [30, 1]],
               [4, [40, 1]]
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  var rolled = getRolledData(g, data, 1, 2);
  assert.deepEqual([1, 10, [8, 12]], rolled[0]);
 
  // variance = sqrt( pow(error) * rollPeriod)
  var variance = Math.sqrt(2);
  for (var i=1;i<data.length;i++) {
    var value = data[i][1][0] - 5;
    assert.equal(value, rolled[i][1], "unexpected rolled average");
    assert.equal(value - variance, rolled[i][2][0], "unexpected rolled min");
    assert.equal(value + variance, rolled[i][2][1], "unexpected rolled max");
  }
});

it('testRollFractions', function() {
  var opts = {
    fractions: true,
    rollPeriod: 2,
    labels: ['x', 'A']
  };
  var data = [ [1, [1, 10]],
               [2, [2, 10]],
               [3, [3, 10]],
               [4, [4, 10]]
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  var rolled = getRolledData(g, data, 1, 2);
  assert.deepEqual([1, 10], rolled[0]);
  assert.deepEqual([2, 15], rolled[1]);
  assert.deepEqual([3, 25], rolled[2]);
  assert.deepEqual([4, 35], rolled[3]);
});

it('testRollFractionsBars', function() {
  var opts = {
    fractions: true,
    errorBars: true,
    wilsonInterval: false,
    rollPeriod: 2,
    labels: ['x', 'A']
  };
  var data = [ [1, [1, 10]],
               [2, [2, 10]],
               [3, [3, 10]],
               [4, [4, 10]]
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  var rolled = getRolledData(g, data, 1, 2);

  // precalculated rounded values expected
  var values = [10, 15, 25, 35];
  var lows = [-9, -1, 6, 14];
  var highs = [29, 31, 44, 56];

  for (var i=0;i<data.length;i++) {
    assert.equal(values[i], Math.round(rolled[i][1]), "unexpected rolled average");
    assert.equal(lows[i], Math.round(rolled[i][2][0]), "unexpected rolled min");
    assert.equal(highs[i], Math.round(rolled[i][2][1]), "unexpected rolled max");
  }
});

it('testRollFractionsBarsWilson', function() {
  var opts = {
    fractions: true,
    errorBars: true,
    wilsonInterval: true,
    rollPeriod: 2,
    labels: ['x', 'A']
  };
  var data = [ [1, [1, 10]],
               [2, [2, 10]],
               [3, [3, 10]],
               [4, [4, 10]]
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  var rolled = getRolledData(g, data, 1, 2);

  //precalculated rounded values expected
  var values = [10, 15, 25, 35];
  var lows = [2, 5, 11, 18];
  var highs = [41, 37, 47, 57];

  for (var i=0;i<data.length;i++) {
    assert.equal(values[i], Math.round(rolled[i][1]), "unexpected rolled average");
    assert.equal(lows[i], Math.round(rolled[i][2][0]), "unexpected rolled min");
    assert.equal(highs[i], Math.round(rolled[i][2][1]), "unexpected rolled max");
  }
});

var getRolledData = function(g, data, seriesIdx, rollPeriod){
  var options = g.attributes_;
  return g.dataHandler_.rollingAverage(g.dataHandler_.extractSeries(data, seriesIdx, options), rollPeriod, options);
};

});
