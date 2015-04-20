describe("plugins-legend", function() {

beforeEach(function() {
  document.body.innerHTML = "<div id='graph'></div><div id='label'></div>";
});

afterEach(function() {
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

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  var legendPlugin = new Dygraph.Plugins.Legend();
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
  var g = new Dygraph('graph', 'X,Y\n1,2\n', {labelsDiv: 'label'});
null
  g.setSelection(0);
  assert.equal('1: Y: 2', Util.nbspToSpace(labelsDiv.textContent));
});

it('should let labelsDiv be an Element', function() {
  var labelsDiv = document.getElementById('label');
  var g = new Dygraph('graph', 'X,Y\n1,2\n', { labelsDiv: labelsDiv });
  assert.isNull(labelsDiv.getAttribute('class'));  // dygraph-legend not added.
  g.setSelection(0);
  assert.equal('1: Y: 2', Util.nbspToSpace(labelsDiv.textContent));
});

it('should render dashed patterns', function() {
  var g = new Dygraph('graph', 'X,Y\n1,2\n', {
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

});
