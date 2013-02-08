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

AxisLabelsTestCase.simpleData =
    "X,Y,Y2\n" +
    "0,-1,.5\n" +
    "1,0,.7\n" +
    "2,1,.4\n" +
    "3,0,.98\n";

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
  assertEquals(['-1','-0.5','0','0.5','1'], Util.getYLabels());

  // Go up to 2
  data += "4,2\n";
  g.updateOptions({file: data});
  assertEquals(['-1','-0.5','0','0.5','1','1.5','2'], Util.getYLabels());

  // Now 10
  data += "5,10\n";
  g.updateOptions({file: data});
  assertEquals(['-2','0','2','4','6','8','10'], Util.getYLabels());

  // Now 100
  data += "6,100\n";
  g.updateOptions({file: data});
  assertEquals(['0','20','40','60','80','100'], Util.getYLabels());

  g.setSelection(0);
  assertEquals('0: Y: -1', Util.getLegend());
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
  assertEqualsDelta([-0.1, -0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08],
                    Util.makeNumbers(Util.getYLabels()), this.kCloseFloat);

  opts.valueRange = [-0.05, 0.05];
  g.updateOptions(opts);
  assertEquals([-0.05, -0.04, -0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04],
               Util.makeNumbers(Util.getYLabels()));

  opts.valueRange = [-0.01, 0.01];
  g.updateOptions(opts);
  assertEquals([-0.01, -8.00e-3, -6.00e-3, -4.00e-3, -2.00e-3, 0, 2.00e-3, 4.00e-3, 6.00e-3, 8.00e-3],
               Util.makeNumbers(Util.getYLabels()));

  g.setSelection(1);
  assertEquals('1: Y: 0', Util.getLegend());
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
  assertEquals(["9.9","9.92","9.94","9.96","9.98","10","10.02","10.04","10.06","10.08"], Util.getYLabels());

  opts.valueRange = [9.99, 10.01];
  g.updateOptions(opts);
  // TODO(danvk): this is bad
  assertEquals(["9.99","9.99","9.99","10","10","10","10","10","10.01","10.01"], Util.getYLabels());

  opts.valueRange = [9.999, 10.001];
  g.updateOptions(opts);
  // TODO(danvk): this is even worse!
  assertEquals(["10","10","10","10","10","10","10","10","10","10"], Util.getYLabels());

  g.setSelection(1);
  assertEquals('1: Y: 0', Util.getLegend());
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

  assertEquals(["00:05:00","00:05:12","00:05:24","00:05:36","00:05:48"], Util.getXLabels());

  // The legend does not use the axisLabelFormatter:
  g.setSelection(1);
  assertEquals('5.1: Y1: 1', Util.getLegend());
};

AxisLabelsTestCase.prototype.testAxisLabelFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        axisLabelFormatter : function(x, granularity, opts, dg) {
          assertEquals('number', typeof(x));
          assertEquals('number', typeof(granularity));
          assertEquals('function', typeof(opts));
          assertEquals('[Dygraph graph]', dg.toString());
          return 'x' + x;
        }
      },
      y : {
        axisLabelFormatter : function(y, granularity, opts, dg) {
          assertEquals('number', typeof(y));
          assertEquals('number', typeof(granularity));
          assertEquals('function', typeof(opts));
          assertEquals('[Dygraph graph]', dg.toString());
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

  assertEquals(['x0','x2','x4','x6','x8'], Util.getXLabels());
  assertEquals(['y0','y2','y4','y6','y8','y10','y12','y14','y16','y18'], Util.getYLabels());

  g.setSelection(2);
  assertEquals("2: y: 4", Util.getLegend());
};

AxisLabelsTestCase.prototype.testDateAxisLabelFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        axisLabelFormatter : function(x, granularity, opts, dg) {
          assertTrue(Dygraph.isDateLike(x));
          assertEquals('number', typeof(granularity));
          assertEquals('function', typeof(opts));
          assertEquals('[Dygraph graph]', dg.toString());
          return 'x' + x.strftime('%Y/%m/%d');
        }
      },
      y : {
        axisLabelFormatter : function(y, granularity, opts, dg) {
          assertEquals('number', typeof(y));
          assertEquals('number', typeof(granularity));
          assertEquals('function', typeof(opts));
          assertEquals('[Dygraph graph]', dg.toString());
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

  assertEquals(["x2011/01/01", "x2011/01/02", "x2011/01/03", "x2011/01/04", "x2011/01/05", "x2011/01/06", "x2011/01/07", "x2011/01/08", "x2011/01/09"], Util.getXLabels());
  assertEquals(['y2','y4','y6','y8','y10','y12','y14','y16','y18'], Util.getYLabels());

  g.setSelection(0);
  assertEquals("2011/01/01: y: 2", Util.getLegend());
};

// This test verifies that when a valueFormatter is set (but not an
// axisLabelFormatter), then the valueFormatter is used to format the axis
// labels.
AxisLabelsTestCase.prototype.testValueFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        valueFormatter: function(x, opts, series_name, dg) {
          assertEquals('number', typeof(x));
          assertEquals('function', typeof(opts));
          assertEquals('string', typeof(series_name));
          assertEquals('[Dygraph graph]', dg.toString());
          return 'x' + x;
        }
      },
      y : {
        valueFormatter: function(y, opts, series_name, dg) {
          assertEquals('number', typeof(y));
          assertEquals('function', typeof(opts));
          assertEquals('string', typeof(series_name));
          assertEquals('[Dygraph graph]', dg.toString());
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
  assertEquals(['0','2','4','6','8'], Util.getXLabels());
  assertEquals(['0','2','4','6','8','10','12','14','16','18'],
               Util.getYLabels());

  // they do affect the legend, however.
  g.setSelection(2);
  assertEquals("x2: y: y4", Util.getLegend());
};

AxisLabelsTestCase.prototype.testDateValueFormatter = function () {
  var opts = {
    width: 480,
    height: 320,
    axes : {
      x : {
        valueFormatter: function(x, opts, series_name, dg) {
          assertEquals('number', typeof(x));
          assertEquals('function', typeof(opts));
          assertEquals('string', typeof(series_name));
          assertEquals('[Dygraph graph]', dg.toString());
          return 'x' + new Date(x).strftime('%Y/%m/%d');
        }
      },
      y : {
        valueFormatter: function(y, opts, series_name, dg) {
          assertEquals('number', typeof(y));
          assertEquals('function', typeof(opts));
          assertEquals('string', typeof(series_name));
          assertEquals('[Dygraph graph]', dg.toString());
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
  assertEquals(['01Jan','02Jan','03Jan','04Jan','05Jan','06Jan','07Jan','08Jan','09Jan'], Util.getXLabels());
  assertEquals(['2','4','6','8','10','12','14','16','18'], Util.getYLabels());

  // the valueFormatter options also affect the legend.
  g.setSelection(2);
  assertEquals('x2011/01/03: y: y6', Util.getLegend());
};

// This test verifies that when both a valueFormatter and an axisLabelFormatter
// are specified, the axisLabelFormatter takes precedence.
AxisLabelsTestCase.prototype.testAxisLabelFormatterPrecedence = function () {
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
        }
      },
      y : {
        valueFormatter: function(y) {
          return 'yvf' + y;
        },
        axisLabelFormatter: function(y) {
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

  assertEquals(['x0','x2','x4','x6','x8'], Util.getXLabels());
  assertEquals(['y0','y2','y4','y6','y8','y10','y12','y14','y16','y18'], Util.getYLabels());

  g.setSelection(9);
  assertEquals("xvf9: y: yvf18", Util.getLegend());
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

  assertEquals(["x0","x2","x4","x6","x8"], Util.getXLabels());
  assertEquals(['y0','y2','y4','y6','y8','y10','y12','y14','y16','y18'], Util.getYLabels());

  g.setSelection(9);
  assertEquals("xvf9: y: yvf18", Util.getLegend());
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

  assertEquals(['alf0','alf2','alf4','alf6','alf8'], Util.getXLabels());
  assertEquals(['alf0','alf2','alf4','alf6','alf8','alf10','alf12','alf14','alf16','alf18'], Util.getYLabels());

  g.setSelection(9);
  assertEquals("vf9: y: vf18", Util.getLegend());
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
  assertEquals('2: 00: 103 01: 203 10: 303 11: 403', Util.getLegend());

  // Sanity checks for indexFromSetName
  assertEquals(0, g.indexFromSetName("x"));
  assertEquals(1, g.indexFromSetName("00"));
  assertEquals(null, g.indexFromSetName("abcde"));

  // Verify that we get the label list back in the right order
  assertEquals(["x", "00", "01", "10", "11"], g.getLabels());
};

AxisLabelsTestCase.prototype.testLabelKMB = function() {
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

  assertEquals(["0", "500", "1K", "1.5K", "2K"], Util.getYLabels());
};

AxisLabelsTestCase.prototype.testLabelKMG2 = function() {
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

  assertEquals(
      ["0","256","512","768","1k","1.25k","1.5k","1.75k","2k"],
      Util.getYLabels());
};

// Same sa testLabelKMG2 but specifies the option at the
// top of the option dictionary.
AxisLabelsTestCase.prototype.testLabelKMG2_top = function() {
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

  assertEquals(
      ["0","256","512","768","1k","1.25k","1.5k","1.75k","2k"],
      Util.getYLabels());
};

/**
 * Verify that log scale axis range is properly specified.
 */
AxisLabelsTestCase.prototype.testLogScale = function() {
  var g = new Dygraph("graph", [[0, 5], [1, 1000]], { logscale : true });
  var nonEmptyLabels = Util.getYLabels().filter(function(x) { return x.length > 0; });
  assertEquals(["6","10","30","60","100","300","600","1000"], nonEmptyLabels);
 
  g.updateOptions({ logscale : false });
  assertEquals(['0','200','400','600','800','1000'], Util.getYLabels());
}

/**
 * Verify that include zero range is properly specified.
 */
AxisLabelsTestCase.prototype.testIncludeZero = function() {
  var g = new Dygraph("graph", [[0, 500], [1, 1000]], { includeZero : true });
  assertEquals(['0','200','400','600','800','1000'], Util.getYLabels());
 
  g.updateOptions({ includeZero : false });
  assertEquals(['500','600','700','800','900','1000'], Util.getYLabels());
}

AxisLabelsTestCase.prototype.testAxisLabelFontSize = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, AxisLabelsTestCase.simpleData, {});

  // Be sure we're dealing with a 14-point default.
  assertEquals(14, Dygraph.DEFAULT_ATTRS.axisLabelFontSize);

  var assertFontSize = function(selector, expected) {
    Util.assertStyleOfChildren(selector, "font-size", expected);
  }
  
  assertFontSize($(".dygraph-axis-label-x"), "14px");
  assertFontSize($(".dygraph-axis-label-y") , "14px");

  g.updateOptions({ axisLabelFontSize : 8});
  assertFontSize($(".dygraph-axis-label-x"), "8px"); 
  assertFontSize($(".dygraph-axis-label-y"), "8px"); 

  g.updateOptions({
    axisLabelFontSize : null,
    axes : { 
      x : { axisLabelFontSize : 5 },
    }   
  }); 

  assertFontSize($(".dygraph-axis-label-x"), "5px"); 
  assertFontSize($(".dygraph-axis-label-y"), "14px");

  g.updateOptions({
    axes : { 
      y : { axisLabelFontSize : 20 },
    }   
  }); 

  assertFontSize($(".dygraph-axis-label-x"), "5px"); 
  assertFontSize($(".dygraph-axis-label-y"), "20px"); 

  g.updateOptions({
    series : { 
      Y2 : { axis : "y2" } // copy y2 series to y2 axis.
    },  
    axes : { 
      y2 : { axisLabelFontSize : 12 },
    }   
  }); 

  assertFontSize($(".dygraph-axis-label-x"), "5px"); 
  assertFontSize($(".dygraph-axis-label-y1"), "20px"); 
  assertFontSize($(".dygraph-axis-label-y2"), "12px"); 
}

AxisLabelsTestCase.prototype.testAxisLabelFontSizeNull = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, AxisLabelsTestCase.simpleData,
    {
      axisLabelFontSize: null
    });

  var assertFontSize = function(selector, expected) {
    Util.assertStyleOfChildren(selector, "font-size", expected);
  };

  // Be sure we're dealing with a 14-point default.
  assertEquals(14, Dygraph.DEFAULT_ATTRS.axisLabelFontSize);

  assertFontSize($(".dygraph-axis-label-x"), "14px");
  assertFontSize($(".dygraph-axis-label-y"), "14px");
}

AxisLabelsTestCase.prototype.testAxisLabelColor = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, AxisLabelsTestCase.simpleData, {});

  // Be sure we're dealing with a black default.
  assertEquals("black", Dygraph.DEFAULT_ATTRS.axisLabelColor);

  var assertColor = function(selector, expected) {
    Util.assertStyleOfChildren(selector, "color", expected);
  }

  assertColor($(".dygraph-axis-label-x"), "rgb(0, 0, 0)");
  assertColor($(".dygraph-axis-label-y"), "rgb(0, 0, 0)");

  g.updateOptions({ axisLabelColor : "red"});
  assertColor($(".dygraph-axis-label-x"), "rgb(255, 0, 0)"); 
  assertColor($(".dygraph-axis-label-y"), "rgb(255, 0, 0)"); 

  g.updateOptions({
    axisLabelColor : null,
    axes : { 
      x : { axisLabelColor : "blue" },
    }   
  }); 

  assertColor($(".dygraph-axis-label-x"), "rgb(0, 0, 255)"); 
  assertColor($(".dygraph-axis-label-y"), "rgb(0, 0, 0)");

  g.updateOptions({
    axes : { 
      y : { axisLabelColor : "green" },
    }   
  }); 

  assertColor($(".dygraph-axis-label-x"), "rgb(0, 0, 255)"); 
  assertColor($(".dygraph-axis-label-y"), "rgb(0, 128, 0)"); 

  g.updateOptions({
    series : { 
      Y2 : { axis : "y2" } // copy y2 series to y2 axis.
    },  
    axes : { 
      y2 : { axisLabelColor : "yellow" },
    }   
  }); 

  assertColor($(".dygraph-axis-label-x"), "rgb(0, 0, 255)"); 
  assertColor($(".dygraph-axis-label-y1"), "rgb(0, 128, 0)"); 
  assertColor($(".dygraph-axis-label-y2"), "rgb(255, 255, 0)"); 
}

AxisLabelsTestCase.prototype.testAxisLabelColorNull = function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, AxisLabelsTestCase.simpleData,
    {
      axisLabelColor: null
    });

  var assertColor = function(selector, expected) {
    Util.assertStyleOfChildren(selector, "color", expected);
  }

  // Be sure we're dealing with a 14-point default.
  assertEquals(14, Dygraph.DEFAULT_ATTRS.axisLabelFontSize);

  assertColor($(".dygraph-axis-label-x"), "rgb(0, 0, 0)");
  assertColor($(".dygraph-axis-label-y"), "rgb(0, 0, 0)");
}
