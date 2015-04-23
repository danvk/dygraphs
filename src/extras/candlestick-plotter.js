/**
 * The Candle chart plotter is adapted from code written by
 * Zhenlei Cai (jpenguin@gmail.com)
 * https://github.com/danvk/dygraphs/pull/141/files
 */

/*global Dygraph:false */

(function() {
  "use strict";

  var candlePlotter = function(e) {
    if (e.seriesIndex > 3) {
      Dygraph.Plotters.linePlotter(e);
    }
    // This is the officially endorsed way to plot all the series at once.
    if (e.seriesIndex !== 0) return;

    var prices = [];
    var price;
    var sets = e.allSeriesPoints.slice(0, 4); // Slice first four sets for candlestick chart
    for (var p = 0 ; p < sets[0].length; p++) {
      price = {
        open : sets[0][p].yval,
        close : sets[1][p].yval,
        high : sets[2][p].yval,
        low : sets[3][p].yval,
        openY : sets[0][p].y,
        closeY : sets[1][p].y,
        highY : sets[2][p].y,
        lowY : sets[3][p].y
      };
      prices.push(price);
    }

    var area = e.plotArea;
    var ctx = e.drawingContext;
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 0.6;

    var minBarWidth = 2;
    var numBars = prices.length + 1; // To compensate the probably removed first "incomplete" bar
    var barWidth = Math.round((area.w / numBars) / 2);
    if (barWidth % 2 !== 0) {
      barWidth++;
    }
    barWidth = Math.max(barWidth, minBarWidth);

    for (p = 0 ; p < prices.length; p++) {
      ctx.beginPath();

      price = prices[p];
      var topY = area.h * price.highY + area.y;
      var bottomY = area.h * price.lowY + area.y;
      var centerX = Math.floor(area.x + sets[0][p].x * area.w) + 0.5; // crisper rendering
      ctx.moveTo(centerX, topY);
      ctx.lineTo(centerX, bottomY);
      ctx.closePath();
      ctx.stroke();
      var bodyY;
      if (price.open > price.close) {
        ctx.fillStyle ='rgba(244,44,44,1.0)';
        bodyY = area.h * price.openY + area.y;
      }
      else {
        ctx.fillStyle ='rgba(44,244,44,1.0)';
        bodyY = area.h * price.closeY  + area.y;
      }
      var bodyHeight = area.h * Math.abs(price.openY - price.closeY);
      ctx.fillRect(centerX - barWidth / 2, bodyY, barWidth,  bodyHeight);
    }
  };

  Dygraph.update(Dygraph.Plotters, {
    candlePlotter: function(e) {
      candlePlotter(e);
    }
  });
})();
