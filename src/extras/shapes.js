/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licenced: https://opensource.org/licenses/MIT
 */

/**
 * @fileoverview
 * Including this file will add several additional shapes to Dygraph.Circles
 * which can be passed to drawPointCallback.
 * See tests/custom-circles.html for usage.
 */

/* loader wrapper to allow browser use and ES6 imports */
(function _extras_shapes_closure() {
'use strict';
var Dygraph;
if (window.Dygraph) {
  Dygraph = window.Dygraph;
} else if (typeof(module) !== 'undefined') {
  Dygraph = require('../dygraph');
  if (typeof(Dygraph.NAME) === 'undefined' && typeof(Dygraph.default) !== 'undefined')
    Dygraph = Dygraph.default;
}
/* end of loader wrapper header */

/**
 * @param {!CanvasRenderingContext2D} ctx the canvas context
 * @param {number} sides the number of sides in the shape.
 * @param {number} radius the radius of the image.
 * @param {number} cx center x coordate
 * @param {number} cy center y coordinate
 * @param {number=} rotationRadians the shift of the initial angle, in radians.
 * @param {number=} delta the angle shift for each line. If missing, creates a
 *     regular polygon.
 */
var regularShape = function regularShape(
    ctx, sides, radius, cx, cy, rotationRadians, delta) {
  rotationRadians = rotationRadians || 0;
  delta = delta || Math.PI * 2 / sides;

  ctx.beginPath();
  var initialAngle = rotationRadians;
  var angle = initialAngle;

  var computeCoordinates = function computeCoordinates() {
    var x = cx + (Math.sin(angle) * radius);
    var y = cy + (-Math.cos(angle) * radius);
    return [x, y];
  };

  var initialCoordinates = computeCoordinates();
  var x = initialCoordinates[0];
  var y = initialCoordinates[1];
  ctx.moveTo(x, y);

  for (var idx = 0; idx < sides; idx++) {
    angle = (idx == sides - 1) ? initialAngle : (angle + delta);
    var coords = computeCoordinates();
    ctx.lineTo(coords[0], coords[1]);
  }
  ctx.fill();
  ctx.stroke();
};

/**
 * TODO(danvk): be more specific on the return type.
 * @param {number} sides
 * @param {number=} rotationRadians
 * @param {number=} delta
 * @return {Function}
 * @private
 */
var shapeFunction = function shapeFunction(sides, rotationRadians, delta) {
  return function shapedFunction(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    regularShape(ctx, sides, radius, cx, cy, rotationRadians, delta);
  };
};

var customCircles = {
  TRIANGLE : shapeFunction(3),
  SQUARE : shapeFunction(4, Math.PI / 4),
  DIAMOND : shapeFunction(4),
  PENTAGON : shapeFunction(5),
  HEXAGON : shapeFunction(6),
  CIRCLE : function CIRCLE(g, name, ctx, cx, cy, color, radius) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  },
  STAR : shapeFunction(5, 0, 4 * Math.PI / 5),
  PLUS : function PLUS(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(cx + radius, cy);
    ctx.lineTo(cx - radius, cy);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + radius);
    ctx.lineTo(cx, cy - radius);
    ctx.closePath();
    ctx.stroke();
  },
  EX : function EX(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(cx + radius, cy + radius);
    ctx.lineTo(cx - radius, cy - radius);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + radius, cy - radius);
    ctx.lineTo(cx - radius, cy + radius);
    ctx.closePath();
    ctx.stroke();
  }
};

for (var k in customCircles) {
  if (!customCircles.hasOwnProperty(k)) continue;
  Dygraph.Circles[k] = customCircles[k];
}

/* closure and loader wrapper */
Dygraph._require.add('dygraphs/src/extras/shapes.js', /* exports */ {});
})();
