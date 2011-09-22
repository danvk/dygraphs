/** 
 * @fileoverview Tests involving multiple y-axes.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */

var MultipleAxesTestCase = TestCase("multiple-axes-tests");

MultipleAxesTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

function getYLabelsForAxis(axis_num) {
  var y_labels = document.getElementsByClassName("dygraph-axis-label-y" + axis_num);
  var ary = [];
  for (var i = 0; i < y_labels.length; i++) {
    ary.push(y_labels[i].innerHTML);
  }
  return ary;
}

function getLegend() {
  var legend = document.getElementsByClassName("dygraph-legend")[0];
  return legend.textContent;
}

MultipleAxesTestCase.getData = function() {
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

MultipleAxesTestCase.prototype.testBasicMultipleAxes = function() {
  var data = MultipleAxesTestCase.getData();

  g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      width: 640,
      height: 350,
      'Y3': {
        axis: {
          // set axis-related properties here
          labelsKMB: true
        }
      },
      'Y4': {
        axis: 'Y3'  // use the same y-axis as series Y3
      }
    }
  );

  assertEquals(["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"], getYLabelsForAxis("1"));
  assertEquals(["900K", "1.01M", "1.12M", "1.23M", "1.34M", "1.45M", "1.55M", "1.66M", "1.77M", "1.88M", "1.99M"], getYLabelsForAxis("2"));
};

MultipleAxesTestCase.prototype.testNewStylePerAxisOptions = function() {
  var data = MultipleAxesTestCase.getData();

  g = new Dygraph(
    document.getElementById("graph"),
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      width: 640,
      height: 350,
      'Y3': {
        axis: { }
      },
      'Y4': {
        axis: 'Y3'  // use the same y-axis as series Y3
      },
      axes: {
        y2: {
          labelsKMB: true
        }
      }
    }
  );

  assertEquals(["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"], getYLabelsForAxis("1"));
  assertEquals(["900K", "1.01M", "1.12M", "1.23M", "1.34M", "1.45M", "1.55M", "1.66M", "1.77M", "1.88M", "1.99M"], getYLabelsForAxis("2"));
};

MultipleAxesTestCase.prototype.testMultiAxisLayout = function() {
  var data = MultipleAxesTestCase.getData();

  var el = document.getElementById("graph");

  g = new Dygraph(
    el,
    data,
    {
      labels: [ 'Date', 'Y1', 'Y2', 'Y3', 'Y4' ],
      width: 640,
      height: 350,
      'Y3': {
        axis: { }
      },
      'Y4': {
        axis: 'Y3'  // use the same y-axis as series Y3
      },
      axes: {
        y2: {
          labelsKMB: true
        }
      }
    }
  );

  // Test that all elements are inside the bounds of the graph, set above
  var innerDiv = el.firstChild;
  for (var child = innerDiv.firstChild; child != null; child = child.nextSibling) {
    assertTrue(child.offsetLeft >= 0);
    assertTrue((child.offsetLeft + child.offsetWidth) <= 640);
    assertTrue(child.offsetTop >= 0);
    // TODO(flooey@google.com): Text sometimes linebreaks,
    // causing the labels to appear outside the allocated area.
    // assertTrue((child.offsetTop + child.offsetHeight) <= 350);
  }
};
