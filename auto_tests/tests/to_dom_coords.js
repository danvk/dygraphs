/** 
 * @fileoverview Test cases for toDomCoords/toDataCoords
 *
 * @author danvk@google.com (Dan Vanderkam)
 */

var ToDomCoordsTestCase = TestCase("to-dom-coords");

ToDomCoordsTestCase._origFunc = Dygraph.getContext;
ToDomCoordsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(ToDomCoordsTestCase._origFunc(canvas));
  }
};

ToDomCoordsTestCase.prototype.tearDown = function() {
  Dygraph.getContext = ToDomCoordsTestCase._origFunc;
};

// Checks that toDomCoords and toDataCoords are inverses of one another.
ToDomCoordsTestCase.prototype.checkForInverses = function(g) {
  var x_range = g.xAxisRange();
  var y_range = g.yAxisRange();
  for (var i = 0; i <= 10; i++) {
    var x = x_range[0] + i / 10.0 * (x_range[1] - x_range[0]);
    for (var j = 0; j <= 10; j++) {
      var y = y_range[0] + j / 10.0 * (y_range[1] - y_range[0]);
      assertEquals(x, g.toDataXCoord(g.toDomXCoord(x)));
      assertEquals(y, g.toDataYCoord(g.toDomYCoord(y)));
    }
  }
}

ToDomCoordsTestCase.prototype.testPlainChart = function() {
  var opts = {
    drawXAxis: false,
    drawYAxis: false,
    drawXGrid: false,
    drawYGrid: false,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 400,
    height: 400,
    colors: ['#ff0000']
  }

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assertEquals([0, 100], g.toDataCoords(0, 0));
  assertEquals([0, 0], g.toDataCoords(0, 400));
  assertEquals([100, 100], g.toDataCoords(400, 0));
  assertEquals([100, 0], g.toDataCoords(400, 400));

  this.checkForInverses(g);

  // TODO(konigsberg): This doesn't really belong here. Move to its own test.
  var htx = g.hidden_ctx_;
  assertEquals(1, CanvasAssertions.numLinesDrawn(htx, '#ff0000'));
}

ToDomCoordsTestCase.prototype.testChartWithAxes = function() {
  var opts = {
    drawXAxis: true,
    xAxisHeight: 50,
    drawYAxis: true,
    yAxisLabelWidth: 100,
    axisTickSize: 0,
    drawXGrid: false,
    drawYGrid: false,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 450,
    colors: ['#ff0000']
  }

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assertEquals([0, 100], g.toDataCoords(100, 0));
  assertEquals([0, 0], g.toDataCoords(100, 400));
  assertEquals([100, 100], g.toDataCoords(500, 0));
  assertEquals([100, 0], g.toDataCoords(500, 400));

  this.checkForInverses(g);
}

ToDomCoordsTestCase.prototype.testChartWithAxesAndLabels = function() {
  var opts = {
    drawXAxis: true,
    xAxisHeight: 50,
    drawYAxis: true,
    yAxisLabelWidth: 100,
    axisTickSize: 0,
    drawXGrid: false,
    drawYGrid: false,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 500,
    colors: ['#ff0000'],
    ylabel: 'This is the y-axis',
    xlabel: 'This is the x-axis',
    xLabelHeight: 25,
    title: 'This is the title of the chart',
    titleHeight: 25
  }

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assertEquals([0, 100], g.toDataCoords(100, 25));
  assertEquals([0, 0], g.toDataCoords(100, 425));
  assertEquals([100, 100], g.toDataCoords(500, 25));
  assertEquals([100, 0], g.toDataCoords(500, 425));

  this.checkForInverses(g);
}

ToDomCoordsTestCase.prototype.testYAxisLabelWidth = function() {
  var opts = {
    yAxisLabelWidth: 100,
    axisTickSize: 0,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 500
  }

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assertEquals([100, 0], g.toDomCoords(0, 100));
  assertEquals([500, 486], g.toDomCoords(100, 0));

  g.updateOptions({ yAxisLabelWidth: 50 });
  assertEquals([50, 0], g.toDomCoords(0, 100));
  assertEquals([500, 486], g.toDomCoords(100, 0));
}

ToDomCoordsTestCase.prototype.testAxisTickSize = function() {
  var opts = {
    yAxisLabelWidth: 100,
    axisTickSize: 0,
    rightGap: 0,
    valueRange: [0, 100],
    dateWindow: [0, 100],
    width: 500,
    height: 500
  }

  var graph = document.getElementById("graph");
  g = new Dygraph(graph, [ [0,0], [100,100] ], opts);

  assertEquals([100, 0], g.toDomCoords(0, 100));
  assertEquals([500, 486], g.toDomCoords(100, 0));

  g.updateOptions({ axisTickSize : 50 });
  assertEquals([200, 0], g.toDomCoords(0, 100));
  assertEquals([500, 386], g.toDomCoords(100, 0));
}
