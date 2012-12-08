/** 
 * @fileoverview Utility functions for Dygraphs.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var Util = {};

/**
 * Get the y-labels for a given axis. You can specify a parent if more than one
 * graph is on the document.
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
}

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
}
