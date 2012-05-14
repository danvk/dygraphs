/**
 * @fileoverview Test cases for how axis labels are chosen and formatted.
 *
 * @author dan@dygraphs.com (Dan Vanderkam)
 */
var AxisLabelsTestCase = TestCase("axis-labels");

AxisLabelsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

AxisLabelsTestCase.prototype.tearDown = function() {
};

function getYLabels() {
  var y_labels = document.getElementsByClassName("dygraph-axis-label-y");
  var ary = [];
  for (var i = 0; i < y_labels.length; i++) {
    ary.push(y_labels[i].innerHTML);
  }
  return ary;
}

function getXLabels() {
  var x_labels = document.getElementsByClassName("dygraph-axis-label-x");
  var ary = [];
  for (var i = 0; i < x_labels.length; i++) {
    ary.push(x_labels[i].innerHTML);
  }
  return ary;
}

function makeNumbers(ary) {
  var ret = [];
  for (var i = 0; i < ary.length; i++) {
    ret.push(parseFloat(ary[i]));
  }
  return ret;
}

function getLegend() {
  var legend = document.getElementsByClassName("dygraph-legend")[0];
  return legend.textContent;
}

AxisLabelsTestCase.prototype.kCloseFloat = 1.0e-10;

AxisLabelsTestCase.prototype.testMinusOneToOne = function() {
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
  assertEquals(['-1','-0.5','0','0.5','1'], getYLabels());

  // Go up to 2
  data += "4,2\n";
  g.updateOptions({file: data});
  assertEquals(['-1','-0.5','0','0.5','1','1.5','2'], getYLabels());

  // Now 10
  data += "5,10\n";
  g.updateOptions({file: data});
  assertEquals(['-2','0','2','4','6','8','10'], getYLabels());

  // Now 100
  data += "6,100\n";
  g.updateOptions({file: data});
  assertEquals(['0','20','40','60','80','100'], getYLabels());

  g.setSelection(0);
  assertEquals('0: Y:-1', getLegend());
};

AxisLabelsTestCase.prototype.testSmallRangeNearZero = function() {
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
  assertEqualsDelta(makeNumbers(["-0.1","-0.08","-0.06","-0.04","-0.02","0","0.02","0.04","0.06","0.08"]),
                    makeNumbers(getYLabels()), this.kCloseFloat);

  opts.valueRange = [-0.05, 0.05];
  g.updateOptions(opts);
  // TODO(danvk): why '1.00e-2' and not '0.01'?
  assertEquals(makeNumbers(["-0.05","-0.04","-0.03","-0.02","-0.01","0","1.00e-2","0.02","0.03","0.04"]),
               makeNumbers(getYLabels()));

  opts.valueRange = [-0.01, 0.01];
  g.updateOptions(opts);
  assertEquals(makeNumbers(["-0.01","-8.00e-3","-6.00e-3","-4.00e-3","-2.00e-3","0","2.00e-3","4.00e-3","6.00e-3","8.00e-3"]), makeNumbers(getYLabels()));

  g.setSelection(1);
  assertEquals('1: Y:0', getLegend());
};

AxisLabelsTestCase.prototype.testSmallRangeAwayFromZero = function() {
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
  assertEquals(["9.9","9.92","9.94","9.96","9.98","10","10.02","10.04","10.06","10.08"], getYLabels());

  opts.valueRange = [9.99, 10.01];
  g.updateOptions(opts);
  // TODO(danvk): this is bad
  assertEquals(["9.99","9.99","9.99","10","10","10","10","10","10.01","10.01"], getYLabels());

  opts.valueRange = [9.999, 10.001];
  g.updateOptions(opts);
  // TODO(danvk): this is even worse!
  assertEquals(["10","10","10","10","10","10","10","10","10","10"], getYLabels());

  g.setSelection(1);
  assertEquals('1: Y:0', getLegend());
};

AxisLabelsTestCase.prototype.testXAxisTimeLabelFormatter = function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = [[5.0,0],[5.1,1],[5.2,2],[5.3,3],[5.4,4],[5.5,5],[5.6,6],[5.7,7],[5.8,8],[5.9,9]];
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  g.updateOptions({
    xAxisLabelFormatter: function (totalMinutes) {
      var hours   = Math.floor( totalMinutes / 60);
      var minutes = Math.floor((totalMinutes - (hours * 60)));
      var seconds = Math.round((totalMinutes * 60) - (hours * 3600) - (minutes * 60));

      if (hours   < 10) hours   = "0" + hours;
      if (minutes < 10) minutes = "0" + minutes;
      if (seconds < 10) seconds = "0" + seconds;

      return hours + ':' + minutes + ':' + seconds;
    }
  });

  assertEquals(["00:05:00","00:05:12","00:05:24","00:05:36","00:05:48"], getXLabels());

  // The legend does not use the xAxisLabelFormatter:
  g.setSelection(1);
  assertEquals('5.1: Y1:1', getLegend());
};

AxisLabelsTestCase.prototype.testAxisLabelFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    xAxisLabelFormatter: function(x, granularity, opts, dg) {
      assertEquals('number', typeof(x));
      assertEquals('number', typeof(granularity));
      assertEquals('function', typeof(opts));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'x' + x;
    },
    yAxisLabelFormatter: function(y, granularity, opts, dg) {
      assertEquals('number', typeof(y));
      assertEquals('number', typeof(granularity));
      assertEquals('function', typeof(opts));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'y' + y;
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assertEquals(['x0','x2','x4','x6','x8'], getXLabels());
  assertEquals(['y0','y2','y4','y6','y8','y10','y12','y14','y16','y18'], getYLabels());

  g.setSelection(2);
  assertEquals("2: y:4", getLegend());
};

AxisLabelsTestCase.prototype.testDateAxisLabelFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    xAxisLabelFormatter: function(x, granularity, opts, dg) {
      assertTrue(Dygraph.isDateLike(x));
      assertEquals('number', typeof(granularity));
      assertEquals('function', typeof(opts));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'x' + x.strftime('%Y/%m/%d');
    },
    yAxisLabelFormatter: function(y, granularity, opts, dg) {
      assertEquals('number', typeof(y));
      assertEquals('number', typeof(granularity));
      assertEquals('function', typeof(opts));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'y' + y;
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 1; i < 10; i++) {
    data.push([new Date("2011/01/0" + i), 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assertEquals(["x2011/01/01", "x2011/01/02", "x2011/01/03", "x2011/01/04", "x2011/01/05", "x2011/01/06", "x2011/01/07", "x2011/01/08", "x2011/01/09"], getXLabels());
  assertEquals(['y2','y4','y6','y8','y10','y12','y14','y16','y18'], getYLabels());

  g.setSelection(0);
  assertEquals("2011/01/01: y:2", getLegend());
};

// This test verifies that when a valueFormatter is set (but not an
// axisLabelFormatter), then the valueFormatter is used to format the axis
// labels.
AxisLabelsTestCase.prototype.testValueFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    xValueFormatter: function(x, opts, series_name, dg) {
      assertEquals('number', typeof(x));
      assertEquals('function', typeof(opts));
      assertEquals('string', typeof(series_name));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'x' + x;
    },
    yValueFormatter: function(y, opts, series_name, dg) {
      assertEquals('number', typeof(y));
      assertEquals('function', typeof(opts));
      assertEquals('string', typeof(series_name));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'y' + y;
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
  assertEquals(['0','2','4','6','8'], getXLabels());
  assertEquals(['0','2','4','6','8','10','12','14','16','18'],
               getYLabels());

  // they do affect the legend, however.
  g.setSelection(2);
  assertEquals("x2: y:y4", getLegend());
};

AxisLabelsTestCase.prototype.testDateValueFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    xValueFormatter: function(x, opts, series_name, dg) {
      assertEquals('number', typeof(x));
      assertEquals('function', typeof(opts));
      assertEquals('string', typeof(series_name));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'x' + new Date(x).strftime('%Y/%m/%d');
    },
    yValueFormatter: function(y, opts, series_name, dg) {
      assertEquals('number', typeof(y));
      assertEquals('function', typeof(opts));
      assertEquals('string', typeof(series_name));
      assertEquals('[Dygraph graph]', dg.toString());
      return 'y' + y;
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
  assertEquals(['01Jan','02Jan','03Jan','04Jan','05Jan','06Jan','07Jan','08Jan','09Jan'], getXLabels());
  assertEquals(['2','4','6','8','10','12','14','16','18'], getYLabels());

  // the valueFormatter options also affect the legend.
  g.setSelection(2);
  assertEquals('x2011/01/03: y:y6', getLegend());
};

// This test verifies that when both a valueFormatter and an axisLabelFormatter
// are specified, the axisLabelFormatter takes precedence.
AxisLabelsTestCase.prototype.testAxisLabelFormatterPrecedence = function () {
  var opts = {
    width: 480,
    height: 320,
    xValueFormatter: function(x) {
      return 'xvf' + x;
    },
    yValueFormatter: function(y) {
      return 'yvf' + y;
    },
    xAxisLabelFormatter: function(x, granularity) {
      return 'x' + x;
    },
    yAxisLabelFormatter: function(y) {
      return 'y' + y;
    },
    labels: ['x', 'y']
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assertEquals(['x0','x2','x4','x6','x8'], getXLabels());
  assertEquals(['y0','y2','y4','y6','y8','y10','y12','y14','y16','y18'], getYLabels());

  g.setSelection(9);
  assertEquals("xvf9: y:yvf18", getLegend());
};

// This is the same as the previous test, except that options are added
// one-by-one.
AxisLabelsTestCase.prototype.testAxisLabelFormatterIncremental = function () {
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
    xValueFormatter: function(x) {
      return 'xvf' + x;
    }
  });
  g.updateOptions({
    yValueFormatter: function(y) {
      return 'yvf' + y;
    }
  });
  g.updateOptions({
    xAxisLabelFormatter: function(x, granularity) {
      return 'x' + x;
    }
  });
  g.updateOptions({
    yAxisLabelFormatter: function(y) {
      return 'y' + y;
    }
  });

  assertEquals(["x0","x2","x4","x6","x8"], getXLabels());
  assertEquals(['y0','y2','y4','y6','y8','y10','y12','y14','y16','y18'], getYLabels());

  g.setSelection(9);
  assertEquals("xvf9: y:yvf18", getLegend());
};

AxisLabelsTestCase.prototype.testGlobalFormatters = function() {
  var opts = {
    width: 480,
    height: 320,
    labels: ['x', 'y'],
    valueFormatter: function(x) {
      return 'vf' + x;
    },
    axisLabelFormatter: function(x) {
      return 'alf' + x;
    }
  };
  var data = [];
  for (var i = 0; i < 10; i++) {
    data.push([i, 2 * i]);
  }
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  assertEquals(['alf0','alf2','alf4','alf6','alf8'], getXLabels());
  assertEquals(['alf0','alf2','alf4','alf6','alf8','alf10','alf12','alf14','alf16','alf18'], getYLabels());

  g.setSelection(9);
  assertEquals("vf9: y:vf18", getLegend());
};

AxisLabelsTestCase.prototype.testSeriesOrder = function() {
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
  assertEquals('2: 00:103 01:203 10:303 11:403', getLegend());

  // Sanity checks for indexFromSetName
  assertEquals(0, g.indexFromSetName("x"));
  assertEquals(1, g.indexFromSetName("00"));
  assertEquals(null, g.indexFromSetName("abcde"));

  // Verify that we get the label list back in the right order
  assertEquals(["x", "00", "01", "10", "11"], g.getLabels());
};
