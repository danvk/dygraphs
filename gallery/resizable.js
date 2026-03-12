/*global Gallery,Dygraph,data */
/*global NoisyData */
//galleryActive=true
Gallery.register(
  'resizable',
  {
    name: 'resizable graph div',
    title: 'Drag the bottom-right handle and see the graph resize.',
    setup: function(parent) {
      parent.innerHTML = "<div id='div_g'>";
    },
    run: function() {
      new Dygraph(
            document.getElementById("div_g"),
            NoisyData, {
              resizable: "both",
              rollPeriod: 7,
              errorBars: true
            }
          );
    }
  });
