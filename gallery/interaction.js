Gallery.register(
  'interaction',
  {
    name: 'Custom interaction models',
    title: 'title',
    setup: function(parent) {
      parent.innerHTML = [
          "<table border='1'>",
          "<tr><td>",
          "<b>Default interaction model</b>",
          "<div id='div_g' style='width:600px; height:300px;'></div>",
          "</td><td>Zoom: click-drag<br/>Pan: shift-click-drag<br/>Restore zoom level: double-click<br/>",
          "</td></tr>",
          "<tr><td>",
          "<b>No interaction model</b>",
          "<div id='div_g2' style='width:600px; height:300px;'></div>",
          "</td><td>Click and drag all you like, it won't do anything!",
          "<div id='g2_console'></div>",
          "</td></tr>",
          "<tr><td>",
          "<b>Custom interaction model</b>",
          "<button id='restore3'>Restore Position</button>",
          "<div id='div_g3' style='width:600px; height:300px;'></div>",
          "</td><td>",
          "Zoom in: double-click, scroll wheel<br/>",
          "Zoom out: ctrl-double-click, scroll wheel<br/>",
          "Standard Zoom: shift-click-drag",
          "Standard Pan: click-drag<br/>",
          "Restore zoom level: press button<br/>",
          "</td></tr>",
          "<tr><td>",
          "<b>Fun model!</b>",
          "<div id='div_g4' style='width:600px; height:300px;'></div>",
          "</td><td>",
          "Keep the mouse button pressed, and hover over all points",
          "to mark them.",
          "</td></tr>",
          "</table>"].join("\n");

    },
    run: function() {
      // TODO(konigsberg): Add cleanup to remove callbacks.
      Dygraph.addEvent(document, "mousewheel", function() { lastClickedGraph = null; });
      Dygraph.addEvent(document, "click", function() { lastClickedGraph = null; });
      var g = new Dygraph(document.getElementById("div_g"),
           NoisyData, { errorBars : true });
      var s = document.getElementById("g2_console");
      var g2 = new Dygraph(document.getElementById("div_g2"),
           NoisyData,
           {
             errorBars : true,
             interactionModel: {}
           });
      var g3 = new Dygraph(document.getElementById("div_g3"),
           NoisyData, { errorBars : true, interactionModel : {
            'mousedown' : downV3,
            'mousemove' : moveV3,
            'mouseup' : upV3,
            'click' : clickV3,
            'dblclick' : dblClickV3,
            'mousewheel' : scrollV3
      }});
      document.getElementById("restore3").onclick = function() {
        restorePositioning(g3);
      }
      var g4 = new Dygraph(document.getElementById("div_g4"),
           NoisyData, { errorBars : true, drawPoints : true, interactionModel : {
            'mousedown' : downV4,
            'mousemove' : moveV4,
            'mouseup' : upV4,
            'dblclick' : dblClickV4,
           },
           underlayCallback : captureCanvas
      });
    }
  });
