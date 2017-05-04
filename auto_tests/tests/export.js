/**
 * @fileoverview Tests for the image exporter plugin.
 *
 * @author achuni@google.com (Anthony Lenton)
 */
var exportTestCase = TestCase("export");

exportTestCase.prototype.setUp = function() {
  document.body.innterHTML = "<div id='graph'></div>";
};

exportTestCase.prototype.tearDown = function() {
};

exportTestCase.prototype.testExportsSomething = function() {
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

  var img = new Image();
  Dygraph.Plugins.Export.asPNG(g, img);
  assertEquals("data:", img.src.substr(0, 5));
};
