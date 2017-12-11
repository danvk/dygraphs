/*global Gallery,Dygraph,data */
/*global dataManyPoints */
Gallery.register(
  'many-points',
  {
    name: 'Many Points',
    title: 'Many Points Benchmark',
    setup: function(parent) {
      parent.innerHTML = "<div id='many_points_div' style='width: 600px; height: 300px;'></div><p id='many_points_timing'></p>";
    },
    run: function() {
      var data = dataManyPoints();
      var startTimeMillis = Date.now();       
      var g = new Dygraph(document.getElementById("many_points_div"), data, {});
      document.getElementById('many_points_timing').innerHTML = (Date.now() - startTimeMillis) + 'ms';
    }
   });
