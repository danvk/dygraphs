/**
 * @fileoverview Tests for the plugins option.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var pluginsTestCase = TestCase("plugins");

pluginsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

pluginsTestCase.prototype.tearDown = function() {
};

pluginsTestCase.prototype.testWillDrawChart = function() {
  var draw = 0;

  var plugin = (function() {
    var p = function() {
    };  

    p.prototype.activate = function(g) {
      return {
        willDrawChart: this.willDrawChart
      };
    };

    p.prototype.willDrawChart = function(e) {
      draw++;
    };

    return p;
  })();

  var data = "X,Y1,Y2\n" +
      "0,1,1\n" +
      "1,1,1\n" +
      "2,1,1\n" +
      "3,1,1\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, { plugins : [ plugin ] });

  assertEquals(1, draw);
};
