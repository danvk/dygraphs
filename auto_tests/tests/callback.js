/** 
 * @fileoverview Test cases for the callbacks.
 *
 * @author uemit.seren@gmail.com (Ümit Seren)
 */

var CallbackTestCase = TestCase("callback");

CallbackTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
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

var runClosestTest = function(isStacked, widthNormal, widthHighlighted) {
  var h_row;
  var h_pts;
  var h_series;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data,
      {
	width: 600,
	height : 400,
	stackedGraph: isStacked,
	strokeWidth: widthNormal,
	highlightCircleSize: widthNormal * 2,

	highlightSeriesOpts: {
	  strokeWidth: widthHighlighted,
	  highlightCircleSize: widthHighlighted * 2,
	},
      });

  var highlightCallback	 =  function(e, x, pts, row, set) {
    h_row = row;
    h_pts = pts;
    h_series = set;
  };

  g.updateOptions({highlightCallback: highlightCallback}, true);

  if (isStacked) {
    DygraphOps.dispatchMouseMove(g, 12, 6.4);
    assertEquals(2, h_row);
    assertEquals('b', h_series);

    //now move up in the same row
    DygraphOps.dispatchMouseMove(g, 12, 6.6);
    assertEquals(2, h_row);
    assertEquals('a', h_series);
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
}

/**
 * Closest-point highlighting with legend CSS - show only closest series.
 */
CallbackTestCase.prototype.testClosestPointCallbackCss2 = function() {
  var css = "div.dygraph-legend > span { display: none; }\n" +
    "div.dygraph-legend > span.highlight { display: inline; }\n";
  this.styleSheet.innerHTML = css;
  runClosestTest(false, 10, 15);
  // TODO(klausw): verify that the highlighted line is drawn on top?
}
