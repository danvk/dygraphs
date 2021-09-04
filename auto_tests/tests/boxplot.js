/**
 * @fileoverview Tests for boxplot option.
 * 
 * @author vojtech.horky@gmail.com (Vojtech Horky)
 */
import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
import Proxy from './Proxy';
import CanvasAssertions from './CanvasAssertions';

describe("boxplot", function() {

cleanupAfterEach();
useProxyCanvas(utils, Proxy);

//Here we assume the values are at 1,2,3,... (without extra gaps)
var assertWhisker = function(graph, x_center, y_box, y_whisker, predicate) {
  CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
    graph.toDomCoords(x_center - 1.0/6.0, y_whisker),
    graph.toDomCoords(x_center + 1.0/6.0, y_whisker), predicate);
  CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
    graph.toDomCoords(x_center, y_whisker),
    graph.toDomCoords(x_center, y_box), predicate);
};

var assertBox = function(graph, x_center, y_low, y_mid, y_high, predicate) {
  CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
    graph.toDomCoords(x_center - 1.0/3.0, y_mid),
    graph.toDomCoords(x_center + 1.0/3.0, y_mid), predicate);
  // Rectangle is not captured by the context.
  //CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
  //  graph.toDomCoords(x_center - 1.0/3.0, y_low),
  //  graph.toDomCoords(x_center + 1.0/3.0, y_low), predicate);
  //CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
  //  graph.toDomCoords(x_center - 1.0/3.0, y_high),
  //  graph.toDomCoords(x_center + 1.0/3.0, y_high), predicate);
  //CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
  //  graph.toDomCoords(x_center - 1.0/3.0, y_low),
  //  graph.toDomCoords(x_center - 1.0/3.0, y_high), predicate);
  //CanvasAssertions.assertLineDrawn(graph.hidden_ctx_,
  //  graph.toDomCoords(x_center + 1.0/3.0, y_low),
  //  graph.toDomCoords(x_center + 1.0/3.0, y_high), predicate);
}


it('testSimpleBoxplot', function() {
  var opts = {
    width: 400,
    height: 320,
    boxplot: true,
    colors: [ "#ff0000" ],
    xRangePad: 200,
    labels: [ "X", "Y" ]
  };
  var data = [
    [ 1, [ 25, 5, 17, 33, 48] ],
    [ 2, [ 20, 3, 19, 22, 31] ]
  ];
  
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  
  // Test number of lines drawn. Here only the whiskers, median line and
  // the connecting line are counted.
  assert.equal(11, CanvasAssertions.numLinesDrawn(g.hidden_ctx_, "#ff0000"));
  
  var props = { strokeStyle: "#ff0000" };
  
  // Assert the (first) box is drawn.
  assertBox(g, 1, 17, 25, 33, props);
  assertWhisker(g, 1, 17, 5, props);
  assertWhisker(g, 1, 33, 48, props);
  
  // Assert the second box.
  assertBox(g, 2, 19, 20, 22, props);
  assertWhisker(g, 2, 19, 3, props);
  assertWhisker(g, 2, 22, 31, props);
});

});
