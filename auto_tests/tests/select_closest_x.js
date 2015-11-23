/**
 * @license
 * Copyright 2015 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Test the selectByClosestX selection mode.
 * @author musicist288@gmail.com (Joseph Rossi)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';

describe("selection by closest x", function() {

cleanupAfterEach();

it('selects the closest previous value', function () {
  var data = 'X,A,B\n' +
             '100, ,2\n' +
             '200,3, \n';

  var calls = [];
  function cb(g, seriesName, canvasContext, cx, cy, color, pointSize, idx) {
    calls.push(arguments);
    utils.Circles.DEFAULT.apply(this, arguments);
  }

  var g = new Dygraph(document.getElementById("graph"), data, {
    drawHighlightPointCallback: cb,
    selectionMode: Dygraph.SelectionModes.selectByClosestX
  });

  g.setSelection(1);
  assert.equal(calls.length, 2);
  var expectedA = g.toDomCoords(200, 3);
  var aCall = calls[0];
  assert.equal(aCall[1], 'A');

  // Some implementation detail results in point.canvasy
  // and g.toDomYCoord(point.yval) to be ever so slightly
  // different, but not enough to be significant.
  var acceptableError = 1e-9;
  var difference = Math.abs(aCall[4] - expectedA[1]);
  assert.isTrue(difference < acceptableError);
  difference = Math.abs(aCall[3] - expectedA[0]);
  assert.isTrue(difference < acceptableError);

  var expectedB = g.toDomCoords(100, 2);
  var bCall = calls[1];
  assert.equal(bCall[1], 'B');

  difference = Math.abs(bCall[3] - expectedB[0]);
  assert.isTrue(difference < acceptableError);

  difference = Math.abs(bCall[4] - expectedB[1]);
  assert.isTrue(difference < acceptableError);
});

it('does not select from rows greater than the closest row', function () {
  var data = 'X,A,B\n' +
             '1, , \n' +
             '2,3, \n' +
             '3,4,5\n';

  var calls = [];
  function cb(g, seriesName, canvasContext, cx, cy, color, pointSize, idx) {
    calls.push(arguments);
    utils.Circles.DEFAULT.apply(this, arguments);
  }

  var g = new Dygraph(document.getElementById("graph"), data, {
    drawHighlightPointCallback: cb,
    selectionMode: Dygraph.SelectionModes.selectByClosestX
  });

  g.setSelection(1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'A');
});

it('uses the greatest xval of the selected points', function () {
  var selectCalls = [];
  var plugin = function () {}
  plugin.prototype.activate = function () {
    return {
      select: function(e) {
        selectCalls.push(e);
      }
    };
  };

  var data = 'X,A,B\n' +
             '1, , \n' +
             '2,3, \n' +
             '3,4,5\n' +
             '4, ,2\n';

  var g = new Dygraph(document.getElementById("graph"), data, {
    plugins: [plugin],
    selectionMode: Dygraph.SelectionModes.selectByClosestX
  });

  g.setSelection(3);
  assert.equal(selectCalls.length, 1);
  assert.equal(selectCalls[0].selectedX, '4');
});

});
