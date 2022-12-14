"use strict";

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

(function () {
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
  var regularShape = function regularShape(ctx, sides, radius, cx, cy, rotationRadians, delta) {
    rotationRadians = rotationRadians || 0;
    delta = delta || Math.PI * 2 / sides;
    ctx.beginPath();
    var initialAngle = rotationRadians;
    var angle = initialAngle;
    var computeCoordinates = function computeCoordinates() {
      var x = cx + Math.sin(angle) * radius;
      var y = cy + -Math.cos(angle) * radius;
      return [x, y];
    };
    var initialCoordinates = computeCoordinates();
    var x = initialCoordinates[0];
    var y = initialCoordinates[1];
    ctx.moveTo(x, y);
    for (var idx = 0; idx < sides; idx++) {
      angle = idx == sides - 1 ? initialAngle : angle + delta;
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
    return function (g, name, ctx, cx, cy, color, radius) {
      ctx.strokeStyle = color;
      ctx.fillStyle = "white";
      regularShape(ctx, sides, radius, cx, cy, rotationRadians, delta);
    };
  };
  var customCircles = {
    TRIANGLE: shapeFunction(3),
    SQUARE: shapeFunction(4, Math.PI / 4),
    DIAMOND: shapeFunction(4),
    PENTAGON: shapeFunction(5),
    HEXAGON: shapeFunction(6),
    CIRCLE: function CIRCLE(g, name, ctx, cx, cy, color, radius) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.fillStyle = "white";
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
    },
    STAR: shapeFunction(5, 0, 4 * Math.PI / 5),
    PLUS: function PLUS(g, name, ctx, cx, cy, color, radius) {
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
    EX: function EX(g, name, ctx, cx, cy, color, radius) {
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
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZWd1bGFyU2hhcGUiLCJjdHgiLCJzaWRlcyIsInJhZGl1cyIsImN4IiwiY3kiLCJyb3RhdGlvblJhZGlhbnMiLCJkZWx0YSIsIk1hdGgiLCJQSSIsImJlZ2luUGF0aCIsImluaXRpYWxBbmdsZSIsImFuZ2xlIiwiY29tcHV0ZUNvb3JkaW5hdGVzIiwieCIsInNpbiIsInkiLCJjb3MiLCJpbml0aWFsQ29vcmRpbmF0ZXMiLCJtb3ZlVG8iLCJpZHgiLCJjb29yZHMiLCJsaW5lVG8iLCJmaWxsIiwic3Ryb2tlIiwic2hhcGVGdW5jdGlvbiIsImciLCJuYW1lIiwiY29sb3IiLCJzdHJva2VTdHlsZSIsImZpbGxTdHlsZSIsImN1c3RvbUNpcmNsZXMiLCJUUklBTkdMRSIsIlNRVUFSRSIsIkRJQU1PTkQiLCJQRU5UQUdPTiIsIkhFWEFHT04iLCJDSVJDTEUiLCJhcmMiLCJTVEFSIiwiUExVUyIsImNsb3NlUGF0aCIsIkVYIiwiayIsImhhc093blByb3BlcnR5IiwiRHlncmFwaCIsIkNpcmNsZXMiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvZXh0cmFzL3NoYXBlcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxMSBEYW4gVmFuZGVya2FtIChkYW52ZGtAZ21haWwuY29tKVxuICogTUlULWxpY2VuY2VkOiBodHRwczovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlld1xuICogSW5jbHVkaW5nIHRoaXMgZmlsZSB3aWxsIGFkZCBzZXZlcmFsIGFkZGl0aW9uYWwgc2hhcGVzIHRvIER5Z3JhcGguQ2lyY2xlc1xuICogd2hpY2ggY2FuIGJlIHBhc3NlZCB0byBkcmF3UG9pbnRDYWxsYmFjay5cbiAqIFNlZSB0ZXN0cy9jdXN0b20tY2lyY2xlcy5odG1sIGZvciB1c2FnZS5cbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbi8qKlxuICogQHBhcmFtIHshQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHggdGhlIGNhbnZhcyBjb250ZXh0XG4gKiBAcGFyYW0ge251bWJlcn0gc2lkZXMgdGhlIG51bWJlciBvZiBzaWRlcyBpbiB0aGUgc2hhcGUuXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkaXVzIHRoZSByYWRpdXMgb2YgdGhlIGltYWdlLlxuICogQHBhcmFtIHtudW1iZXJ9IGN4IGNlbnRlciB4IGNvb3JkYXRlXG4gKiBAcGFyYW0ge251bWJlcn0gY3kgY2VudGVyIHkgY29vcmRpbmF0ZVxuICogQHBhcmFtIHtudW1iZXI9fSByb3RhdGlvblJhZGlhbnMgdGhlIHNoaWZ0IG9mIHRoZSBpbml0aWFsIGFuZ2xlLCBpbiByYWRpYW5zLlxuICogQHBhcmFtIHtudW1iZXI9fSBkZWx0YSB0aGUgYW5nbGUgc2hpZnQgZm9yIGVhY2ggbGluZS4gSWYgbWlzc2luZywgY3JlYXRlcyBhXG4gKiAgICAgcmVndWxhciBwb2x5Z29uLlxuICovXG52YXIgcmVndWxhclNoYXBlID0gZnVuY3Rpb24oXG4gICAgY3R4LCBzaWRlcywgcmFkaXVzLCBjeCwgY3ksIHJvdGF0aW9uUmFkaWFucywgZGVsdGEpIHtcbiAgcm90YXRpb25SYWRpYW5zID0gcm90YXRpb25SYWRpYW5zIHx8IDA7XG4gIGRlbHRhID0gZGVsdGEgfHwgTWF0aC5QSSAqIDIgLyBzaWRlcztcblxuICBjdHguYmVnaW5QYXRoKCk7XG4gIHZhciBpbml0aWFsQW5nbGUgPSByb3RhdGlvblJhZGlhbnM7XG4gIHZhciBhbmdsZSA9IGluaXRpYWxBbmdsZTtcblxuICB2YXIgY29tcHV0ZUNvb3JkaW5hdGVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHggPSBjeCArIChNYXRoLnNpbihhbmdsZSkgKiByYWRpdXMpO1xuICAgIHZhciB5ID0gY3kgKyAoLU1hdGguY29zKGFuZ2xlKSAqIHJhZGl1cyk7XG4gICAgcmV0dXJuIFt4LCB5XTtcbiAgfTtcblxuICB2YXIgaW5pdGlhbENvb3JkaW5hdGVzID0gY29tcHV0ZUNvb3JkaW5hdGVzKCk7XG4gIHZhciB4ID0gaW5pdGlhbENvb3JkaW5hdGVzWzBdO1xuICB2YXIgeSA9IGluaXRpYWxDb29yZGluYXRlc1sxXTtcbiAgY3R4Lm1vdmVUbyh4LCB5KTtcblxuICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBzaWRlczsgaWR4KyspIHtcbiAgICBhbmdsZSA9IChpZHggPT0gc2lkZXMgLSAxKSA/IGluaXRpYWxBbmdsZSA6IChhbmdsZSArIGRlbHRhKTtcbiAgICB2YXIgY29vcmRzID0gY29tcHV0ZUNvb3JkaW5hdGVzKCk7XG4gICAgY3R4LmxpbmVUbyhjb29yZHNbMF0sIGNvb3Jkc1sxXSk7XG4gIH1cbiAgY3R4LmZpbGwoKTtcbiAgY3R4LnN0cm9rZSgpO1xufTtcblxuLyoqXG4gKiBUT0RPKGRhbnZrKTogYmUgbW9yZSBzcGVjaWZpYyBvbiB0aGUgcmV0dXJuIHR5cGUuXG4gKiBAcGFyYW0ge251bWJlcn0gc2lkZXNcbiAqIEBwYXJhbSB7bnVtYmVyPX0gcm90YXRpb25SYWRpYW5zXG4gKiBAcGFyYW0ge251bWJlcj19IGRlbHRhXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBwcml2YXRlXG4gKi9cbnZhciBzaGFwZUZ1bmN0aW9uID0gZnVuY3Rpb24oc2lkZXMsIHJvdGF0aW9uUmFkaWFucywgZGVsdGEpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGcsIG5hbWUsIGN0eCwgY3gsIGN5LCBjb2xvciwgcmFkaXVzKSB7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7XG4gICAgY3R4LmZpbGxTdHlsZSA9IFwid2hpdGVcIjtcbiAgICByZWd1bGFyU2hhcGUoY3R4LCBzaWRlcywgcmFkaXVzLCBjeCwgY3ksIHJvdGF0aW9uUmFkaWFucywgZGVsdGEpO1xuICB9O1xufTtcblxudmFyIGN1c3RvbUNpcmNsZXMgPSB7XG4gIFRSSUFOR0xFIDogc2hhcGVGdW5jdGlvbigzKSxcbiAgU1FVQVJFIDogc2hhcGVGdW5jdGlvbig0LCBNYXRoLlBJIC8gNCksXG4gIERJQU1PTkQgOiBzaGFwZUZ1bmN0aW9uKDQpLFxuICBQRU5UQUdPTiA6IHNoYXBlRnVuY3Rpb24oNSksXG4gIEhFWEFHT04gOiBzaGFwZUZ1bmN0aW9uKDYpLFxuICBDSVJDTEUgOiBmdW5jdGlvbihnLCBuYW1lLCBjdHgsIGN4LCBjeSwgY29sb3IsIHJhZGl1cykge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcbiAgICBjdHguZmlsbFN0eWxlID0gXCJ3aGl0ZVwiO1xuICAgIGN0eC5hcmMoY3gsIGN5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguc3Ryb2tlKCk7XG4gIH0sXG4gIFNUQVIgOiBzaGFwZUZ1bmN0aW9uKDUsIDAsIDQgKiBNYXRoLlBJIC8gNSksXG4gIFBMVVMgOiBmdW5jdGlvbihnLCBuYW1lLCBjdHgsIGN4LCBjeSwgY29sb3IsIHJhZGl1cykge1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8oY3ggKyByYWRpdXMsIGN5KTtcbiAgICBjdHgubGluZVRvKGN4IC0gcmFkaXVzLCBjeSk7XG4gICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgIGN0eC5zdHJva2UoKTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKGN4LCBjeSArIHJhZGl1cyk7XG4gICAgY3R4LmxpbmVUbyhjeCwgY3kgLSByYWRpdXMpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICBjdHguc3Ryb2tlKCk7XG4gIH0sXG4gIEVYIDogZnVuY3Rpb24oZywgbmFtZSwgY3R4LCBjeCwgY3ksIGNvbG9yLCByYWRpdXMpIHtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKGN4ICsgcmFkaXVzLCBjeSArIHJhZGl1cyk7XG4gICAgY3R4LmxpbmVUbyhjeCAtIHJhZGl1cywgY3kgLSByYWRpdXMpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICBjdHguc3Ryb2tlKCk7XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyhjeCArIHJhZGl1cywgY3kgLSByYWRpdXMpO1xuICAgIGN0eC5saW5lVG8oY3ggLSByYWRpdXMsIGN5ICsgcmFkaXVzKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgY3R4LnN0cm9rZSgpO1xuICB9XG59O1xuXG5mb3IgKHZhciBrIGluIGN1c3RvbUNpcmNsZXMpIHtcbiAgaWYgKCFjdXN0b21DaXJjbGVzLmhhc093blByb3BlcnR5KGspKSBjb250aW51ZTtcbiAgRHlncmFwaC5DaXJjbGVzW2tdID0gY3VzdG9tQ2lyY2xlc1trXTtcbn1cblxufSkoKTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxDQUFDLFlBQVc7RUFFWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNBLElBQUlBLFlBQVksR0FBRyxTQUFmQSxZQUFZLENBQ1pDLEdBQUcsRUFBRUMsS0FBSyxFQUFFQyxNQUFNLEVBQUVDLEVBQUUsRUFBRUMsRUFBRSxFQUFFQyxlQUFlLEVBQUVDLEtBQUssRUFBRTtJQUN0REQsZUFBZSxHQUFHQSxlQUFlLElBQUksQ0FBQztJQUN0Q0MsS0FBSyxHQUFHQSxLQUFLLElBQUlDLElBQUksQ0FBQ0MsRUFBRSxHQUFHLENBQUMsR0FBR1AsS0FBSztJQUVwQ0QsR0FBRyxDQUFDUyxTQUFTLEVBQUU7SUFDZixJQUFJQyxZQUFZLEdBQUdMLGVBQWU7SUFDbEMsSUFBSU0sS0FBSyxHQUFHRCxZQUFZO0lBRXhCLElBQUlFLGtCQUFrQixHQUFHLFNBQXJCQSxrQkFBa0IsR0FBYztNQUNsQyxJQUFJQyxDQUFDLEdBQUdWLEVBQUUsR0FBSUksSUFBSSxDQUFDTyxHQUFHLENBQUNILEtBQUss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