/**
 * @fileoverview Tests zero and one-point charts.
 * These don't have to render nicely, they just have to not crash.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';
import Util from './Util';

describe("pathological-cases", function() {

cleanupAfterEach();

var restoreConsole;
var logs = {};
beforeEach(function() {
  restoreConsole = Util.captureConsole(logs);
});

afterEach(function() {
  restoreConsole();
});

var graph = document.getElementById("graph");

it('testZeroPoint', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n";

  var g = new Dygraph(graph, data, opts);
});

it('testOnePoint', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n" +
             "1,2\n";

  var g = new Dygraph(graph, data, opts);
});

it('testCombinations', function() {
  var dataSets = {
    empty: [],
    onePoint: [[10, 2]],
    nanPoint: [[10, NaN]],
    nanPoints: [[10, NaN], [20, NaN]],
    multiNan1: [[10, NaN, 2], [20, 3, NaN]],
    multiNan2: [[10, NaN, 2], [20, NaN, 4]],
    multiNan3: [[10, NaN, NaN], [20, 3, 4], [30, NaN, NaN]],
    atZero: [[0, 0]],
    atZero2: [[0, 0, 0]],
    negative: [[-10, -1]],
    acrossZero: [[-10, 1], [10, 2]],
    normal: [[0,1,9], [10,3,5], [20,2,7], [30,4,3]]
  };

  var baseOpts = {
    lines: {},
    stacked: {
      stackedGraph: true
    }
  };

  var variantOpts = {
    none: {},
    padded: {
      includeZero: true,
      drawAxesAtZero: true,
      xRangePad: 2,
      yRangePad: 4
    }
  };

  for (var baseName in baseOpts) {
    var base = baseOpts[baseName];
    for (var variantName in variantOpts) {
      var variant = variantOpts[variantName];

      var opts = {
        width: 300,
        height: 150,
        pointSize: 10
      };
      for (var key in base) {
        if (base.hasOwnProperty(key)) opts[key] = base[key];
      }
      for (var key in variant) {
        if (variant.hasOwnProperty(key)) opts[key] = variant[key];
      }

      var h = document.createElement('h3');
      h.appendChild(document.createTextNode(baseName + ' ' + variantName));
      graph.appendChild(h);
      for (var dataName in dataSets) {
        var data = dataSets[dataName];

        var box = document.createElement('fieldset');
        box.style.display = 'inline-block';
        var legend = document.createElement('legend');
        legend.appendChild(document.createTextNode(dataName));
        box.appendChild(legend);
        var gdiv = document.createElement('div');
        gdiv.style.display = 'inline-block';
        box.appendChild(gdiv);
        graph.appendChild(box);

        var cols = data && data[0] ? data[0].length : 0;
        opts.labels = ['X', 'A', 'B', 'C'].slice(0, cols);

        var g = new Dygraph(gdiv, data, opts);

        if (dataName == 'empty') {
          assert.deepEqual(logs, {
            log: [], warn: [],
            error: ["Can't plot empty data set"]
          });
          logs.error = [];  // reset
        } else {
          assert.deepEqual(logs, {log: [], warn: [], error: []});
        }
      }
    }
  }
});

it('testNullLegend', function() {
  var opts = {
    width: 480,
    height: 320,
    labelsDiv: null
  };
  var data = "X,Y\n" +
             "1,2\n";

  var g = new Dygraph(graph, data, opts);
});

it('testDivAsString', function() {
  var data = "X,Y\n" +
             "1,2\n";

  var g = new Dygraph('graph', data, {});
});


it('testConstantSeriesNegative', function() {
  var data = "X,Y\n" +
             "1,-1\n" +
             "2,-1\n";

  var g = new Dygraph('graph', data, {});
  // This check could be loosened to
  // g.yAxisRange()[0] < g.yAxisRange()[1] if it breaks in the future.
  assert.deepEqual([-1.1, -0.9], g.yAxisRange());
});


it('testConstantSeriesNegativeIncludeZero', function() {
  var data = "X,Y\n" +
             "1,-1\n" +
             "2,-1\n";

  var g = new Dygraph('graph', data, {includeZero: true});
  // This check could be loosened to
  // g.yAxisRange()[0] < g.yAxisRange()[1] if it breaks in the future.
  assert.deepEqual([-1.1, 0], g.yAxisRange());
});

it('should throw with non-existent divs', function() {
  var data = "X,Y\n" +
             "1,-1\n" +
             "2,1\n";

  assert.throws(function() {
    new Dygraph(null, data);
  }, /non-existent div/);

  assert.throws(function() {
    new Dygraph('non-existent-div-id', data);
  }, /non-existent div/);
});

});
