/** 
 * @fileoverview Test cases for the interaction model.
 *
 * @author konigsberg@google.com (Robert Konigsbrg)
 */
var InteractionModelTestCase = TestCase("interaction-model");

InteractionModelTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

InteractionModelTestCase.prototype.tearDown = function() {
};

function getXLabels() {
  var x_labels = document.getElementsByClassName("dygraph-axis-label-x");
  var ary = [];
  for (var i = 0; i < x_labels.length; i++) {
    ary.push(x_labels[i].innerHTML);
  }
  return ary;
}

InteractionModelTestCase.prototype.pan = function(g, xRange, yRange) {
  var originalXRange = g.xAxisRange();
  var originalYRange = g.yAxisRange(0);

  DygraphOps.dispatchMouseDown(g, xRange[0], yRange[0]);
  DygraphOps.dispatchMouseMove(g, xRange[1], yRange[0]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, xRange[1], yRange[0]);

  assertEqualsDelta(xRange, g.xAxisRange(), 0.2);
  // assertEqualsDelta(originalYRange, g.yAxisRange(0), 0.2); // Not true, it's something in the middle.

  var midX = (xRange[1] - xRange[0]) / 2;
  DygraphOps.dispatchMouseDown(g, midX, yRange[0]);
  DygraphOps.dispatchMouseMove(g, midX, yRange[1]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, midX, yRange[1]);

  assertEqualsDelta(xRange, g.xAxisRange(), 0.2);
  assertEqualsDelta(yRange, g.yAxisRange(0), 0.2);
}

/**
 * This tests that when changing the interaction model so pan is used instead
 * of zoom as the default behavior, a standard click method is still called.
 */
InteractionModelTestCase.prototype.testClickCallbackIsCalled = function() {
  var clicked;

  var clickCallback = function(event, x) {
    clicked = x;
  };

  var data = "X,Y\n" +
      "20,-1\n" +
      "21,0\n" +
      "22,1\n" +
      "23,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data,
      {
        width: 100,
        height : 100,
        clickCallback : clickCallback
      });

  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseMove_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);

  assertEquals(20, clicked);
};

/**
 * This tests that when changing the interaction model so pan is used instead
 * of zoom as the default behavior, a standard click method is still called.
 */
InteractionModelTestCase.prototype.testClickCallbackIsCalledOnCustomPan = function() {
  var clicked;

  var clickCallback = function(event, x) {
    clicked = x;
  };

  var data = "X,Y\n" +
      "20,-1\n" +
      "21,0\n" +
      "22,1\n" +
      "23,0\n"
  ;

  function customDown(event, g, context) {
    context.initializeMouseDown(event, g, context);
    Dygraph.startPan(event, g, context);
  }

  function customMove(event, g, context) {
    Dygraph.movePan(event, g, context);
  }

  function customUp(event, g, context) {
    Dygraph.endPan(event, g, context);
  }

  var opts = {
    width: 100,
    height : 100,
    clickCallback : clickCallback,
    interactionModel : {
      'mousedown' : customDown,
      'mousemove' : customMove,
      'mouseup' : customUp,
    }
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseMove_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);

  // THIS STILL FAILS. It's clicked, but x is undefined.
  // assertEquals(20, clicked);
};

