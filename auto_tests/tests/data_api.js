/**
 * @fileoverview Tests for data access methods.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */
import Dygraph from '../../src/dygraph';
import * as utils from '../../src/dygraph-utils';
describe("data-api", function() {

cleanupAfterEach();

var opts, graphDiv;

beforeEach(function() {
  opts = {
    width: 480,
    height: 320
  };

  graphDiv = document.getElementById("graph");
});

it('testBasicAccessors', function() {
  var g = new Dygraph(graphDiv, temperature_data, opts);

  assert.equal(365, g.numRows());
  assert.equal(3, g.numColumns());

  // 2007-01-01,62,39
  assert.equal(62, g.getValue(0, 1));
  assert.equal(39, g.getValue(0, 2));

  // 2007-12-31,57,42
  assert.equal(57, g.getValue(364, 1));
  assert.equal(42, g.getValue(364, 2));
});


it('testAccessorsCustomBars', function() {
  var g = new Dygraph(graphDiv, data_temp_high_low, {
    customBars: true
  });

  assert.equal(1070, g.numRows());
  assert.equal(3, g.numColumns());

  // 2007-01-01,46;51;56,43;45;48
  assert.deepEqual([46, 51, 56], g.getValue(0, 1));
  assert.deepEqual([43, 45, 48], g.getValue(0, 2));

  // 2009-12-05,37;42;47  (i.e. missing second column)
  assert.deepEqual([37, 42, 47], g.getValue(1069, 1));
  assert.deepEqual([null, null, null], g.getValue(1069, 2));
});


// Regression test for #554.
it('testGetRowForX', function() {
  var g = new Dygraph(graphDiv, [
    "x,y",
    "1,2",
    "3,4",
    "5,6",
    "7,8",
    "9,10"
  ].join('\n'), opts);

  assert.equal(null, g.getRowForX(0));
  assert.equal(0, g.getRowForX(1));
  assert.equal(null, g.getRowForX(2));
  assert.equal(1, g.getRowForX(3));
  assert.equal(null, g.getRowForX(4));
  assert.equal(2, g.getRowForX(5));
  assert.equal(null, g.getRowForX(6));
  assert.equal(3, g.getRowForX(7));
  assert.equal(null, g.getRowForX(8));
  assert.equal(4, g.getRowForX(9));
  assert.equal(null, g.getRowForX(10));
});

// If there are rows with identical x-values, getRowForX promises that it will
// return the first one.
it('testGetRowForXDuplicates', function() {
  var g = new Dygraph(graphDiv, [
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
  ].join('\n'), opts);

  assert.equal(0, g.getRowForX(1));
  assert.equal(null, g.getRowForX(2));
  assert.equal(5, g.getRowForX(9));
});

// indexFromSeriesName should return a value even if the series is invisible
// In 1.1.1, if you request the last set and it's invisible, the method returns undefined.
it('testIndexFromSetNameOnInvisibleSet', function() {
  
  var localOpts = utils.clone(opts);
  localOpts.visibility = [true, false];

  var g = new Dygraph(graphDiv, [
    "x,y1,y2",
    "1,1,1",
    "2,2,2",
    "3,3,3"
  ].join('\n'), localOpts);

  assert.equal(2, g.indexFromSetName("y2"));
});

});
