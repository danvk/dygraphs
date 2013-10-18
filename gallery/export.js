Gallery.register(
  'export',
  {
    name: 'Export as PNG',
    title: 'Exporting Dygraphs as images demo.',
    setup: function(parent) {
      parent.innerHTML = [
          '<div id="div_g"></div><p>',
          '<a download="dygraph.png" href="" id="a_save">Save as PNG</a>',
          ' -- <a href="" id="a_show">Display as PNG</a> ',
          '</p><div id="div_results"></div>'].join('\n');
    },
    run: function() {
      var fontStyle = 'normal 14px "Helvetica Neue", Arial, Helvetica, sans-serif';
      var exportOptions = {
          backgroundColor: 'white',
          axisLabelFont: fontStyle,
          labelFont: fontStyle,
          legendFont: fontStyle
      };
      g = new Dygraph(
          document.getElementById('div_g'),
          NoisyData, {
            rollPeriod: 7,
            errorBars: true
          });
      document.getElementById('a_show').onclick = function() {
        var result = new Image();
        Dygraph.Plugins.Export.asPNG(g, result, exportOptions);
        var resultContainer = document.getElementById('div_results');
        resultContainer.innerHTML = '';
        resultContainer.appendChild(result);
        return false;
      };
      document.getElementById('a_save').onclick = function(tag) {
        var result = new Image();
        Dygraph.Plugins.Export.asPNG(g, result, exportOptions);
        document.getElementById('a_save').href = result.src;
      };
    }
  });
