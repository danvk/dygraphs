/**
 * @fileoverview Test cases for the callbacks.
 *
 * @author uemit.seren@gmail.com (Ümit Seren)
 */

var CallbackTestCase = TestCase("callback");

CallbackTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div><div id='selection'></div>";
  this.styleSheet = document.createElement("style");
  this.styleSheet.type = "text/css";
  document.getElementsByTagName("head")[0].appendChild(this.styleSheet);
};

CallbackTestCase.prototype.tearDown = function() {
};

var data = "X,a\,b,c\n" +
 "10,-1,1,2\n" +
 "11,0,3,1\n" +
 "12,1,4,2\n" +
 "13,0,2,3\n";


/**
 * This tests that when the function idxToRow_ returns the proper row and the onHiglightCallback
 * is properly called when the  first series is hidden (setVisibility = false)
 *
 */
CallbackTestCase.prototype.testHighlightCallbackIsCalled = function() {
  var h_row;
  var h_pts;

  var highlightCallback  =  function(e, x, pts, row) {
    h_row = row;
    h_pts = pts;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data,
      {
        width: 100,
        height: 100,
        visibility: [false, true, true],
        highlightCallback: highlightCallback
      });

  DygraphOps.dispatchMouseMove(g, 13, 10);

  //check correct row is returned
  assertEquals(3, h_row);
  //check there are only two points (because first series is hidden)
  assertEquals(2, h_pts.length);
};


/**
 * Test that drawPointCallback isn't called when drawPoints is false
 */
CallbackTestCase.prototype.testDrawPointCallback_disabled = function() {
  var called = false;

  var callback = function() {
    called = true;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {
      drawPointCallback : callback,
    });

  assertFalse(called);
};

/**
 * Test that drawPointCallback is called when drawPoints is true
 */
CallbackTestCase.prototype.testDrawPointCallback_enabled = function() {
  var called = false;

  var callback = function() {
    called = true;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {
      drawPoints : true,
      drawPointCallback : callback
    });

  assertTrue(called);
};

/**
 * Test that drawPointCallback is called when drawPoints is true
 */
CallbackTestCase.prototype.testDrawPointCallback_pointSize = function() {
  var pointSize = 0;
  var count = 0;

  var callback = function(g, seriesName, canvasContext, cx, cy, color, pointSizeParam) {
    pointSize = pointSizeParam;
    count++;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, {
      drawPoints : true,
      drawPointCallback : callback
    });

  assertEquals(1.5, pointSize);
  assertEquals(12, count); // one call per data point.

  var g = new Dygraph(graph, data, {
      drawPoints : true,
      drawPointCallback : callback,
      pointSize : 8
    });

  assertEquals(8, pointSize);
};

/**
 * This tests that when the function idxToRow_ returns the proper row and the onHiglightCallback
 * is properly called when the first series is hidden (setVisibility = false)
 *
 */
CallbackTestCase.prototype.testDrawHighlightPointCallbackIsCalled = function() {
  var called = false;

  var drawHighlightPointCallback  = function() {
    called = true;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data,
      {
        width: 100,
        height : 100,
        drawHighlightPointCallback : drawHighlightPointCallback
      });

  assertFalse(called);
  DygraphOps.dispatchMouseMove(g, 13, 10);
  assertTrue(called);
};

/**
 * Test the closest-series highlighting methods for normal and stacked modes.
 * Also pass in line widths for plain and highlighted lines for easier visual
 * confirmation that the highlighted line is drawn on top of the others.
 */
var runClosestTest = function(isStacked, widthNormal, widthHighlighted) {
  var h_row;
  var h_pts;
  var h_series;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data,
      {
        width: 600,
        height: 400,
        visibility: [false, true, true],
        stackedGraph: isStacked,
        strokeWidth: widthNormal,
        strokeBorderWidth: 2,
        highlightCircleSize: widthNormal * 2,
        highlightSeriesBackgroundAlpha: 0.3,

        highlightSeriesOpts: {
          strokeWidth: widthHighlighted,
          highlightCircleSize: widthHighlighted * 2
        }
      });

  var highlightCallback  =  function(e, x, pts, row, set) {
    h_row = row;
    h_pts = pts;
    h_series = set;
    document.getElementById('selection').innerHTML='row=' + row + ', set=' + set;
  };

  g.updateOptions({highlightCallback: highlightCallback}, true);

  if (isStacked) {
    DygraphOps.dispatchMouseMove(g, 11.45, 1.4);
    assertEquals(1, h_row);
    assertEquals('c', h_series);

    //now move up in the same row
    DygraphOps.dispatchMouseMove(g, 11.45, 1.5);
    assertEquals(1, h_row);
    assertEquals('b', h_series);

    //and a bit to the right
    DygraphOps.dispatchMouseMove(g, 11.55, 1.5);
    assertEquals(2, h_row);
    assertEquals('c', h_series);
  } else {
    DygraphOps.dispatchMouseMove(g, 11, 1.5);
    assertEquals(1, h_row);
    assertEquals('c', h_series);

    //now move up in the same row
    DygraphOps.dispatchMouseMove(g, 11, 2.5);
    assertEquals(1, h_row);
    assertEquals('b', h_series);
  }

  return g;
};

/**
 * Test basic closest-point highlighting.
 */
CallbackTestCase.prototype.testClosestPointCallback = function() {
  runClosestTest(false, 1, 3);
}

/**
 * Test setSelection() with series name
 */
CallbackTestCase.prototype.testSetSelection = function() {
  var g = runClosestTest(false, 1, 3);
  assertEquals(1, g.attr_('strokeWidth', 'c'));
  g.setSelection(false, 'c');
  assertEquals(3, g.attr_('strokeWidth', 'c'));
}

/**
 * Test closest-point highlighting for stacked graph
 */
CallbackTestCase.prototype.testClosestPointStackedCallback = function() {
  runClosestTest(true, 1, 3);
}

/**
 * Closest-point highlighting with legend CSS - border around active series.
 */
CallbackTestCase.prototype.testClosestPointCallbackCss1 = function() {
  var css = "div.dygraph-legend > span { display: block; }\n" +
    "div.dygraph-legend > span.highlight { border: 1px solid grey; }\n";
  this.styleSheet.innerHTML = css;
  runClosestTest(false, 2, 4);
  this.styleSheet.innerHTML = '';
}

/**
 * Closest-point highlighting with legend CSS - show only closest series.
 */
CallbackTestCase.prototype.testClosestPointCallbackCss2 = function() {
  var css = "div.dygraph-legend > span { display: none; }\n" +
    "div.dygraph-legend > span.highlight { display: inline; }\n";
  this.styleSheet.innerHTML = css;
  runClosestTest(false, 10, 15);
  this.styleSheet.innerHTML = '';
  // TODO(klausw): verify that the highlighted line is drawn on top?
}

/**
 * This tests that closest point searches work for data containing NaNs.
 *
 * It's intended to catch a regression where a NaN Y value confuses the
 * closest-point algorithm, treating it as closer as any previous point.
 */
CallbackTestCase.prototype.testNaNData = function() {
  var dataNaN = [
    [10, -1, 1, 2],
    [11, 0, 3, 1],
    [12, 1, 4, NaN],
    [13, 0, 2, 3],
    [14, -1, 1, 4]];

  var h_row;
  var h_pts;

  var highlightCallback  =  function(e, x, pts, row) {
    h_row = row;
    h_pts = pts;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, dataNaN,
      {
        width: 600,
        height: 400,
        labels: ['x', 'a', 'b', 'c'],
        visibility: [false, true, true],
        highlightCallback: highlightCallback
      });

  DygraphOps.dispatchMouseMove(g, 10.1, 0.9);
  //check correct row is returned
  assertEquals(0, h_row);

  // Explicitly test closest point algorithms
  var dom = g.toDomCoords(10.1, 0.9);
  assertEquals(0, g.findClosestRow(dom[0]));

  var res = g.findClosestPoint(dom[0], dom[1]);
  assertEquals(0, res.row);
  assertEquals('b', res.seriesName);

  res = g.findStackedPoint(dom[0], dom[1]);
  assertEquals(0, res.row);
  assertEquals('c', res.seriesName);
};
