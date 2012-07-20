/**
 * @fileoverview Tests using the "stackedGraph" option.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */
var stackedTestCase = TestCase("stacked");

stackedTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

stackedTestCase.prototype.tearDown = function() {
};

stackedTestCase.prototype.testCorrectColors = function() {
  var opts = {
    width: 400,
    height: 300,
    stackedGraph: true,
    drawXGrid: false,
    drawYGrid: false,
    drawXAxis: false,
    drawYAxis: false,
    valueRange: [0, 3],
    colors: ['#00ff00', '#0000ff'],
    fillAlpha: 0.15
  };
  var data = "X,Y1,Y2\n" +
      "0,1,1\n" +
      "1,1,1\n" +
      "2,1,1\n" +
      "3,1,1\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // y pixels 299-201 = y2 = transparent blue
  // y pixel 200 = y2 line (blue)
  // y pixels 199-101 = y1 = transparent green
  // y pixel 100 = y1 line (green)
  // y pixels 0-99 = nothing (white)

  var canvas = g.hidden_ctx_;
  var imageData = canvas.getImageData(0, 0, 400, 300);

  assertEquals(400, imageData.width);
  assertEquals(300, imageData.height);

  // returns an (r, g, b, alpha) tuple for the pixel.
  // values are in [0, 255].
  var getPixel = function(imageData, x, y) {
    var i = 4 * (x + imageData.width * y);
    var d = imageData.data;
    return [d[i], d[i+1], d[i+2], d[i+3]];
  };

  // 38 = round(0.15 * 255)
  assertEquals([0, 0, 255, 38], getPixel(imageData, 200, 250));
  assertEquals([0, 255, 0, 38], getPixel(imageData, 200, 150));
};
