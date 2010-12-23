      function downV3(event, g, context) {
        context.initializeMouseDown(event, g, context);
        if (event.altKey || event.shiftKey) {
          Dygraph.startZoom(event, g, context);
        } else {
          Dygraph.startPan(event, g, context);
        }
      }

      function moveV3(event, g, context) {
        if (context.isPanning) {
          Dygraph.movePan(event, g, context);
        } else if (context.isZooming) {
          Dygraph.moveZoom(event, g, context);
        }
      }

      function upV3(event, g, context) {
        if (context.isPanning) {
          Dygraph.endPan(event, g, context);
        } else if (context.isZooming) {
          Dygraph.endZoom(event, g, context);
        }
      }

      function dblClickV3(event, g, context) {
        if (event.ctrlKey) {
          zoom(g, -(1/8));
        } else {
          zoom(g, +.1);
        }
      }

      function scrollV3(event, g, context) {
        var normal = event.detail ? event.detail * -1 : event.wheelDelta / 40;
        // For me the normalized value shows 0.075 for one click. If I took
        // that verbatim, it would be a 7.5%. I think I'm gonna take 1/10 of that.
        // (double for left and right side)
        var percentage = normal / 100;

        zoom(g, percentage);
        Dygraph.cancelEvent(event);
      }

      function zoom(g, percentage) {
        // Adjusts [x, y] toward each other by percentage%
        function adjustAxis(axis, percentage) {
          var delta = axis[1] - axis[0];
          var increment = delta * percentage;
          return [ axis[0] + increment, axis[1] - increment ];
        }
        var yAxes = g.yAxisRanges();
        var newYAxes = [];
        for (var i = 0; i < yAxes.length; i++) {
          newYAxes[i] = adjustAxis(yAxes[i], percentage);
        }

        g.updateOptions({
          dateWindow: adjustAxis(g.xAxisRange(), percentage),
          valueRange: newYAxes[0]
          });
      }

      var v4Active = false;
      var v4Canvas = null;

      function downV4(event, g, context) {
        context.initializeMouseDown(event, g, context);
        v4Active = true;
        moveV4(event, g, context); // in case the mouse went down on a data point.
      }

      var processed = [];

      function moveV4(event, g, context) {
        var RANGE = 7;

        if (v4Active) {
          var canvasx = Dygraph.pageX(event) - Dygraph.findPosX(g.graphDiv);
          var canvasy = Dygraph.pageY(event) - Dygraph.findPosY(g.graphDiv);

          var rows = g.numRows();
          // Row layout:
          // [date, [val1, stdev1], [val2, stdev2]]
          for (var row = 0; row < rows; row++) {
            var date = g.getValue(row, 0);
            var x = g.toDomCoords(date, null)[0];
            var diff = Math.abs(canvasx - x);
            if (diff < RANGE) {
              for (var col = 1; col < 3; col++) {
                // TODO(konigsberg): these will throw exceptions as data is removed.
                var vals =  g.getValue(row, col);
                if (vals == null) { continue; }
                var val = vals[0];
                var y = g.toDomCoords(null, val)[1];
                var diff2 = Math.abs(canvasy - y);
                if (diff2 < RANGE) {
                  var found = false;
                  for (var i in processed) {
                    var stored = processed[i];
                    if(stored[0] == row && stored[1] == col) {
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    processed.push([row, col]);
                    drawV4(x, y);
                  }
                  return;
                }
              }
            }
          }
        }
      }

      function upV4(event, g, context) {
        if (v4Active) {
          v4Active = false;
        }
      }

      function dblClickV4(event, g, context) {
        restorePositioning(g4);
      }

      function drawV4(x, y) {
        var ctx = v4Canvas;

        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(x,y,5,0,Math.PI*2,true);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      }

      function captureCanvas(canvas, area, g) {
        v4Canvas = canvas;
      }

      function restorePositioning(g) {
        g.updateOptions({
          dateWindow: null,
          valueRange: null
        });
      }
