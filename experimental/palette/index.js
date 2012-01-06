// Copyright (c) 2012 Google, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/** 
 * @fileoverview Javascript to run index.html.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

"use strict";

function draw(element, options) {
  try {
    element.innerHTML = "";
    element.removeAttribute("style");
    var g = new Dygraph(
      element,
        function() {
          var zp = function(x) { if (x < 10) return "0"+x; else return x; };
          var r = "date,parabola,line,another line,sine wave\n";
          for (var i=1; i<=31; i++) {
            r += "201110" + zp(i);
            r += "," + 10*(i*(31-i));
            r += "," + 10*(8*i);
            r += "," + 10*(250 - 8*i);
            r += "," + 10*(125 + 125 * Math.sin(0.3*i));
            r += "\n";
          }
          return r;
        }, options
    );
  
    // These don't work yet.
    g.updateOptions({
      labelsDiv: 'status',
    });
  } catch(err) {
   addMessage(err);
   throw(err);
  } finally {
  }
}

function addMessage(text) {
  var messages = document.getElementById("messages");
  messages.innerText = messages.innerText + text + "\n";
}

function start() {
  var options = {
    colors: [
      "rgb(51,204,204)",
      "rgb(255,100,100)",
      "#00DD55",
      "rgba(50,50,200,0.4)"
    ],
    labelsSeparateLines: true,
    labelsKMB: true,
    legend: 'always',
    width: 640,
    height: 480,
    title: 'Interesting Shapes',
    xlabel: 'Date',
    ylabel: 'Count',
    axisLineColor: 'white',
    drawXGrid: false,
    pointClickCallback: function() { alert("p-click!"); },
  };

  var redraw = function() {
    draw(document.getElementById("graph"), palette.read());
  }

  var palette = new Palette();
  palette.create(document, document.getElementById("optionsPalette"));
  palette.write(options);
  palette.onchange = redraw;
  palette.filterBar.focus();
  redraw();

  for (var opt in Dygraph.OPTIONS_REFERENCE) {
    if (!(opt in opts)) {
      var entry = Dygraph.OPTIONS_REFERENCE[opt];
      console.warn("missing option: " + opt + " of type " + entry.type);
    }
  }
}
