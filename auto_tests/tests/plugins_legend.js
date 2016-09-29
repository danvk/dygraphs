import Dygraph from '../../src/dygraph';
import LegendPlugin from '../../src/plugins/legend';
import Util from './Util';

describe("plugins-legend", function() {

var graph;

cleanupAfterEach();
beforeEach(function() {
  var testDiv = document.getElementById('graph');
  testDiv.innerHTML = "<div id='inner-graph'></div><div id='label'></div>";
  graph = document.getElementById('inner-graph');
});

it('testLegendEscape', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,<script>alert('XSS')</script>\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;

  var g = new Dygraph(graph, data, opts);

  var legendPlugin = new LegendPlugin();
  legendPlugin.activate(g);
  var e = {
    selectedX: 'selectedX',
    selectedPoints: [{
      canvasy: 100,
      name: "<script>alert('XSS')</script>",
      yval: 10,
    }],
    dygraph: g
  }
  legendPlugin.select(e);

  var legendSpan = legendPlugin.legend_div_.querySelector("span b span");
  assert.equal(legendSpan.innerHTML, "&lt;script&gt;alert('XSS')&lt;/script&gt;");
});


it('should let labelsDiv be a string', function() {
  var labelsDiv = document.getElementById('label');
  var g = new Dygraph(graph, 'X,Y\n1,2\n', {labelsDiv: 'label'});
null
  g.setSelection(0);
  assert.equal('1: Y: 2', Util.nbspToSpace(labelsDiv.textContent));
});

it('should let labelsDiv be an Element', function() {
  var labelsDiv = document.getElementById('label');
  var g = new Dygraph(graph, 'X,Y\n1,2\n', { labelsDiv: labelsDiv });
  assert.isNull(labelsDiv.getAttribute('class'));  // dygraph-legend not added.
  g.setSelection(0);
  assert.equal('1: Y: 2', Util.nbspToSpace(labelsDiv.textContent));
});

it('should render dashed patterns', function() {
  var g = new Dygraph(graph, 'X,Y\n1,2\n', {
    strokePattern: [5, 5],
    color: 'red',
    legend: 'always'
  });

  // The legend has a dashed line and a label.
  var legendEl = document.querySelector('.dygraph-legend > span');
  assert.equal(' Y', legendEl.textContent);
  var dashEl = document.querySelector('.dygraph-legend > span > div');
  assert.equal(window.getComputedStyle(dashEl)['border-bottom-color'],
               'rgb(255, 0, 0)');
});

it('should use a legendFormatter', function() {
  var calls = [];
  var g = new Dygraph(graph, 'X,Y\n1,2\n', {
    color: 'red',
    legend: 'always',
    legendFormatter: function(data) {
      calls.push(data);
      // Note: can't check against `g` because it's not defined yet.
      assert(this.toString().indexOf('Dygraph') >= 0);
      return '';
    }
  });

  assert(calls.length == 1);  // legend for no selected points
  g.setSelection(0);
  assert(calls.length == 2);  // legend with selected points
  g.clearSelection();
  assert(calls.length == 3);

  assert.equal(calls[0].x, undefined);
  assert.equal(calls[1].x, 1);
  assert.equal(calls[1].xHTML, '1');
  assert.equal(calls[2].x, undefined);

  assert.equal(calls[0].series.length, 1);
  assert.equal(calls[1].series.length, 1);
  assert.equal(calls[2].series.length, 1);

  assert.equal(calls[0].series[0].y, undefined);
  assert.equal(calls[1].series[0].label, 'Y');
  assert.equal(calls[1].series[0].labelHTML, 'Y');
  assert.equal(calls[1].series[0].y, 2);
  assert.equal(calls[1].series[0].yHTML, '2');
  assert.equal(calls[1].series[0].isVisible, true);
  assert.equal(calls[2].series[0].y, undefined);
});

it('should work with highlight series', () => {
  var calls = [];
  var g = new Dygraph(graph, 'X,y1,y2\n1,2,3\n', {
    highlightSeriesOpts: {
      strokeWidth: 3,
    }
  });

  g.setSelection(false, 'y2');
  assert.equal(Util.getLegend(graph), '');
});

it('should include point drawn where canvas-y is 0', function () {
    var graph = document.getElementById("graph");
    var calls = []
    function callback(data) {
      calls.push(data);
    };

    var g = new Dygraph(document.getElementById("graph"),
                        "X,Y\n" +
                        "1,5\n" +
                        "1,10\n" +
                        "1,12\n",
                        {
                          legendFormatter: callback,
                          axes: {
                            y: {
                              valueRange: [0, 10]
                            }
                          }
                        });
  g.setSelection(1);
  var data = calls[1];
  assert.isTrue(data.series[0].isVisible);
  assert.notEqual(data.series[0].yHTML, '');
});

});
