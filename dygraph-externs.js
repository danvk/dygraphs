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
 * @typedef {{
 *     idx: number,
 *     name: string,
 *     x: ?number,
 *     xval: ?number,
 *     y_bottom: ?number,
 *     y: ?number,
 *     y_stacked: ?number,
 *     y_top: ?number,
 *     yval_minus: ?number,
 *     yval: ?number,
 *     yval_plus: ?number,
 *     yval_stacked
 * }}
 */
Dygraph.PointType;

// /**
//  * @constructor
//  */
// function DygraphLayout() {}
// 
// /**
//  * @type {Array.<Array.<Dygraph.PointType>>}
//  */
// DygraphLayout.prototype.points;

// TODO: DygraphOptions should not reach inside Dygraph private data like this.
/** @type {Object} */
Dygraph.prototype.attrs_;
/** @type {Object} */
Dygraph.prototype.user_attrs_;

/**
 * @param {string} name the name of the option.
 */
Dygraph.prototype.attr_ = function(name) {};

/**
 * @return {{w: number, h: number}} object.
 */
Dygraph.prototype.size;

/**
 * @type {DygraphLayout}
 */
Dygraph.prototype.layout_;

/**
 * @type {!HTMLDivElement}
 */
Dygraph.prototype.graphDiv;

/**
 * @type {!DygraphOptions}
 */
Dygraph.prototype.attributes_;

/** @type {function(): string} */
Dygraph.prototype.getHighlightSeries;

/**
 * @param {string} name Event name.
 * @param {Object} extra_props Event-specific properties.
 * @return {boolean} Whether to perform the default action.
 */
Dygraph.prototype.cascadeEvents_ = function(name, extra_props) {};

/**
 * @type {Array.<{
 *   elem: !Element,
 *   type: string,
 *   fn: function(?Event):(boolean|undefined)
 * }>}
 */
Dygraph.prototype.registeredEvents_;

/**
 * @return {!Array.<number>} two element [left, right] array.
 */
Dygraph.prototype.xAxisRange = function() {};

/**
 * @param {string} setName Set name.
 * @return {Object} axis properties for the series.
 */
Dygraph.prototype.axisPropertiesForSeries = function(setName) {};

/**
 * @param {number} y The data y-coordinate.
 * @param {number} axis The axis number on which the data coordinate lives.
 * @return {number} A fraction in [0, 1] where 0 = the top edge.
 */
Dygraph.prototype.toPercentYCoord = function(y, axis) {};

/** @type {{axes: Object}} */
Dygraph.DEFAULT_ATTRS;

/**
 * @typedef {{
 *   xval: (number|undefined),
 *   x: string,
 *   series: string,
 *   icon: (string|undefined),
 *   width: (number|undefined),
 *   height: (number|undefined),
 *   shortText: (string|undefined),
 *   text: (string|undefined)
 * }}
 */
Dygraph.AnnotationType;

/**
 * @typedef {Array.<{
 *   v:number,
 *   label:string,
 *   label_v:(string|undefined)
 * }>}
 */
Dygraph.TickList;

/**
 * @typedef {(function(
 *    number,
 *    number,
 *    number,
 *    function(string):*,
 *    Dygraph=,
 *    Array.<number>=
 *  ): Dygraph.TickList)}
 */
Dygraph.Ticker;

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   w: number,
 *   h: number
 * }}
 */
Dygraph.Rect;

/**
 * @typedef {{
 *   g: !Dygraph,
 *   minyval: number,
 *   maxyval: number,
 *   ticks: Array,
 *   computedValueRange: Array.<number>
 * }}
 */
Dygraph.AxisType;
