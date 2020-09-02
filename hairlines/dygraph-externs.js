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

/** @type {function(): string} */
Dygraph.prototype.getHighlightSeries;

/** @type {Array.<{elem:Element,type:string,fn:function(!Event):(boolean|undefined|null)}>} */
Dygraph.prototype.registeredEvents_;

/** @type {{axes: Object}} */
Dygraph.DEFAULT_ATTRS;
