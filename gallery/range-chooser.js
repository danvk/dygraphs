Gallery.register(
  'range-chooser',
  {
    name: 'Range Chooser',
    title: 'Demo of the Range Chooser',
    setup: function(parent) {
      parent.innerHTML = [
          "<div id='chooser' style='width:600px; height:300px;'></div>"].join("\n");
    },
    run: function() {
      dyg = new Dygraph(
          document.getElementById("chooser"),
          data_temp,
          {
            title: 'Daily Temperatures in New York vs. San Francisco',
            ylabel: 'Temperature (F)',
            legend: 'always',
            labelsDivStyles: { 'textAlign': 'right' },
            showRangeChooser: true,
            rangeChooserLabelFormatter: function(time) { return time.strftime('%m-%d %H:%M:%S'); },
            rangeChooserCallback: function(source, from, to) { alert("source: "+ source +", from: "+ new Date(from) +", to: "+ new Date(to)); }
          }
      );
    }
  });
