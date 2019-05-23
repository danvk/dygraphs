/**
 * @license
 * Copyright 2012 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */
/*global Dygraph:false */

/*
Current bits of jankiness:
- Uses two private APIs:
    1. Dygraph.optionsViewForAxis_
    2. dygraph.plotter_.area
- Registers for a "predraw" event, which should be renamed.
- I call calculateEmWidthInDiv more often than needed.
*/

import * as utils from '../dygraph-utils';
import { DygraphsPlugin, PluginSelectEvent, PluginEvent, PluginDrawEvent, DygraphPointType, LegendData, SeriesLegendData } from '../dygraph-types';
import Dygraph from '../dygraph';

/**
 * Creates the legend, which appears when the user hovers over the chart.
 * The legend can be either a user-specified or generated div.
 */
class Legend implements DygraphsPlugin {
  legend_div_: HTMLElement;
  is_generated_div_: boolean;
  one_em_width_: number;

  constructor() {
    this.legend_div_ = null;
    this.is_generated_div_ = false; // do we own this div, or was it user-specified?
  }

  toString() {
    return "Legend Plugin";
  }

  /**
   * This is called during the dygraph constructor, after options have been set
   * but before the data is available.
   *
   * Proper tasks to do here include:
   * - Reading your own options
   * - DOM manipulation
   * - Registering event listeners
   */
  activate(g: Dygraph) {
    var div: HTMLElement;
    var userLabelsDiv = g.getOption('labelsDiv');
    if (userLabelsDiv && null !== userLabelsDiv) {
      if (typeof (userLabelsDiv) === "string") {
        div = document.getElementById(userLabelsDiv);
      } else {
        div = userLabelsDiv;
      }
    }
    else {
      div = document.createElement("div");
      div.className = "dygraph-legend";
      // TODO(danvk): come up with a cleaner way to expose this.
      g.graphDiv.appendChild(div);
      this.is_generated_div_ = true;
    }
    this.legend_div_ = div;
    this.one_em_width_ = 10; // just a guess, will be updated.
    return {
      select: this.select,
      deselect: this.deselect,
      // TODO(danvk): rethink the name "predraw" before we commit to it in any API.
      predraw: this.predraw,
      didDrawChart: this.didDrawChart
    };
  }

  select(e: PluginSelectEvent) {
    var xValue = e.selectedX;
    var points = e.selectedPoints;
    var row = e.selectedRow;
    var legendMode = e.dygraph.getOption('legend');
    if (legendMode === 'never') {
      this.legend_div_.style.display = 'none';
      return;
    }
    if (legendMode === 'follow') {
      // create floating legend div
      var area = e.dygraph.plotter_.area;
      var labelsDivWidth = this.legend_div_.offsetWidth;
      var yAxisLabelWidth = e.dygraph.getOptionForAxis('axisLabelWidth', 'y');
      // determine floating [left, top] coordinates of the legend div
      // within the plotter_ area
      // offset 50 px to the right and down from the first selection point
      // 50 px is guess based on mouse cursor size
      var leftLegend = points[0].x * area.w + 50;
      var topLegend = points[0].y * area.h - 50;
      // if legend floats to end of the chart area, it flips to the other
      // side of the selection point
      if ((leftLegend + labelsDivWidth + 1) > area.w) {
        leftLegend = leftLegend - 2 * 50 - labelsDivWidth - (yAxisLabelWidth - area.x);
      }
      e.dygraph.graphDiv.appendChild(this.legend_div_);
      this.legend_div_.style.left = yAxisLabelWidth + leftLegend + "px";
      this.legend_div_.style.top = topLegend + "px";
    }
    var html = Legend.generateLegendHTML(e.dygraph, xValue, points, this.one_em_width_, row);
    this.legend_div_.innerHTML = html;
    this.legend_div_.style.display = '';
  }

  deselect(e: PluginEvent) {
    var legendMode = e.dygraph.getOption('legend');
    if (legendMode !== 'always') {
      this.legend_div_.style.display = "none";
    }
    // Have to do this every time, since styles might have changed.
    var oneEmWidth = calculateEmWidthInDiv(this.legend_div_);
    this.one_em_width_ = oneEmWidth;
    var html = Legend.generateLegendHTML(e.dygraph, undefined, undefined, oneEmWidth, null);
    this.legend_div_.innerHTML = html;
  }

  didDrawChart(e: PluginDrawEvent) {
    this.deselect(e);
  }

  // Right edge should be flush with the right edge of the charting area (which
  // may not be the same as the right edge of the div, if we have two y-axes.
  // TODO(danvk): is any of this really necessary? Could just set "right" in "activate".

  /**
   * Position the labels div so that:
   * - its right edge is flush with the right edge of the charting area
   * - its top edge is flush with the top edge of the charting area
   */
  predraw(e: PluginEvent) {
    // Don't touch a user-specified labelsDiv.
    if (!this.is_generated_div_)
      return;
    // TODO(danvk): only use real APIs for this.
    e.dygraph.graphDiv.appendChild(this.legend_div_);
    var area = e.dygraph.getArea();
    var labelsDivWidth = this.legend_div_.offsetWidth;
    this.legend_div_.style.left = area.x + area.w - labelsDivWidth - 1 + "px";
    this.legend_div_.style.top = area.y + "px";
  }

  /**
   * Called when dygraph.destroy() is called.
   * You should null out any references and detach any DOM elements.
   */
  destroy() {
    this.legend_div_ = null;
  }

  /**
   * Generates HTML for the legend which is displayed when hovering over the
   * chart. If no selected points are specified, a default legend is returned
   * (this may just be the empty string).
   * @param x The x-value of the selected points.
   * @param sel_points List of selected points for the given x-value.
   * @param oneEmWidth The pixel width for 1em in the legend. Only
   *   relevant when displaying a legend with no selection (i.e. {legend:
   *   'always'}) and with dashed lines.
   * @param row The selected row index.
   */
  static generateLegendHTML(g: Dygraph, x: number, sel_points: DygraphPointType[], oneEmWidth: number, row: number) {
    // Data about the selection to pass to legendFormatter
    var data: LegendData = {
      dygraph: g,
      x: x,
      series: [],
      xHTML: undefined,
    };
    var labelToSeries = {};
    var labels = g.getLabels();
    if (labels) {
      for (var i = 1; i < labels.length; i++) {
        const series = g.getPropertiesForSeries(labels[i]);
        const strokePattern = g.getOption('strokePattern', labels[i]);
        const seriesData: SeriesLegendData = {
          dashHTML: generateLegendDashHTML(strokePattern, series.color, oneEmWidth),
          label: labels[i],
          labelHTML: escapeHTML(labels[i]),
          isVisible: series.visible,
          color: series.color,
          isHighlighted: false,
          y: undefined,
          yHTML: undefined,
        };
        data.series.push(seriesData);
        labelToSeries[labels[i]] = seriesData;
      }
    }
    if (typeof x !== 'undefined') {
      const xOptView = g.optionsViewForAxis_('x');
      const xvf = xOptView('valueFormatter');
      data.xHTML = xvf.call(g, x, xOptView, labels[0], g, row, 0);
      const yOptViews = [];
      const num_axes = g.numAxes();
      for (var i = 0; i < num_axes; i++) {
        // TODO(danvk): remove this use of a private API
        yOptViews[i] = g.optionsViewForAxis_('y' + (i ? 1 + i : ''));
      }
      var showZeros = g.getOption('labelsShowZeroValues');
      var highlightSeries = g.getHighlightSeries();
      for (i = 0; i < sel_points.length; i++) {
        const pt = sel_points[i];
        const seriesData = labelToSeries[pt.name] as any;
        seriesData.y = pt.yval;
        if ((pt.yval === 0 && !showZeros) || isNaN(pt.canvasy)) {
          seriesData.isVisible = false;
          continue;
        }
        const series = g.getPropertiesForSeries(pt.name);
        const yOptView = yOptViews[series.axis - 1];
        const fmtFunc = yOptView('valueFormatter');
        const yHTML: string = fmtFunc.call(g, pt.yval, yOptView, pt.name, g, row, labels.indexOf(pt.name));
        utils.update(seriesData, { yHTML });
        if (pt.name == highlightSeries) {
          seriesData.isHighlighted = true;
        }
      }
    }
    var formatter = (g.getOption('legendFormatter') || Legend.defaultFormatter);
    return formatter.call(g, data);
  }

  static defaultFormatter(data: LegendData) {
    var g = data.dygraph;
    // TODO(danvk): deprecate this option in place of {legend: 'never'}
    // XXX should this logic be in the formatter?
    if (g.getOption('showLabelsOnHighlight') !== true)
      return '';
    var sepLines = g.getOption('labelsSeparateLines');
    var html;
    if (typeof (data.x) === 'undefined') {
      // TODO: this check is duplicated in generateLegendHTML. Put it in one place.
      if (g.getOption('legend') != 'always') {
        return '';
      }
      html = '';
      for (var i = 0; i < data.series.length; i++) {
        var series = data.series[i];
        if (!series.isVisible)
          continue;
        if (html !== '')
          html += (sepLines ? '<br/>' : ' ');
        html += `<span style='font-weight: bold; color: ${series.color};'>${series.dashHTML} ${series.labelHTML}</span>`;
      }
      return html;
    }
    html = data.xHTML + ':';
    for (var i = 0; i < data.series.length; i++) {
      var series = data.series[i];
      if (!series.isVisible)
        continue;
      if (sepLines)
        html += '<br>';
      var cls = series.isHighlighted ? ' class="highlight"' : '';
      html += `<span${cls}> <b><span style='color: ${series.color};'>${series.labelHTML}</span></b>:&#160;${series.yHTML}</span>`;
    }
    return html;
  }
}

// Needed for dashed lines.
function calculateEmWidthInDiv(div: HTMLElement) {
  var sizeSpan = document.createElement('span');
  sizeSpan.setAttribute('style', 'margin: 0; padding: 0 0 0 1em; border: 0;');
  div.appendChild(sizeSpan);
  var oneEmWidth=sizeSpan.offsetWidth;
  div.removeChild(sizeSpan);
  return oneEmWidth;
}

function escapeHTML(str: string) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

/**
 * Generates html for the "dash" displayed on the legend when using "legend: always".
 * In particular, this works for dashed lines with any stroke pattern. It will
 * try to scale the pattern to fit in 1em width. Or if small enough repeat the
 * pattern for 1em width.
 *
 * TODO(danvk): cache the results of this
 * @param strokePattern The pattern
 * @param color The color of the series.
 * @param oneEmWidth The width in pixels of 1em in the legend.
 * @private
 */
function generateLegendDashHTML(strokePattern: number[], color: string, oneEmWidth: number) {
  // Easy, common case: a solid line
  if (!strokePattern || strokePattern.length <= 1) {
    return `<div class="dygraph-legend-line" style="border-bottom-color: ${color};"></div>`;
  }

  var strokePixelLength = 0, segmentLoop = 0;
  var normalizedPattern = [];

  // Compute the length of the pixels including the first segment twice,
  // since we repeat it.
  for (let i = 0; i <= strokePattern.length; i++) {
    strokePixelLength += strokePattern[i%strokePattern.length];
  }

  // See if we can loop the pattern by itself at least twice.
  let loop = Math.floor(oneEmWidth/(strokePixelLength-strokePattern[0]));
  if (loop > 1) {
    // This pattern fits at least two times, no scaling just convert to em;
    for (let i = 0; i < strokePattern.length; i++) {
      normalizedPattern[i] = strokePattern[i] / oneEmWidth;
    }
    // Since we are repeating the pattern, we don't worry about repeating the
    // first segment in one draw.
    segmentLoop = normalizedPattern.length;
  } else {
    // If the pattern doesn't fit in the legend we scale it to fit.
    loop = 1;
    for (let i = 0; i < strokePattern.length; i++) {
      normalizedPattern[i] = strokePattern[i] / strokePixelLength;
    }
    // For the scaled patterns we do redraw the first segment.
    segmentLoop = normalizedPattern.length+1;
  }

  // Now make the pattern.
  var dash = "";
  for (let j = 0; j < loop; j++) {
    for (let i = 0; i < segmentLoop; i+=2) {
      // The padding is the drawn segment.
      const paddingLeft = normalizedPattern[i%normalizedPattern.length];
      let marginRight: number;
      if (i < strokePattern.length) {
        // The margin is the space segment.
        marginRight = normalizedPattern[(i+1)%normalizedPattern.length];
      } else {
        // The repeated first segment has no right margin.
        marginRight = 0;
      }
      dash += `<div class="dygraph-legend-dash" style="margin-right: ${marginRight}em; padding-left: ${paddingLeft}em;"></div>`;
    }
  }
  return dash;
}

export default Legend;
