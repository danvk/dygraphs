// Copyright (c) 2011 Google, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/** 
 * @fileoverview Test cases for drawing simple lines.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';

import CanvasAssertions from './CanvasAssertions';
import Proxy from './Proxy';
import PixelSampler from './PixelSampler';

describe("simple-drawing", function() {

cleanupAfterEach();
useProxyCanvas(utils, Proxy);

var ZERO_TO_FIFTY = 'X,Y\n10,0\n20,50';

it('testDrawSimpleRangePlusOne', function() {
  var opts = {
    axes: {
      x: {
        drawGrid: false,
        drawAxis: false
      },
      y: {
        drawGrid: false,
        drawAxis: false
      }
    },
    valueRange: [0,51]
  };

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY, opts);
  var htx = g.hidden_ctx_;

  CanvasAssertions.assertLineDrawn(htx, [0,320], [475,6.2745], {
    strokeStyle: "#008080",
    lineWidth: 1
  });
  g.destroy(); // to balance context saves and destroys.
  CanvasAssertions.assertBalancedSaveRestore(htx);
});

// See http://code.google.com/p/dygraphs/issues/detail?id=185
it('testDrawSimpleRangeZeroToFifty', function() {
  var opts = {
    axes : {
      x : {
        drawGrid: false,
        drawAxis: false,
      },
      y : {
        drawGrid: false,
        drawAxis: false,
      }
    },
    valueRange: [0,50] }

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY, opts);
  var htx = g.hidden_ctx_;

  var lines = CanvasAssertions.getLinesDrawn(htx, {
    strokeStyle: "#008080",
    lineWidth: 1
  });
  assert.equal(1, lines.length);
  g.destroy(); // to balance context saves and destroys.
  CanvasAssertions.assertBalancedSaveRestore(htx);
});

it('testDrawWithAxis', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY);

  var htx = g.hidden_ctx_;
  g.destroy(); // to balance context saves and destroys.
  CanvasAssertions.assertBalancedSaveRestore(htx);
});

/**
 * Tests that it is drawing dashes, and it remember the dash history between
 * points.
 */
it('testDrawSimpleDash', function() {
  var opts = {
    axes: {
      x: {
        drawGrid: false,
        drawAxis: false
      },
      y: {
        drawGrid: false,
        drawAxis: false
      }
    },
    series: {
      'Y1': {strokePattern: [25, 7, 7, 7]},
    },
    colors: ['#ff0000'],
    labels: ['X', 'Y']
  };

  var graph = document.getElementById("graph");
  // Set the dims so we pass if default changes.
  graph.style.width='480px';
  graph.style.height='320px';
  var g = new Dygraph(graph, [[1, 4], [2, 5], [3, 3], [4, 7], [5, 9]], opts);
  var htx = g.hidden_ctx_;

  // TODO(danvk): figure out a good way to restore this test.
  // assert.equal(29, CanvasAssertions.numLinesDrawn(htx, "#ff0000"));
  g.destroy(); // to balance context saves and destroys.
  CanvasAssertions.assertBalancedSaveRestore(htx);
});

/**
 * Tests that thick lines are drawn continuously.
 * Regression test for http://code.google.com/p/dygraphs/issues/detail?id=328
 */
it('testDrawThickLine', function() {
  var opts = {
    axes: {
      x: {
        drawGrid: false,
        drawAxis: false
      },
      y: {
        drawGrid: false,
        drawAxis: false
      }
    },
    strokeWidth: 15,
    colors: ['#ff0000'],
    labels: ['X', 'Y']
  };

  var graph = document.getElementById("graph");
  // Set the dims so we pass if default changes.
  graph.style.width='480px';
  graph.style.height='320px';
  var g = new Dygraph(graph, [[1, 2], [2, 5], [3, 2], [4, 7], [5, 0]], opts);
  var htx = g.hidden_ctx_;

  // There's a big gap in the line at (2, 5)
  // If the bug is fixed, then there should be some red going up from here.
  var xy = g.toDomCoords(2, 5);
  var x = Math.round(xy[0]), y = Math.round(xy[1]);

  var sampler = new PixelSampler(g);
  assert.deepEqual([255,0,0,255], sampler.colorAtPixel(x, y));
  assert.deepEqual([255,0,0,255], sampler.colorAtPixel(x, y - 1));
  assert.deepEqual([255,0,0,255], sampler.colorAtPixel(x, y - 2));

  // TODO(danvk): figure out a good way to restore this test.
  // assert.equal(29, CanvasAssertions.numLinesDrawn(htx, "#ff0000"));
  g.destroy(); // to balance context saves and destroys.
  CanvasAssertions.assertBalancedSaveRestore(htx);
});

});
