"use strict";

/**
 * @license
 * Copyright 2015 Petr Shevtsov (petr.shevtsov@gmail.com)
 * MIT-licenced: https://opensource.org/licenses/MIT
 */

/*global Dygraph:false */
/*jshint globalstrict: true */
Dygraph.Plugins.Crosshair = function () {
  "use strict";

  /**
   * Creates the crosshair
   *
   * @constructor
   */
  var crosshair = function crosshair(opt_options) {
    this.canvas_ = document.createElement("canvas");
    opt_options = opt_options || {};
    this.direction_ = opt_options.direction || null;
  };
  crosshair.prototype.toString = function () {
    return "Crosshair Plugin";
  };

  /**
   * @param {Dygraph} g Graph instance.
   * @return {object.<string, function(ev)>} Mapping of event names to callbacks.
   */
  crosshair.prototype.activate = function (g) {
    g.graphDiv.appendChild(this.canvas_);
    return {
      select: this.select,
      deselect: this.deselect
    };
  };
  crosshair.prototype.select = function (e) {
    if (this.direction_ === null) {
      return;
    }
    var width = e.dygraph.width_;
    var height = e.dygraph.height_;
    this.canvas_.width = width;
    this.canvas_.height = height;
    this.canvas_.style.width = width + "px"; // for IE
    this.canvas_.style.height = height + "px"; // for IE

    var ctx = this.canvas_.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(0, 0, 0,0.3)";
    ctx.beginPath();
    var canvasx = Math.floor(e.dygraph.selPoints_[0].canvasx) + 0.5; // crisper rendering

    if (this.direction_ === "vertical" || this.direction_ === "both") {
      ctx.moveTo(canvasx, 0);
      ctx.lineTo(canvasx, height);
    }
    if (this.direction_ === "horizontal" || this.direction_ === "both") {
      for (var i = 0; i < e.dygraph.selPoints_.length; i++) {
        var canvasy = Math.floor(e.dygraph.selPoints_[i].canvasy) + 0.5; // crisper rendering
        ctx.moveTo(0, canvasy);
        ctx.lineTo(width, canvasy);
      }
    }
    ctx.stroke();
    ctx.closePath();
  };
  crosshair.prototype.deselect = function (e) {
    var ctx = this.canvas_.getContext("2d");
    ctx.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  };
  crosshair.prototype.destroy = function () {
    this.canvas_ = null;
  };
  return crosshair;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEeWdyYXBoIiwiUGx1Z2lucyIsIkNyb3NzaGFpciIsImNyb3NzaGFpciIsIm9wdF9vcHRpb25zIiwiY2FudmFzXyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImRpcmVjdGlvbl8iLCJkaXJlY3Rpb24iLCJwcm90b3R5cGUiLCJ0b1N0cmluZyIsImFjdGl2YXRlIiwiZyIsImdyYXBoRGl2IiwiYXBwZW5kQ2hpbGQiLCJzZWxlY3QiLCJkZXNlbGVjdCIsImUiLCJ3aWR0aCIsImR5Z3JhcGgiLCJ3aWR0aF8iLCJoZWlnaHQiLCJoZWlnaHRfIiwic3R5bGUiLCJjdHgiLCJnZXRDb250ZXh0IiwiY2xlYXJSZWN0Iiwic3Ryb2tlU3R5bGUiLCJiZWdpblBhdGgiLCJjYW52YXN4IiwiTWF0aCIsImZsb29yIiwic2VsUG9pbnRzXyIsIm1vdmVUbyIsImxpbmVUbyIsImkiLCJsZW5ndGgiLCJjYW52YXN5Iiwic3Ryb2tlIiwiY2xvc2VQYXRoIiwiZGVzdHJveSJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHRyYXMvY3Jvc3NoYWlyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFBldHIgU2hldnRzb3YgKHBldHIuc2hldnRzb3ZAZ21haWwuY29tKVxuICogTUlULWxpY2VuY2VkOiBodHRwczovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICovXG5cbi8qZ2xvYmFsIER5Z3JhcGg6ZmFsc2UgKi9cbi8qanNoaW50IGdsb2JhbHN0cmljdDogdHJ1ZSAqL1xuRHlncmFwaC5QbHVnaW5zLkNyb3NzaGFpciA9IChmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGNyb3NzaGFpclxuICAgKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG5cbiAgdmFyIGNyb3NzaGFpciA9IGZ1bmN0aW9uKG9wdF9vcHRpb25zKSB7XG4gICAgdGhpcy5jYW52YXNfID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICBvcHRfb3B0aW9ucyA9IG9wdF9vcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuZGlyZWN0aW9uXyA9IG9wdF9vcHRpb25zLmRpcmVjdGlvbiB8fCBudWxsO1xuICB9O1xuXG4gIGNyb3NzaGFpci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCJDcm9zc2hhaXIgUGx1Z2luXCI7XG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RHlncmFwaH0gZyBHcmFwaCBpbnN0YW5jZS5cbiAgICogQHJldHVybiB7b2JqZWN0LjxzdHJpbmcsIGZ1bmN0aW9uKGV2KT59IE1hcHBpbmcgb2YgZXZlbnQgbmFtZXMgdG8gY2FsbGJhY2tzLlxuICAgKi9cbiAgY3Jvc3NoYWlyLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKGcpIHtcbiAgICBnLmdyYXBoRGl2LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzXyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0OiB0aGlzLnNlbGVjdCxcbiAgICAgIGRlc2VsZWN0OiB0aGlzLmRlc2VsZWN0XG4gICAgfTtcbiAgfTtcblxuICBjcm9zc2hhaXIucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAodGhpcy5kaXJlY3Rpb25fID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHdpZHRoID0gZS5keWdyYXBoLndpZHRoXztcbiAgICB2YXIgaGVpZ2h0ID0gZS5keWdyYXBoLmhlaWdodF87XG4gICAgdGhpcy5jYW52YXNfLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5jYW52YXNfLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLmNhbnZhc18uc3R5bGUud2lkdGggPSB3aWR0aCArIFwicHhcIjsgICAgLy8gZm9yIElFXG4gICAgdGhpcy5jYW52YXNfLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFwicHhcIjsgIC8vIGZvciBJRVxuXG4gICAgdmFyIGN0eCA9IHRoaXMuY2FudmFzXy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBcInJnYmEoMCwgMCwgMCwwLjMpXCI7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuXG4gICAgdmFyIGNhbnZhc3ggPSBNYXRoLmZsb29yKGUuZHlncmFwaC5zZWxQb2ludHNfWzBdLmNhbnZhc3gpICsgMC41OyAvLyBjcmlzcGVyIHJlbmRlcmluZ1xuXG4gICAgaWYgKHRoaXMuZGlyZWN0aW9uXyA9PT0gXCJ2ZXJ0aWNhbFwiIHx8IHRoaXMuZGlyZWN0aW9uXyA9PT0gXCJib3RoXCIpIHtcbiAgICAgIGN0eC5tb3ZlVG8oY2FudmFzeCwgMCk7XG4gICAgICBjdHgubGluZVRvKGNhbnZhc3gsIGhlaWdodCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZGlyZWN0aW9uXyA9PT0gXCJob3Jpem9udGFsXCIgfHwgdGhpcy5kaXJlY3Rpb25fID09PSBcImJvdGhcIikge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmR5Z3JhcGguc2VsUG9pbnRzXy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2FudmFzeSA9IE1hdGguZmxvb3IoZS5keWdyYXBoLnNlbFBvaW50c19baV0uY2FudmFzeSkgKyAwLjU7IC8vIGNyaXNwZXIgcmVuZGVyaW5nXG4gICAgICAgIGN0eC5tb3ZlVG8oMCwgY2FudmFzeSk7XG4gICAgICAgIGN0eC5saW5lVG8od2lkdGgsIGNhbnZhc3kpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGN0eC5zdHJva2UoKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gIH07XG5cbiAgY3Jvc3NoYWlyLnByb3RvdHlwZS5kZXNlbGVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgY3R4ID0gdGhpcy5jYW52YXNfLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzXy53aWR0aCwgdGhpcy5jYW52YXNfLmhlaWdodCk7XG4gIH07XG5cbiAgY3Jvc3NoYWlyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jYW52YXNfID0gbnVsbDtcbiAgfTtcblxuICByZXR1cm4gY3Jvc3NoYWlyO1xufSkoKTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQUEsT0FBTyxDQUFDQyxPQUFPLENBQUNDLFNBQVMsR0FBSSxZQUFXO0VBQ3RDLFlBQVk7O0VBRVo7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUVFLElBQUlDLFNBQVMsR0FBRyxTQUFaQSxTQUFTLENBQVlDLFdBQVcsRUFBRTtJQUNwQyxJQUFJLENBQUNDLE9BQU8sR0FBR0MsUUFBUSxDQUFDQyxhQUFhLENBQUMsUUFBUSxDQUFDO0lBQy9DSCxXQUFXLEdBQUdBLFdBQVcsSUFBSSxDQUFDLENBQUM7SUFDL0IsSUFBSSxDQUFDSSxVQUFVLEdBQUdKLFdBQVcsQ0FBQ0ssU0FBUyxJQUFJLElBQUk7RUFDakQsQ0FBQztFQUVETixTQUFTLENBQUNPLFNBQVMsQ0FBQ0MsUUFBUSxHQUFHLFlBQVc7SUFDeEMsT0FBTyxrQkFBa0I7RUFDM0IsQ0FBQzs7RUFFRDtBQUNGO0FBQ0E7QUFDQTtFQUNFUixTQUFTLENBQUNPLFNBQVMsQ0FBQ0UsUUFBUSxHQUFHLFVBQVNDLENBQUMsRUFBRTtJQUN6Q0EsQ0FBQyxDQUFDQyxRQUFRLENBQUNDLFdBQVcsQ0FBQyxJQUFJLENBQUNWLE9BQU8sQ0FBQztJQUVwQyxPQUFPO01BQ0xXLE1BQU0sRUFBRSxJQUFJLENBQUNBLE1BQU07TUFDbkJDLFFBQVEsRUFBRSxJQUFJLENBQUNBO0lBQ2pCLENBQUM7RUFDSCxDQUFDO0VBRURkLFNBQVMsQ0FBQ08sU0FBUyxDQUFDTSxNQUFNLEdBQUcsVUFBU0UsQ0FBQyxFQUFFO0lBQ3ZDLElBQUksSUFBSSxDQUFDVixV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