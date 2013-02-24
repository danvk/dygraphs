var g, garea;

(function($){ // encapsulate jQuery

	$(document).ready(function() {	
		
		function binaryChartPlotter(e) {
			var ctx = e.drawingContext;
			var points = e.points;
			var range = e.dygraph.yAxisRange();
			var y_bottom = e.dygraph.toDomYCoord(0);  // see http://dygraphs.com/jsdoc/symbols/Dygraph.html#toDomYCoord
			var y_top = e.dygraph.toDomYCoord(range[1]);  // see http://dygraphs.com/jsdoc/symbols/Dygraph.html#toDomYCoord
			// This should really be based on the minimum gap
			var bar_width = points[1].canvasx - points[0].canvasx;
			ctx.fillStyle = e.color;
			// Do the actual plotting.
			for (var i = 0; i < points.length; i++) {
				var p = points[i];
				var center_x = p.canvasx;  // center of the bar
		 
			if (p.yval > 0) {    
			ctx.fillRect(center_x - bar_width / 2, y_top,
						bar_width, y_bottom);
				ctx.strokeRect(center_x - bar_width / 2, y_top,
						bar_width, y_bottom);
			}
			}
		}

		function abc(dygraph, is_initial) {
			var label = document.getElementById("legend");
			var labels = dygraph.getLabels();
			label.innerHTML = "<ul>";
			for (var i = 1; i < labels.length; i++) {
				var series = dygraph.getPropertiesForSeries(labels[i]);
				label.innerHTML += "<li style=\"color: " + series.color + ";\">" + labels[i] + "</li>";
			}
			label.innerHTML += "</ul>";
		}

		function zeropad(x) {
			if (x < 10) return "0" + x; else return "" + x;
		};

		function zoomGraphX(scale) {
			var rangeinview = g.xAxisRange();
			var rangetotal = g.xAxisExtremes();
				var viewwidth = rangeinview[1] - rangeinview[0];
			switch (scale) {
				case 'day':
					var w = 24*3600*1000;
					break;
				case 'week':
					var w = 7*24*3600*1000;
					break;
				default:
					var w = rangetotal[1] - rangetotal[0];
					break;
			}
			//if (!g.isZoomed('x')) {
				var endx = rangetotal[1];
				var startx = endx - w;
			//} else {	
			//	var endx = rangeinview[1] + ((w - viewwidth) / 2);
			//	var startx = endx + w;
			//}
			if (endx > rangetotal[1]) {
				endx = rangetotal[1];
				startx = endx - w;
			}
			if (startx < rangetotal[0]) {
				startx = rangetotal[0];
				endx = startx + w;
			}
			g.updateOptions({
				dateWindow: [startx, endx]
			});
		}


		$("#zoomday").click(function() {zoomGraphX('day');});
		$("#zoomweek").click(function() {zoomGraphX('week');});
		$("#zoomall").click(function() {zoomGraphX('all');});

		function def(event, x, points, row, seriesName) {
			var div = document.getElementById("highlight");
			var div2 = document.getElementById("div_g1");
			var d = new Date(x);
			var txt = "<table><tbody><tr><td colspan=\"2\" class=\"hlitem\">" + d.strftime('%d %b ') + zeropad(d.getHours()) + ":" + zeropad(d.getMinutes()) + "</td></tr>"
			
			for (var i = 0; i < points.length; i++) {
				var series = g.getPropertiesForSeries(points[i].name);
				switch (points[i].name) {
					case 'heater':
						value = isNaN(points[i].yval) ? '?' : points[i].yval == 0 ? 'off' : 'on';
						break;
					case 'temperature':
						value = isNaN(points[i].yval) ? '? &deg;C' : points[i].yval.toFixed(1) + ' &deg;C';
						break;
					default:
						value = points[i].yval + ' ?';
						break;
				}
				txt += "<tr><td style=\"color:" + series.color + "\" class=\"hlitem\">" + points[i].name + "</td><td class=\"hlvalue\">" + value + "</td></tr>";
			}
			div.innerHTML = txt + "</tbody></table>";
			var scrollx = (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
			var scrolly = (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);

			var rect = div.getBoundingClientRect();
			var w = rect.right - rect.left;
			var h = rect.bottom - rect.top;
			var rect2 = div2.getBoundingClientRect();
			var leftx = garea.x + 19;
			var rightx = leftx + garea.w;
			var topy = garea.y + 10 + scrolly + rect2.top;
			var bottomy = topy + garea.h;
			if ((event.clientX + scrollx + w) > rightx) {
				div.style.left = (event.clientX + scrollx - w) + "px";
			} else {
				div.style.left = (event.clientX + scrollx) + "px";
			}
			div.style.top = (bottomy - h) + "px";
			div.style.visibility='visible';
		}

		function defg(event) {
			var div = document.getElementById("highlight");
			div.style.visibility='hidden';
		}

			var data = [];
			var t = new Date();
			for (var i = 0; i < 60; i++) {
				data[i] = [new Date(t.getTime() - (59- i) * 60000), Math.round(Math.random()),Math.random()*5 + 15];
			}
			g = new Dygraph(document.getElementById("div_g"), data, {
				"heater": {
					plotter:binaryChartPlotter,
					highlightCircleSize: 0,
				},  
				noExtremes: [true,false],
				drawCallback: abc,
				highlightCallback: def,
				unhighlightCallback: defg,
				underlayCallback: function(canvas, area, g) {
					garea = area;
				},
				showLabelsOnHighlight: false,
				legend:'never',
				ylabel: 'temperature',                          
				drawPoints: false,
				showRoller: false,
				labels: ['Time', 'heater', 'temperature'],
				colors:["rgb(255,200,200)", "rgb(0,255,0)"]
			});
		
	});
})(jQuery);
	