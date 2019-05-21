/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview A wrapper around the Dygraph class which implements the
 * interface for a GViz (aka Google Visualization API) visualization.
 * It is designed to be a drop-in replacement for Google's AnnotatedTimeline,
 * so the documentation at
 * http://code.google.com/apis/chart/interactive/docs/gallery/annotatedtimeline.html
 * translates over directly.
 *
 * For a full demo, see:
 * - http://dygraphs.com/tests/gviz.html
 * - http://dygraphs.com/tests/annotation-gviz.html
 */

import Dygraph from './dygraph';
import { GVizDataTable } from './dygraph-internal.externs';
import DygraphOptions from './dygraph-options';

/**
 * A wrapper around Dygraph that implements the gviz API.
 */
class GVizChart {
  container: HTMLDivElement;
  date_graph: Dygraph;

  /**
   * @param container The DOM object the visualization should live in.
   */
  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  draw(data: GVizDataTable, options: DygraphOptions) {
    // Clear out any existing dygraph.
    // TODO(danvk): would it make more sense to simply redraw using the current
    // date_graph object?
    this.container.innerHTML = '';
    if (typeof (this.date_graph) != 'undefined') {
      this.date_graph.destroy();
    }
    this.date_graph = new Dygraph(this.container, data, options);
  }

  /**
   * Google charts compatible setSelection
   * Only row selection is supported, all points in the row will be highlighted
   * @param selection_array array of the selected cells
   */
  setSelection(selection_array: { row: number; }[]) {
    var row: number|boolean = false;
    if (selection_array.length) {
      row = selection_array[0].row;
    }
    this.date_graph.setSelection(row);
  }

  /**
   * Google charts compatible getSelection implementation
   * @return array of the selected cells
   */
  getSelection(): Array<{ row: number; column: number; }> {
    var selection = [];
    var row = this.date_graph.getSelection();
    if (row < 0)
      return selection;
    var points = this.date_graph.layout_.points;
    for (var setIdx = 0; setIdx < points.length; ++setIdx) {
      selection.push({ row: row, column: setIdx + 1 });
    }
    return selection;
  }
}

export default GVizChart;
