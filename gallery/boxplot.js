Gallery.register(
  'boxplot',
  {
    name: 'Boxplot Demo',
    title: 'Boxplot Demo',
    setup: function(parent) {
      parent.innerHTML = "<div id='boxplot_div' style='width: 600px; height: 300px;'></div><br/>";
    },
    run: function() {
      var g = new Dygraph(document.getElementById("boxplot_div"), dataBoxplot,
          {
            boxplot: true,
            xRangePad: 100,
            strokeWidth: 0.0
          });
    }
  });
