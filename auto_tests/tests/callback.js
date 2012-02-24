/** 
 * @fileoverview Test cases for the callbacks.
 *
 * @author uemit.seren@gmail.com (Ümit Seren)
 */

var CallbackTestCase = TestCase("callback");

CallbackTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
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
 * is properly called when the first series is hidden (setVisibility = false) 
 * 
 */
CallbackTestCase.prototype.testHighlightCallbackIsCalled = function() {
  var h_row;
  var h_pts;

  var highlightCallback = function(e, x, pts, row) {
    h_row = row;
    h_pts = pts;
  }; 

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data,
      {
        width: 100,
        height : 100,
        visibility: [false, true, true],
        highlightCallback : highlightCallback,
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
