/**
 * @license
 * Copyright 2012 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */
Dygraph.Plugins.ChartLabels = (function() {

// TODO(danvk): move chart label options out of dygraphs and into the plugin.

var chart_labels = function() {
  this.title_div_ = null;
  this.xlabel_div_ = null;
  this.ylabel_div_ = null;
  this.y2label_div_ = null;
};

chart_labels.prototype.toString = function() {
  return "ChartLabels Plugin";
};

chart_labels.prototype.activate = function(g) {
  return {
    layout: this.layout,
    // clearChart: this.clearChart,
    drawChart: this.drawChart
  };
};

// QUESTION: should there be a plugin-utils.js?
var createDivInRect = function(r) {
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = r.x + 'px';
  div.style.top = r.y + 'px';
  div.style.width = r.w + 'px';
  div.style.height = r.h + 'px';
  return div;
};

// Detach and null out any existing nodes.
chart_labels.prototype.detachLabels_ = function() {
  var els = [ this.title_div_,
              this.xlabel_div_,
              this.ylabel_div_,
              this.y2label_div_ ];
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (!el) continue;
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  this.title_div_ = null;
  this.xlabel_div_ = null;
  this.ylabel_div_ = null;
  this.y2label_div_ = null;
};

var createRotatedDiv = function(g, box, axis, classes, html) {
  // TODO(danvk): is this outer div actually necessary?
  div = document.createElement("div");
  div.style.position = 'absolute';
  if (axis == 1) {
    div.style.left = box.left;
  } else {
    div.style.right = box.left;
  }
  div.style.top = box.top + 'px';
  div.style.width = box.width + 'px';
  div.style.height = box.height + 'px';
  div.style.fontSize = (g.getOption('yLabelWidth') - 2) + 'px';

  var inner_div = document.createElement("div");
  inner_div.style.position = 'absolute';
  inner_div.style.width = box.height + 'px';
  inner_div.style.height = box.width + 'px';
  inner_div.style.top = (box.height / 2 - box.width / 2) + 'px';
  inner_div.style.left = (box.width / 2 - box.height / 2) + 'px';
  inner_div.style.textAlign = 'center';

  // CSS rotation is an HTML5 feature which is not standardized. Hence every
  // browser has its own name for the CSS style.
  var val = 'rotate(' + (axis == 1 ? '-' : '') + '90deg)';
  inner_div.style.transform = val;        // HTML5
  inner_div.style.WebkitTransform = val;  // Safari/Chrome
  inner_div.style.MozTransform = val;     // Firefox
  inner_div.style.OTransform = val;       // Opera
  inner_div.style.msTransform = val;      // IE9

  if (typeof(document.documentMode) !== 'undefined' &&
      document.documentMode < 9) {
    // We're dealing w/ an old version of IE, so we have to rotate the text
    // using a BasicImage transform. This uses a different origin of rotation
    // than HTML5 rotation (top left of div vs. its center).
    inner_div.style.filter =
        'progid:DXImageTransform.Microsoft.BasicImage(rotation=' +
        (axis == 1 ? '3' : '1') + ')';
    inner_div.style.left = '0px';
    inner_div.style.top = '0px';
  }

  class_div = document.createElement("div");
  class_div.className = classes;
  class_div.innerHTML = html;

  inner_div.appendChild(class_div);
  div.appendChild(inner_div);
  return div;
}

chart_labels.prototype.layout = function(e) {
  this.detachLabels_();

  var g = e.dygraph;
  var div = e.chart_div;
  if (g.getOption('title')) {
    // QUESTION: should this return an absolutely-positioned div instead?
    var title_rect = e.reserveSpaceTop(g.getOption('titleHeight'));
    this.title_div_ = createDivInRect(title_rect);
    this.title_div_.className = 'dygraph-label dygraph-title';
    this.title_div_.innerHTML = g.getOption('title');
    this.title_div_.style.textAlign = 'center';
    this.title_div_.style.fontSize = (g.getOption('titleHeight') - 8) + 'px';
    this.title_div_.style.fontWeight = 'bold';
    div.appendChild(this.title_div_);
  }

  if (g.getOption('ylabel')) {
    // It would make sense to shift the chart here to make room for the y-axis
    // label, but the default yAxisLabelWidth is large enough that this results
    // in overly-padded charts. The y-axis label should fit fine. If it
    // doesn't, the yAxisLabelWidth option can be increased.
    var y_rect = e.reserveSpaceLeft(0);

    this.ylabel_div_ = createRotatedDiv(
        g, y_rect,
        1,  // primary (left) y-axis
        'dygraph-label dygraph-ylabel',
        g.getOption('ylabel'));
    div.appendChild(this.ylabel_div_);
  }

  /*
  if (g.getOption('xlabel')) {
    var x_rect = e.reserveSpaceBottom(g.getOption('xLabelHeight'));
  }

  if (g.getOption('y2label')) {
    var y2_rect = e.reserveSpaceRight(0);
  }
  */
};

chart_labels.prototype.drawChart = function(e) {
  var g = e.dygraph;
  if (this.title_div_) {
    this.title_div_.innerHTML = g.getOption('title');
  }
  if (this.ylabel_div_) {
    // this.ylabel_div_.
  }
};

chart_labels.prototype.clearChart = function() {
};

chart_labels.prototype.destroy = function() {
  detachLabels();
};


return chart_labels;
})();
