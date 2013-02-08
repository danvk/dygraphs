/**
 * @fileoverview Tests for rolling averages.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
var rollingAverageTestCase = TestCase("rolling-average");

rollingAverageTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

rollingAverageTestCase.prototype.tearDown = function() {
};

rollingAverageTestCase.prototype.testRollingAverage = function() {
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

  g.setSelection(0); assertEquals("0: Y: 0", Util.getLegend());
  g.setSelection(1); assertEquals("1: Y: 1", Util.getLegend());
  g.setSelection(2); assertEquals("2: Y: 2", Util.getLegend());
  g.setSelection(3); assertEquals("3: Y: 3", Util.getLegend());
  assertEquals(1, g.rollPeriod());

  g.updateOptions({rollPeriod: 2});
  g.setSelection(0); assertEquals("0: Y: 0", Util.getLegend());
  g.setSelection(1); assertEquals("1: Y: 0.5", Util.getLegend());
  g.setSelection(2); assertEquals("2: Y: 1.5", Util.getLegend());
  g.setSelection(3); assertEquals("3: Y: 2.5", Util.getLegend());
  assertEquals(2, g.rollPeriod());

  g.updateOptions({rollPeriod: 3});
  g.setSelection(0); assertEquals("0: Y: 0", Util.getLegend());
  g.setSelection(1); assertEquals("1: Y: 0.5", Util.getLegend());
  g.setSelection(2); assertEquals("2: Y: 1", Util.getLegend());
  g.setSelection(3); assertEquals("3: Y: 2", Util.getLegend());
  assertEquals(3, g.rollPeriod());

  g.updateOptions({rollPeriod: 4});
  g.setSelection(0); assertEquals("0: Y: 0", Util.getLegend());
  g.setSelection(1); assertEquals("1: Y: 0.5", Util.getLegend());
  g.setSelection(2); assertEquals("2: Y: 1", Util.getLegend());
  g.setSelection(3); assertEquals("3: Y: 1.5", Util.getLegend());
  assertEquals(4, g.rollPeriod());
};

rollingAverageTestCase.prototype.testRollBoxDoesntDisapper = function() {
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
  assertEquals(1, roll_box.length);
  assertEquals("1", roll_box[0].value);

  graph.style.width = "500px";
  g.resize();
  assertEquals(1, roll_box.length);
  assertEquals("1", roll_box[0].value);
};

// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=426
rollingAverageTestCase.prototype.testRollShortFractions = function() {
  var opts = {
    customBars: true,
    labels: ['x', 'A']
  };
  var data1 = [ [1, [1, 10, 20]] ];
  var data2 = [ [1, [1, 10, 20]],
                [2, [1, 20, 30]],
              ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data1, opts);

  var rolled1 = g.rollingAverage(data1, 1);
  var rolled2 = g.rollingAverage(data2, 1);

  assertEquals(rolled1[0], rolled2[0]);
};
