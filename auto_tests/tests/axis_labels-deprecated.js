/**
 * @fileoverview Test cases for how axis labels are chosen and formatted,
 * specializing on the deprecated xLabelFormatter, etc.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */
describe("axis-labels-deprecated", function() {

beforeEach(function() {
  document.body.innerHTML = "<div id='graph'></div>";
});

afterEach(function() {
});

it('testDeprecatedDeprecatedXAxisTimeLabelFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    labels: ['X', 'Y1']
  };
  var data = [[5.0,0],[5.1,1],[5.2,2],[5.3,3],[5.4,4],[5.5,5],[5.6,6],[5.7,7],[5.8,8],[5.9,9]];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  g.updateOptions({
    axes : {
      x : {
        axisLabelFormatter: function (totalMinutes) {
          var hours   = Math.floor( totalMinutes / 60);
          var minutes = Math.floor((totalMinutes - (hours * 60)));
          var seconds = Math.round((totalMinutes * 60) - (hours * 3600) - (minutes * 60));

          if (hours   < 10) hours   = "0" + hours;
          if (minutes < 10) minutes = "0" + minutes;
          if (seconds < 10) seconds = "0" + seconds;

          return hours + ':' + minutes + ':' + seconds;
        }
      }
    }
  });

  assert.deepEqual(["00:05:00","00:05:12","00:05:24","00:05:36","00:05:48"], Util.getXLabels());

  // The legend does not use the xAxisLabelFormatter:
  g.setSelection(1);
  assert.equal('5.1: Y1: 1', Util.getLegend());
});

it('testDeprecatedAxisLabelFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        axisLabelFormatter: function(x, granularity, opts, dg) {
          assert.equal('number', typeof(x));
          assert.equal('number', typeof(granularity));
          assert.equal('function', typeof(opts));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'x' + x;
        }
      },
      y : {
        axisLabelFormatter: function(y, granularity, opts, dg) {
          assert.equal('number', typeof(y));
          assert.equal('number', typeof(granularity));
          assert.equal('function', typeof(opts));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'y' + y;
        }
      }
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual(['x0','x2','x4','x6','x8'], Util.getXLabels());
  assert.deepEqual(["y0","y5","y10","y15"], Util.getYLabels());

  g.setSelection(2);
  assert.equal("2: y: 4", Util.getLegend());
});

it('testDeprecatedDateAxisLabelFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        axisLabelFormatter: function(x, granularity, opts, dg) {
          assert.isTrue(Dygraph.isDateLike(x));
          assert.equal('number', typeof(granularity));
          assert.equal('function', typeof(opts));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'x' + Util.formatDate(x);
        },
        pixelsPerLabel: 60
      },
      y : {
        axisLabelFormatter: function(y, granularity, opts, dg) {
          assert.equal('number', typeof(y));
          assert.equal('number', typeof(granularity));
          assert.equal('function', typeof(opts));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'y' + y;
        }
      }
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 1; i < 10; i++) {
    data.push([new Date("2011/01/0" + i), 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual(["x2011/01/02","x2011/01/04","x2011/01/06","x2011/01/08"], Util.getXLabels());
  assert.deepEqual(["y5","y10","y15"], Util.getYLabels());

  g.setSelection(0);
  assert.equal("2011/01/01: y: 2", Util.getLegend());
});

// This test verifies that when a valueFormatter is set (but not an
// axisLabelFormatter), then the valueFormatter is used to format the axis
// labels.
it('testDeprecatedValueFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        valueFormatter: function(x, opts, series_name, dg) {
          assert.equal('number', typeof(x));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'x' + x;
        }
      },
      y : {
        valueFormatter: function(y, opts, series_name, dg) {
          assert.equal('number', typeof(y));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'y' + y;
        }
      }
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // the valueFormatter options do not affect the ticks.
  assert.deepEqual(['0','2','4','6','8'], Util.getXLabels());
  assert.deepEqual(["0","5","10","15"], Util.getYLabels());

  // they do affect the legend, however.
  g.setSelection(2);
  assert.equal("x2: y: y4", Util.getLegend());
});

it('testDeprecatedDateValueFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        valueFormatter: function(x, opts, series_name, dg) {
          assert.equal('number', typeof(x));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'x' + Util.formatDate(x);
        },
        pixelsPerLabel: 60
      },
      y : {
        valueFormatter: function(y, opts, series_name, dg) {
          assert.equal('number', typeof(y));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'y' + y;
        }
      }
    },
    labels: ['x', 'y']
  };

  var data = [];
  for (var i = 1; i < 10; i++) {
    data.push([new Date("2011/01/0" + i), 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // valueFormatters do not affect ticks.
  assert.deepEqual(["02 Jan","04 Jan","06 Jan","08 Jan"], Util.getXLabels());
  assert.deepEqual(["5","10","15"], Util.getYLabels());

  // the valueFormatter options also affect the legend.
  g.setSelection(2);
  assert.equal('x2011/01/03: y: y6', Util.getLegend());
});

// This test verifies that when both a valueFormatter and an axisLabelFormatter
// are specified, the axisLabelFormatter takes precedence.
it('testDeprecatedAxisLabelFormatterPrecedence', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        valueFormatter: function(x) {
          return 'xvf' + x;
        },
        axisLabelFormatter: function(x, granularity) {
          return 'x' + x;
        },
      },
      y : {
        valueFormatter: function(y) {
          return 'yvf' + y;
        },
        axisLabelFormatter: function(y) {
          return 'y' + y;
        },
      }
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual(['x0','x2','x4','x6','x8'], Util.getXLabels());
  assert.deepEqual(["y0","y5","y10","y15"], Util.getYLabels());

  g.setSelection(9);
  assert.equal("xvf9: y: yvf18", Util.getLegend());
});

// This is the same as the previous test, except that options are added
// one-by-one.
it('testDeprecatedAxisLabelFormatterIncremental', function() {
  var opts = {
    width: 480,
    height: 320,
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  g.updateOptions({
    axes : {
      x : { 
        valueFormatter: function(x) {
          return 'xvf' + x;
        }
      }
    }
  });
  g.updateOptions({
    axes : {
      y : { 
        valueFormatter: function(y) {
          return 'yvf' + y;
        }
      }
    }
  });
  g.updateOptions({
    axes : {
      x : { 
        axisLabelFormatter: function(x) {
          return 'x' + x;
        }
      }
    }
  });
  g.updateOptions({
    axes : {
      y : { 
        axisLabelFormatter: function(y) {
          return 'y' + y;
        }
      }
    }
  });

  assert.deepEqual(["x0","x2","x4","x6","x8"], Util.getXLabels());
  assert.deepEqual(["y0","y5","y10","y15"], Util.getYLabels());

  g.setSelection(9);
  assert.equal("xvf9: y: yvf18", Util.getLegend());
});

});
