/**
 * @fileoverview Tests for the highlightSeriesBackgroundAlpha and
 * highlightSeriesBackgroundColor options.
 * @author sergeyslepian@gmail.com
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
import Util from './Util';

describe("highlight-series-background", function() {

  cleanupAfterEach();

  function setupGraph(highlightSeriesBackgroundAlpha,
                      highlightSeriesBackgroundColor) {
    var opts = {
      width: 480,
      height: 320,
      labels: ['x', 'y'],
      legend: 'always',
      highlightSeriesOpts: {
        strokeWidth: 1,
        strokeBorderWidth: 1,
        highlightCircleSize: 1
      }
    };

    if (highlightSeriesBackgroundAlpha) utils.update(opts, {highlightSeriesBackgroundAlpha});
    if (highlightSeriesBackgroundColor) utils.update(opts, {highlightSeriesBackgroundColor});

    var data = [];
    for (var j = 0; j < 10; j++) {
      data.push([j, 0]);
    }

    return new Dygraph('graph', data, opts);
  }

  it('testDefaultHighlight', function(done) {
    var graph = setupGraph();

    assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,0,0,0]);

    graph.setSelection(0, 'y', true);

    // handle background color fade-in time
    window.setTimeout(() => {
      assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [255,255,255,128]);
      done();
    }, 500);
  });

  it('testNoHighlight', function(done) {
    var graph = setupGraph(1);

    assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,0,0,0]);

    graph.setSelection(0, 'y', true);

    // handle background color fade-in time
    window.setTimeout(() => {
      assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,0,0,0]);
      done();
    }, 500);
  });

  it('testCustomHighlightColor', function(done) {
    var graph = setupGraph(null, 'rgb(0,255,255)');

    assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,0,0,0]);

    graph.setSelection(0, 'y', true);

    // handle background color fade-in time
    window.setTimeout(() => {
      assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,255,255,128]);
      done();
    }, 500);
  });

  it('testCustomHighlightAlpha', function(done) {
    var graph = setupGraph(0.3);

    assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,0,0,0]);

    graph.setSelection(0, 'y', true);

    // handle background color fade-in time
    window.setTimeout(() => {
      assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [255,255,255,179]);
      done();
    }, 500);
  });

  it('testCustomHighlightColorAndAlpha', function(done) {
    var graph = setupGraph(0.7,'rgb(255,0,0)');

    assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [0,0,0,0]);

    graph.setSelection(0, 'y', true);

    // handle background color fade-in time
    window.setTimeout(() => {
      assert.deepEqual(Util.samplePixel(graph.canvas_, 100, 100), [255,0,0,77]);
      done();
    }, 500);
  });

  it('testGetSelectionZeroCanvasY', function () {
    var graph = document.getElementById("graph");
    var calls = []
    function callback(g, seriesName, canvasContext, cx, cy, color, pointSize, idx) {
      calls.push(arguments);
    };

    var g = new Dygraph(document.getElementById("graph"),
                        "X,Y\n" +
                        "1,5\n" +
                        "1,10\n" +
                        "1,12\n",
                        {
                          drawHighlightPointCallback: callback,
                          axes: {
                            y: {
                              valueRange: [0, 10]
                            }
                          }
                        });
    g.setSelection(1);
    var args = calls[0];
    assert.equal(args[4], 0);
  });
});
