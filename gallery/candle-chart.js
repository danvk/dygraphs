Gallery.register(
  'candle',
  {
    name: 'Candle Chart Demo',
    title: 'Candle Chart Demo',
    setup: function(parent) {
      parent.innerHTML = [
          "<div id='stock_div' style='width: 800px; height: 400px;'></div><br/>",
          "<div style='width: 600px; text-align: center;'>",
          "</div>"].join("\n");
    },
    run: function() {
      var g = new Dygraph(document.getElementById("stock_div"), candleData,
          {
            renderer : "candle"
          });
    }
  });