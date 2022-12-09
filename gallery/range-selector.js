/*global Gallery,Dygraph,data */
/*global data_temp */
Gallery.register(
  'range-selector',
  {
    name: 'Range Selector',
    title: 'Demo of the Range Selector',
    setup: function(parent) {
      parent.innerHTML = [
          "<style>",
          "  #darkbg .dygraph-axis-label { color: white; }",
          "  .dygraph-legend { text-align: right; }",
          "  #darkbg .dygraph-legend { background-color: #101015; }",
          "</style>",
          "<p>No roll period.</p>",
          "<div id='noroll' style='width:600px; height:300px;'></div>",
          "",
          "<p>Roll period of 14 timesteps, custom range selector height and plot color.</p>",
          "<div id='roll14' style='width:600px; height:300px;'></div>",
          "",
          "<div style='background-color: #101015; color: white'>",
          "<p>Dark background, custom range selector gradient color.</p>",
          "<div id='darkbg' style='width:600px; height:300px;'></div>",
          "</div>"].join("\n");
    },
    run: function() {
      new Dygraph(
          document.getElementById("noroll"),
          data_temp,
          {
            customBars: true,
            title: 'Daily Temperatures in New York vs. San Francisco',
            ylabel: 'Temperature (F)',
            legend: 'always',
            showRangeSelector: true
          }
      );
      new Dygraph(
          document.getElementById("roll14"),
          data_temp,
          {
            rollPeriod: 14,
            showRoller: true,
            customBars: true,
            title: 'Daily Temperatures in New York vs. San Francisco',
            ylabel: 'Temperature (F)',
            legend: 'always',
            showRangeSelector: true,
            rangeSelectorHeight: 30,
            rangeSelectorPlotStrokeColor: 'yellow',
            rangeSelectorPlotFillColor: 'lightyellow'
          }
        );
      new Dygraph(
          document.getElementById("darkbg"),
          data_temp,
          {
              rollPeriod: 14,
              showRoller: true,
              customBars: true,
              title: 'Nightly Temperatures in New York vs. San Francisco',
              ylabel: 'Temperature (F)',
              legend: 'always',
              showRangeSelector: true,
              rangeSelectorPlotFillColor: 'MediumSlateBlue',
              rangeSelectorPlotFillGradientColor: 'rgba(123, 104, 238, 0)',
              colorValue: 0.9,
              fillAlpha: 0.4
          }
      );
    }
  });
