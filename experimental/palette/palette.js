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
 * @fileoverview Dygraphs options palette.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
"use strict";

function Palette() {
  this.model = {};
  this.onchange = function() {};
  this.filterBar = null;
}

Palette.prototype.create = function(document, parentElement) {
  var palette = this;
  var createChild = function(type, parentElement) {
    var element = document.createElement(type);
    parentElement.appendChild(element);
    return element;
  };

  var table = createChild("table", parentElement);
  table.class = "palette";

  var row = createChild("tr", table);
  row.style.display = "block";

  createChild("td", row).innerText = "Filter:";
  this.filterBar = createChild("input", createChild("td", row));
  this.filterBar.onkeyup = function() {
    palette.filter(palette.filterBar.value)
  };
  var go = document.createElement("button");
  createChild("td", row).appendChild(go);
  go.innerText = "Redraw"
  go.onclick = function() {
    palette.onchange();
  };

  for (var opt in opts) {
    try {
      if (opts.hasOwnProperty(opt)) {
        var type = opts[opt].type;
        var isFunction = type.indexOf("function(") == 0;
        var row = createChild("tr", table);
        var div = createChild("div", createChild("td", row));
        var a = createChild("a", div);
        a.innerText = opt;
        a.href = "http://dygraphs.com/options.html#" + opt;
        a.title = Dygraph.OPTIONS_REFERENCE[opt].description;
        a.target="_blank";

        if (isFunction) {
           var input = createChild("button", createChild("td", row));
           input.onclick = function(opt, palette) {
             return function(event) {
               var entry = palette.model[opt];
               var inputValue = entry.functionString;
               if (inputValue == null || inputValue.length == 0) {
                 inputValue = opts[opt].type + "{ }";
               }
               var value = prompt("enter function", inputValue);
               if (value != null) {
                 if (value.length == 0) {
                   value = null;
                 }
                 if (value != inputValue) {
                   entry.functionString = value;
                   entry.input.innerText = value ? "defined" : "not defined";
                   palette.onchange();
                 }
               }
             }
           }(opt, this);
        } else {
          var input = createChild("input", createChild("td", row));
          input.onkeypress = function(event) {
            var keycode = event.which;
            if (keycode == 13 || keycode == 8) {
              palette.onchange();
            }
          }

          input.type="text";
        }
        this.model[opt] = { input: input, row: row };
      }
    } catch(err) {
      throw "For option " + opt + ":" + err;
    }
  }
  this.filter("");
}

// TODO: replace semicolon parsing with comma parsing, and supporting quotes.
Palette.parseStringArray = function(value) {
  if (value == null || value.length == 0) {
    return null;
  }
  return value.split(";");
}

Palette.parseBooleanArray = function(value) {
  if (value == null || value.length == 0) {
    return null;
  }
  return value.split(',').map(function(x) { return x.trim() == "true"; });
}

Palette.parseFloatArray = function(value) {
  if (value == null || value.length == 0) {
    return null;
  }
  return value.split(',').map(function(x) { return parseFloat(x); });
}

Palette.parseIntArray = function(value) {
  if (value == null || value.length == 0) {
    return null;
  }
  return value.split(',').map(function(x) { return parseInt(x); });
}

Palette.prototype.read = function() {
  var results = {};
  for (var opt in this.model) {
    if (this.model.hasOwnProperty(opt)) {
      var type = opts[opt].type;
      var isFunction = type.indexOf("function(") == 0;
      var input = this.model[opt].input;
      var value = isFunction ? this.model[opt].functionString : input.value;
      if (value && value.length != 0) {
        if (type == "boolean") {
          results[opt] = value == "true";
        } else if (type == "int") {
          results[opt] = parseInt(value);
        } else if (type == "float") {
          results[opt] = parseFloat(value);
        } else if (type == "array<string>") {
          results[opt] = Palette.parseStringArray(value);
        } else if (type == "array<float>") {
          results[opt] = Palette.parseFloatArray(value);
        } else if (type == "array<boolean>") {
          results[opt] = Palette.parseBooleanArray(value);
        } else if (type == "array<Date>") {
          results[opt] = Palette.parseIntArray(value);
        } else if (isFunction) {
          var localVariable = null;
          eval("localVariable = " + value);
          results[opt] = localVariable;
        } else {
          results[opt] = value;
        }
      }
    }
  }
  return results;
}

/**
 * Write to input elements.
 */
Palette.prototype.write = function(hash) {
  var results = {};
  for (var opt in this.model) {
    //  && hash.hasOwnProperty(opt)
    if (this.model.hasOwnProperty(opt)) {
      var input = this.model[opt].input;
      var type = opts[opt].type;
      var value = hash[opt];
      if (type == "array<string>") {
        if (value) {
          input.value = value.join("; ");
        }
      } else if (type.indexOf("array") == 0) {
        if (value) {
          input.value = value.join(", ");
        }
      } else if (type.indexOf("function(") == 0) {
        input.innerText = value ? "defined" : "not defined";
        this.model[opt].functionString = value ? value.toString() : null;
      } else {
        if (value) {
          input.value = value;
        }
      }
    }
  }
}

Palette.prototype.filter = function(pattern) {
  pattern = pattern.toLowerCase();
  for (var opt in this.model) {
    if (this.model.hasOwnProperty(opt)) {
      var row = this.model[opt].row;
      row.style.display = (opt.toLowerCase().indexOf(pattern) >= 0) ? "block" : "none";
    }
  }
}
