/* 
    PlotKit Canvas
    ==============
    
    Provides HTML Canvas Renderer. This is supported under:
    
    - Safari 2.0
    - Mozilla Firefox 1.5
    - Opera 9.0 preview 2
    - IE 6 (via VML Emulation)
    
    It uses DIVs for labels.
    
    Copyright
    ---------
    Copyright 2005,2006 (c) Alastair Tse <alastair^liquidx.net>
    For use under the BSD license. <http://www.liquidx.net/plotkit>
    
*/
// --------------------------------------------------------------------
// Check required components
// --------------------------------------------------------------------

try {    
    if ((typeof(PlotKit.Base) == 'undefined') ||
        (typeof(PlotKit.Layout) == 'undefined'))
    {
        throw "";    
    }
} 
catch (e) {    
    throw "PlotKit.Layout depends on MochiKit.{Base,Color,DOM,Format} and PlotKit.{Base,Layout}"
}


// ------------------------------------------------------------------------
//  Defines the renderer class
// ------------------------------------------------------------------------

if (typeof(PlotKit.CanvasRenderer) == 'undefined') {
    PlotKit.CanvasRenderer = {};
}

PlotKit.CanvasRenderer.NAME = "PlotKit.CanvasRenderer";
PlotKit.CanvasRenderer.VERSION = PlotKit.VERSION;

PlotKit.CanvasRenderer.__repr__ = function() {
    return "[" + this.NAME + " " + this.VERSION + "]";
};

PlotKit.CanvasRenderer.toString = function() {
    return this.__repr__();
}

PlotKit.CanvasRenderer = function(element, layout, options) {
    if (arguments.length  > 0)
        this.__init__(element, layout, options);
};

PlotKit.CanvasRenderer.prototype.__init__ = function(element, layout, options) {
    var isNil = MochiKit.Base.isUndefinedOrNull;
    var Color = MochiKit.Color.Color;
    
    // default options
    this.options = {
        "drawBackground": true,
        "backgroundColor": Color.whiteColor(),
        "colorScheme": PlotKit.Base.palette(PlotKit.Base.baseColors()[0]),
        "strokeColor": Color.whiteColor(),
        "strokeColorTransform": "asStrokeColor",
        "strokeWidth": 0.5,
        "shouldFill": true,
        "shouldStroke": true,
        "drawXAxis": true,
        "drawYAxis": true,
        "axisLineColor": Color.blackColor(),
        "axisLineWidth": 0.5,
        "axisTickSize": 3,
        "axisLabelColor": Color.blackColor(),
        "axisLabelFont": "Arial",
        "axisLabelFontSize": 9,
		"axisLabelWidth": 50,
		"pieRadius": 0.4,
        "enableEvents": true
    };
    MochiKit.Base.update(this.options, options ? options : {});

    this.layout = layout;
    this.element = MochiKit.DOM.getElement(element);
    this.container = this.element.parentNode;

    // Stuff relating to Canvas on IE support    
    this.isIE = PlotKit.Base.excanvasSupported();

    if (this.isIE && !isNil(G_vmlCanvasManager)) {
        this.IEDelay = 0.5;
        this.maxTries = 5;
        this.renderDelay = null;
        this.clearDelay = null;
        this.element = G_vmlCanvasManager.initElement(this.element);
    }

    this.height = this.element.height;
    this.width = this.element.width;

    // --- check whether everything is ok before we return

    if (isNil(this.element))
        throw "CanvasRenderer() - passed canvas is not found";

    if (!this.isIE && !(PlotKit.CanvasRenderer.isSupported(this.element)))
        throw "CanvasRenderer() - Canvas is not supported.";

    if (isNil(this.container) || (this.container.nodeName.toLowerCase() != "div"))
        throw "CanvasRenderer() - <canvas> needs to be enclosed in <div>";

    // internal state
    this.xlabels = new Array();
    this.ylabels = new Array();
    this.isFirstRender = true;

    this.area = {
        x: this.options.yAxisLabelWidth + 2 * this.options.axisTickSize,
        y: 0
    };
    this.area.w = this.width - this.area.x - this.options.rightGap;
    this.area.h = this.height - this.options.axisLabelFontSize -
                  2 * this.options.axisTickSize;

    MochiKit.DOM.updateNodeAttributes(this.container, 
    {"style":{ "position": "relative", "width": this.width + "px"}});
};


PlotKit.CanvasRenderer.prototype._renderLineAxis = function() {
	this._renderAxis();
};


PlotKit.CanvasRenderer.prototype._renderAxis = function() {
    if (!this.options.drawXAxis && !this.options.drawYAxis)
        return;

    var context = this.element.getContext("2d");

    var labelStyle = {"style":
         {"position": "absolute",
          "fontSize": this.options.axisLabelFontSize + "px",
          "zIndex": 10,
          "color": this.options.axisLabelColor.toRGBString(),
          "width": this.options.axisLabelWidth + "px",
          "overflow": "hidden"
         }
    };

    // axis lines
    context.save();
    context.strokeStyle = this.options.axisLineColor.toRGBString();
    context.lineWidth = this.options.axisLineWidth;


    if (this.options.drawYAxis) {
        if (this.layout.yticks) {
            var drawTick = function(tick) {
                if (typeof(tick) == "function") return;
                var x = this.area.x;
                var y = this.area.y + tick[0] * this.area.h;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x - this.options.axisTickSize, y);
                context.closePath();
                context.stroke();

                var label = DIV(labelStyle, tick[1]);
                var top = (y - this.options.axisLabelFontSize / 2);
                if (top < 0) top = 0;

                if (top + this.options.axisLabelFontSize + 3 > this.height) {
                  label.style.bottom = "0px";
                } else {
                  label.style.top = top + "px";
                }
                label.style.left = "0px";
                label.style.textAlign = "right";
                label.style.width = this.options.yAxisLabelWidth + "px";
                MochiKit.DOM.appendChildNodes(this.container, label);
                this.ylabels.push(label);
            };
            
            MochiKit.Iter.forEach(this.layout.yticks, bind(drawTick, this));

            // The lowest tick on the y-axis often overlaps with the leftmost
            // tick on the x-axis. Shift the bottom tick up a little bit to
            // compensate if necessary.
            var bottomTick = this.ylabels[0];
            var fontSize = this.options.axisLabelFontSize;
            var bottom = parseInt(bottomTick.style.top) + fontSize;
            if (bottom > this.height - fontSize) {
              bottomTick.style.top = (parseInt(bottomTick.style.top) -
                                      fontSize / 2) + "px";
            }
        }

        context.beginPath();
        context.moveTo(this.area.x, this.area.y);
        context.lineTo(this.area.x, this.area.y + this.area.h);
        context.closePath();
        context.stroke();
    }

    if (this.options.drawXAxis) {
        if (this.layout.xticks) {
            var drawTick = function(tick) {
                if (typeof(dataset) == "function") return;
                
                var x = this.area.x + tick[0] * this.area.w;
                var y = this.area.y + this.area.h;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x, y + this.options.axisTickSize);
                context.closePath();
                context.stroke();

                var label = DIV(labelStyle, tick[1]);
                label.style.textAlign = "center";
                label.style.bottom = "0px";

                var left = (x - this.options.axisLabelWidth/2);
                if (left + this.options.axisLabelWidth > this.width) {
                  left = this.width - this.options.xAxisLabelWidth;
                  label.style.textAlign = "right";
                }
                if (left < 0) {
                  left = 0;
                  label.style.textAlign = "left";
                }

                label.style.left = left + "px";
                label.style.width = this.options.xAxisLabelWidth + "px";
                MochiKit.DOM.appendChildNodes(this.container, label);
                this.xlabels.push(label);
            };
            
            MochiKit.Iter.forEach(this.layout.xticks, bind(drawTick, this));
        }

        context.beginPath();
        context.moveTo(this.area.x, this.area.y + this.area.h);
        context.lineTo(this.area.x + this.area.w, this.area.y + this.area.h);
        context.closePath();
        context.stroke();
    }

    context.restore();

};

PlotKit.CanvasRenderer.prototype.clear = function() {
    if (this.isIE) {
        // VML takes a while to start up, so we just poll every this.IEDelay
        try {
            if (this.clearDelay) {
                this.clearDelay.cancel();
                this.clearDelay = null;
            }
            var context = this.element.getContext("2d");
        }
        catch (e) {
            this.isFirstRender = false;
            this.clearDelay = MochiKit.Async.wait(this.IEDelay);
            this.clearDelay.addCallback(bind(this.clear, this));
            return;
        }
    }

    var context = this.element.getContext("2d");
    context.clearRect(0, 0, this.width, this.height);

    MochiKit.Iter.forEach(this.xlabels, MochiKit.DOM.removeElement);
    MochiKit.Iter.forEach(this.ylabels, MochiKit.DOM.removeElement);
    this.xlabels = new Array();
    this.ylabels = new Array();
};

// ----------------------------------------------------------------
//  Everything below here is experimental and undocumented.
// ----------------------------------------------------------------


PlotKit.CanvasRenderer.isSupported = function(canvasName) {
    var canvas = null;
    try {
        if (MochiKit.Base.isUndefinedOrNull(canvasName)) 
            canvas = MochiKit.DOM.CANVAS({});
        else
            canvas = MochiKit.DOM.getElement(canvasName);
        var context = canvas.getContext("2d");
    }
    catch (e) {
        var ie = navigator.appVersion.match(/MSIE (\d\.\d)/);
        var opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1);
        if ((!ie) || (ie[1] < 6) || (opera))
            return false;
        return true;
    }
    return true;
};

// Namespace Iniitialisation

PlotKit.Canvas = {}
PlotKit.Canvas.CanvasRenderer = PlotKit.CanvasRenderer;

PlotKit.Canvas.EXPORT = [
    "CanvasRenderer"
];

PlotKit.Canvas.EXPORT_OK = [
    "CanvasRenderer"
];

PlotKit.Canvas.__new__ = function() {
    var m = MochiKit.Base;
    
    m.nameFunctions(this);
    
    this.EXPORT_TAGS = {
        ":common": this.EXPORT,
        ":all": m.concat(this.EXPORT, this.EXPORT_OK)
    };
};

PlotKit.Canvas.__new__();
MochiKit.Base._exportSymbols(this, PlotKit.Canvas);

