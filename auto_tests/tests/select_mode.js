/**
 * @fileoverview Tests involving issuing XHRs for data.
 *
 * Note that these tests must be run with an HTTP server.
 * XHRs can't be issued from file:/// URLs.
 * This can be done with
 *
 *     npm install http-server
 *     http-server
 *     open http://localhost:8080/auto_tests/runner.html
 *
 */

import Dygraph from '../../src/dygraph';
import DygraphOps from './DygraphOps';
import Util from './Util';

import 'core-js/es6/promise';

// Note that this data contains 2 points with the same
// x value. euclidian selection mode can distinguish them.
var TEST_SERIES = "X,Y1,Y2\n" +
                  "0,1,3\n" +
                  "0.5,1,3\n" +
                  "0.7,4.5,2.5\n" +
                  "0.7,5,3\n" +
                  "1,1,4\n";

// A version without the duplicate x value, for use with
// stacked graphs (these don't show duplicate x values).
var TEST_SERIES_NODUP = "X,Y1,Y2\n" +
                  "0,1,3\n" +
                  "0.5,1,3\n" +
                  "0.7,4.5,2.5\n" +
                  "1,1,4\n";



function lockSeries(graph) {
  graph.setSelection(4, 'Y1', true);
}

function makeGraph(series, options) {
  return new Dygraph(
      document.getElementById('graph'),
      series,
      options
  );
}

describe("select-mode", function() {

cleanupAfterEach();

/**
 * Default behaviour:
 *
 * selectMode: closest-x
 * highlightSeriesOpts: no
 * stacked: no
 * series locked: no
 */
it('default-settings', () => {

  var g = makeGraph(TEST_SERIES, null);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());

});

/**
 * Explicitly set closest-x
 *
 * selectMode: closest-x
 * highlightSeriesOpts: no
 * stacked: no
 * series locked: no
 */
it('closest-x/no highlight/not stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'closest-x'
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: no
 * stacked: no
 * series locked: no
 */
it('euclidian/no highlight/not stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'euclidian'
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(4, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(3, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(3, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(3, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(3, g.getSelection());

});

/**
 * Should behave like euclidian 
 *
 * selectMode: closest-x
 * highlightSeriesOpts: yes
 * stacked: no
 * series locked: no
 */
it('closest-x/with highlight/not stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'closest-x',
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(3, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);
});


/**
 * selectMode: euclidian
 * highlightSeriesOpts: yes
 * stacked: no
 * series locked: no
 */
it('euclidian/with highlight/not stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'euclidian',
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(3, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);
});

/**
 * selectMode: closest-x
 * highlightSeriesOpts: no
 * stacked: yes
 * series locked: no
 */
it('closest-x/no highlight/is stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'closest-x',
    stackedGraph: true
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());

  // Mouse along y=7
  DygraphOps.dispatchMouseMove(g, 0, 7);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 7);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 7);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 7);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 7);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 7);
  assert.equal(3, g.getSelection());

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: no
 * stacked: yes
 * series locked: no
 */
it('euclidian/no highlight/is stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'euclidian',
    stackedGraph: true
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());

  // Mouse along y=7
  DygraphOps.dispatchMouseMove(g, 0, 7);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.2, 7);
  assert.equal(0, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.4, 7);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.6, 7);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.8, 7);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 1, 7);
  assert.equal(3, g.getSelection());

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
});

/**
 * selectMode: closest-x
 * highlightSeriesOpts: yes
 * stacked: yes
 * series locked: no
 */
it('closest-x/with highlight/is stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'closest-x',
    stackedGraph: true,
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  // Mouse along y=7
  DygraphOps.dispatchMouseMove(g, 0, 7);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 7);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 7);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 7);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 7);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 7);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: yes
 * stacked: yes
 * series locked: no
 */
it('euclidian/with highlight/is stacked/no series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'euclidian',
    stackedGraph: true,
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  // Mouse along y=7
  DygraphOps.dispatchMouseMove(g, 0, 7);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 7);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 7);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 7);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 7);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 7);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y2', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: closest-x
 * highlightSeriesOpts: no
 * stacked: no
 * series locked: yes
 */
it('closest-x/no highlight/not stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'closest-x',
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: no
 * stacked: no
 * series locked: yes
 */
it('euclidian/no highlight/not stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'euclidian',
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: closest-x
 * highlightSeriesOpts: yes
 * stacked: no
 * series locked: yes
 */
it('closest-x/with highlight/not stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'closest-x',
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: yes
 * stacked: no
 * series locked: yes
 */
it('euclidian/with highlight/not stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES, {
    selectMode: 'euclidian',
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(4, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: closest-x
 * highlightSeriesOpts: no
 * stacked: yes
 * series locked: yes
 */
it('closest-x/no highlight/is stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'closest-x',
    stackedGraph: true
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: no
 * stacked: yes
 * series locked: yes
 */
it('euclidian/no highlight/is stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'euclidian',
    stackedGraph: true
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: closest-x
 * highlightSeriesOpts: yes
 * stacked: yes
 * series locked: yes
 */
it('closest-x/with highlight/is stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'closest-x',
    stackedGraph: true,
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});

/**
 * selectMode: euclidian
 * highlightSeriesOpts: yes
 * stacked: yes
 * series locked: yes
 */
it('euclidian/with highlight/is stacked/with series lock', () => {

  var g = makeGraph(TEST_SERIES_NODUP, {
    selectMode: 'euclidian',
    stackedGraph: true,
    highlightSeriesOpts: {strokeWidth: 2}
  });

  // Lock the series
  g.setSelection(0, 'Y1', true);

  // Mouse along y=1
  DygraphOps.dispatchMouseMove(g, 0, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 1);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 1);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse along y=5
  DygraphOps.dispatchMouseMove(g, 0, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.2, 5);
  assert.equal(0, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.4, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.6, 5);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.8, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 1, 5);
  assert.equal(3, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  // Mouse up x=0.7
  DygraphOps.dispatchMouseMove(g, 0.7, 1);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 2);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 3);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 4);
  assert.equal(1, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

  DygraphOps.dispatchMouseMove(g, 0.7, 5);
  assert.equal(2, g.getSelection());
  assert.equal('Y1', g.highlightSet_);

});
});
