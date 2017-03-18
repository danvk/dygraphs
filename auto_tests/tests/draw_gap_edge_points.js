/**
 * @fileoverview Test cases for the option "drawGapEdgePoints"
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';

describe("draw-gap-edge-points", function() {

  cleanupAfterEach();

  it("shouldn't draw any points by default", function() {
    var called = false;
    var g = new Dygraph(document.getElementById("graph"),
                        [[0, 0],
                         [1, 1],
                         [2, 2],
                         [3, 3],
                         [4, 4],
                         [5, 5]],
                        {labels: ['a', 'b'],
                         drawGapEdgePoints: true,
                         drawPointCallback: function() { called = true; }});

    assert.isFalse(called);
  });

  it("shouldn't draw any points by default (no axes)", function() {
    var called = false;
    var g = new Dygraph(document.getElementById("graph"),
                        [[0, 0],
                         [1, 1],
                         [2, 2],
                         [3, 3],
                         [4, 4],
                         [5, 5]],
                        {labels: ['a', 'b'],
                         drawGapEdgePoints: true,
                         drawPointCallback: function() { called = true; },
                         axes: {
                           x: { drawAxis: false },
                           y: { drawAxis: false }
                         }});

    assert.isFalse(called);
  });
});
