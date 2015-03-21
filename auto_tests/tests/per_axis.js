/**
 * @fileoverview Tests for per-axis options.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var perAxisTestCase = TestCase("per-axis");

var _origGetContext = Dygraph.getContext;

var xAxisLineColor = "#00ffff";
var yAxisLineColor = "#ffff00";

var g, graph;

perAxisTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(_origGetContext(canvas));
  }

  var opts = {
    axes : {
      x : {
        drawAxis : false,
        drawGrid : false,
        gridLineColor : xAxisLineColor
      },
      y : {
        drawAxis : false,
        drawGrid : false,
        gridLineColor : yAxisLineColor
      }
    },
    colors: [ '#ff0000', '#0000ff' ]
  };

  var data = "X,Y,Z\n" +
      "1,1,0\n" +
      "8,0,1\n"
  ;
  graph = document.getElementById('graph');
  g = new Dygraph(graph, data, opts);
};

perAxisTestCase.prototype.tearDown = function() {
  Dygraph.getContext = _origGetContext;
};

perAxisTestCase.prototype.testDrawXAxis = function() {
  g.updateOptions({ axes : { x : { drawAxis: true }} });
  assertTrue(graph.getElementsByClassName('dygraph-axis-label-x').length > 0);
  assertTrue(graph.getElementsByClassName('dygraph-axis-label-y').length == 0);
}

perAxisTestCase.prototype.testDrawYAxis = function() {
  g.updateOptions({ axes : { y : { drawAxis: true }} });
  assertTrue(graph.getElementsByClassName('dygraph-axis-label-x').length ==0);
  assertTrue(graph.getElementsByClassName('dygraph-axis-label-y').length > 0);
}

perAxisTestCase.prototype.testDrawXGrid = function() {
  g.updateOptions({ axes : { x : { drawGrid : true }}});
  var htx = g.hidden_ctx_;
  assertTrue(CanvasAssertions.numLinesDrawn(htx, xAxisLineColor) > 0);
  assertTrue(CanvasAssertions.numLinesDrawn(htx, yAxisLineColor) == 0);
}

perAxisTestCase.prototype.testDrawYGrid = function() {
  g.updateOptions({ axes : { y : { drawGrid : true }}});
  var htx = g.hidden_ctx_;
  assertTrue(CanvasAssertions.numLinesDrawn(htx, xAxisLineColor) == 0);
  assertTrue(CanvasAssertions.numLinesDrawn(htx, yAxisLineColor) > 0);
}
