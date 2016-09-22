/**
 * @fileoverview Tests for fastCanvasProxy, which drops superfluous segments.
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */

import DygraphCanvasRenderer from '../../src/dygraph-canvas';
import Proxy from './Proxy';

describe("fast-canvas-proxy", function() {

var fakeCanvasContext = {
  moveTo: function() {},
  lineTo: function() {},
  beginPath: function() {},
  closePath: function() {},
  fill: function() {},
  stroke: function() {}
}

function extractMoveToAndLineToCalls(proxy) {
  var calls = proxy.calls__;
  var out = [];
  for (var i = 0; i < calls.length; i++) {
    var c = calls[i];
    if (c.name == 'moveTo' || c.name == 'lineTo') {
      out.push([c.name, c.args[0], c.args[1]]);
    }
  }
  return out;
}

it('testExtraMoveTosElided', function() {
  var htx = new Proxy(fakeCanvasContext);
  var fastProxy = DygraphCanvasRenderer._fastCanvasProxy(htx);

  fastProxy.moveTo(1, 1);
  fastProxy.lineTo(2, 1);
  fastProxy.moveTo(2, 1);
  fastProxy.lineTo(3, 1);
  fastProxy.moveTo(3, 1);
  fastProxy.stroke();

  assert.deepEqual([['moveTo', 1, 1],
                ['lineTo', 2, 1],
                ['lineTo', 3, 1]], extractMoveToAndLineToCalls(htx));
});

it('testConsecutiveMoveTosElided', function() {
  var htx = new Proxy(fakeCanvasContext);
  var fastProxy = DygraphCanvasRenderer._fastCanvasProxy(htx);

  fastProxy.moveTo(1, 1);
  fastProxy.lineTo(2, 1);
  fastProxy.moveTo(3, 1);
  fastProxy.moveTo(3.1, 2);
  fastProxy.moveTo(3.2, 3);
  fastProxy.stroke();

  assert.deepEqual([['moveTo', 1, 1],
                ['lineTo', 2, 1],
                ['moveTo', 3.2, 3]], extractMoveToAndLineToCalls(htx));
});

it('testSuperfluousSegmentsElided', function() {
  var htx = new Proxy(fakeCanvasContext);
  var fastProxy = DygraphCanvasRenderer._fastCanvasProxy(htx);

  fastProxy.moveTo(0.6, 1);
  fastProxy.lineTo(0.7, 2);
  fastProxy.lineTo(0.8, 3);
  fastProxy.lineTo(0.9, 4);
  fastProxy.lineTo(1.0, 5);  // max for Math.round(x) == 1
  fastProxy.lineTo(1.1, 3);
  fastProxy.lineTo(1.2, 0);  // min for Math.round(x) == 1
  fastProxy.lineTo(1.3, 1);
  fastProxy.lineTo(1.4, 2);
  fastProxy.moveTo(1.4, 2);
  fastProxy.lineTo(1.5, 2);  // rounding up to 2
  fastProxy.moveTo(1.5, 2);
  fastProxy.lineTo(1.6, 3);
  fastProxy.moveTo(1.6, 3);
  fastProxy.lineTo(1.7, 30);  // max for Math.round(x) == 2
  fastProxy.moveTo(1.7, 30);
  fastProxy.lineTo(1.8, -30);  // min for Math.round(x) == 2
  fastProxy.moveTo(1.8, -30);
  fastProxy.lineTo(1.9, 0);
  fastProxy.moveTo(3, 0);  // dodge the "don't touch the last pixel" rule.
  fastProxy.stroke();

  assert.deepEqual([['moveTo', 0.6, 1],
                ['lineTo', 1.0, 5],
                ['lineTo', 1.2, 0],
                ['lineTo', 1.7, 30],
                ['lineTo', 1.8, -30],
                ['moveTo', 3, 0]], extractMoveToAndLineToCalls(htx));
});


// For a more visual version of this test, see
// https://gist.github.com/danvk/e98dbb24253c9b153696
// The drawing commands in the following two tests are taken from there.
it('should handle gaps on the left', function() {
  var htx = new Proxy(fakeCanvasContext);
  var fastProxy = DygraphCanvasRenderer._fastCanvasProxy(htx);

  fastProxy.moveTo(0, 320);
  fastProxy.lineTo(0, 320);
  fastProxy.lineTo(53.21, 187);
  fastProxy.lineTo(53.23, 29);
  fastProxy.lineTo(53.41, 320);
  fastProxy.lineTo(54.15, 320);
  fastProxy.lineTo(475, 320);
  fastProxy.lineTo(475, 320);
  fastProxy.fill();

  assert.deepEqual([
    ['moveTo', 0, 320],
    ['lineTo', 0, 320],
    ['lineTo', 53.21, 187],
    ['lineTo', 53.23, 29],
    ['lineTo', 53.41, 320],
    ['lineTo', 54.15, 320],
    ['lineTo', 475, 320],
    ['lineTo', 475, 320]
  ], extractMoveToAndLineToCalls(htx));
});

it('should handle gaps on the right', function() {
  var htx = new Proxy(fakeCanvasContext);
  var fastProxy = DygraphCanvasRenderer._fastCanvasProxy(htx);
  fastProxy.moveTo(240.2, 320);
  fastProxy.lineTo(240.2, 320);
  fastProxy.lineTo(240.2, 174);
  fastProxy.lineTo(240.7, 145);
  fastProxy.lineTo(240.8, 320);
  fastProxy.lineTo(241.3, 29);
  fastProxy.lineTo(241.4, 320);
  fastProxy.lineTo(715.9, 320);
  fastProxy.lineTo(715.9, 320);
  fastProxy.fill();

  assert.deepEqual([
    ['moveTo', 240.2, 320],
    ['lineTo', 240.2, 320],
    ['lineTo', 240.2, 174],
    ['lineTo', 240.7, 145],
    ['lineTo', 240.8, 320],
    ['lineTo', 241.3, 29],
    ['lineTo', 241.4, 320],
    ['lineTo', 715.9, 320],
    ['lineTo', 715.9, 320]
  ], extractMoveToAndLineToCalls(htx));
});

});
