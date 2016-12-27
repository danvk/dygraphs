/**
 * @fileoverview Test cases for the interaction model.
 *
 * @author konigsberg@google.com (Robert Konigsbrg)
 */

import Dygraph from '../../src/dygraph';
import DygraphInteraction from '../../src/dygraph-interaction-model';
import DygraphOps from './DygraphOps';

describe("interaction-model", function() {

cleanupAfterEach();

var data1 = "X,Y\n" +
    "20,-1\n" +
    "21,0\n" +
    "22,1\n" +
    "23,0\n";

var data2 =
    "X,Y\n" +
    "1,10\n" +
    "2,20\n" +
    "3,30\n" +
    "4,40\n" +
    "5,120\n" +
    "6,50\n" +
    "7,70\n" +
    "8,90\n" +
    "9,50\n";

function getXLabels() {
  var x_labels = document.getElementsByClassName("dygraph-axis-label-x");
  var ary = [];
  for (var i = 0; i < x_labels.length; i++) {
    ary.push(x_labels[i].innerHTML);
  }
  return ary;
}

/*
it('testPan', function() {
  var originalXRange = g.xAxisRange();
  var originalYRange = g.yAxisRange(0);

  DygraphOps.dispatchMouseDown(g, xRange[0], yRange[0]);
  DygraphOps.dispatchMouseMove(g, xRange[1], yRange[0]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, xRange[1], yRange[0]);

  assert.closeTo(xRange, g.xAxisRange(), 0.2);
  // assert.closeTo(originalYRange, g.yAxisRange(0), 0.2); // Not true, it's something in the middle.

  var midX = (xRange[1] - xRange[0]) / 2;
  DygraphOps.dispatchMouseDown(g, midX, yRange[0]);
  DygraphOps.dispatchMouseMove(g, midX, yRange[1]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, midX, yRange[1]);

  assert.closeTo(xRange, g.xAxisRange(), 0.2);
  assert.closeTo(yRange, g.yAxisRange(0), 0.2);
});
*/

/**
 * This tests that when changing the interaction model so pan is used instead
 * of zoom as the default behavior, a standard click method is still called.
 */
it('testClickCallbackIsCalled', function() {
  var clicked;

  var clickCallback = function(event, x) {
    clicked = x;
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data1,
      {
        width: 100,
        height : 100,
        clickCallback : clickCallback
      });

  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseMove_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);

  assert.equal(20, clicked);
});

/**
 * This tests that when changing the interaction model so pan is used instead
 * of zoom as the default behavior, a standard click method is still called.
 */
it('testClickCallbackIsCalledOnCustomPan', function() {
  var clicked;

  var clickCallback = function(event, x) {
    clicked = x;
  };

  function customDown(event, g, context) {
    context.initializeMouseDown(event, g, context);
    DygraphInteraction.startPan(event, g, context);
  }

  function customMove(event, g, context) {
    DygraphInteraction.movePan(event, g, context);
  }

  function customUp(event, g, context) {
    DygraphInteraction.endPan(event, g, context);
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
  var g = new Dygraph(graph, data1, opts);

  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseMove_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);

  assert.equal(20, clicked);
});

var clickAt = function(g, x, y) {
  DygraphOps.dispatchMouseDown(g, x, y);
  DygraphOps.dispatchMouseMove(g, x, y);
  DygraphOps.dispatchMouseUp(g, x, y);
};

/**
 * This tests that clickCallback is still called with the nonInteractiveModel.
 */
it('testClickCallbackIsCalledWithNonInteractiveModel', function() {
  var clicked;

  // TODO(danvk): also test pointClickCallback here.
  var clickCallback = function(event, x) {
    clicked = x;
  };

  var opts = {
    width: 100,
    height : 100,
    clickCallback : clickCallback,
    interactionModel : DygraphInteraction.nonInteractiveModel_
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data1, opts);

  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseMove_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);

  assert.equal(20, clicked);
});

/**
 * A sanity test to ensure pointClickCallback is called.
 */
it('testPointClickCallback', function() {
  var clicked = null;
  var g = new Dygraph('graph', data2, {
    pointClickCallback: function(event, point) {
      clicked = point;
    }
  });

  clickAt(g, 4, 40);

  assert.isNotNull(clicked);
  assert.equal(4, clicked.xval);
  assert.equal(40, clicked.yval);
});

/**
 * A sanity test to ensure pointClickCallback is not called when out of range.
 */
it('testNoPointClickCallbackWhenOffPoint', function() {
  var clicked;
  var g = new Dygraph(document.getElementById("graph"), data2, {
    pointClickCallback : function(event, point) {
      clicked = point;
    }
  });

  clickAt(g, 5, 40);

  assert.isUndefined(clicked);
});

/**
 * Ensures pointClickCallback circle size is taken into account.
 */
it('testPointClickCallback_circleSize', function() {
  // TODO(konigsberg): Implement.
});

/**
 * Ensures that pointClickCallback is called prior to clickCallback
 */
it('testPointClickCallbackCalledPriorToClickCallback', function() {
  var counter = 0;
  var pointClicked;
  var clicked;
  var g = new Dygraph(document.getElementById("graph"), data2, {
    pointClickCallback : function(event, point) {
      counter++;
      pointClicked = counter;
    },
    clickCallback : function(event, point) {
      counter++;
      clicked = counter;
    }
  });

  clickAt(g, 4, 40);
  assert.equal(1, pointClicked);
  assert.equal(2, clicked);
});

/**
 * Ensures that when there's no pointClickCallback, clicking on a point still calls
 * clickCallback
 */
it('testClickCallback_clickOnPoint', function() {
  var clicked;
  var g = new Dygraph(document.getElementById("graph"), data2, {
    clickCallback : function(event, point) {
      clicked = 1;
    }
  });

  clickAt(g, 4, 40);
  assert.equal(1, clicked);
});

it('testIsZoomed_none', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  assert.isFalse(g.isZoomed());
  assert.isFalse(g.isZoomed("x"));
  assert.isFalse(g.isZoomed("y"));
});

it('testIsZoomed_x', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 130, 100);
  DygraphOps.dispatchMouseUp_Point(g, 130, 100);

  assert.isTrue(g.isZoomed());
  assert.isTrue(g.isZoomed("x"));
  assert.isFalse(g.isZoomed("y"));
});

it('testIsZoomed_y', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseMove_Point(g, 10, 30);
  DygraphOps.dispatchMouseUp_Point(g, 10, 30);

  assert.isTrue(g.isZoomed());
  assert.isFalse(g.isZoomed("x"));
  assert.isTrue(g.isZoomed("y"));
});

it('testIsZoomed_both', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  // Zoom x axis
  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 130, 100);
  DygraphOps.dispatchMouseUp_Point(g, 130, 100);

  // Now zoom y axis
  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 100, 130);
  DygraphOps.dispatchMouseUp_Point(g, 100, 130);


  assert.isTrue(g.isZoomed());
  assert.isTrue(g.isZoomed("x"));
  assert.isTrue(g.isZoomed("y"));
});

it('testIsZoomed_updateOptions_none', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  g.updateOptions({});

  assert.isFalse(g.isZoomed());
  assert.isFalse(g.isZoomed("x"));
  assert.isFalse(g.isZoomed("y"));
});

it('testIsZoomed_updateOptions_x', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  g.updateOptions({dateWindow: [-.5, .3]});
  assert.isTrue(g.isZoomed());
  assert.isTrue(g.isZoomed("x"));
  assert.isFalse(g.isZoomed("y"));
});

it('testIsZoomed_updateOptions_y', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  g.updateOptions({valueRange: [1, 10]});

  assert.isTrue(g.isZoomed());
  assert.isFalse(g.isZoomed("x"));
  assert.isTrue(g.isZoomed("y"));
});

it('testIsZoomed_updateOptions_both', function() {
  var g = new Dygraph(document.getElementById("graph"), data2, {});

  g.updateOptions({dateWindow: [-1, 1], valueRange: [1, 10]});

  assert.isTrue(g.isZoomed());
  assert.isTrue(g.isZoomed("x"));
  assert.isTrue(g.isZoomed("y"));
});


it('testCorrectAxisValueRangeAfterUnzoom', function() {
  var g = new Dygraph(document.getElementById("graph"),
      data2, {
        valueRange: [1, 50],
        dateWindow: [1, 9],
        animatedZooms:false
      });

  // Zoom x axis
  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 130, 100);
  DygraphOps.dispatchMouseUp_Point(g, 130, 100);

  // Zoom y axis
  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 100, 130);
  DygraphOps.dispatchMouseUp_Point(g, 100, 130);
  var currentYAxisRange = g.yAxisRange();
  var currentXAxisRange = g.xAxisRange();

  //check that the range for the axis has changed
  assert.notEqual(1, currentXAxisRange[0]);
  assert.notEqual(10, currentXAxisRange[1]);
  assert.notEqual(1, currentYAxisRange[0]);
  assert.notEqual(50, currentYAxisRange[1]);

  // unzoom by doubleclick.  This is really the order in which a browser
  // generates events, and we depend on it.
  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);
  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);
  DygraphOps.dispatchDoubleClick(g, null);

  // check if the range for both axis was reset to show the full data.
  assert.deepEqual(g.yAxisExtremes()[0], g.yAxisRange());
  assert.deepEqual(g.xAxisExtremes(), g.xAxisRange());
});

/**
 * Ensures pointClickCallback is called when some points along the y-axis don't
 * exist.
 */
it('testPointClickCallback_missingData', function() {

  // There's a B-value at 2, but no A-value.
  var data =
    "X,A,B\n" +
    "1,,100\n"+
    "2,,110\n"+
    "3,140,120\n"+
    "4,130,110\n"+
    "";

  var clicked;
  var g = new Dygraph(document.getElementById("graph"), data, {
    pointClickCallback : function(event, point) {
      clicked = point;
    }
  });

  clickAt(g, 2, 110);

  assert.equal(2, clicked.xval);
  assert.equal(110, clicked.yval);
});

describe('animated zooms', function() {
  var oldDuration;

  before(function() {
    oldDuration = Dygraph.ANIMATION_DURATION;
    Dygraph.ANIMATION_DURATION = 100;  // speed up the animation for testing
  });
  after(function() {
    Dygraph.ANIMATION_DURATION = oldDuration;
  });

  it('should support animated zooms', function(done) {
    var data =
      "X,A,B\n" +
      "1,120,100\n"+
      "2,110,110\n"+
      "3,140,120\n"+
      "4,130,110\n";

    var ranges = [];

    var g = new Dygraph('graph', data, {
      animatedZooms: true,
    });

    // updating the dateWindow does not result in an animation.
    assert.deepEqual([1, 4], g.xAxisRange());
    g.updateOptions({dateWindow: [2, 4]});
    assert.deepEqual([2, 4], g.xAxisRange());

    g.updateOptions({
      // zoomCallback is called once when the animation is complete.
      zoomCallback: function(xMin, xMax) {
        assert.equal(1, xMin);
        assert.equal(4, xMax);
        assert.deepEqual([1, 4], g.xAxisRange());
        done();
      }
    }, false);

    // Zoom out -- resetZoom() _does_ produce an animation.
    g.resetZoom();
    assert.notDeepEqual([2, 4], g.xAxisRange());  // first frame is synchronous
    assert.notDeepEqual([1, 4], g.xAxisRange());

    // at this point control flow goes up to zoomCallback
  });

});

//bulk copied from "testCorrectAxisValueRangeAfterUnzoom"
//tests if the xRangePad is taken into account after unzoom.
it('testCorrectAxisPaddingAfterUnzoom', function() {
  var g = new Dygraph(document.getElementById("graph"),
      data2, {
        valueRange: [1, 50],
        dateWindow: [1, 9],
        xRangePad: 10,
        animatedZooms:false
      });

  var xExtremes = g.xAxisExtremes();
  var [ yExtremes ] = g.yAxisExtremes();

  // Zoom x axis
  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 130, 100);
  DygraphOps.dispatchMouseUp_Point(g, 130, 100);

  // Zoom y axis
  DygraphOps.dispatchMouseDown_Point(g, 100, 100);
  DygraphOps.dispatchMouseMove_Point(g, 100, 130);
  DygraphOps.dispatchMouseUp_Point(g, 100, 130);

  //check that the range for the axis has changed
  assert.notDeepEqual([1, 10], g.xAxisRange());
  assert.notDeepEqual([1, 50], g.yAxisRange());

  // unzoom by doubleclick.  This is really the order in which a browser
  // generates events, and we depend on it.
  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);
  DygraphOps.dispatchMouseDown_Point(g, 10, 10);
  DygraphOps.dispatchMouseUp_Point(g, 10, 10);
  DygraphOps.dispatchDoubleClick(g, null);

  // check if range for x-axis was reset to original value.
  assert.deepEqual(xExtremes, g.xAxisRange());
  assert.deepEqual(yExtremes, g.yAxisRange());
});

});
