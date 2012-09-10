Gallery.register(
  'synchronize',
  {
    name: 'Synchronization',
    title: 'Multiple graphs in sync',
    setup: function(parent) {
      parent.innerHTML = [
        "<p>Zooming and panning on any of the charts will zoom and pan all the",
        "others.</p>",
        "<p><aside>(zoom: Click and drag, pan: shift-click and drag, unzoom: double-click)</aside></p>",
        "<table><tr>",
        "<td><div id='div1' style='width:500px; height:300px;'></div></td>",
        "<td><div id='div3' style='width:500px; height:300px;'></div></td></tr>",
        "<tr><td><div id='div2' style='width:500px; height:300px;'></div></td>",
        "<td><div id='div4' style='width:500px; height:300px;'></div></td></table>"].join("\n");
    },
    run: function() {
      gs = [];
      var blockRedraw = false;
      for (var i = 1; i <= 4; i++) {
        gs.push(
          new Dygraph(
            document.getElementById("div" + i),
            NoisyData, {
              rollPeriod: 7,
              errorBars: true,
              drawCallback: function(me, initial) {
                if (blockRedraw || initial) return;
                blockRedraw = true;
                var range = me.xAxisRange();
                var yrange = me.yAxisRange();
                for (var j = 0; j < 4; j++) {
                  if (gs[j] == me) continue;
                  gs[j].updateOptions( {
                    dateWindow: range,
                    valueRange: yrange
                  } );
                }
                blockRedraw = false;
              }
            }
          )
        );
      }
    }
  });
