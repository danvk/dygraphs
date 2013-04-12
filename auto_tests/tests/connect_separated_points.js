/**
 * @fileoverview Test cases for the option "connectSeparatedPoints" especially for the scenario where not every series has a value for each timestamp.
 *
 * @author julian.eichstaedt@ch.sauter-bc.com (Fr. Sauter AG)
 */
var ConnectSeparatedPointsTestCase = TestCase("connect-separated-points");

ConnectSeparatedPointsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

ConnectSeparatedPointsTestCase.origFunc = Dygraph.getContext;

ConnectSeparatedPointsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(ConnectSeparatedPointsTestCase.origFunc(canvas));
  };
};

ConnectSeparatedPointsTestCase.prototype.tearDown = function() {
  Dygraph.getContext = ConnectSeparatedPointsTestCase.origFunc;
};

ConnectSeparatedPointsTestCase.prototype.testEdgePointsSimple = function() {
  var opts = {
    width: 480,
    height: 320,
//    drawXGrid: false,
//    drawYGrid: false,
//    drawXAxis: false,
//    drawYAxis: false,
//    errorBars: false,
    labels: ["x", "series1", "series2", "series3"],
    connectSeparatedPoints: true,
    drawPoints: true,
    dateWindow: [1.5,6.5]
  };

  var data = [
              [-7,-1000,0,null],
              [-6,null,2,null],
              [-5,null,2,null],
              [-4,null,2,null],
              [-3,null,2,null],
              [-2,null,2,null],
              [-1,null,2,null],
              [0,null,2,null],
              [1,null,4,null],
              [2,0.5,0,null],
              [3,1,-1,5],
              [4,2,-2,6],
              [5,2.5,-2.5,7],
              [6,3,-3,4],
              [7,4,null,5],
              [8,4,-10,6],
             ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  
  htx = g.hidden_ctx_;

  var attrs = {};  

  //Test if series1 is drawn correctly.
  //------------------------------------
  
  // The first point of the first series
  var x1 = data[0][0];
  var y1 = data[0][1];
  var xy1 = g.toDomCoords(x1, y1);
  
  // The third (the second valid) point of the first series
  // This series has no value at the second position.
  var x2 = data[9][0];
  var y2 = data[9][1];
  var xy2 = g.toDomCoords(x2, y2);
  
  // Check if both points are connected at the left edge of the canvas and if the option "connectSeparatedPoints" works properly
  // even if the point is outside the visible range and only one series has a valid value for this point.
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

  //Test if series2 is drawn correctly.
  //------------------------------------
  
  // The sixth point of the second series
  // Use the sixth and NOT the seventh point despite this series has eight points 
  // since this series has no value at the seventh position.
  var x1 = data[13][0];
  var y1 = data[13][2];
  var xy1 = g.toDomCoords(x1, y1);
  
  // The last point of the second series.
  var x2 = data[15][0];
  var y2 = data[15][2];
  var xy2 = g.toDomCoords(x2, y2);
  
  // Check if both points are connected at the right edge of the canvas and if the option "connectSeparatedPoints" works properly
  // even if the point is outside the visible range and only one series has a valid value for this point.
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);
};

ConnectSeparatedPointsTestCase.prototype.testEdgePointsStacked = function() {
  var opts = {
    width: 480,
    height: 320,
//    drawXGrid: false,
//    drawYGrid: false,
//    drawXAxis: false,
//    drawYAxis: false,
//    errorBars: false,
    labels: ["x", "series1", "series2", "series3"],
    connectSeparatedPoints: true,
    drawPoints: true,
    stackedGraph: true,
    dateWindow: [1.5,6.5]
  };

  var data = [
              [-7,null,1,0],
              [-6,null,3,null],
              [-5,null,3,null],
              [-4,null,3,null],
              [-3,null,3,null],
              [-2,null,3,null],
              [-1,null,3,null],
              [0,null,3,null],
              [1,null,3,null],
              [2,null,1,3],
              [3,3,1,1],
              [4,4,2,2],
              [5,3,2,2],
              [6,3,1,3],
              [7,4,null,2],
              [8,5,2,1],
             ];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  
  htx = g.hidden_ctx_;

  var attrs = {};  

  //Test if series1 is drawn correctly.
  //------------------------------------
  
  // The first point of the first series
  var x1 = data[0][0];
  var y1 = data[0][1];
  var xy1 = g.toDomCoords(x1, y1);
  
  // The third (the second valid) point of the first series
  // This series has no value at the second position.
  var x2 = data[9][0];
  var y2 = data[9][1];
  var xy2 = g.toDomCoords(x2, y2);
  
  // Check if both points are connected at the left edge of the canvas and if the option "connectSeparatedPoints" works properly
  // even if the point is outside the visible range and only one series has a valid value for this point.
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);

  //Test if series2 is drawn correctly.
  //------------------------------------
  
  // The sixth point of the second series
  // Use the sixth and NOT the seventh point despite this series has eight points 
  // since this series has no value at the seventh position.
  var x1 = data[13][0];
  var y1 = data[13][2];
  var xy1 = g.toDomCoords(x1, y1);
  
  // The last point of the second series.
  var x2 = data[15][0];
  var y2 = data[15][2];
  var xy2 = g.toDomCoords(x2, y2);
  
  // Check if both points are connected at the right edge of the canvas and if the option "connectSeparatedPoints" works properly
  // even if the point is outside the visible range and only one series has a valid value for this point.
  CanvasAssertions.assertLineDrawn(htx, xy1, xy2, attrs);
};
