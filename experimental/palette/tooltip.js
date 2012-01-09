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
 * @fileoverview Dygraphs options palette tooltip.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
"use strict";

function Tooltip(parent) {
  if (!parent) {
    parent = document.getElementsByTagName("body")[0];
  }
  this.elem = Palette.createChild("div", parent);
  this.title = Palette.createChild("div", this.elem);
  this.elem.className = "tooltip";
  this.title.className = "title";
  this.type = Palette.createChild("div", this.elem);
  this.type.className = "type";
  this.body = Palette.createChild("div", this.elem);
  this.body.className = "body";
  this.hide();
}

Tooltip.prototype.show = function(source, event, title, type, body) {
  this.title.innerHTML = title;
  this.body.innerHTML = body;
  this.type.textContent = type; // textContent for arrays.

  var getTopLeft = function(element) {
    var x = element.offsetLeft;
    var y = element.offsetTop;
    element = element.offsetParent;

    while(element != null) {
      x = parseInt(x) + parseInt(element.offsetLeft);
      y = parseInt(y) + parseInt(element.offsetTop);
      element = element.offsetParent;
    }
    return [y, x];
  }

  this.elem.style.height = source.style.height;
  this.elem.style.width = "280";
  var topLeft = getTopLeft(source);
  this.elem.style.top = parseInt(topLeft[0] + source.offsetHeight) + 'px';
  this.elem.style.left = parseInt(topLeft[1] + 10) + 'px';
  this.elem.style.visibility = "visible";
}

Tooltip.prototype.hide = function() {
  this.elem.style.visibility = "hidden";
}
