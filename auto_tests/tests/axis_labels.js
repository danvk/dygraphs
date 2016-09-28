/**
 * @fileoverview Test cases for how axis labels are chosen and formatted.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
import DEFAULT_ATTRS from '../../src/dygraph-default-attrs';
import Util from './Util';
import {assertDeepCloseTo} from './custom_asserts';

describe("axis-labels", function() {

cleanupAfterEach();

var simpleData =
    "X,Y,Y2\n" +
    "0,-1,.5\n" +
    "1,0,.7\n" +
    "2,1,.4\n" +
    "3,0,.98\n";

var kCloseFloat = 1.0e-10;

it('testMinusOneToOne', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  // TODO(danvk): would ['-1.0','-0.5','0.0','0.5','1.0'] be better?
  assert.deepEqual(['-1','-0.5','0','0.5','1'], Util.getYLabels());

  // Go up to 2
  data += "4,2\n";
  g.updateOptions({file: data});
  assert.deepEqual(['-1','-0.5','0','0.5','1','1.5','2'], Util.getYLabels());

  // Now 10
  data += "5,10\n";
  g.updateOptions({file: data});
  assert.deepEqual(['-2','0','2','4','6','8','10'], Util.getYLabels());

  // Now 100
  data += "6,100\n";
  g.updateOptions({file: data});
  assert.deepEqual(['0','20','40','60','80','100'], Util.getYLabels());

  g.setSelection(0);
  assert.equal('0: Y: -1', Util.getLegend());
});

it('testSmallRangeNearZero', function() {
  var opts = {
    drawAxesAtZero: true,
    width: 480,
    height: 320
  };
  var data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;
  opts.valueRange = [-0.1, 0.1];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertDeepCloseTo([-0.1,-0.05,0,0.05],
                    Util.makeNumbers(Util.getYLabels()), kCloseFloat);

  opts.valueRange = [-0.05, 0.05];
  g.updateOptions(opts);
  assert.deepEqual([-0.04,-0.02,0,0.02,0.04],
                   Util.makeNumbers(Util.getYLabels()));

  opts.valueRange = [-0.01, 0.01];
  g.updateOptions(opts);
  assert.deepEqual([-0.01,-0.005,0,0.005],
                   Util.makeNumbers(Util.getYLabels()));

  g.setSelection(1);
  assert.equal('1: Y: 0', Util.getLegend());
});

it('testSmallRangeAwayFromZero', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;
  var graph = document.getElementById("graph");

  opts.valueRange = [9.9, 10.1];
  var g = new Dygraph(graph, data, opts);
  assert.deepEqual(["9.9","9.92","9.94","9.96","9.98","10","10.02","10.04","10.06","10.08"], Util.getYLabels());

  opts.valueRange = [9.99, 10.01];
  g.updateOptions(opts);
  // TODO(danvk): this is bad
  assert.deepEqual(["9.99","9.99","9.99","10","10","10","10","10","10.01","10.01"], Util.getYLabels());

  opts.valueRange = [9.999, 10.001];
  g.updateOptions(opts);
  // TODO(danvk): this is even worse!
  assert.deepEqual(["10","10","10","10"], Util.getYLabels());

  g.setSelection(1);
  assert.equal('1: Y: 0', Util.getLegend());
});

it('testXAxisTimeLabelFormatter', function() {
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
        axisLabelFormatter : function (totalMinutes) {
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

  // The legend does not use the axisLabelFormatter:
  g.setSelection(1);
  assert.equal('5.1: Y1: 1', Util.getLegend());
});

it('testAxisLabelFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        axisLabelFormatter : function(x, granularity, opts, dg) {
          assert.equal('number', typeof(x));
          assert.equal('number', typeof(granularity));
          assert.equal('function', typeof(opts));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'x' + x;
        }
      },
      y : {
        axisLabelFormatter : function(y, granularity, opts, dg) {
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

it('testDateAxisLabelFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        pixelsPerLabel: 60,
        axisLabelFormatter : function(x, granularity, opts, dg) {
          assert.isTrue(utils.isDateLike(x));
          assert.equal('number', typeof(granularity));
          assert.equal('function', typeof(opts));
          assert.equal('[Dygraph graph]', dg.toString());
          return 'x' + Util.formatDate(x);
        }
      },
      y : {
        axisLabelFormatter : function(y, granularity, opts, dg) {
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
it('testValueFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes: {
      x: {
        valueFormatter: function(x, opts, series_name, dg, row, col) {
          assert.equal('number', typeof(x));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          assert.equal('number', typeof(row));
          assert.equal('number', typeof(col));
          assert.equal(dg, this);
          return 'x' + x;
        }
      },
      y: {
        valueFormatter: function(y, opts, series_name, dg, row, col) {
          assert.equal('number', typeof(y));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          assert.equal('number', typeof(row));
          assert.equal('number', typeof(col));
          assert.equal(dg, this);
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
  assert.deepEqual(["0","5","10","15"],
               Util.getYLabels());

  // they do affect the legend, however.
  g.setSelection(2);
  assert.equal("x2: y: y4", Util.getLegend());
});

it('testDateValueFormatter', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        pixelsPerLabel: 60,
        valueFormatter: function(x, opts, series_name, dg, row, col) {
          assert.equal('number', typeof(x));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          assert.equal('number', typeof(row));
          assert.equal('number', typeof(col));
          assert.equal(dg, this);
          return 'x' + Util.formatDate(x);
        }
      },
      y : {
        valueFormatter: function(y, opts, series_name, dg, row, col) {
          assert.equal('number', typeof(y));
          assert.equal('function', typeof(opts));
          assert.equal('string', typeof(series_name));
          assert.equal('[Dygraph graph]', dg.toString());
          assert.equal('number', typeof(row));
          assert.equal('number', typeof(col));
          assert.equal(dg, this);
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
it('testAxisLabelFormatterPrecedence', function() {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        valueFormatter: function(x) {
          assert.equal('[Dygraph graph]', this.toString());
          return 'xvf' + x;
        },
        axisLabelFormatter: function(x, granularity) {
          assert.equal('[Dygraph graph]', this.toString());
          return 'x' + x;
        }
      },
      y : {
        valueFormatter: function(y) {
          assert.equal('[Dygraph graph]', this.toString());
          return 'yvf' + y;
        },
        axisLabelFormatter: function(y) {
          assert.equal('[Dygraph graph]', this.toString());
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

  g.setSelection(9);
  assert.equal("xvf9: y: yvf18", Util.getLegend());
});

// This is the same as the previous test, except that options are added
// one-by-one.
it('testAxisLabelFormatterIncremental', function() {
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
        axisLabelFormatter: function(x, granularity) {
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

it('testGlobalFormatters', function() {
  var opts = {
    width: 480,
    height: 320,
    labels: ['x', 'y'],
    valueFormatter: function(x) {
      assert.equal('[Dygraph graph]', this);
      return 'vf' + x;
    },
    axisLabelFormatter: function(x) {
      assert.equal('[Dygraph graph]', this);
      return 'alf' + x;
    }
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual(['alf0','alf2','alf4','alf6','alf8'], Util.getXLabels());
  assert.deepEqual(["alf0","alf5","alf10","alf15"], Util.getYLabels());

  g.setSelection(9);
  assert.equal("vf9: y: vf18", Util.getLegend());
});

it('testValueFormatterParameters', function() {
  var calls = [];
  // change any functions in list to 'fn' -- functions can't be asserted.
  var killFunctions = function(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (typeof(list[i]) == 'function') {
        out[i] = 'fn';
      } else {
        out[i] = list[i];
      }
    }
    return out;
  };
  var taggedRecorder = function(tag) {
    return function() {
      calls.push([tag].concat([this], killFunctions(arguments)));
      return '';
    }
  };
  var opts = {
    axes: {
      x:  { valueFormatter: taggedRecorder('x') },
      y:  { valueFormatter: taggedRecorder('y') },
      y2: { valueFormatter: taggedRecorder('y2') }
    },
    series: {
      'y1': { axis: 'y1'},
      'y2': { axis: 'y2'}
    },
    labels: ['x', 'y1', 'y2']
  };
  var data = [
    [0, 1, 2],
    [1, 3, 4]
  ];
  var graph = document.getElementById('graph');
  var g = new Dygraph(graph, data, opts);

  assert.deepEqual([], calls);
  g.setSelection(0);
  assert.deepEqual([
    // num or millis, opts, series, dygraph, row, col
    [ 'x', g, 0, 'fn',  'x', g, 0, 0],
    [ 'y', g, 1, 'fn', 'y1', g, 0, 1],
    ['y2', g, 2, 'fn', 'y2', g, 0, 2]
  ], calls);

  calls = [];
  g.setSelection(1);
  assert.deepEqual([
    [ 'x', g, 1, 'fn',  'x', g, 1, 0],
    [ 'y', g, 3, 'fn', 'y1', g, 1, 1],
    ['y2', g, 4, 'fn', 'y2', g, 1, 2]
  ], calls);
});

it('testSeriesOrder', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "x,00,01,10,11\n" +
      "0,101,201,301,401\n" +
      "1,102,202,302,402\n" +
      "2,103,203,303,403\n" +
      "3,104,204,304,404\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setSelection(2);
  assert.equal('2: 00: 103 01: 203 10: 303 11: 403', Util.getLegend());

  // Sanity checks for indexFromSetName
  assert.equal(0, g.indexFromSetName("x"));
  assert.equal(1, g.indexFromSetName("00"));
  assert.equal(null, g.indexFromSetName("abcde"));

  // Verify that we get the label list back in the right order
  assert.deepEqual(["x", "00", "01", "10", "11"], g.getLabels());
});

it('testLabelKMB', function() {
  var data = [];
  data.push([0,0]);
  data.push([1,2000]);
  data.push([2,1000]);

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'X', 'bar' ],
      axes : {
        y: {
          labelsKMB: true
        }
      }
    }
  );

  assert.deepEqual(["0", "500", "1K", "1.5K", "2K"], Util.getYLabels());
});

it('testLabelKMG2', function() {
  var data = [];
  data.push([0,0]);
  data.push([1,2000]);
  data.push([2,1000]);

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'X', 'bar' ],
      axes : {
        y: {
          labelsKMG2: true
        }
      }
    }
  );

  assert.deepEqual(["0","256","512","768","1k","1.25k","1.5k","1.75k","2k"],
                   Util.getYLabels());
});

// Same as testLabelKMG2 but specifies the option at the
// top of the option dictionary.
it('testLabelKMG2_top', function() {
  var data = [];
  data.push([0,0]);
  data.push([1,2000]);
  data.push([2,1000]);

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'X', 'bar' ],
      labelsKMG2: true
    }
  );

  assert.deepEqual(
      ["0","256","512","768","1k","1.25k","1.5k","1.75k","2k"],
      Util.getYLabels());
});

it('testSmallLabelKMB', function() {
  var data = [];
  data.push([0, 0]);
  data.push([1, 1e-6]);
  data.push([2, 2e-6]);

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'X', 'bar' ],
      axes : {
        y: {
          labelsKMB: true
        }
      }
    }
  );

  // TODO(danvk): use prefixes here (e.g. m, µ, n)
  assert.deepEqual(['0', '5.00e-7', '1.00e-6', '1.50e-6', '2.00e-6'],
                   Util.getYLabels());
});

it('testSmallLabelKMG2', function() {
  var data = [];
  data.push([0, 0]);
  data.push([1, 1e-6]);
  data.push([2, 2e-6]);

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'X', 'bar' ],
      axes : {
        y: {
          labelsKMG2: true
        }
      }
    }
  );

  // TODO(danvk): this is strange--the values aren't on powers of two, and are
  // these units really used for powers of two in <1? See issue #571.
  assert.deepEqual(['0', '0.48u', '0.95u', '1.43u', '1.91u'],
                   Util.getYLabels());
});

/**
 * Verify that log scale axis range is properly specified.
 */
it('testLogScale', function() {
  var g = new Dygraph("graph",
                      [[0, 5], [1, 1000]], {
                        logscale: true,
                        labels: ['X', 'Y']
                      });
  var nonEmptyLabels = Util.getYLabels().filter(function(x) { return x.length > 0; });
  assert.deepEqual(["5","10","20","50","100","200","500","1000"], nonEmptyLabels);
 
  g.updateOptions({ logscale : false });
  assert.deepEqual(['0','200','400','600','800','1000'], Util.getYLabels());
});

/**
 * Verify that log scale axis range works with yRangePad.
 *
 * This is a regression test for https://github.com/danvk/dygraphs/issues/661 .
 */
it('testLogScalePad', function() {
  var g = new Dygraph("graph",
                      [[0, 1e-5], [1, 0.25], [2, 1], [3, 3], [4, 10]], {
                        width: 250,
                        height: 130,
                        logscale: true,
                        yRangePad: 30,
                        axes: {y: {valueRange: [1, 10]}},
                        labels: ['X', 'Y']
                      });
  var nonEmptyLabels = Util.getYLabels().filter(function(x) { return x.length > 0; });
  assert.deepEqual(['1', '7', '30'], nonEmptyLabels);

  g.updateOptions({ yRangePad: 10, axes: {y: {valueRange: [0.25005, 3]}} });
  nonEmptyLabels = Util.getYLabels().filter(function(x) { return x.length > 0; });
  assert.deepEqual(['0.4', '1', '3'], nonEmptyLabels);

  g.updateOptions({ axes: {y: {valueRange: [0.01, 3]}} });
  nonEmptyLabels = Util.getYLabels().filter(function(x) { return x.length > 0; });
  assert.deepEqual(['0.01','0.1','0.7','5'], nonEmptyLabels);
});

/**
 * Verify that include zero range is properly specified.
 */
it('testIncludeZero', function() {
  var g = new Dygraph("graph",
                      [[0, 500], [1, 1000]], {
                        includeZero: true,
                        labels: ['X', 'Y1']
                      });
  assert.deepEqual(['0','200','400','600','800','1000'], Util.getYLabels());
 
  g.updateOptions({ includeZero : false });
  assert.deepEqual(['500','600','700','800','900','1000'], Util.getYLabels());
});

it('testAxisLabelFontSize', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, simpleData, {});

  // Be sure we're dealing with a 14-point default.
  assert.equal(14, DEFAULT_ATTRS.axisLabelFontSize);

  var assertFontSize = function(selector, expected) {
    Util.assertStyleOfChildren(selector, "font-size", expected);
  }

  assertFontSize(document.querySelectorAll(".dygraph-axis-label-x"), "14px");
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y"), "14px");

  g.updateOptions({axisLabelFontSize : 8});
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-x"), "8px"); 
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y"), "8px"); 

  g.updateOptions({
    axisLabelFontSize : null,
    axes: { 
      x: { axisLabelFontSize : 5 },
    }   
  }); 

  assertFontSize(document.querySelectorAll(".dygraph-axis-label-x"), "5px"); 
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y"), "14px");

  g.updateOptions({
    axes: { 
      y: { axisLabelFontSize : 20 },
    }   
  }); 

  assertFontSize(document.querySelectorAll(".dygraph-axis-label-x"), "5px"); 
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y"), "20px"); 

  g.updateOptions({
    series: { 
      Y2: { axis : "y2" } // copy y2 series to y2 axis.
    },  
    axes: { 
      y2: { axisLabelFontSize : 12 },
    }   
  }); 

  assertFontSize(document.querySelectorAll(".dygraph-axis-label-x"), "5px"); 
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y1"), "20px"); 
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y2"), "12px"); 
});

it('testAxisLabelFontSizeNull', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, simpleData,
    {
      axisLabelFontSize: null
    });

  var assertFontSize = function(selector, expected) {
    Util.assertStyleOfChildren(selector, "font-size", expected);
  };

  // Be sure we're dealing with a 14-point default.
  assert.equal(14, DEFAULT_ATTRS.axisLabelFontSize);

  assertFontSize(document.querySelectorAll(".dygraph-axis-label-x"), "14px");
  assertFontSize(document.querySelectorAll(".dygraph-axis-label-y"), "14px");
});

/*
 * This test shows that the label formatter overrides labelsKMB for all values.
 */
it('testLabelFormatterOverridesLabelsKMB', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "X,a,b\n" +
      "1,0,2000\n" +
      "2,500,1500\n" +
      "3,1000,1000\n" +
      "4,2000,0\n", {
        labelsKMB: true,
        axisLabelFormatter: function (v) {
          return v + ":X";
        }
      });
  assert.deepEqual(["0:X","500:X","1000:X","1500:X","2000:X"], Util.getYLabels());
  assert.deepEqual(["1:X","2:X","3:X"], Util.getXLabels());
});

/*
 * This test shows that you can override labelsKMB on the axis level.
 */
it('testLabelsKMBPerAxis', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "x,a,b\n" +
      "1000,0,2000\n" +
      "2000,500,1500\n" +
      "3000,1000,1000\n" +
      "4000,2000,0\n", {
        labelsKMB: false,
        axes: {
          y2: { labelsKMB: true },
          x: { labelsKMB: true }
        },
        series: {
          b: { axis: "y2" }
        }
      });

  // labelsKMB doesn't apply to the x axis. This value should be different.
  // BUG : https://code.google.com/p/dygraphs/issues/detail?id=488
  assert.deepEqual(["1000","2000","3000"], Util.getXLabels());
  assert.deepEqual(["0","500","1000","1500","2000"], Util.getYLabels(1));
  assert.deepEqual(["0","500","1K","1.5K","2K"], Util.getYLabels(2));
});

/*
 * This test shows that you can override labelsKMG2 on the axis level.
 */
it('testLabelsKMBG2IPerAxis', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "x,a,b\n" +
      "1000,0,2000\n" +
      "2000,500,1500\n" +
      "3000,1000,1000\n" +
      "4000,2000,0\n", {
        labelsKMG2: false,
        axes: {
          y2: { labelsKMG2: true },
          x: { labelsKMG2: true, pixelsPerLabel: 60 }
        },
        series: {
          b: { axis: "y2" }
        }
      });

  // It is weird that labelsKMG2 does something on the x axis but KMB does not.
  // Plus I can't be sure they're doing the same thing as they're done in different
  // bits of code.
  // BUG : https://code.google.com/p/dygraphs/issues/detail?id=488
  assert.deepEqual(["1024","2048","3072"], Util.getXLabels());
  assert.deepEqual(["0","500","1000","1500","2000"], Util.getYLabels(1));
  assert.deepEqual(["0","500","1000","1.46k","1.95k"], Util.getYLabels(2));
});

/**
 * This test shows you can override sigFigs on the axis level.
 */
it('testSigFigsPerAxis', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "x,a,b\n" +
      "1000,0,2000\n" +
      "2000,500,1500\n" +
      "3000,1000,1000\n" +
      "4000,2000,0\n", {
        sigFigs: 2,
        axes: {
          y2: { sigFigs: 6 },
          x: { sigFigs: 8 }
        },
        series: {
          b: { axis: "y2" }
        }

      });
  // sigFigs doesn't apply to the x axis. This value should be different.
  // BUG : https://code.google.com/p/dygraphs/issues/detail?id=488
  assert.deepEqual(["1000","2000","3000"], Util.getXLabels());
  assert.deepEqual(["0.0","5.0e+2","1.0e+3","1.5e+3","2.0e+3"], Util.getYLabels(1));
  assert.deepEqual(["0.00000","500.000","1000.00","1500.00","2000.00"], Util.getYLabels(2));
});

/**
 * This test shows you can override digitsAfterDecimal on the axis level.
 */
it('testDigitsAfterDecimalPerAxis', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "x,a,b\n" +
      "0.006,0.001,0.008\n" +
      "0.007,0.002,0.007\n" +
      "0.008,0.003,0.006\n" +
      "0.009,0.004,0.005\n", {
        digitsAfterDecimal: 1,
        series: {
          b: { axis: "y2" }
        }

      });

  g.updateOptions({ axes: { y: { digitsAfterDecimal: 3 }}});
  assert.deepEqual(["0.001","0.002","0.002","0.003","0.003","0.004","0.004"], Util.getYLabels(1));
  g.updateOptions({ axes: { y: { digitsAfterDecimal: 4 }}});
  assert.deepEqual(["0.001","0.0015","0.002","0.0025","0.003","0.0035","0.004"], Util.getYLabels(1));
  g.updateOptions({ axes: { y: { digitsAfterDecimal: 5 }}});
  assert.deepEqual(["0.001","0.0015","0.002","0.0025","0.003","0.0035","0.004"], Util.getYLabels(1));
  g.updateOptions({ axes: { y: { digitsAfterDecimal: null }}});
  assert.deepEqual(["1e-3","2e-3","2e-3","3e-3","3e-3","4e-3","4e-3"], Util.getYLabels(1));

  g.updateOptions({ axes: { y2: { digitsAfterDecimal: 3 }}});
  assert.deepEqual(["0.005","0.006","0.006","0.007","0.007","0.008","0.008"], Util.getYLabels(2));
  g.updateOptions({ axes: { y2: { digitsAfterDecimal: 4 }}});
  assert.deepEqual(["0.005","0.0055","0.006","0.0065","0.007","0.0075","0.008"], Util.getYLabels(2));
  g.updateOptions({ axes: { y2: { digitsAfterDecimal: 5 }}});
  assert.deepEqual(["0.005","0.0055","0.006","0.0065","0.007","0.0075","0.008"], Util.getYLabels(2));
  g.updateOptions({ axes: { y2: { digitsAfterDecimal: null }}});
  assert.deepEqual(["5e-3","6e-3","6e-3","7e-3","7e-3","7e-3","8e-3"], Util.getYLabels(2));


  // digitsAfterDecimal is ignored for the x-axis.
  // BUG : https://code.google.com/p/dygraphs/issues/detail?id=488
  g.updateOptions({ axes: { x: { digitsAfterDecimal: 3 }}});
  assert.deepEqual(["0.006","0.007","0.008"], Util.getXLabels());
  g.updateOptions({ axes: { x: { digitsAfterDecimal: 4 }}});
  assert.deepEqual(["0.006","0.007","0.008"], Util.getXLabels());
  g.updateOptions({ axes: { x: { digitsAfterDecimal: 5 }}});
  assert.deepEqual(["0.006","0.007","0.008"], Util.getXLabels());
  g.updateOptions({ axes: { x: { digitsAfterDecimal: null }}});
  assert.deepEqual(["0.006","0.007","0.008"], Util.getXLabels());
});

/**
 * This test shows you can override digitsAfterDecimal on the axis level.
 */
it('testMaxNumberWidthPerAxis', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "x,a,b\n" +
      "12401,12601,12804\n" +
      "12402,12602,12803\n" +
      "12403,12603,12802\n" +
      "12404,12604,12801\n", {
        maxNumberWidth: 1,
        series: {
          b: { axis: "y2" }
        }
      });

  g.updateOptions({ axes: { y: { maxNumberWidth: 4 }}});
  assert.deepEqual(["1.26e+4","1.26e+4","1.26e+4","1.26e+4","1.26e+4","1.26e+4","1.26e+4"] , Util.getYLabels(1));
  g.updateOptions({ axes: { y: { maxNumberWidth: 5 }}});
  assert.deepEqual(["12601","12601.5","12602","12602.5","12603","12603.5","12604"] , Util.getYLabels(1));
  g.updateOptions({ axes: { y: { maxNumberWidth: null }}});
  assert.deepEqual(["1.26e+4","1.26e+4","1.26e+4","1.26e+4","1.26e+4","1.26e+4","1.26e+4"] , Util.getYLabels(1));

  g.updateOptions({ axes: { y2: { maxNumberWidth: 4 }}});
  assert.deepEqual(["1.28e+4","1.28e+4","1.28e+4","1.28e+4","1.28e+4","1.28e+4","1.28e+4"], Util.getYLabels(2));
  g.updateOptions({ axes: { y2: { maxNumberWidth: 5 }}});
  assert.deepEqual(["12801","12801.5","12802","12802.5","12803","12803.5","12804"], Util.getYLabels(2));
  g.updateOptions({ axes: { y2: { maxNumberWidth: null }}});
  assert.deepEqual(["1.28e+4","1.28e+4","1.28e+4","1.28e+4","1.28e+4","1.28e+4","1.28e+4"], Util.getYLabels(2));

  // maxNumberWidth is ignored for the x-axis.
  // BUG : https://code.google.com/p/dygraphs/issues/detail?id=488
  g.updateOptions({ axes: { x: { maxNumberWidth: 4 }}});
  assert.deepEqual(["12401","12402","12403"], Util.getXLabels());
  g.updateOptions({ axes: { x: { maxNumberWidth: 5 }}});
  assert.deepEqual(["12401","12402","12403"], Util.getXLabels());
  g.updateOptions({ axes: { x: { maxNumberWidth: null }}});
  assert.deepEqual(["12401","12402","12403"], Util.getXLabels());
});

/*
// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=147
// Checks that axis labels stay sane across a DST change.
it('testLabelsCrossDstChange', function() {
  // (From tests/daylight-savings.html)
  var g = new Dygraph(
      document.getElementById("graph"),
      "Date/Time,Purchases\n" +
      "2010-11-05 00:00:00,167082\n" +
      "2010-11-06 00:00:00,168571\n" +
      "2010-11-07 00:00:00,177796\n" +
      "2010-11-08 00:00:00,165587\n" +
      "2010-11-09 00:00:00,164380\n",
      { width: 1024 }
      );

  // Dates and "nice" hours: 6AM/PM and noon, not 5AM/11AM/...
  var okLabels = {
    '05Nov': true,
    '06Nov': true,
    '07Nov': true,
    '08Nov': true,
    '09Nov': true,
    '06:00': true,
    '12:00': true,
    '18:00': true
  };

  var xLabels = Util.getXLabels();
  for (var i = 0; i < xLabels.length; i++) {
    assert.isTrue(okLabels[xLabels[i]]);
  }

  // This range had issues of its own on tests/daylight-savings.html.
  g.updateOptions({
    dateWindow: [1289109997722.8127, 1289261208937.7659]
  });
  xLabels = Util.getXLabels();
  for (var i = 0; i < xLabels.length; i++) {
    assert.isTrue(okLabels[xLabels[i]]);
  }
});


// Tests data which crosses a "fall back" at a high enough frequency that you
// can see both 1:00 A.M.s.
it('testLabelsCrossDstChangeHighFreq', function() {
  // Generate data which crosses the EST/EDT boundary.
  var dst_data = [];
  var base_ms = 1383454200000;
  for (var x = base_ms; x < base_ms + 1000 * 60 * 80; x += 1000) {
    dst_data.push([new Date(x), x]);
  }

  var g = new Dygraph(
          document.getElementById("graph"),
          dst_data,
      { width: 1024, labels: ['Date', 'Value'] }
      );

  assert.deepEqual([
    '00:50', '00:55',
    '01:00', '01:05', '01:10', '01:15', '01:20', '01:25',
    '01:30', '01:35', '01:40', '01:45', '01:50', '01:55',
    '01:00', '01:05'  // 1 AM number two!
  ], Util.getXLabels());

  // Now zoom past the initial 1 AM. This used to cause trouble.
  g.updateOptions({
    dateWindow: [1383454200000 + 15*60*1000, g.xAxisExtremes()[1]]}
  );
  assert.deepEqual([
    '01:05', '01:10', '01:15', '01:20', '01:25',
    '01:30', '01:35', '01:40', '01:45', '01:50', '01:55',
    '01:00', '01:05'  // 1 AM number two!
  ], Util.getXLabels());
});


// Tests data which crosses a "spring forward" at a low frequency.
// Regression test for http://code.google.com/p/dygraphs/issues/detail?id=433
it('testLabelsCrossSpringForward', function() {
  var g = new Dygraph(
      document.getElementById("graph"),
      "Date/Time,Purchases\n" +
      "2011-03-11 00:00:00,167082\n" +
      "2011-03-12 00:00:00,168571\n" +
      "2011-03-13 00:00:00,177796\n" +
      "2011-03-14 00:00:00,165587\n" +
      "2011-03-15 00:00:00,164380\n",
      {
        width: 1024,
        dateWindow: [1299989043119.4365, 1300080693627.4866]
      });

  var okLabels = {
    '13Mar': true,
    // '02:00': true,  // not a real time!
    '04:00': true,
    '06:00': true,
    '08:00': true,
    '10:00': true,
    '12:00': true,
    '14:00': true,
    '16:00': true,
    '18:00': true,
    '20:00': true,
    '22:00': true,
    '14Mar': true
  };

  var xLabels = Util.getXLabels();
  for (var i = 0; i < xLabels.length; i++) {
    assert.isTrue(okLabels[xLabels[i]]);
  }
});

it('testLabelsCrossSpringForwardHighFreq', function() {
  var base_ms_spring = 1299999000000;
  var dst_data_spring = [];
  for (var x = base_ms_spring; x < base_ms_spring + 1000 * 60 * 80; x += 1000) {
    dst_data_spring.push([new Date(x), x]);
  }

  var g = new Dygraph(
      document.getElementById("graph"),
      dst_data_spring,
      { width: 1024, labels: ['Date', 'Value'] }
  );

  assert.deepEqual([
    '01:50', '01:55',
    '03:00', '03:05', '03:10', '03:15', '03:20', '03:25',
    '03:30', '03:35', '03:40', '03:45', '03:50', '03:55',
    '04:00', '04:05'
  ], Util.getXLabels());
});
*/

});
