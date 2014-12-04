// This file:
// - declares symbols that are provided outisde of dygraphs
// - defines custom types used internally


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
