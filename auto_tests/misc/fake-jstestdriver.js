// Copyright (c)  2011 Google, Inc.
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
 * @fileoverview Mocked-out jstestdriver api that lets me test locally.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var jstestdriver = {
  jQuery : jQuery
};

var jstd = {
  include : function(name) {
    this.sucker("Not including " + name);
  },
  sucker : function(text) {
    console.log(text + ", sucker!");
  }
};

function TestCase(name) {
  jstd.sucker("Not really creating TestCase(" + name + ")");
  this.name = name;
  this.toString = function() {
    return "Fake test case " + name;
  };

  var emptyFunction = function() { return this; };
  emptyFunction.prototype.setUp = function() { };
  emptyFunction.prototype.tearDown = function() { };
  emptyFunction.prototype.runTest = function(name) {
    try {
      this.setUp();
      var fn = this[name];
      fn.apply(this, []);
      this.tearDown();
    } catch (e) {
      console.log(e.stack);
    }
  };
  return emptyFunction;
};
