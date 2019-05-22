/**
 * @license
 * Copyright 2012 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */
// TODO(danvk): move chart label options out of dygraphs and into the plugin.
// TODO(danvk): only tear down & rebuild the DIVs when it's necessary.

import { DygraphsPlugin, PluginDrawEvent, PluginLayoutEvent, Area } from "../dygraph-types";
import Dygraph from "../dygraph";

class ChartLabels implements DygraphsPlugin {
  title_div_: HTMLDivElement;
  xlabel_div_: HTMLDivElement;
  ylabel_div_: HTMLDivElement;
  y2label_div_: HTMLDivElement;

  constructor() {
    this.title_div_ = null;
    this.xlabel_div_ = null;
    this.ylabel_div_ = null;
    this.y2label_div_ = null;
  }

  toString() {
    return "ChartLabels Plugin";
  }

  activate(g: Dygraph) {
    return {
      layout: this.layout,
      // clearChart: this.clearChart,
      didDrawChart: this.didDrawChart
    };
  }

  // Detach and null out any existing nodes.
  detachLabels_() {
    var els = [
      this.title_div_,
      this.xlabel_div_,
      this.ylabel_div_,
      this.y2label_div_
    ];
    for (const el of els) {
      if (!el)
        continue;
      if (el.parentNode)
        el.parentNode.removeChild(el);
    }
    this.title_div_ = null;
    this.xlabel_div_ = null;
    this.ylabel_div_ = null;
    this.y2label_div_ = null;
  }

  layout(e: PluginLayoutEvent) {
    this.detachLabels_();
    var g = e.dygraph;
    var div = e.chart_div;
    if (g.getOption('title')) {
      // QUESTION: should this return an absolutely-positioned div instead?
      var title_rect = e.reserveSpaceTop(g.getOption('titleHeight'));
      this.title_div_ = createDivInRect(title_rect);
      this.title_div_.style.fontSize = (g.getOption('titleHeight') - 8) + 'px';
      var class_div = document.createElement("div");
      class_div.className = 'dygraph-label dygraph-title';
      class_div.innerHTML = g.getOption('title');
      this.title_div_.appendChild(class_div);
      div.appendChild(this.title_div_);
    }
    if (g.getOption('xlabel')) {
      var x_rect = e.reserveSpaceBottom(g.getOption('xLabelHeight'));
      this.xlabel_div_ = createDivInRect(x_rect);
      this.xlabel_div_.style.fontSize = (g.getOption('xLabelHeight') - 2) + 'px';
      var class_div = document.createElement("div");
      class_div.className = 'dygraph-label dygraph-xlabel';
      class_div.innerHTML = g.getOption('xlabel');
      this.xlabel_div_.appendChild(class_div);
      div.appendChild(this.xlabel_div_);
    }
    if (g.getOption('ylabel')) {
      // It would make sense to shift the chart here to make room for the y-axis
      // label, but the default yAxisLabelWidth is large enough that this results
      // in overly-padded charts. The y-axis label should fit fine. If it
      // doesn't, the yAxisLabelWidth option can be increased.
      var y_rect = e.reserveSpaceLeft(0);
      this.ylabel_div_ = createRotatedDiv(g, y_rect, 1, // primary (left) y-axis
        'dygraph-label dygraph-ylabel', g.getOption('ylabel'));
      div.appendChild(this.ylabel_div_);
    }
    if (g.getOption('y2label') && g.numAxes() == 2) {
      // same logic applies here as for ylabel.
      var y2_rect = e.reserveSpaceRight(0);
      this.y2label_div_ = createRotatedDiv(g, y2_rect, 2, // secondary (right) y-axis
        'dygraph-label dygraph-y2label', g.getOption('y2label'));
      div.appendChild(this.y2label_div_);
    }
  }

  didDrawChart(e: PluginDrawEvent) {
    var g = e.dygraph;
    if (this.title_div_) {
      this.title_div_.children[0].innerHTML = g.getOption('title');
    }
    if (this.xlabel_div_) {
      this.xlabel_div_.children[0].innerHTML = g.getOption('xlabel');
    }
    if (this.ylabel_div_) {
      this.ylabel_div_.children[0].children[0].innerHTML = g.getOption('ylabel');
    }
    if (this.y2label_div_) {
      this.y2label_div_.children[0].children[0].innerHTML = g.getOption('y2label');
    }
  }
  clearChart() {
  }
  destroy() {
    this.detachLabels_();
  }
}

// QUESTION: should there be a plugin-utils.js?
function createDivInRect(r: Area) {
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = r.x + 'px';
  div.style.top = r.y + 'px';
  div.style.width = r.w + 'px';
  div.style.height = r.h + 'px';
  return div;
};

function createRotatedDiv(g: Dygraph, box: Area, axis: number, classes: string, html: string) {
  // TODO(danvk): is this outer div actually necessary?
  var div = document.createElement("div");
  div.style.position = 'absolute';
  if (axis == 1) {
    // NOTE: this is cheating. Should be positioned relative to the box.
    div.style.left = '0px';
  } else {
    div.style.left = box.x + 'px';
  }
  div.style.top = box.y + 'px';
  div.style.width = box.w + 'px';
  div.style.height = box.h + 'px';
  div.style.fontSize = (g.getOption('yLabelWidth') - 2) + 'px';

  var inner_div = document.createElement("div");
  inner_div.style.position = 'absolute';
  inner_div.style.width = box.h + 'px';
  inner_div.style.height = box.w + 'px';
  inner_div.style.top = (box.h / 2 - box.w / 2) + 'px';
  inner_div.style.left = (box.w / 2 - box.h / 2) + 'px';
  // TODO: combine inner_div and class_div.
  inner_div.className = 'dygraph-label-rotate-' + (axis == 1 ? 'right' : 'left');

  var class_div = document.createElement("div");
  class_div.className = classes;
  class_div.innerHTML = html;

  inner_div.appendChild(class_div);
  div.appendChild(inner_div);
  return div;
};

export default ChartLabels;
