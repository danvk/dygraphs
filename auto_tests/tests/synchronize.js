/**
 * @fileoverview Tests synchronizer.
 *
 * @author nyx@nyx.cz (Marek Janda)
 */

import Dygraph from '../../src/dygraph';
import '../../src/extras/synchronizer';  // Sets Dygraph.synchronize

import DygraphOps from './DygraphOps';

describe("synchronize", function() {
  var gs;
  var originalCallbackCalled;
  var data = "X,a,b,c\n" +
    "10,-1,1,2\n" +
    "11,0,3,1\n" +
    "12,1,4,2\n" +
    "13,0,2,3\n";
  var h_row, h_pts;
  var graph = document.getElementById('graph');

  beforeEach(function() {
    graph.innerHTML = "<div id='graph1'></div><div id='graph2'></div>";
    originalCallbackCalled = false;
    h_row = 0, h_pts = [];
    gs = [];

    var highlightCallback = function(e, x, pts, row) {
      originalCallbackCalled = true;

      h_row = row;
      h_pts = pts;
      assert.equal(gs[0], this);
    };

    gs.push(new Dygraph(document.getElementById("graph1"), data, {
      width: 100,
      height: 100,
      visibility: [false, true, true],
      highlightCallback: highlightCallback
    }));
    gs.push(new Dygraph(document.getElementById("graph2"), data, {
      width: 100,
      height: 100,
      visibility: [false, true, true],
    }));
  });

  afterEach(function() {

  });

  /**
   * This tests if original highlightCallback is called when synchronizer is attached
   */
  it('testOriginalHighlightCallbackStillWorks', function() {
    var sync = Dygraph.synchronize(gs);

    DygraphOps.dispatchMouseMove(gs[1], 5, 5);
    // check that chart2 doesn't trigger highlightCallback on chart1
    assert.equal(originalCallbackCalled, false);

    DygraphOps.dispatchMouseMove(gs[0], 13, 10);
    // check that original highlightCallback was called
    assert.equal(originalCallbackCalled, true);

    sync.detach();
  });

  /**
   * This tests if selection is propagated correctly between charts
   */
  it('testChartsAreSynchronized', function() {
    DygraphOps.dispatchMouseMove(gs[0], 13, 10);
    assert.notEqual(gs[0].getSelection(), gs[1].getSelection());
    DygraphOps.dispatchMouseMove(gs[0], 0, 0);

    var sync = Dygraph.synchronize(gs);

    DygraphOps.dispatchMouseMove(gs[0], 13, 10);

    //check correct row is highlighted on second chart
    assert.equal(3, h_row);
    //check there are only two points (because first series is hidden)
    assert.equal(2, h_pts.length);
    //check that selection on both charts is the same
    assert.equal(gs[0].getSelection(), gs[1].getSelection());

    sync.detach();
  });

  /**
   * This tests if detach works
   */
  it('testSynchronizerDetach', function() {
    var sync = Dygraph.synchronize(gs);
    DygraphOps.dispatchMouseMove(gs[1], 10, 10);
    sync.detach();

    originalCallbackCalled = false;
    DygraphOps.dispatchMouseMove(gs[1], 0, 0);

    //check that chart2 doesn't have highlightCallback
    assert.equal(originalCallbackCalled, false);

    DygraphOps.dispatchMouseMove(gs[0], 13, 10);

    //check that original callback was re-attached
    assert.equal(originalCallbackCalled, true);

    //check that selection isn't synchronized anymore
    assert.equal(gs[0].getSelection(), 3);
    assert.equal(gs[1].getSelection(), 0);
  });
});
