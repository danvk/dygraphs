/**
 * @fileoverview Test cases for the per-axis grid options, including the new
 *               option "gridLinePattern".
 * 
 * @author david.eberlein@ch.sauter-bc.com (Fr. Sauter AG)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';

import Proxy from './Proxy';
import CanvasAssertions from './CanvasAssertions';
import Util from './Util';
import PixelSampler from './PixelSampler';

describe("grid-per-axis", function() {

cleanupAfterEach();
useProxyCanvas(utils, Proxy);

it('testIndependentGrids', function() {
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
  for ( var axis = 0; axis < 2; axis++) {
    // Step through all gridlines of the axis
    for ( var i = 0; i < gridlines[axis].length; i++) {
      // Check the labels:
      var labels = Util.getYLabels(axis + 1);
      assert.equal(gridlines[axis][i], labels[i], "Expected label not found.");

      // Check that the grid was drawn.
      y = halfDown(g.toDomYCoord(gridlines[axis][i], axis));
      var p1 = [ x, y ];
      var p2 = [ x + g.plotter_.area.w, y ];
      CanvasAssertions.assertLineDrawn(htx, p1, p2, attrs);
    }
  }
});

it('testPerAxisGridColors', function() {
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
  var htx = g.hidden_ctx_;

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
  var x, y;
  x = halfUp(g.plotter_.area.x);
  var sampler = new PixelSampler(g);
  // Step through y(0) and y2(1) axis
  for ( var axis = 0; axis < 2; axis++) {
    // Step through all gridlines of the axis
    for ( var i = 0; i < gridlines[axis].length; i++) {
      y = halfDown(g.toDomYCoord(gridlines[axis][i], axis));
      // Check the grid colors.
      assert.deepEqual(gridColors[axis], sampler.colorAtPixel(x, y),
          "Unexpected grid color found at pixel: x: " + x + "y: " + y);
    }
  }
});

it('testPerAxisGridWidth', function() {
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
  var htx = g.hidden_ctx_;

  // The expected gridlines
  var yGridlines = [ 20, 40, 60, 80 ];
  var y2Gridlines = [ 50, 100, 150, 200, 250, 350 ];
  var gridlines = [ yGridlines, y2Gridlines ];
  var xGridlines = [ 2, 3, 4 ];
  var gridColor = [ 255, 0, 0 ];
  var emptyColor = [ 0, 0, 0 ];

  function halfUp(x) {
    return Math.round(x) + 1;
  }
  function halfDown(y) {
    return Math.round(y) - 1;
  }
  var x, y;
  x = halfUp(g.plotter_.area.x + 10);

  var sampler = new PixelSampler(g);
  // Step through y(0) and y2(1) axis
  for ( var axis = 0; axis < 2; axis++) {
    // Step through all gridlines of the axis
    for ( var i = 0; i < gridlines[axis].length; i++) {
      y = halfDown(g.toDomYCoord(gridlines[axis][i], axis));
      // Ignore the alpha value

      // FIXME(pholden): this test fails with a context pixel ratio of 2.
      var drawnPixeldown2 = sampler.rgbAtPixel(x, y - 2);
      var drawnPixeldown1 = sampler.rgbAtPixel(x, y - 1);
      var drawnPixel = sampler.rgbAtPixel(x, y);
      var drawnPixelup1 = sampler.rgbAtPixel(x, y + 1);
      var drawnPixelup2 = sampler.rgbAtPixel(x, y + 2);
      // Check the grid width.
      switch (axis) {
      case 0: // y with 2 pixels width
        assert.deepEqual(emptyColor, drawnPixeldown2, "Unexpected y-grid color found at pixel: x: " + x + "y: " + y);
        assert.deepEqual(gridColor, drawnPixeldown1, "Unexpected y-grid color found at pixel: x: " + x + "y: " + y);
        assert.deepEqual(gridColor, drawnPixel, "Unexpected y-grid color found at pixel: x: " + x + "y: " + y);
        assert.deepEqual(gridColor, drawnPixelup1, "Unexpected y-grid color found at pixel: x: " + x + "y: " + y);
        assert.deepEqual(emptyColor, drawnPixelup2, "Unexpected y-grid color found at pixel: x: " + x + "y: " + y);
        break;
      case 1: // y2 with 1 pixel width
        assert.deepEqual(emptyColor, drawnPixeldown1, "Unexpected y2-grid color found at pixel: x: " + x + "y: " + y);
        assert.deepEqual(gridColor, drawnPixel, "Unexpected y2-grid color found at pixel: x: " + x + "y: " + y);
        assert.deepEqual(emptyColor, drawnPixelup1, "Unexpected y2-grid color found at pixel: x: " + x + "y: " + y);
        break;
      }
    }
  }

  // Check the x axis grid
  y = halfDown(g.plotter_.area.y) + 10;
  for ( var i = 0; i < xGridlines.length; i++) {
    x = halfUp(g.toDomXCoord(xGridlines[i]));
    assert.deepEqual(emptyColor, sampler.rgbAtPixel(x - 4, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
    assert.deepEqual(gridColor, sampler.rgbAtPixel(x - 3, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
    assert.deepEqual(gridColor, sampler.rgbAtPixel(x - 2, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
    assert.deepEqual(gridColor, sampler.rgbAtPixel(x - 1, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
    assert.deepEqual(gridColor, sampler.rgbAtPixel(x, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
    assert.deepEqual(gridColor, sampler.rgbAtPixel(x + 1, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
    assert.deepEqual(emptyColor, sampler.rgbAtPixel(x + 2, y),
                     "Unexpected x-grid color found at pixel: x: " + x + "y: " + y);
  }
});

// PhantomJS 1.9.x does not support setLineDash
// When Travis-CI updates to Phantom2, this can be re-enabled.
// See https://github.com/ariya/phantomjs/issues/12948
if (!navigator.userAgent.match(/PhantomJS\/1.9/)) {
it('testGridLinePattern', function() {
  var opts = {
    width : 480,
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
        drawGrid: false,
        drawAxis: false,
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
  var htx = g.hidden_ctx_;

  // The expected gridlines
  var yGridlines = [ 0, 20, 40, 60, 80, 100, 120 ];

  function halfUp(x) {
    return Math.round(x) + 1;
  }
  function halfDown(y) {
    return Math.round(y) - 1;
  }
  var x, y;
  var sampler = new PixelSampler(g);
  // Step through all gridlines of the axis
  for (var i = 0; i < yGridlines.length; i++) {
    y = halfDown(g.toDomYCoord(yGridlines[i], 0));
    // Step through the pixels of the line and test the pattern.
    for (x = halfUp(g.plotter_.area.x); x < g.plotter_.area.w; x++) {
      // avoid checking the edge pixels since they differ depending on the OS.
      var pixelpos = x % 10;
      if(pixelpos < 1 || pixelpos > 8) continue;

      // XXX: check what this looks like at master
      
      // Ignore alpha
      var drawnPixel = sampler.rgbAtPixel(x, y);
      var pattern = (Math.floor((x) / 10)) % 2;
      switch (pattern) {
      case 0: // fill
        assert.deepEqual([ 0, 0, 255 ], drawnPixel,
                         "Unexpected filled grid-pattern color found at pixel: x: " + x + " y: " + y);
        break;
      case 1: // no fill
        assert.deepEqual([ 0, 0, 0 ], drawnPixel,
                         "Unexpected empty grid-pattern color found at pixel: x: " + x + " y: " + y);
        break;
      }
    }
  }
});
}

});
