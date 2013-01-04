/** 
 * @fileoverview Utility functions for Dygraphs.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var Util = {};

/**
 * Get the y-labels for a given axis.
 *
 * You can specify a parent if more than one graph is in the document.
 */
Util.getYLabels = function(axis_num, parent) {
  axis_num = axis_num || "";
  parent = parent || document;
  var y_labels = parent.getElementsByClassName("dygraph-axis-label-y" + axis_num);
  var ary = [];
  for (var i = 0; i < y_labels.length; i++) {
    ary.push(y_labels[i].innerHTML);
  }
  return ary;
};

/**
 * Get the x-labels for a given axis.
 *
 * You can specify a parent if more than one graph is in the document.
 */
Util.getXLabels = function(parent) {
  parent = parent || document;
  var x_labels = parent.getElementsByClassName("dygraph-axis-label-x");
  var ary = [];
  for (var i = 0; i < x_labels.length; i++) {
    ary.push(x_labels[i].innerHTML);
  }
  return ary;
};

/**
 * Returns all text in tags w/ a given css class, sorted.
 * You can specify a parent if more than one graph is on the document.
 */
Util.getClassTexts = function(css_class, parent) {
  parent = parent || document;
  var texts = [];
  var els = parent.getElementsByClassName(css_class);
  for (var i = 0; i < els.length; i++) {
    texts[i] = els[i].textContent;
  }
  texts.sort();
  return texts;
};

Util.getLegend = function(parent) {
  parent = parent || document;
  var legend = parent.getElementsByClassName("dygraph-legend")[0];
  return legend.textContent;
};

/**
 * Assert that all the elements in 'parent' with class 'className' is
 * the expected font size.
 */
Util.assertFontSizes = function(parent, className, expectedSize) {
  var expectedSizePx = expectedSize + "px";
  var labels = parent.getElementsByClassName(className);
  assertTrue(labels.length > 0);

  // window.getComputedStyle is apparently compatible with all browsers
  // (IE first became compatible with IE9.)
  // If this test fails on earlier browsers, then enable something like this,
  // because the font size is set by the parent div.
  // if (!window.getComputedStyle) {
  //   fontSize = label.parentElement.style.fontSize;
  // }
  for (var idx = 0; idx < labels.length; idx++) {
    var label = labels[idx];
    var fontSize = window.getComputedStyle(label).fontSize;
    assertEquals(expectedSizePx, fontSize);
  }
};


/**
 * Takes in an array of strings and returns an array of floats.
 */
Util.makeNumbers = function(ary) {
  var ret = [];
  for (var i = 0; i < ary.length; i++) {
    ret.push(parseFloat(ary[i]));
  }
  return ret;
};
