/*global Gallery,Dygraph,data */
Gallery.register(
  'border',
  { 
    name: "Border test",
    title: 'Graph stays within the border',
    setup: function(parent) {
      parent.innerHTML =
          "<style>.dygraph-legend { border: 1px solid black; }</style>" +
          "<div id='bordered' style='border: 1px solid red; width:600px; height:300px;'></div>";
    },
    run: function() {
      new Dygraph(document.getElementById('bordered'), data,
      {
        title: 'Chart Title',
        xlabel: 'Date',
        ylabel: 'Temperature (F)'
      });
    }
  });
