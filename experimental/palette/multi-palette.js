// Copyright (c) 2011 Google, Inc.
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
 * @fileoverview Multiple Dygraphs palettes, grouped by global, series, etc..
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */

function MultiPalette() {
  this.palettes = {};
  this.root = null;
  this.filterBar = null;
  // This is meant to be overridden by a palette host.
  this.activePalette = null;
  this.onchange = function() {};
}


MultiPalette.optionSetValues = {
  "global": "global",
  "x": "x axis",
  "y": "y axis",
  "y2": "y2 axis",  
};

MultiPalette.prototype.create = function(parentElement) {
  var self = this;

  this.root = $("<div>").addClass("palette").appendTo(parentElement);
  var header = $("<div>").addClass("header").appendTo(this.root);
  // Selector for series and axes.
  var selectorRow = $("<div>").appendTo(header);
  var optionSelector = $("<select>")
      .change(function(x) {
        self.activate(optionSelector.val());
      });

  selectorRow
      .append($("<span>").text("Option Set:"))
      .append(optionSelector);

  var filter = function() {
    $.each(self.palettes, function(key, value) {
      value.filter(self.filterBar.val());
    });
  }

  this.filterBar = $("<input>", { type : "search" })
      .keyup(filter)
      .click(filter);

  header.append($("<div>")
      .append($("<span>").text("Filter:"))
      .append($("<span>").append(this.filterBar))
      .append($("<span>")
          .append($("<a>")
              .attr("href", "#")
              .addClass("link")
              .text("Redraw")
              .css("float", "right")
              .css("padding-right", "8px")
              .click(function() { self.onchange(); }))));

  $.each(MultiPalette.optionSetValues, function(key, value) {
     $(optionSelector)
         .append($("<option></option>")
         .attr("value", key)
         .text(value)); 
      var palette = new Palette(key);
      palette.create(self.root);
      palette.root.style.display = "none";
      palette.onchange = function() {
        self.onchange();
      };
      self.palettes[key] = palette;
  });

  this.activate("global");
}

MultiPalette.prototype.activate = function(key) {
  if (this.activePalette) {
    this.activePalette.root.style.display = "none";
  }
  this.activePalette = this.palettes[key];
  this.activePalette.root.style.display = "block";
}

/**
 * Read from palette
 */
MultiPalette.prototype.read = function() {
  var results = this.palettes.global.read();
  results.axes = {};
  var clearIfEmpty = function(hash, key) {
    var val = hash[key];
    if ($.isEmptyObject(val)) {
      delete hash[key];
    }
  }
  results.axes.x = this.palettes.x.read();
  results.axes.y = this.palettes.y.read();
  results.axes.y2 = this.palettes.y2.read();
  clearIfEmpty(results.axes, "x");
  clearIfEmpty(results.axes, "y");
  clearIfEmpty(results.axes, "y2");
  clearIfEmpty(results, "axes");
  return results;
}

/**
 * Write to palette from hash.
 */
MultiPalette.prototype.write = function(hash) {
  this.palettes.global.write(hash);
  if (hash.hasOwnProperty("axes")) {
    var axes = hash.axes;
    this.palettes.x.write(axes["x"]);
    this.palettes.y.write(axes["y"]);
    this.palettes.y2.write(axes["y2"]);
  }
}
