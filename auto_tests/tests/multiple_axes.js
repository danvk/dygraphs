/** 
 * @fileoverview Tests involving multiple y-axes.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
import Util from './Util';

describe("multiple-axes-tests", function() {

cleanupAfterEach();

var getData = function() {
  var data = [];
  for (var i = 1; i <= 100; i++) {
    var m = "01", d = i;
    if (d > 31) { m = "02"; d -= 31; }
    if (m == "02" && d > 28) { m = "03"; d -= 28; }
    if (m == "03" && d > 31) { m = "04"; d -= 31; }
    if (d < 10) d = "0" + d;
    // two series, one with range 1-100, one with range 1-2M
    data.push([new Date("2010/" + m + "/" + d),
               i,
               100 - i,
               1e6 * (1 + i * (100 - i) / (50 * 50)),
               1e6 * (2 - i * (100 - i) / (50 * 50))]);
  }
  return data;
};

it('testBasicMultipleAxes', function() {
  var data = getData();

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      width: 640,
      height: 350,
      series : {
        'Y3': {
          axis: 'y2'
        },
        'Y4': {
          axis: 'y2'
        }
      },
      axes : {
        y2 : {
          // set axis-related properties here
          labelsKMB: true
        }
      }
    }
  );

  assert.deepEqual(["0","20","40","60","80","100"], Util.getYLabels("1"));
  assert.deepEqual(["900K","1.12M","1.34M","1.55M","1.77M","1.99M"], Util.getYLabels("2"));
});

it('testTwoAxisVisibility', function() {
  var data = [];
  data.push([0,0,0]);
  data.push([1,2,2000]);
  data.push([2,4,1000]);

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'X', 'bar', 'zot' ],
      series : {
        zot : {
          axis : 'y2'
        }
      },
      axes : {
        y2: {
          labelsKMB: true
        }
      }
    }
  );

  assert.isTrue(document.getElementsByClassName("dygraph-axis-label-y").length > 0);
  assert.isTrue(document.getElementsByClassName("dygraph-axis-label-y2").length > 0);

  g.setVisibility(0, false);

  assert.isTrue(document.getElementsByClassName("dygraph-axis-label-y").length > 0);
  assert.isTrue(document.getElementsByClassName("dygraph-axis-label-y2").length > 0);

  g.setVisibility(0, true);
  g.setVisibility(1, false);

  assert.isTrue(document.getElementsByClassName("dygraph-axis-label-y").length > 0);
  assert.isTrue(document.getElementsByClassName("dygraph-axis-label-y2").length > 0);
});

// verifies that all four chart labels (title, x-, y-, y2-axis label) can be
// used simultaneously.
it('testMultiChartLabels', function() {
  var data = getData();

  var el = document.getElementById("graph");
  el.style.border = '1px solid black';
  el.style.marginLeft = '200px';
  el.style.marginTop = '200px';

  var g = new Dygraph(
    el,
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      width: 640,
      height: 350,
      series : {
        'Y3': {
          axis: 'y2'
        },
        'Y4': {
          axis: 'y2'
        }
      },
      xlabel: 'x-axis',
      ylabel: 'y-axis',
      y2label: 'y2-axis',
      title: 'Chart title'
    }
  );

  assert.deepEqual(["Chart title", "x-axis", "y-axis", "y2-axis"],
               Util.getClassTexts("dygraph-label"));
  assert.deepEqual(["Chart title"], Util.getClassTexts("dygraph-title"));
  assert.deepEqual(["x-axis"], Util.getClassTexts("dygraph-xlabel"));
  assert.deepEqual(["y-axis"], Util.getClassTexts("dygraph-ylabel"));
  assert.deepEqual(["y2-axis"], Util.getClassTexts("dygraph-y2label"));

  // TODO(danvk): check relative positioning here: title on top, y left of y2.
});

// Check that a chart w/o a secondary y-axis will not get a y2label, even if one
// is specified.
it('testNoY2LabelWithoutSecondaryAxis', function() {
  var g = new Dygraph(
    document.getElementById("graph"),
    getData(),
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      width: 640,
      height: 350,
      xlabel: 'x-axis',
      ylabel: 'y-axis',
      y2label: 'y2-axis',
      title: 'Chart title'
    }
  );

  assert.deepEqual(["Chart title", "x-axis", "y-axis"],
               Util.getClassTexts("dygraph-label"));
  assert.deepEqual(["Chart title"], Util.getClassTexts("dygraph-title"));
  assert.deepEqual(["x-axis"], Util.getClassTexts("dygraph-xlabel"));
  assert.deepEqual(["y-axis"], Util.getClassTexts("dygraph-ylabel"));
  assert.deepEqual([], Util.getClassTexts("dygraph-y2label"));
});

it('testValueRangePerAxisOptions', function() {
  var data = getData();

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      series : {
        'Y3': {
          axis: 'y2'
        },
        'Y4': {
          axis: 'y2'
        }
      },
      axes: {
        y: {
          axisLabelWidth: 60,
          valueRange: [40, 70]
        },
        y2: {
          // set axis-related properties here
          labelsKMB: true
        }
      },
      ylabel: 'Primary y-axis',
      y2label: 'Secondary y-axis',
    }
  );
  assert.deepEqual(["40", "45", "50", "55", "60", "65"], Util.getYLabels("1"));
  assert.deepEqual(["900K","1.1M","1.3M","1.5M","1.7M","1.9M"], Util.getYLabels("2"));
  
  g.updateOptions(
    {
      axes: {
        y: {
          valueRange: [40, 80]
        },
        y2: {
          valueRange: [1e6, 1.2e6]
        }
     }
    }
  );
  assert.deepEqual(["40", "45", "50", "55", "60", "65", "70", "75"], Util.getYLabels("1"));
  assert.deepEqual(["1M", "1.02M", "1.05M", "1.08M", "1.1M", "1.13M", "1.15M", "1.18M"], Util.getYLabels("2"));
});

it('testDrawPointCallback', function() {
  var data = getData();

  var results = { y : {}, y2 : {}};
  var firstCallback = function(g, seriesName, ctx, canvasx, canvasy, color, radius) {
    results.y[seriesName] = 1; 
    utils.Circles.DEFAULT(g, seriesName, ctx, canvasx, canvasy, color, radius);

  };
  var secondCallback = function(g, seriesName, ctx, canvasx, canvasy, color, radius) {
    results.y2[seriesName] = 1; 
    utils.Circles.DEFAULT(g, seriesName, ctx, canvasx, canvasy, color, radius);
  };

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      drawPoints : true,
      pointSize : 3,
      series : {
        'Y3': {
          axis: 'y2'
        },
        'Y4': {
          axis: 'y2'
        }
      },
      axes: {
        y2: {
          drawPointCallback: secondCallback
        }
      },
      drawPointCallback: firstCallback
    }
  );

  assert.equal(1, results.y["Y1"]);
  assert.equal(1, results.y["Y2"]);
  assert.equal(1, results.y2["Y3"]);
  assert.equal(1, results.y2["Y4"]);
});

// Test for http://code.google.com/p/dygraphs/issues/detail?id=436
it('testRemovingSecondAxis', function() {
  var data = getData();

  var results = { y : {}, y2 : {}};

  var g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      drawPoints : true,
      pointSize : 3,
      series : {
        'Y4': {
          axis: 'y2'
        }
      },
    }
  );

 g.updateOptions({ series : { Y4 : { axis : 'y' } } });
});

});
