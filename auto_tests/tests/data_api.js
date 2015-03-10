/**
 * @fileoverview Tests for data access methods.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */
var dataApiTestCase = TestCase("data-api");

dataApiTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
  this.opts = {
    width: 480,
    height: 320
  };

  this.graphDiv = document.getElementById("graph");
};

dataApiTestCase.prototype.tearDown = function() {
};

dataApiTestCase.prototype.testBasicAccessors = function() {
  var g = new Dygraph(this.graphDiv, temperature_data, this.opts);

  assertEquals(365, g.numRows());
  assertEquals(3, g.numColumns());

  // 2007-01-01,62,39
  assertEquals(62, g.getValue(0, 1));
  assertEquals(39, g.getValue(0, 2));

  // 2007-12-31,57,42
  assertEquals(57, g.getValue(364, 1));
  assertEquals(42, g.getValue(364, 2));
};


dataApiTestCase.prototype.testAccessorsCustomBars = function() {
  var g = new Dygraph(this.graphDiv, data_temp_high_low, {
    customBars: true
  });

  assertEquals(1070, g.numRows());
  assertEquals(3, g.numColumns());

  // 2007-01-01,46;51;56,43;45;48
  assertEquals([46, 51, 56], g.getValue(0, 1));
  assertEquals([43, 45, 48], g.getValue(0, 2));

  // 2009-12-05,37;42;47  (i.e. missing second column)
  assertEquals([37, 42, 47], g.getValue(1069, 1));
  assertEquals([null, null, null], g.getValue(1069, 2));
};


// Regression test for #554.
dataApiTestCase.prototype.testGetRowForX = function() {
  var g = new Dygraph(this.graphDiv, [
    "x,y",
    "1,2",
    "3,4",
    "5,6",
    "7,8",
    "9,10"
  ].join('\n'), this.opts);

  assertEquals(null, g.getRowForX(0));
  assertEquals(0, g.getRowForX(1));
  assertEquals(null, g.getRowForX(2));
  assertEquals(1, g.getRowForX(3));
  assertEquals(null, g.getRowForX(4));
  assertEquals(2, g.getRowForX(5));
  assertEquals(null, g.getRowForX(6));
  assertEquals(3, g.getRowForX(7));
  assertEquals(null, g.getRowForX(8));
  assertEquals(4, g.getRowForX(9));
  assertEquals(null, g.getRowForX(10));
};

// If there are rows with identical x-values, getRowForX promises that it will
// return the first one.
dataApiTestCase.prototype.testGetRowForXDuplicates = function() {
  var g = new Dygraph(this.graphDiv, [
    "x,y",
    "1,2",  // 0
    "1,4",  // 1
    "1,6",  // 2
    "1,8",  // 3
    "1,6",  // 4
    "9,2",  // 5
    "9,4",
    "9,6",
    "9,8",
    "9,10"
  ].join('\n'), this.opts);

  assertEquals(0, g.getRowForX(1));
  assertEquals(null, g.getRowForX(2));
  assertEquals(5, g.getRowForX(9));
};
