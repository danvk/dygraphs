/** 
 * @fileoverview Test cases for a graph contained in a scrolling div
 *
 * @author konigsberg@google.com (Robert Konigsbrg)
 */

import Dygraph from '../../src/dygraph';
import DygraphOps from './DygraphOps';

describe("scrolling-div", function() {

var point, g; 

beforeEach(function() {

var LOREM_IPSUM =
    "<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod\n" +
    "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\n" +
    "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo\n" +
    "consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse\n" +
    "cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat\n" +
    "non proident, sunt in culpa qui officia deserunt mollit anim id est\n" +
    "laborum.</p>";

  var testDiv = document.getElementById('graph');
  testDiv.innerHTML =
      "<div id='scroller' style='overflow: scroll; height: 450px; width: 800px;'>" +
      "<div id='graph-inner'></div>" +
      "<div style='height:100px; background-color:green;'>" + LOREM_IPSUM + " </div>" +
      "<div style='height:100px; background-color:red;'>" + LOREM_IPSUM + "</div>" +
      "</div>";

  // The old test runner had an 8px margin on the body
  // The Mocha test runner does not. We set it on the test div to keep the
  // coordinates the same.
  testDiv.style.margin = '8px';

  var data = [
      [ 10, 1 ],
      [ 20, 3 ],
      [ 30, 2 ],
      [ 40, 4 ],
      [ 50, 3 ],
      [ 60, 5 ],
      [ 70, 4 ],
      [ 80, 6 ] ];

  var graph = document.getElementById("graph-inner");

  point = null;
  g = new Dygraph(graph, data,
          {
            labels : ['a', 'b'],
            drawPoints : true,
            highlightCircleSize : 6,
            pointClickCallback : function(evt, p) {
              point = p;
            }
          }
      );
  
});

// This is usually something like 15, but for OS X Lion and its auto-hiding
// scrollbars, it's 0. This is a large enough difference that we need to
// consider it when synthesizing clicks.
// Adapted from http://davidwalsh.name/detect-scrollbar-width
var detectScrollbarWidth = function() {
  // Create the measurement node
  var scrollDiv = document.createElement("div");
  scrollDiv.style.width = "100px";
  scrollDiv.style.height = "100px";
  scrollDiv.style.overflow = "scroll";
  scrollDiv.style.position = "absolute";
  scrollDiv.style.top = "-9999px";
  document.body.appendChild(scrollDiv);

  // Get the scrollbar width
  var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

  // Delete the DIV 
  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
};

/**
 * This tests that when the nested div is unscrolled, things work normally.
 */
it('testUnscrolledDiv', function() {

  document.getElementById('scroller').scrollTop = 0;

  var clickOn4_40 = {
    clientX: 244,
    clientY: 131,
    screenX: 416,
    screenY: 320
  };

  DygraphOps.dispatchCanvasEvent(g, DygraphOps.createEvent(clickOn4_40, { type : 'mousemove' }));
  DygraphOps.dispatchCanvasEvent(g, DygraphOps.createEvent(clickOn4_40, { type : 'mousedown' }));
  DygraphOps.dispatchCanvasEvent(g, DygraphOps.createEvent(clickOn4_40, { type : 'mouseup' }));

  assert.equal(40, point.xval);
  assert.equal(4, point.yval);
});

/**
 * This tests that when the nested div is scrolled, things work normally.
 */
it('testScrolledDiv', function() {
  document.getElementById('scroller').scrollTop = 117;

  var clickOn4_40 = {
    clientX: 244,
    clientY: 30 - detectScrollbarWidth(),
    screenX: 416,
    screenY: 160
  };

  DygraphOps.dispatchCanvasEvent(g, DygraphOps.createEvent(clickOn4_40, { type : 'mousemove' }));
  DygraphOps.dispatchCanvasEvent(g, DygraphOps.createEvent(clickOn4_40, { type : 'mousedown' }));
  DygraphOps.dispatchCanvasEvent(g, DygraphOps.createEvent(clickOn4_40, { type : 'mouseup' }));

  assert.equal(40, point.xval);
  assert.equal(4, point.yval);
});

});
