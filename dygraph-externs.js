/**
 * @param {Object} dict
 * @return {!Array.<string>}
 */
function printStackTrace(dict) {}


/**
 * @constructor
 */
function G_vmlCanvasManager() {}

/**
 * @param {!HTMLCanvasElement} canvas
 */
G_vmlCanvasManager.initElement = function(canvas) {};

// For IE
/**
 * @param {string} type
 * @param {Object} fn
 */
Element.prototype.detachEvent = function(type, fn) {};


/**
 * @typedef {function(
 *   (number|Date),
 *   number,
 *   function(string):*,
 *   (Dygraph|undefined)
 * ):string}
 */
var AxisLabelFormatter;


/**
 * @typedef {function(number,function(string),Dygraph):string}
 */
var ValueFormatter;


/**
 * @typedef {Array.<Array.<string|number|Array.<number>>>}
 */
var DygraphDataArray;

/**
 * @constructor
 */
function GVizDataTable() {}

// TODO(danvk): move the Dygraph definitions out of here once I closure-ify dygraphs.js
/**
 * @param {!HTMLDivElement|string} div
 * @param {DygraphDataArray|
 *     GVizDataTable|
 *     string|
 *     function():(DygraphDataArray|GVizDataTable|string)} file
 * @param {Object} attrs
 * @constructor
 */
function Dygraph(div, file, attrs) {}

/** @type {string} */
Dygraph.NAME;

/** @type {string} */
Dygraph.VERSION;

/** @type {function(): string} */
Dygraph.toString;

/** @type {Object} */
Dygraph.Plotters;

/** @type {number} */ Dygraph.HORIZONTAL;
/** @type {number} */ Dygraph.VERTICAL;

/** @type {Array} */ Dygraph.PLUGINS;

/** @type {boolean} */
Dygraph.addedAnnotationCSS;

/**
 * @constructor
 */
function DygraphLayout() {}

/**
 * @type {Array}
 */
DygraphLayout.prototype.datasets;

// TODO: DygraphOptions should not reach inside Dygraph private data like this.
/** @type {Object} */
Dygraph.prototype.attrs_;
/** @type {Object} */
Dygraph.prototype.user_attrs_;

/**
 * @type {DygraphLayout}
 */
Dygraph.prototype.layout_;

/** @type {function(?string): boolean} */
Dygraph.prototype.isZoomed;

/** @type {function(): string} */
Dygraph.prototype.toString;

/** @type {function(string, string)} */
Dygraph.prototype.getOption;

/** @type {function(): number} */
Dygraph.prototype.rollPeriod;

/** @type {function(): ?Array.<number>} */
Dygraph.prototype.xAxisRange;

/** @type {function(): Array.<number>} */
Dygraph.prototype.xAxisExtremes;

/** @type {function(number): ?Array.<number>} */
Dygraph.prototype.yAxisRange;

/** @type {function(): Array.<Array.<number>>} */
Dygraph.prototype.yAxisRanges;

/** @type {function(?number, ?number, ?number): Array.<?number>} */
Dygraph.prototype.toDomCoords

/** @type {function(?number): ?number} */
Dygraph.prototype.toDomXCoord;

/** @type {function(?number, ?number): ?number} */
Dygraph.prototype.toDomYCoord;

/** @type {function(?number, ?number, ?number): Array.<?number>} */
Dygraph.prototype.toDataCoords;

/** @type {function(?number): ?number} */
Dygraph.prototype.toDataXCoord;

/** @type {function(?number, ?number): ?number} */
Dygraph.prototype.toDataYCoord;

/** @type {function(?number, ?number): ?number} */
Dygraph.prototype.toPercentYCoord;

/** @type {function(?number): ?number} */
Dygraph.prototype.toPercentXCoord;

/** @type {function(): number} */
Dygraph.prototype.numColumns;

/** @type {function(): number} */
Dygraph.prototype.numRows;

/** @type {function(number, number)} */
Dygraph.prototype.getValue;

/** @type {function()} */
Dygraph.prototype.destroy;

/** @type {function()} */
Dygraph.prototype.getColors;

/** @type {function(string)} */
Dygraph.prototype.getPropertiesForSeries;

/** @type {function()} */
Dygraph.prototype.resetZoom;

/** @type {function(): {x, y, w, h}} */
Dygraph.prototype.getArea;

/** @type {function(Object): Array.<number>} */
Dygraph.prototype.eventToDomCoords;

/** @type {function(number, string, boolean): boolean} */
Dygraph.prototype.setSelection;

/** @type {function()} */
Dygraph.prototype.clearSelection;

/** @type {function(): number} */
Dygraph.prototype.getSelection;

/** @type {function(): string} */
Dygraph.prototype.getHighlightSeries;

/** @type {Array.<{elem:Element,type:string,fn:function(!Event):(boolean|undefined|null)}>} */
Dygraph.prototype.registeredEvents_;
/** @type {function(): boolean} */
Dygraph.prototype.isSeriesLocked;

/** @type {function(): number} */
Dygraph.prototype.numAxes;

/** @type {function(Object, Boolean=)} */
Dygraph.prototype.updateOptions;

/** @type {function(number, number)} */
Dygraph.prototype.resize;

/** @type {function(number)} */
Dygraph.prototype.adjustRoll;

/** @type {function(): Array.<boolean>} */
Dygraph.prototype.visibility;

/** @type {function(number, boolean)} */
Dygraph.prototype.setVisibility;

/** @type {function(Array.<Object>, boolean)} */
Dygraph.prototype.setAnnotations;

/** @type {function(): Array.<Object>} */
Dygraph.prototype.annotations;

/** @type {function(): ?Array.<string>} */
Dygraph.prototype.getLabels;

/** @type {function(string): ?number} */
Dygraph.prototype.indexFromSetName;

/** @type {function(function(!Dygraph))} */
Dygraph.prototype.ready;
