Dygraph.Plugins.CanvasAnnotations = (function() {
"use strict";

var annotations = function() {
  this.annotations_ = [];
};

annotations.prototype.toString = function() {
  return "CanvasAnnotations Plugin";
};

annotations.prototype.activate = function(g) {
  g.ready(function(dg) {
    var annotations = dg.getFunctionOption('annotationDataParser')(dg.rawData_, dg);
    dg.setAnnotations(annotations, true); // Don't redraw chart
  });

  return {
    clearChart: this.clearChart,
    didDrawChart: this.didDrawChart
  };
};

annotations.prototype.detachLabels = function() {
  for (var i = 0; i < this.annotations_.length; i++) {
    var a = this.annotations_[i];
    if (a.parentNode) a.parentNode.removeChild(a);
    this.annotations_[i] = null;
  }
  this.annotations_ = [];
};

annotations.prototype.clearChart = function(e) {
  this.detachLabels();
};

annotations.prototype.didDrawChart = function(e) {
  var g = e.dygraph;

  // Early out in the (common) case of zero annotations.
  var points = g.layout_.annotated_points;
  if (!points || points.length === 0) return;

  var containerDiv = e.canvas.parentNode;

  var bindEvt = function(eventName, classEventName, pt) {
    return function(annotation_event) {
      var a = pt.annotation;
      if (a.hasOwnProperty(eventName)) {
        a[eventName](a, pt, g, annotation_event);
      } else if (g.getOption(classEventName)) {
        g.getOption(classEventName)(a, pt, g, annotation_event );
      }
    };
  };
  var getBoundingBox = function(ctx, alphaThreshold) {
    alphaThreshold = alphaThreshold || 15;
    
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;

    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    var data = ctx.getImageData(0, 0, w, h).data;

    for (var x = 0; x < w; ++x) {
      for (var y = 0; y < h; ++y) {
        var a = data[(w * y + x) * 4 + 3];

        if (a > alphaThreshold) {
          if (x > maxX) maxX = x;
          if (x < minX) minX = x;
          if (y > maxY) maxY = y;
          if (y < minY) minY = y;
        }
      }
    }
    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY
    };
  };

  // Add the annotations one-by-one.
  var area = e.dygraph.plotter_.area;

  // x-coord to sum of previous annotation's heights (used for stacking).
  var xToUsedHeight = {};

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (p.canvasx < area.x || p.canvasx > area.x + area.w ||
        p.canvasy < area.y || p.canvasy > area.y + area.h) {
      continue;
    }

    var a = p.annotation;
    if (!a.hasOwnProperty("canvas")) continue;
    var tick_height = 6;
    if (a.hasOwnProperty("tickHeight")) {
      tick_height = a.tickHeight;
    }
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var size = 10;
    if (a.hasOwnProperty("size")) {
      size = a.size;
    }
    var rotation = 0;
    if (a.hasOwnProperty("rotation")) {
      switch (a.rotation) {
        case "up":
          rotation = 0;
          break;
        case "down":
          rotation = 180;
          break;
        default:
          rotation = parseInt(a.rotation, 10) || 0;
      }
    }

    var width = size * 4 + tick_height * 4;
    var height = width;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";   // for IE
    canvas.style.height = height + "px";  // for IE
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    var left = p.canvasx - width / 2;
    canvas.style.left = left + "px";
    var canvasTop = 0;
    if (a.attachAtBottom) {
      var y = (area.y + area.h - height / 2 - tick_height);
      if (xToUsedHeight[left]) {
        y -= xToUsedHeight[left];
      } else {
        xToUsedHeight[left] = 0;
      }
      xToUsedHeight[left] += (tick_height + size);
      canvasTop = y;
    } else {
      canvasTop = p.canvasy - height / 2 + tick_height;
    }
    canvas.style.top = canvasTop + "px";
    
    var cx = width / 2;
    var cy = height / 2;
    ctx.translate(cx, cy - tick_height);
    ctx.rotate((Math.PI / 180 * rotation));
    ctx.translate(-cx, -cy + tick_height);

    var strokeStyle = "black";
    if (a.hasOwnProperty("strokeStyle")) {
      strokeStyle = a.strokeStyle;
    }
    var fillStyle = "white";
    if (a.hasOwnProperty("fillStyle")) {
      fillStyle = a.fillStyle;
    }
    ctx.fillStyle = fillStyle;

    a.canvas(g, null, ctx, width / 2, height / 2, strokeStyle, size);

    var bbox = getBoundingBox(ctx);
    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = left + bbox.x + "px";
    div.style.top = canvasTop + bbox.y + "px";
    div.style.width = bbox.w + "px";
    div.style.height = bbox.h + "px";
    div.title = p.annotation.text;

    a.div = div;

    g.addAndTrackEvent(div, 'click',
        bindEvt('clickHandler', 'annotationClickHandler', p, this));
    g.addAndTrackEvent(div, 'mouseover',
        bindEvt('mouseOverHandler', 'annotationMouseOverHandler', p, this));
    g.addAndTrackEvent(div, 'mouseout',
        bindEvt('mouseOutHandler', 'annotationMouseOutHandler', p, this));
    g.addAndTrackEvent(div, 'dblclick',
        bindEvt('dblClickHandler', 'annotationDblClickHandler', p, this));

    containerDiv.appendChild(canvas);
    containerDiv.appendChild(div);
    this.annotations_.push(canvas);
    this.annotations_.push(div);
  }
};

return annotations;

})();
