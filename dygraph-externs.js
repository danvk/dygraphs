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


// TODO(danvk): move the Dygraph definitions out of here once I closure-ify dygraphs.js

/**
 * @constructor
 */
function Dygraph() {}

/** @type {Array.<{elem:Element,type:string,fn:function(!Event):(boolean|undefined|null)}>} */
Dygraph.prototype.registeredEvents_;
