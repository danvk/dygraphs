/**
 * @fileoverview Test cases for the per-axis grid options, including the new
 *               option "gridLinePattern".
 *
 * @author david.eberlein@ch.sauter-bc.com (Fr. Sauter AG)
 */
var GridPerAxisTestCase = TestCase("grid-per-axis");

GridPerAxisTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

GridPerAxisTestCase.origFunc = Dygraph.getContext;

GridPerAxisTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  Dygraph.getContext = function(canvas) {
    return new Proxy(GridPerAxisTestCase.origFunc(canvas));
  };
};

GridPerAxisTestCase.prototype.tearDown = function() {
  Dygraph.getContext = GridPerAxisTestCase.origFunc;
};

GridPerAxisTestCase.prototype.testIndependentGrids = function() {
  var opts = {
    width : 480,
    height : 320,
    errorBars : false,
    labels : [ "X", "Left", "Right" ],
    series : {
      Left : {
        axis : "y"
      },
      Right : {
        axis : "y2"
      }
    },
    axes : {
      y2 : {
        drawGrid : true,
        independentTicks : true
      }
    }
  };

  var data = [ [ 1, 0, 0 ], [ 2, 12, 88 ], [ 3, 88, 122 ], [ 4, 63, 273 ],
      [ 5, 110, 333 ] ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var htx = g.hidden_ctx_;

  // The expected gridlines
  var yGridlines = [ 0, 20, 40, 60, 80, 100, 120 ];
  var y2Gridlines = [ 0, 50, 100, 150, 200, 250, 300, 350 ];
  var gridlines = [ yGridlines, y2Gridlines ];

  function halfUp(x) {
    return Math.round(x) + 0.5;
  }
  function halfDown(y) {
    return Math.round(y) - 0.5;
  }

  var attrs = {}, x, y;
  x = halfUp(g.plotter_.area.x);
  // Step through y(0) and y2(1) axis
  for (var axis = 0; axis < 2; axis++) {
    // Step through all gridlines of the axis
    for (var i = 0; i < gridlines[axis].length; i++) {
      // Check the labels:
      var labels = Util.getYLabels(axis + 1);
      assertEquals("Expected label not found.", gridlines[axis][i], labels[i]);

      // Check that the grid was drawn.
      y = halfDown(g.toDomYCoord(gridlines[axis][i], axis));
      var p1 = [ x, y ];
      var p2 = [ x + g.plotter_.area.w, y ];
      CanvasAssertions.assertLineDrawn(htx, p1, p2, attrs);
    }
  }
};

GridPerAxisTestCase.prototype.testPerAxisGridColors = function() {
  var opts = {
    width : 480,
    height : 320,
    errorBars : false,
    labels : [ "X", "Left", "Right" ],
    series : {
      Left : {
        axis : "y"
      },
      Right : {
        axis : "y2"
      }
    },
    axes : {
      y : {
        gridLineColor : "#0000ff",
        gridLineWidth : 2
      },
      y2 : {
        drawGrid : true,
        independentTicks : true,
        gridLineColor : "#ff0000",
        gridLineWidth : 2,
      }
    }
  };
  var data = [ [ 1, 0, 0 ], [ 2, 12, 88 ], [ 3, 88, 122 ], [ 4, 63, 273 ],
      [ 5, 110, 333 ] ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // The expected gridlines
  var yGridlines = [ 20, 40, 60, 80, 100, 120 ];
  var y2Gridlines = [ 50, 100, 150, 200, 250, 300, 350 ];
  var gridlines = [ yGridlines, y2Gridlines ];
  var gridColors = [ [ 0, 0, 255, 255 ], [ 255, 0, 0, 255 ] ];

  function halfUp(x) {
    return Math.round(x) + 1;
  }
  function halfDown(y) {
    return Math.round(y) - 1;
  }

  var sampler = new PixelSampler(g);
  var x, y;
  x = halfUp(g.plotter_.area.x);
  // Step through y(0) and y2(1) axis
  for (var axis = 0; axis < 2; axis++) {
    // Step through all gridlines of the axis
    for (var i = 0; i < gridlines[axis].length; i++) {
      y = halfDown(g.toDomYCoord(gridlines[axis][i], axis));
      // Check the grid colors.
      assertEquals("Unexpected grid color found at pixel: x: " + x + "y: " + y,
          gridColors[axis], sampler.colorAtPixel(x, y));
    }
  }
};

GridPerAxisTestCase.prototype.testPerAxisGridWidth = function() {
  var opts = {
    width : 480,
    height : 320,
    errorBars : false,
    gridLineColor : "#ff0000",
    labels : [ "X", "Left", "Right" ],
    series : {
      Left : {
        axis : "y"
      },
      Right : {
        axis : "y2"
      }
    },
    axes : {
      x : {
        gridLineWidth : 4
      },
      y : {
        gridLineWidth : 2
      },
      y2 : {
        drawGrid : true,
        independentTicks : true,
        gridLineWidth : 1
      }
    }
  };
  var data = [ [ 1, 0, 0 ], [ 2, 12, 88 ], [ 3, 88, 122 ], [ 4, 63, 273 ],
      [ 5, 110, 333 ] ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // The expected gridlines
  var yGridlines = [ 20, 40, 60, 80 ];
  var y2Gridlines = [ 50, 100, 150, 200, 250, 350 ];
  var xGridlines = [ 2, 3, 4 ];
  var gridColor = [ 255, 0, 0, 255 ];
  var emptyColor = [ 0, 0, 0, 0 ];

  function halfUp(x) {
    return Math.round(x) + 1;
  }
  function halfDown(y) {
    return Math.round(y) - 1;
  }

  function alignX(x, width) { return Math.round(x) + (width & 1) / 2.0; }
  function alignY(y, width) { return Math.round(y) - (width & 1) / 2.0; }

  var sampler = new PixelSampler(g);
  var x, y;
  x = halfUp(g.plotter_.area.x) + 10;

  // y with 2 pixels width
  // Step through all gridlines of the axis
  for (var i = 0; i < yGridlines.length; i++) {
    var lineWidth = 2;
    y = alignY(g.toDomYCoord(yGridlines[i], 0), lineWidth);

    // Check the grid width.
    assertEquals("Unexpected y-grid color found: x: " + x
        + " y: " + (y - 2), emptyColor, sampler.colorAtPixel(x, y - 2));
    assertEquals("Unexpected y-grid color found: x: " + x
        + " y: " + (y - 1), gridColor, sampler.colorAtPixel(x, y - 1));
    assertEquals("Unexpected y-grid color found: x: " + x
        + " y: " + (y + 0), gridColor, sampler.colorAtPixel(x, y - 0));
    assertEquals("Unexpected y-grid color found: x: " + x
        + " y: " + (y + 1), emptyColor, sampler.colorAtPixel(x, y + 2));
  }

  // y2 with 1 pixel width
  // Step through all gridlines of the axis
  for (var i = 0; i < y2Gridlines.length; i++) {
    var lineWidth = 1;
    y = alignY(g.toDomYCoord(y2Gridlines[i], 1), lineWidth);

    // Check the grid width.
    assertEquals("Unexpected y2-grid color found: x: " + x
        + " y: " + (y - 1), emptyColor, sampler.colorAtPixel(x, y - 1));
    assertEquals("Unexpected y2-grid color found: x: " + x
        + " y: " + (y + 0), gridColor, sampler.colorAtPixel(x, y + 0));
    assertEquals("Unexpected y2-grid color found: x: " + x
        + " y: " + (y + 1), emptyColor, sampler.colorAtPixel(x, y + 1));
  }

  // Check the x axis grid
  y = halfDown(g.plotter_.area.y) + 10;
  for (var i = 0; i < xGridlines.length; i++) {
    var lineWidth = 4;
    x = alignX(g.toDomXCoord(xGridlines[i]), lineWidth);

    // Check the grid width.
    assertEquals("Unexpected y-grid color found: x: "
        + (x - 3) + "y: " + y, emptyColor, sampler.colorAtPixel(x - 3, y));
    assertEquals("Unexpected x-grid color found: " + "x: " + (x - 2)
        + " y: " + y, gridColor, sampler.colorAtPixel(x - 2, y));
    assertEquals("Unexpected x-grid color found: " + "x: " + (x - 1)
        + " y: " + y, gridColor, sampler.colorAtPixel(x - 1, y));
    assertEquals("Unexpected x-grid color found: " + "x: " + (x - 0)
        + " y: " + y, gridColor, sampler.colorAtPixel(x - 0, y));
    assertEquals("Unexpected x-grid color found: " + "x: " + (x + 1)
        + " y: " + y, gridColor, sampler.colorAtPixel(x + 1, y));
    assertEquals("Unexpected y-grid color found: x: " + (x + 2)
          + " y: " + y, emptyColor, sampler.colorAtPixel(x + 2, y));
  }
};

GridPerAxisTestCase.prototype.testGridLinePattern = function() {
  var opts = {
    width : 120,
    height : 320,
    errorBars : false,
    drawXGrid : false,
    labels : [ "X", "Left", "Right" ],
    colors : [ "rgba(0,0,0,0)", "rgba(0,0,0,0)" ],
    series : {
      Left : {
        axis : "y"
      },
      Right : {
        axis : "y2"
      }
    },
    axes : {
      x : {
        drawAxis : false
      },
      y : {
        drawAxis : false,
        gridLineColor : "#0000ff",
        gridLinePattern : [ 10, 10 ]
      }
    }
  };
  var data = [ [ 1, 0, 0 ], [ 2, 12, 88 ], [ 3, 88, 122 ], [ 4, 63, 273 ],
      [ 5, 110, 333 ] ];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // The expected gridlines
  var yGridlines = [ 0, 20, 40, 60, 80, 100, 120 ];

  function halfUp(x) {
    return Math.round(x) + 1;
  }
  function halfDown(y) {
    return Math.round(y) - 1;
  }

  var sampler = new PixelSampler(g);
  var x, y;
  // Step through all gridlines of the axis
  for (var i = 0; i < yGridlines.length; i++) {
    y = halfDown(g.toDomYCoord(yGridlines[i], 0));
    // Step through the pixels of the line and test the pattern.
    var x1 = g.plotter_.area.x + g.plotter_.area.w
    for (x = halfUp(g.plotter_.area.x); x < x1; x++) {
      // avoid checking the edge pixels since they differ depending on the OS.
      var pixelpos = x % 10;
      if(pixelpos < 1 || pixelpos > 8) continue;

      // Ignore alpha
      var drawnPixel = sampler.colorAtPixel(x, y).slice(0, 3);
      var pattern = (Math.floor((x) / 10)) % 2;
      switch (pattern) {
      case 0: // fill
        assertEquals("Unexpected filled grid-pattern color found at pixel: "
            + "x: " + x + " y: " + y, [ 0, 0, 255 ], drawnPixel);
        break;
      case 1: // no fill
        assertEquals("Unexpected empty grid-pattern color found at pixel: "
            + "x: " + x + " y: " + y, [ 0, 0, 0 ], drawnPixel);
        break;
      }
    }
  }
};

GridPerAxisTestCase.prototype.testGridLineWidths = function() {

  function halfUp(x) {
    return Math.round(x) + 1;
  }
  function alignY(y, width) {
    return Math.round(y) - (width & 1) / 2.0;
  }

  var gridLineWidths = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

  for (var i = 0; i < gridLineWidths.length; i++) {
    var gridLineWidth = gridLineWidths[i];
    var opts = {
      width : 120,
      height : 320,
      errorBars : false,
      labels : [ "X", "Left", "Right" ],
      colors : [ "rgba(0,0,0,0)", "rgba(0,0,0,0)" ],
      series : {
        Left : {
          axis : "y"
        },
        Right : {
          axis : "y2"
        }
      },
      axes : {
        x : {
          drawAxis : false,
          drawGrid : false,
        },
        y : {
          drawAxis : false,
          gridLineColor : "#ff0000",
          gridLineWidth : gridLineWidth
        }
      }
    };
    var data = [ [ 1, 0, 0 ], [ 2, 12, 88 ], [ 3, 88, 122 ], [ 4, 63, 273 ],
        [ 5, 110, 333 ] ];
    var graph = document.getElementById("graph");
    var g = new Dygraph(graph, data, opts);

    var sampler = new PixelSampler(g);

    var gridColor = [ 255, 0, 0, 255 ];

    // Just pick a single grid line to examine.
    var yGridLine = 60;

    var x = halfUp(g.plotter_.area.x) + 10;
    var yCenter = alignY(g.toDomYCoord(yGridLine, 0), gridLineWidth);

    // [yStart,yEnd] defines the range of pixels that are touched for this line.
    var yStart = Math.floor(yCenter - gridLineWidth / 2.0);
    var yEnd = yStart + gridLineWidth;

    // The pixel before the line should be untouched.
    assertEquals("Unexpected yStart color for lineWidth: " + gridLineWidth,
        [0, 0, 0, 0], sampler.colorAtPixel(x, yStart - 1));

    for (var y = yStart; y < yEnd; y++) {
      var col = sampler.colorAtPixel(x, y);
      assertEquals("Unexpected color for lineWidth: " + gridLineWidth
          + " found at y: " + y, gridColor, col);
    }

    // The pixel after the line should be untouched.
    assertEquals("Unexpected yEnd color lineWidth= " + gridLineWidth,
        [0, 0, 0, 0], sampler.colorAtPixel(x, yEnd));
  }
};
