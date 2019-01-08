/**
 * @fileoverview Tests for per-axis options.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';

import Util from './Util';
import CanvasAssertions from './CanvasAssertions';
import Proxy from './Proxy';

describe("per-axis", function() {

cleanupAfterEach();
Dygraph.setGetContext(function(canvas) {
  return new Proxy(canvas.getContext("2d"));
});

var xAxisLineColor = "#00ffff";
var yAxisLineColor = "#ffff00";

var g, graph;

beforeEach(function() {
  var opts = {
    axes : {
      x : {
        drawAxis : false,
        drawGrid : false,
        gridLineColor : xAxisLineColor
      },
      y : {
        drawAxis : false,
        drawGrid : false,
        gridLineColor : yAxisLineColor
      }
    },
    colors: [ '#ff0000', '#0000ff' ]
  };

  var data = "X,Y,Z\n" +
      "1,1,0\n" +
      "8,0,1\n"
  ;
  graph = document.getElementById('graph');
  g = new Dygraph(graph, data, opts);
});

it('testDrawXAxis', function() {
  g.updateOptions({ axes : { x : { drawAxis: true }} });
  assert.isTrue(graph.getElementsByClassName('dygraph-axis-label-x').length > 0);
  assert.isTrue(graph.getElementsByClassName('dygraph-axis-label-y').length == 0);
});

it('testDrawYAxis', function() {
  g.updateOptions({ axes : { y : { drawAxis: true }} });
  assert.isTrue(graph.getElementsByClassName('dygraph-axis-label-x').length ==0);
  assert.isTrue(graph.getElementsByClassName('dygraph-axis-label-y').length > 0);
});

it('testDrawXGrid', function() {
  g.updateOptions({ axes : { x : { drawGrid : true }}});
  var htx = g.hidden_ctx_;
  assert.isTrue(CanvasAssertions.numLinesDrawn(htx, xAxisLineColor) > 0);
  assert.isTrue(CanvasAssertions.numLinesDrawn(htx, yAxisLineColor) == 0);
});

it('testDrawYGrid', function() {
  g.updateOptions({ axes : { y : { drawGrid : true }}});
  var htx = g.hidden_ctx_;
  assert.isTrue(CanvasAssertions.numLinesDrawn(htx, xAxisLineColor) == 0);
  assert.isTrue(CanvasAssertions.numLinesDrawn(htx, yAxisLineColor) > 0);
});

});
