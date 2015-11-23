/**
 * @fileoverview Tests for the smooth (bezier curve) plotter.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';
import '../../src/extras/smooth-plotter';  // defines Dygraph.smoothPlotter

describe("smooth-plotter", function() {

var smoothPlotter = Dygraph.smoothPlotter;
var getControlPoints = smoothPlotter._getControlPoints;

beforeEach(function() {
});

afterEach(function() {
});

it('testNoSmoothing', function() {
  var lastPt = {x: 10, y: 0},
      pt = {x: 11, y: 1},
      nextPt = {x: 12, y: 0},
      alpha = 0;

  assert.deepEqual([11, 1, 11, 1], getControlPoints(lastPt, pt, nextPt, alpha));
});

it('testHalfSmoothing', function() {
  var lastPt = {x: 10, y: 0},
      pt = {x: 11, y: 1},
      nextPt = {x: 12, y: 0},
      alpha = 0.5;

  assert.deepEqual([10.5, 1, 11.5, 1], getControlPoints(lastPt, pt, nextPt, alpha));
});

it('testExtrema', function() {
  var lastPt = {x: 10, y: 0},
      pt = {x: 11, y: 1},
      nextPt = {x: 12, y: 1},
      alpha = 0.5;

  assert.deepEqual([10.5, 0.75, 11.5, 1.25],
               getControlPoints(lastPt, pt, nextPt, alpha, true));

  assert.deepEqual([10.5, 1, 11.5, 1],
               getControlPoints(lastPt, pt, nextPt, alpha, false));
});

});
