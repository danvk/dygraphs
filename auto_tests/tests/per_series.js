/**
 * @fileoverview Tests for per-series options.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';

import PixelSampler from './PixelSampler';

describe("per-series", function() {

cleanupAfterEach();

it('testPerSeriesFill', function() {
  var opts = {
    width: 480,
    height: 320,
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
    series: {
      Y: { fillGraph: true },
    },
    colors: [ '#FF0000', '#0000FF' ],
    fillAlpha: 0.15
  };
  var data = "X,Y,Z\n" +
      "1,0,0\n" +
      "2,0,1\n" +
      "3,0,1\n" +
      "4,0,0\n" +
      "5,0,0\n" +
      "6,1,0\n" +
      "7,1,0\n" +
      "8,0,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var sampler = new PixelSampler(g);

  // Inside of the "Z" bump -- no fill.
  assert.deepEqual([0,0,0,0], sampler.colorAtCoordinate(2.5, 0.5));

  // Inside of the "Y" bump -- filled in.
  assert.deepEqual([255,0,0,38], sampler.colorAtCoordinate(6.5, 0.5));
});

it('testPerSeriesAlpha', function() {
  var opts = {
    width: 480,
    height: 320,
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
    series: {
      Y: { fillGraph: true, fillAlpha: 0.25 },
      Z: { fillGraph: true, fillAlpha: 0.75 }
    },
    colors: [ '#FF0000', '#0000FF' ]
  };
  var data = "X,Y,Z\n" +
      "1,0,0\n" +
      "2,0,1\n" +
      "3,0,1\n" +
      "4,0,0\n" +
      "5,0,0\n" +
      "6,1,0\n" +
      "7,1,0\n" +
      "8,0,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var sampler = new PixelSampler(g);

  // Inside of the "Y" bump -- 5% alpha.
  assert.deepEqual([255,0,0,64], sampler.colorAtCoordinate(6.5, 0.5));

  // Inside of the "Z" bump -- 95% alpha.
  assert.deepEqual([0,0,255,191], sampler.colorAtCoordinate(2.5, 0.5));
});

it('testNewStyleSeries', function() {
  var opts = {
    pointSize : 5,
    series : {
      Y: { pointSize : 4 }
    },
  };
  var graph = document.getElementById("graph");
  var data = "X,Y,Z\n1,0,0\n";
  var g = new Dygraph(graph, data, opts);

  assert.equal(5, g.getOption("pointSize"));
  assert.equal(4, g.getOption("pointSize", "Y"));
  assert.equal(5, g.getOption("pointSize", "Z"));
});

// TODO(konigsberg): move to multiple_axes.js
it('testAxisInNewSeries', function() {
  var opts = {
    series : {
      D : { axis : 'y2' },
      C : { axis : 1 },
      B : { axis : 0 },
      E : { axis : 'y' }
    }
  };
  var graph = document.getElementById("graph");
  var data = "X,A,B,C,D,E\n0,1,2,3,4,5\n";
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual(["A", "B", "E"], g.attributes_.seriesForAxis(0));
  assert.deepEqual(["C", "D"], g.attributes_.seriesForAxis(1));
});

// TODO(konigsberg): move to multiple_axes.js
it('testAxisInNewSeries_withAxes', function() {
  var opts = {
    series : {
      D : { axis : 'y2' },
      C : { axis : 1 },
      B : { axis : 0 },
      E : { axis : 'y' }
    },
    axes : {
      y : { pointSize : 7 },
      y2 : { pointSize  : 6 }
    }
  };
  var graph = document.getElementById("graph");
  var data = "X,A,B,C,D,E\n0,1,2,3,4,5\n";
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual(["A", "B", "E"], g.attributes_.seriesForAxis(0));
  assert.deepEqual(["C", "D"], g.attributes_.seriesForAxis(1));

  assert.equal(1.5, g.getOption("pointSize"));
  assert.equal(7, g.getOption("pointSize", "A"));
  assert.equal(7, g.getOption("pointSize", "B"));
  assert.equal(6, g.getOption("pointSize", "C"));
  assert.equal(6, g.getOption("pointSize", "D"));
  assert.equal(7, g.getOption("pointSize", "E"));
});

// TODO(konigsberg): move to multiple_axes.js
it('testOldAxisSpecInNewSeriesThrows', function() {
  var opts = {
    series : {
      D : { axis : {} },
    },
  };
  var graph = document.getElementById("graph");
  var data = "X,A,B,C,D,E\n0,1,2,3,4,5\n";
  var threw = false;
  try {
    new Dygraph(graph, data, opts);
  } catch(e) {
    threw = true;
  }

  assert.isTrue(threw);
});

it('testColorOption', function() {
  var graph = document.getElementById("graph");
  var data = "X,A,B,C\n0,1,2,3\n";
  var g = new Dygraph(graph, data, {});
  assert.deepEqual(['rgb(64,128,0)', 'rgb(64,0,128)', 'rgb(0,128,128)'], g.getColors());
  g.updateOptions({series : { B : { color : 'purple' }}});
  assert.deepEqual(['rgb(64,128,0)', 'purple', 'rgb(0,128,128)'], g.getColors());
});

});
