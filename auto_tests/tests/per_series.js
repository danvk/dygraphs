/**
 * @fileoverview FILL THIS IN
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
var perSeriesTestCase = TestCase("per-series");

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

