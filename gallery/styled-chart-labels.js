/*global Gallery,Dygraph,data */
//galleryActive=true
Gallery.register(
  'styled-chart-labels',
  {
    name: 'CSS label styling',
    title: 'Each chart label is styled independently with CSS',
    setup: function(parent) {
      parent.innerHTML = [
          "<style>.dygraph-legend { text-align: right; background: none; }</style>",
          "<p class='infotext'>This chart's labels are styled</p>",
          "<div class='chart' style='width:600px; height:300px;'><div id='div_g' style='width:100%; height:100%;'></div></div>",
          "<p class='infotext'>This version of the chart uses the default styles:</p>",
          "<div class='chart' style='width:600px; height:300px;'><div id='div_g2' style='width:100%; height:100%;'></div></div>"].join("\n");
    },
    run: function() {
      new Dygraph(
            document.getElementById("div_g"),
            data, {
              rollPeriod: 7,
              legend: 'always',
              title: 'High and Low Temperatures',
              titleHeight: 32,
              ylabel: 'Temperature (F)',
              xlabel: 'Date (Ticks indicate the start of the indicated time period)',
              strokeWidth: 1.5
            }
          );

      new Dygraph(
            document.getElementById("div_g2"),
            data, {
              rollPeriod: 30,
              legend: 'always',
              title: 'High and Low Temperatures (30-day average)',
              ylabel: 'Temperature (F)',
              xlabel: 'Date (Ticks indicate the start of the indicated time period)',
              strokeWidth: 1.5
            }
          );
    }
  });
