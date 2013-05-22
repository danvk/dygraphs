/**
 * @fileoverview Tests using the "stackedGraph" option.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */
var stackedTestCase = TestCase("stacked");

stackedTestCase._origGetContext = Dygraph.getContext;

stackedTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(stackedTestCase._origGetContext(canvas));
  }
};

stackedTestCase.prototype.tearDown = function() {
  Dygraph.getContext = stackedTestCase._origGetContext;
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

  // TODO(danvk): factor this and getPixel() into a utility usable by all tests.
  var ctx = g.hidden_ctx_;
  var imageData = ctx.getImageData(0, 0, 400, 300);

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

// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=358
stackedTestCase.prototype.testSelectionValues = function() {
  var opts = {
    stackedGraph: true
  };
  var data = "X,Y1,Y2\n" +
      "0,1,1\n" +
      "1,1,1\n" +
      "2,1,1\n" +
      "3,1,1\n"
  ;

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, data, opts);

  g.setSelection(0);

  assertEquals("0: Y1: 1 Y2: 1", Util.getLegend());

  // Verify that the behavior is correct with highlightSeriesOpts as well.
  g.updateOptions({
    highlightSeriesOpts: {
      strokeWidth: 10
    }
  });
  g.setSelection(0);
  assertEquals("0: Y1: 1 Y2: 1", Util.getLegend());

  g.setSelection(1);
  assertEquals("1: Y1: 1 Y2: 1", Util.getLegend());

  g.setSelection(0, 'Y2');
  assertEquals("0: Y1: 1 Y2: 1", Util.getLegend());
};

// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=176
stackedTestCase.prototype.testDuplicatedXValue = function() {
  var opts = {
    stackedGraph: true,
    fillAlpha: 0.15,
    colors: ['#00ff00'],
    width: 400,
    height: 300
  };
  var data = "X,Y1\n" +
      "0,1\n" +
      "1,1\n" +
      "2,1\n" +
      "2,1\n" +  // duplicate x-value!
      "3,1\n"
  ;

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, data, opts);

  assert(g.yAxisRange()[1] < 2);

  assertEquals([0, 255, 0, 38], Util.samplePixel(g.hidden_, 200, 250));
  assertEquals([0, 255, 0, 38], Util.samplePixel(g.hidden_, 317, 250));
}

// Validates regression when null values in stacked graphs show up
// incorrectly in the legend.
stackedTestCase.prototype.testNullValues = function() {
  var opts = {
    stackedGraph: true,
    stepPlot:true
  };
  var data = "X,Y1,Y2,Y3\n" +
      "0,-5,-1,1\n" +
      "1,1,,1\n" +
      "2,1,2,3\n" +
      "3,3,,4\n" +
      "4,3,2,3\n"
  ;

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, data, opts);

  g.setSelection(0);
  assertEquals("0: Y1: -5 Y2: -1 Y3: 1", Util.getLegend());

  g.setSelection(1);
  assertEquals("1: Y1: 1 Y3: 1", Util.getLegend());

  g.setSelection(2);
  assertEquals("2: Y1: 1 Y2: 2 Y3: 3", Util.getLegend());

  g.setSelection(3);
  assertEquals("3: Y1: 3 Y3: 4", Util.getLegend());

  g.setSelection(4);
  assertEquals("4: Y1: 3 Y2: 2 Y3: 3", Util.getLegend());
};

// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=438
stackedTestCase.prototype.testMissingValueAtZero = function() {
  var opts = {
    stackedGraph: true
  };
  var data = "X,Y1,Y2\n" +
      "0,,1\n" +
      "1,1,2\n" +
      "2,,3\n"
  ;

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, data, opts);

  g.setSelection(0);
  assertEquals("0: Y2: 1", Util.getLegend());

  g.setSelection(1);
  assertEquals("1: Y1: 1 Y2: 2", Util.getLegend());

  g.setSelection(2);
  assertEquals("2: Y2: 3", Util.getLegend());
};

stackedTestCase.prototype.testInterpolation = function() {
  var opts = {
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    stackedGraph: true
  };

  var data = [
    [100, 1, 2, 1],
    [101, 1, 2, 2],
    [102, 1, 2, NaN],
    [103, 1, 2, 4],
    [104, NaN, NaN, NaN],
    [105, 1, 2, 6],
    [106, 1, 2, 7],
    [107, 1, 2, 8],
    [108, 1, 2, NaN],
    [109, 1, NaN, 10]];

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, data, opts);

  var htx = g.hidden_ctx_;
  var attrs = {};

  // Check that lines are drawn at the expected positions, using
  // interpolated values for missing data.
  var xy1 = g.toDomCoords(102, 6);
  var xy2 = g.toDomCoords(103, 7);
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);
  var xy1 = g.toDomCoords(102, 5);
  var xy2 = g.toDomCoords(103, 6);
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);
  var xy1 = g.toDomCoords(108, 12);
  var xy2 = g.toDomCoords(109, 13);
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

  // Check that the expected number of line segments gets drawn
  // for each series. Gaps don't get a line.
  assertEquals(7, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
  assertEquals(6, CanvasAssertions.numLinesDrawn(htx, '#00ff00'));
  assertEquals(3, CanvasAssertions.numLinesDrawn(htx, '#0000ff'));

  // Check that the selection returns the original (non-stacked)
  // values and skips gaps.
  g.setSelection(1);
  assertEquals("101: Y1: 1 Y2: 2 Y3: 2", Util.getLegend());

  g.setSelection(8);
  assertEquals("108: Y1: 1 Y2: 2", Util.getLegend());

  g.setSelection(9);
  assertEquals("109: Y1: 1 Y3: 10", Util.getLegend());
};
