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

/**
 * @constructor
 */
var PixelSampler = function(dygraph) {
  this.dygraph_ = dygraph;

  var canvas = dygraph.hidden_;
  var ctx = canvas.getContext("2d");
  this.imageData_ = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * @param {number} x The screen x-coordinate at which to sample.
 * @param {number} y The screen y-coordinate at which to sample.
 * @return {Array.<number>} a 4D array: [R, G, B, alpha]. All four values
 * are in [0, 255]. A pixel which has never been touched will be [0,0,0,0].
 */
PixelSampler.prototype.colorAtPixel = function(x, y) {
  var i = 4 * (x + this.imageData_.width * y);
  var d = this.imageData_.data;
  return [d[i], d[i+1], d[i+2], d[i+3]];
};

/**
 * The method samples a color using data coordinates (not screen coordinates).
 * This will round your data coordinates to the nearest screen pixel before
 * sampling.
 * @param {number} x The data x-coordinate at which to sample.
 * @param {number} y The data y-coordinate at which to sample.
 * @return {Array.<number>} a 4D array: [R, G, B, alpha]. All four values
 * are in [0, 255]. A pixel which has never been touched will be [0,0,0,0].
 */
PixelSampler.prototype.colorAtCoordinate = function(x, y) {
  var dom_xy = this.dygraph_.toDomCoords(x, y);
  return this.colorAtPixel(Math.round(dom_xy[0]), Math.round(dom_xy[1]));
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

