/**
 * @fileoverview FILL THIS IN
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
var errorBarsTestCase = TestCase("error-bars");

errorBarsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

var _origFunc = Dygraph.getContext;
errorBarsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(_origFunc(canvas));
  }
};

errorBarsTestCase.prototype.tearDown = function() {
  Dygraph.getContext = _origFunc;
};

errorBarsTestCase.prototype.testNameGoesHere = function() {
  var opts = {
    width: 480,
    height: 320,
    drawXGrid: false,
    drawYGrid: false,
    drawXAxis: false,
    drawYAxis: false,
    customBars: true,
    errorBars: true
  };
  var data = [
               [1, [10,  10, 100]],
               [2, [15,  20, 110]],
               [3, [10,  30, 100]],
               [4, [15,  40, 110]],
               [5, [10, 120, 100]],
               [6, [15,  50, 110]],
               [7, [10,  70, 100]],
               [8, [15,  90, 110]],
               [9, [10,  50, 100]]
             ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  htx = g.hidden_ctx_;

  var attrs = {};  // TODO(danvk): fill in

  for (var i = 0; i < data.length - 1; i++) {
    // bottom line
    var xy1 = g.toDomCoords(data[i][0], data[i][1][0]);
    var xy2 = g.toDomCoords(data[i + 1][0], data[i + 1][1][0]);
    CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

    // top line
    xy1 = g.toDomCoords(data[i][0], data[i][1][2]);
    xy2 = g.toDomCoords(data[i + 1][0], data[i + 1][1][2]);
    CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

    // middle line
    xy1 = g.toDomCoords(data[i][0], data[i][1][1]);
    xy2 = g.toDomCoords(data[i + 1][0], data[i + 1][1][1]);
    CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);
  }

  g.updateOptions({logscale: true});

  for (var i = 0; i < data.length - 1; i++) {
    // bottom line
    var xy1 = g.toDomCoords(data[i][0], data[i][1][0]);
    var xy2 = g.toDomCoords(data[i + 1][0], data[i + 1][1][0]);
    CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

    // top line
    xy1 = g.toDomCoords(data[i][0], data[i][1][2]);
    xy2 = g.toDomCoords(data[i + 1][0], data[i + 1][1][2]);
    CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

    // middle line
    xy1 = g.toDomCoords(data[i][0], data[i][1][1]);
    xy2 = g.toDomCoords(data[i + 1][0], data[i + 1][1][1]);
    CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);
  }
};

