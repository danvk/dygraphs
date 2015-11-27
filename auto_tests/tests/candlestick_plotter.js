/**
 * @fileoverview Tests for the candlestick plotter.
 *
 * @author petr.shevtsov@gmail.com (Petr Shevtsov)
 */

import Dygraph from '../../src/dygraph';
import '../../src/extras/candlestick-plotter';  // defines Dygraph.candlestickPlotter
import '../../src/extras/compress';  // defines Dygraph.DataHandlers.CompressHandler

describe("candlestick-plotter", function() {
  var candlestickPlotter = Dygraph.candlestickPlotter;
  var getPrices = candlestickPlotter._getPrices;

  beforeEach(function() {
  });

  afterEach(function() {
  });

  it('testPrices', function() {
    var set = [
      [{yval: 200, y: 0.2}], // Open
      [{yval: 300, y: 0.3}], // Close
      [{yval: 400, y: 0.4}], // High
      [{yval: 100, y: 0.1}], // Low
    ];

    assert.deepEqual([{
      open: 200,
      openY: 0.2,
      close: 300,
      closeY: 0.3,
      high: 400,
      highY: 0.4,
      low: 100,
      lowY: 0.1
    }], getPrices(set));
  });

  it('testCompressHandler', function() {
    var series = [];
    var x;
    var y = 0;
    for (var i = 1; i < 365; i++) {
      x = i * 1000 * 60 * 60 * 24;
      series.push([x, y]);
    }
    var comp = new Dygraph.DataHandlers.CompressHandler;
    var pts = comp.seriesToPoints(series, "", 0);

    assert.deepEqual(51, pts.length); // 50 bars + 1 to compensate
  });
});
