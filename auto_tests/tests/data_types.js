/** 
 * @fileoverview Test cases for DygraphOptions.
 */

import Dygraph from '../../src/dygraph';

describe("dygraph-data-types", function() {

  cleanupAfterEach();

  var graph;

  beforeEach(function() {
    graph = document.getElementById("graph");
  });

  /*
   * Test to ensure ints are correctly interpreted as ints and not as dates
   */
  it('testNumberOfData', function() {
    var opts = {
      width: 480,
      height: 320
    };
    var data = "x	y\n" +
      "20033000	1\n" +
      "20034000	2\n" +
      "20035000	3\n" +
      "20036000	4";

    var g = new Dygraph(graph, data, opts);
    assert.deepEqual(4, g.rawData_.length); 
  });
});
