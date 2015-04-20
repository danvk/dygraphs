/**
 * @fileoverview Tests the way that dygraphs parses data.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
describe("parser", function() {

beforeEach(function() {
  document.body.innerHTML = "<div id='graph'></div>";
});

afterEach(function() {
});

it('testDetectLineDelimiter', function() {
  var data = "X,Y\r" +
      "0,-1\r" +
      "1,0\r" +
      "2,1\r" +
      "3,0\r"
  ;
  assert.equal("\r", Dygraph.detectLineDelimiter(data));

  data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;
  assert.equal("\n", Dygraph.detectLineDelimiter(data));

  data = "X,Y\n\r" +
      "0,-1\n\r" +
      "1,0\n\r" +
      "2,1\n\r" +
      "3,0\n\r"
  ;
  assert.equal("\n\r", Dygraph.detectLineDelimiter(data));
});

it('testParseDosNewlines', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\r" +
      "0,-1\r" +
      "1,0\r" +
      "2,1\r" +
      "3,0\r"
  ;

  var g = new Dygraph('graph', data, opts);
  assert.equal(0, g.getValue(0, 0));
  assert.equal(-1, g.getValue(0, 1));
  assert.equal(1, g.getValue(1, 0));
  assert.equal(0, g.getValue(1, 1));
  assert.deepEqual(['X', 'Y'], g.getLabels());
});

it('should parse tab-delimited data', function() {
  var data = "X\tY\n" +
      "0\t-1\n" +
      "1\t0\n" +
      "2\t1\n" +
      "3\t0\n";

  var g = new Dygraph('graph', data);
  assert.equal(0, g.getValue(0, 0));
  assert.equal(-1, g.getValue(0, 1));
  assert.equal(1, g.getValue(1, 0));
  assert.equal(0, g.getValue(1, 1));
  assert.deepEqual(['X', 'Y'], g.getLabels());
});

it('should parse fractions', function() {
  var data = "X,Y\n" +
      "0,1/4\n" +
      "1,2/4\n" +
      "2,3/4\n" +
      "3,4/4\n";
  var g = new Dygraph('graph', data, {fractions:true});

  assert.equal(0, g.getValue(0, 0));
  assert.deepEqual([1, 4], g.getValue(0, 1));
  assert.equal(1, g.getValue(1, 0));
  assert.deepEqual([2, 4], g.getValue(1, 1));
  assert.deepEqual(['X', 'Y'], g.getLabels());
});

it('should parse error bars', function() {
  var data = "X,Y\n" +
      "0,1,4\n" +
      "1,2,4\n" +
      "2,3,4\n" +
      "3,4,4\n";
  var g = new Dygraph('graph', data, {errorBars:true});

  assert.equal(0, g.getValue(0, 0));
  assert.deepEqual([1, 4], g.getValue(0, 1));
  assert.equal(1, g.getValue(1, 0));
  assert.deepEqual([2, 4], g.getValue(1, 1));
  assert.deepEqual(['X', 'Y'], g.getLabels());
});

it('should parse custom bars', function() {
  var data = "X,Y1,Y2\n" +
             "1,10;20;30,20;5;25\n" +
             "2,10;25;35,20;10;25\n";
  var g = new Dygraph('graph', data, {customBars:true});

  assert.equal(1, g.getValue(0, 0));
  assert.deepEqual([10, 20, 30], g.getValue(0, 1));
  assert.deepEqual([20, 5, 25], g.getValue(0, 2));
  assert.equal(2, g.getValue(1, 0));
  assert.deepEqual([10, 25, 35], g.getValue(1, 1));
  assert.deepEqual([20, 10, 25], g.getValue(1, 2));
  assert.deepEqual(['X', 'Y1', 'Y2'], g.getLabels());
});

/*
it('should warn on unsorted input', function() {
});

it('should warn on different length columns', function() {
});

it('should detect double-labeled data', function() {
});
*/

});
