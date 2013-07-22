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
/** @type {Array.<Object>} */
Dygraph.prototype.selPoints_;  // TODO(danvk): type actually has .canvasx, ...

/**
 * @param {string} name the name of the option.
 */
Dygraph.prototype.attr_ = function(name) {};

/**
 * @return {{width: number, height: number}} object.
 */
Dygraph.prototype.size = function() {};

/**
 * @return {Dygraph.Rect}
 */
Dygraph.prototype.getArea = function() {};

/**
 * @return {!Array.<number>}
 */
Dygraph.prototype.xAxisExtremes = function() {};

/**
 * @param {?number} x The data x-value.
 * @return {?number} The DOM coordinate, or null if the input is null.
 */
Dygraph.prototype.toDomXCoord = function(x) {};

/**
 * @param {?number} y The data y-value.
 * @param {number=} opt_axis The axis number (0=primary).
 * @return {?number} The DOM coordinate, or null if the input is null.
 */
Dygraph.prototype.toDomYCoord = function(y, opt_axis) {};

/**
 * @param {?number} x The DOM x-coordinate.
 * @return {?number} The data x-coordinate, or null if the input is null.
 */
Dygraph.prototype.toDataXCoord = function(x) {};

/**
 * @param {?number} y The DOM y-coordinate.
 * @param {number=} opt_axis The axis number (0=primary).
 * @return {?number} The data y-value, or null if the input is null.
 */
Dygraph.prototype.toDataYCoord = function(y, opt_axis) {};

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
 * @type {CanvasRenderingContext2D}
 */
Dygraph.prototype.canvas_ctx_;

/**
 * @type {CanvasRenderingContext2D}
 */
Dygraph.prototype.hidden_ctx_;

/**
 * @type {Object.<string>}
 */
Dygraph.prototype.colorsMap_;

/**
 * TODO(danvk): be more specific
 * @type {Array.<Object>}
 */
Dygraph.prototype.axes_;

/**
 * @type {number}
 */
Dygraph.prototype.lastx_;

/**
 * @return {!Array.<number>} two element [left, right] array.
 */
Dygraph.prototype.xAxisRange = function() {};

/**
 * @param {number=} opt_axis Optional axis (0=primary).
 * @return {Array.<number>} A two-element array: [bottom, top].
 */
Dygraph.prototype.yAxisRange = function(opt_axis) {};

/**
 * @return {!Array.<!Array.<number>>}
 */
Dygraph.prototype.yAxisRanges = function() {};

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

/**
 * @param {string} name The name of the option (e.g. 'strokeWidth')
 * @param {string=} opt_seriesName Series name to get per-series values.
 * @return {*} The value of the option.
 */
Dygraph.prototype.getOption = function(name, opt_seriesName) {};

/**
 * @return {?Array.<string>} The names of each series (including the x-axis),
 *     or null if they haven't been defined yet.
 */
Dygraph.prototype.getLabels = function() {};

/**
 * @return {Array.<string>} The list of colors.
 */
Dygraph.prototype.getColors = function() {};

/**
 */
Dygraph.prototype.drawGraph_ = function() {};

/**
 * @param {number} direction 
 * @param {number} startX
 * @param {number} endX
 * @param {number} startY
 * @param {number} endY
 * @param {number} prevDirection
 * @param {number} prevEndX
 * @param {number} prevEndY
 * @private
 */
Dygraph.prototype.drawZoomRect_ = function(direction, startX, endX, startY,
                                           endY, prevDirection, prevEndX,
                                           prevEndY) {};


Dygraph.prototype.clearZoomRect_ = function() {};
Dygraph.prototype.resetZoom = function() {};

/**
 * @param {number} lowX
 * @param {number} highX
 */
Dygraph.prototype.doZoomX_ = function(lowX, highX) {};

/**
 * @param {number} lowY
 * @param {number} highY
 */
Dygraph.prototype.doZoomY_ = function(lowY, highY) {};

/** @type {number} */
Dygraph.HORIZONTAL;
/** @type {number} */
Dygraph.VERTICAL;

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

/**
 * TODO(danvk): be more specific than "Object".
 * @typedef {function(Object)}
 */
Dygraph.PlotterType;


/**
 * @typedef {{
 *   px: number,
 *   py: number,
 *   isZooming: boolean,
 *   isPanning: boolean,
 *   is2DPan: boolean,
 *   cancelNextDblclick: boolean,
 *   initializeMouseDown:
 *       function(!Event, !Dygraph, !Dygraph.InteractionContext)
 * }}
 */
Dygraph.InteractionContext;
