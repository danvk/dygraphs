/**
 * @fileoverview Tests for per-series options.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
var Tests for per-series options.

perSeriesTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

perSeriesTestCase.prototype.tearDown = function() {
};


perSeriesTestCase.prototype.testPerSeriesFill = function() {
  var opts = {
    width: 480,
    height: 320,
    drawXGrid: false,
    drawYGrid: false,
    drawXAxis: false,
    drawYAxis: false,
    Y: { fillGraph: true },
    colors: [ '#FF0000', '#0000FF' ],
    fillAlpha: 0.15
  };
  var data = "X,Y,Z\n" +
      "1,0,0\n" +
      "2,0,1\n" +
      "3,0,1\n" +
      "4,0,0\n" +
      "5,0,0\n" +
      "6,1,0\n" +
      "7,1,0\n" +
      "8,0,0\n"
  ;

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, data, opts);

  var sampler = new PixelSampler(g);

  // Inside of the "Z" bump -- no fill.
  assertEquals([0,0,0,0], sampler.colorAtCoordinate(2.5, 0.5));

  // Inside of the "Y" bump -- filled in.
  assertEquals([255,0,0,38], sampler.colorAtCoordinate(6.5, 0.5));
};

perSeriesTestCase.prototype.testOldStyleSeries = function() {
  var opts = {
    pointSize : 5
    Y: { pointSize : 4 },
  };
  var data = "X,Y,Z\n1,0,0\n";
  g = new Dygraph("Graph", data, opts);

  assertEquals(5, g.getOption("pointSize"));
  assertEquals(4, g.getOption("pointSize", "Y"));
  assertEquals(5, g.getOption("pointSize", "Z"));
};

