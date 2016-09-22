/**
 * Unit tests for GViz data table support.
 */

import Dygraph from '../../src/dygraph';

import Util from './Util';

describe('gviz', function() {

  cleanupAfterEach();

  // This is a fake version of the gviz DataTable API, which can only be
  // sourced using the google js loader.
  //
  // Their example of the "data" structure is:
  //   cols: [{id: 'task', label: 'Task', type: 'string'},
  //          {id: 'hours', label: 'Hours per Day', type: 'number'}],
  //   rows: [{c:[{v: 'Work'}, {v: 11}]},
  //          {c:[{v: 'Eat'}, {v: 2}]},
  //          {c:[{v: 'Commute'}, {v: 2}]},
  //          {c:[{v: 'Watch TV'}, {v:2}]},
  //          {c:[{v: 'Sleep'}, {v:7, f:'7.000'}]}
  //         ]
  //
  // https://developers.google.com/chart/interactive/docs/reference#DataTable
  var FakeDataTable = function(data) {
    this.data = data;
  };
  FakeDataTable.prototype.getNumberOfColumns = function() {
    return this.data.cols.length;
  };
  FakeDataTable.prototype.getNumberOfRows = function() {
    return this.data.rows.length;
  };
  FakeDataTable.prototype.getColumnType = function(idx) {
    return this.data.cols[idx].type;
  };
  FakeDataTable.prototype.getColumnLabel = function(idx) {
    return this.data.cols[idx].label;
  };
  FakeDataTable.prototype.getValue = function(row, col) {
    return this.data.rows[row].c[col].v;
  };
  FakeDataTable.prototype.getColumnRange = function(col) {
    throw 'Not Implemented';
  };

  // This mirrors http://dygraphs.com/tests/gviz.html
  var numericData = new FakeDataTable({
    cols: [{id:"",label:"X",type:"number"},
           {id:"",label:"A",type:"number"},
           {id:"",label:"B",type:"number"}],
    rows: [{c:[{v:0},{v:1},{v:7}]},
           {c:[{v:1},{v:2},{v:4}]},
           {c:[{v:2},{v:3},{v:3}]},
           {c:[{v:3},{v:4},{v:0}]}]
  });

  it('should parse simple data tables', function() {
    var g = new Dygraph('graph', numericData);
    assert.equal(4, g.numRows());
    assert.equal(3, g.numColumns());
    assert.equal(0, g.getValue(0, 0));
    assert.equal(1, g.getValue(0, 1));
    assert.equal(7, g.getValue(0, 2));
    assert.equal(3, g.getValue(3, 0));
    assert.equal(4, g.getValue(3, 1));
    assert.equal(0, g.getValue(3, 2));
    assert.deepEqual(['X', 'A', 'B'], g.getLabels());
  });

  it('should parse tables with annotations', function() {
    // Data from https://developers.google.com/chart/interactive/docs/gallery/annotatedtimeline
    var data = new FakeDataTable({
      cols: [
        {label: "Date", type: "date" },
        {label: "Sold Pencils", type: "number" },
        {label: "title1", type: "string" },
        {label: "text1", type: "string" },
        {label: "Sold Pens", type: "number" },
        {label: "title2", type: "string" },
        {label: "text2", type: "string" }
      ],
      rows: [
        {c: [{v: new Date(2008, 1, 1)}, {v: 30000}, {v: null}, {v: null},
             {v: 40645}, {v: null}, {v: null}]},
        {c: [{v: new Date(2008, 1, 2)}, {v: 14045}, {v: null}, {v: null},
             {v: 20374}, {v: null}, {v: null}]},
        {c: [{v: new Date(2008, 1, 3)}, {v: 55022}, {v: null}, {v: null},
             {v: 50766}, {v: null}, {v: null}]},
        {c: [{v: new Date(2008, 1, 4)}, {v: 75284}, {v: null}, {v: null},
             {v: 14334}, {v: "Out of Stock"}, {v: "Ran out of stock"}]},
        {c: [{v: new Date(2008, 1, 5)}, {v: 41476}, {v: "Bought Pens"},
             {v: "Bought 200k pens" }, {v: 66467}, {v: null}, {v: null}]},
        {c: [{v: new Date(2008, 1, 6)}, {v: 33322}, {v: null}, {v: null},
             {v: 39463}, {v: null}, {v: null}]}
      ]
    });
    
    var g = new Dygraph('graph', data, {displayAnnotations: true});

    var annEls = document.getElementsByClassName('dygraphDefaultAnnotation');
    assert.equal(2, annEls.length);

    var annotations = g.annotations();
    assert.equal(2, annotations.length);
    var a0 = annotations[0];
    assert.deepEqual({
      text: 'Out of Stock\nRan out of stock',
      series: 'Sold Pens',
      xval: new Date(2008, 1, 4).getTime(),
      shortText: 'A'
    }, annotations[0]);
  });

  it('should parse tables with dates', function() {
    // This mirrors http://dygraphs.com/tests/gviz.html
    var data = new FakeDataTable({
      cols: [{id:"",label:"Date",type:"datetime"},
             {id:"",label:"Column A",type:"number"},
             {id:"",label:"Column B",type:"number"}],
      rows: [{c:[{v:new Date(2009, 6, 1)},{v:1},{v:7}]},
             {c:[{v:new Date(2009, 6, 8)},{v:2},{v:4}]},
             {c:[{v:new Date(2009, 6, 15)},{v:3},{v:3}]},
             {c:[{v:new Date(2009, 6, 22)},{v:4},{v:0}]}]
    });

    var g = new Dygraph('graph', data);
    assert.equal(4, g.numRows());
    assert.equal(3, g.numColumns());
    assert.equal(new Date(2009, 6, 1).getTime(), g.getValue(0, 0));
    assert.equal(1, g.getValue(0, 1));
    assert.equal(7, g.getValue(0, 2));
    assert.deepEqual(['Date', 'Column A', 'Column B'], g.getLabels());
  });

  // it('should parse tables with error bars', function() {
  // });

  it('should implement the gviz API', function() {
    var g = new Dygraph.GVizChart(document.getElementById('graph'));
    g.draw(numericData);

    g.setSelection([{row: 0}]);
    assert.equal('0: A: 1 B: 7', Util.getLegend());
    assert.deepEqual([{row: 0, column: 1}, {row: 0, column: 2}], g.getSelection());
    g.setSelection([]);
    assert.deepEqual([], g.getSelection());
  });
});
