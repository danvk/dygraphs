// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Regression test based on an optimization w/
 * unforeseen consequences.
 * @author danvk@google.com (Dan Vanderkam)
 */

import Dygraph from '../../src/dygraph';
import DefaultHandler from '../../src/datahandler/default';

describe("selection", function() {

cleanupAfterEach();

it('testSetGetSelection', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph,
    "X,Y\n" +
    "1,1\n" +
    "50,50\n" +
    "100,100\n"
  );

  g.setSelection(0);
  assert.equal(0, g.getSelection());
  g.setSelection(1);
  assert.equal(1, g.getSelection());
  g.setSelection(2);
  assert.equal(2, g.getSelection());
});

it('testSetGetSelectionDense', function() {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph,
    "X,Y\n" +
    "1,1\n" +
    "50,50\n" +
    "50.0001,50.0001\n" +
    "100,100\n"
  );

  g.setSelection(0);
  assert.equal(0, g.getSelection());
  g.setSelection(1);
  assert.equal(1, g.getSelection());
  g.setSelection(2);
  assert.equal(2, g.getSelection());
  g.setSelection(3);
  assert.equal(3, g.getSelection());
});

it('testSetGetSelectionMissingPoints', function() {
  var dataHandler = function() {};
  dataHandler.prototype = new DefaultHandler();
  dataHandler.prototype.seriesToPoints = function(series, setName, boundaryIdStart) {
    var val = null;
    if (setName == 'A') {
      val = 1;
    } else if (setName == 'B') {
      val = 2;
    } else if (setName == 'C') {
      val = 3;
    }
    return [{
      x: NaN,
      y: NaN,
      xval: val,
      yval: val,
      name: setName,
      idx: val - 1
    }];
  };
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph,
    "X,A,B,C\n" +
    "1,1,,\n" +
    "2,,2,\n" +
    "3,,,3\n",
    {
      dataHandler: dataHandler
    }
  );

  g.setSelection(0);
  assert.equal(0, g.getSelection());
  g.setSelection(1);
  assert.equal(1, g.getSelection());
  g.setSelection(2);
  assert.equal(2, g.getSelection());
});

});
