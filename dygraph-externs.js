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
 * @typedef {{
 *   xval: (number|undefined),
 *   x: string,
 *   series: string,
 *   icon: (string|undefined),
 *   width: (number|undefined),
 *   height: (number|undefined),
 *   shortText: (string|undefined),
 *   text: (string|undefined),
 *   attachAtBottom: (boolean|undefined),
 *   div: (!HTMLDivElement|undefined),
 *   cssClass: (string|undefined),
 *   tickHeight: (number|undefined),
 *   canvasx: (number|undefined),
 *   canvasy: (number|undefined)
 * }}
 */
var DygraphAnnotationType;

/**
 * @typedef {Array.<{
 *   v:number,
 *   label:string,
 *   label_v:(string|undefined)
 * }>}
 */
var DygraphTickList;

/**
 * @typedef {(function(
 *    number,
 *    number,
 *    number,
 *    function(string):*,
 *    Dygraph=,
 *    Array.<number>=
 *  ): DygraphTickList)}
 */
var DygraphTicker;

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   w: number,
 *   h: number
 * }}
 */
var DygraphRect;

/**
 * @typedef {{
 *   g: !Dygraph,
 *   minyval: number,
 *   maxyval: number,
 *   ticks: Array,
 *   computedValueRange: Array.<number>
 * }}
 */
var DygraphAxisType;


/**
 * @typedef {{
 *   dygraph: !Dygraph,
 *   points: !Array,
 *   setName: string,
 *   drawingContext: !CanvasRenderingContext2D,
 *   color: string,
 *   strokeWidth: number,
 *   axis: Object,
 *   plotArea: DygraphRect,
 *   seriesIndex: number,
 *   seriesCount: number,
 *   singleSeriesName: (string|undefined),
 *   allSeriesPoints: Array
 * }}
 */
var DygraphPlotterArguments;

/**
 * TODO(danvk): be more specific than "Object".
 * @typedef {function(DygraphPlotterArguments)}
 */
var DygraphPlotterType;


/**
 * @typedef {{
 *   px: number,
 *   py: number,
 *   isZooming: boolean,
 *   isPanning: boolean,
 *   is2DPan: boolean,
 *   cancelNextDblclick: boolean,
 *   initializeMouseDown:
 *       function(!Event, !Dygraph, !DygraphInteractionContext)
 * }}
 */
var DygraphInteractionContext;


/**
 * @typedef {{
 *   clearChart:    (function(Object)|undefined),
 *   deselect:      (function(Object)|undefined),
 *   didDrawChart:  (function(Object)|undefined),
 *   layout:        (function(Object)|undefined),
 *   predraw:       (function(Object)|undefined),
 *   select:        (function(Object)|undefined),
 *   willDrawChart: (function(Object)|undefined)
 * }}
 */
var DygraphPluginHandlers;


/**
 * @interface
 */
var DygraphPluginType;

/**
 * @param {!Dygraph} dygraph
 * @return {DygraphPluginHandlers} Mapping from event -> callback.
 */
DygraphPluginType.prototype.activate = function(dygraph) {};

/**
 * @return {string}
 */
DygraphPluginType.prototype.toString = function() {};

DygraphPluginType.prototype.destroy = function() {};

// Convenience for debugging -- makes "console.log" compile-able.
var console = {};
/** @param {...} varargs */
console.log = function(varargs) {};

