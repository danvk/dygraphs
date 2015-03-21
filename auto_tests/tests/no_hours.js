/**
 * @fileoverview Tests that we don'show specify hours, minutes or seconds
 * in your dates if you don't specify them. This can get mixed up becaues of
 * time zones.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
describe("no-hours", function() {

beforeEach(function() {
  document.body.innerHTML = "<div id='graph'></div>";
});

afterEach(function() {
});

it('testNoHours', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "Date,Y\n" +
      "2012/03/13,-1\n" +
      "2012/03/14,0\n" +
      "2012/03/15,1\n" +
      "2012/03/16,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setSelection(0);
  assert.equal("2012/03/13: Y: -1", Util.getLegend());

  g.setSelection(1);
  assert.equal("2012/03/14: Y: 0", Util.getLegend());

  g.setSelection(2);
  assert.equal("2012/03/15: Y: 1", Util.getLegend());

  g.setSelection(3);
  assert.equal("2012/03/16: Y: 0", Util.getLegend());
});

it('testNoHoursDashed', function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "Date,Y\n" +
      "2012-03-13,-1\n" +
      "2012-03-14,0\n" +
      "2012-03-15,1\n" +
      "2012-03-16,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);

  g.setSelection(0);
  assert.equal("2012/03/13: Y: -1", Util.getLegend());

  g.setSelection(1);
  assert.equal("2012/03/14: Y: 0", Util.getLegend());

  g.setSelection(2);
  assert.equal("2012/03/15: Y: 1", Util.getLegend());

  g.setSelection(3);
  assert.equal("2012/03/16: Y: 0", Util.getLegend());
});


});
