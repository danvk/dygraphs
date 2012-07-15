/**
 * @license
 * Copyright 2012 Zhenlei Cai (jpenguin@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */


var BAR_WIDTH = 8;
function DygraphCandleChartRenderer(dygraph, element, elementContext, layout) {
  DygraphCanvasRenderer.call(this,dygraph, element, elementContext, layout);
}

DygraphCandleChartRenderer.prototype = new DygraphCanvasRenderer();
DygraphCandleChartRenderer.prototype.constructor = DygraphCandleChartRenderer ;

DygraphCandleChartRenderer.prototype._renderLineChart=function(){
  var ctx = this.elementContext;
  var points = this.layout.points;
  var pointsLength = points.length;
  var i, point;
  
  // Update Points
  // TODO(danvk): here
  for (i = pointsLength; i--;) {
    point = points[i];
    point.canvasx = this.area.w * point.x + this.area.x;
    point.canvasy = this.area.h * point.y + this.area.y;
  }

  var setCount = this.layout.setNames.length;
  if (setCount != 4 || pointsLength % 4 !== 0)
    throw "Exactly 4 prices each point must be provided for candle chart (open close high low)";

  // TODO(danvk): Move this mapping into Dygraph and get it out of here.
  this.colors = {};
  for (i = 0; i < setCount; i++) {
    this.colors[this.layout.setNames[i]] = this.colorScheme_[i % this.colorScheme_.length];
  }
  
  var prices = [];
  var price;
  var numCandles = pointsLength / 4;
  for (var p = 0 ; p < numCandles; p++) {
    price = { open : points[p].yval, close : points[p + numCandles].yval,
                  high : points[p + numCandles * 2].yval, low : points[p + numCandles * 3].yval,
                  openY : points[p].y, closeY : points[p + numCandles].y,
                  highY : points[p + numCandles * 2].y, lowY : points[p + numCandles * 3].y
                };
    prices.push(price);
  }

  ctx.save();
  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 0.6;

  for (p = 0 ; p < numCandles; p++) {
    ctx.beginPath();
    ctx.strokeStyle = '#202020';

    price = prices[p];
    var topY = this.area.h * price.highY + this.area.y;
    var bottomY = this.area.h * price.lowY + this.area.y;
    var centerX = this.area.x + points[p].x * this.area.w;
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX, bottomY);
    ctx.closePath();
    ctx.stroke();
    var bodyY;
    if (price.open > price.close) {
      ctx.fillStyle ='rgba(244,44,44,1.0)';
      bodyY = this.area.h * price.openY + this.area.y;
    }
    else {
      ctx.fillStyle ='rgba(44,244,44,1.0)';
      bodyY = this.area.h * price.closeY  + this.area.y;
    }
    var bodyHeight = this.area.h * Math.abs(price.openY - price.closeY);
    ctx.fillRect(centerX - BAR_WIDTH / 2, bodyY, BAR_WIDTH,  bodyHeight);
  }
  ctx.restore();
};

