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
};

AxisLabelsTestCase.prototype.testSmallRangeNearZero = function() {
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
  opts.valueRange = [-0.1, 0.1];

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  assertEquals(["-0.1","-0.08","-0.06","-0.04","-0.02","0","0.02","0.04","0.06","0.08"], getYLabels());

  opts.valueRange = [-0.05, 0.05];
  g.updateOptions(opts);
  // TODO(danvk): why '1.00e-2' and not '0.01'?
  assertEquals(["-0.05","-0.04","-0.03","-0.02","-0.01","0","1.00e-2","0.02","0.03","0.04"], getYLabels());

  opts.valueRange = [-0.01, 0.01];
  g.updateOptions(opts);
  assertEquals(["-0.01","-8.00e-3","-6.00e-3","-4.00e-3","-2.00e-3","0","2.00e-3","4.00e-3","6.00e-3","8.00e-3"], getYLabels());
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

            if (hours   < 10) {
                hours   = "0"+hours;
            }
            if (minutes < 10) {
                minutes = "0"+minutes;
            }
            if (seconds < 10) {
                seconds = "0"+seconds;
            }
                
            var time = hours+':'+minutes+':'+seconds;                
            return time;
        }
    });

    assertEquals(["00:05:00", "00:05:06", "00:05:12", "00:05:18", "00:05:24", "00:05:30", "00:05:36", "00:05:42", "00:05:48", "00:05:54"], getXLabels());
	// assertEquals(['5','5.1','5.2','5.3','5.4','5.5', '5.6', '5.7', '5.8', '5.9'], getXLabels());
  
};


