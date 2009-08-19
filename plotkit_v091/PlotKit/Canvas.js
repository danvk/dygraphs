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
        "padding": {left: 30, right: 30, top: 5, bottom: 10},
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
        x: this.options.padding.left,
        y: this.options.padding.top,
        w: this.width - this.options.padding.left - this.options.padding.right,
        h: this.height - this.options.padding.top - this.options.padding.bottom
    };

    MochiKit.DOM.updateNodeAttributes(this.container, 
    {"style":{ "position": "relative", "width": this.width + "px"}});

    // load event system if we have Signals
    /* Disabled until we have a proper implementation
    try {
        this.event_isinside = null;
        if (MochiKit.Signal && this.options.enableEvents) {
            this._initialiseEvents();
        }
    }
    catch (e) {
        // still experimental
    }
    */
};

PlotKit.CanvasRenderer.prototype.render = function() {
    if (this.isIE) {
        // VML takes a while to start up, so we just poll every this.IEDelay
        try {
            if (this.renderDelay) {
                this.renderDelay.cancel();
                this.renderDelay = null;
            }
            var context = this.element.getContext("2d");
        }
        catch (e) {
            this.isFirstRender = false;
            if (this.maxTries-- > 0) {
                this.renderDelay = MochiKit.Async.wait(this.IEDelay);
                this.renderDelay.addCallback(bind(this.render, this));
            }
            return;
        }
    }

    if (this.options.drawBackground)
        this._renderBackground();

    if (this.layout.style == "line") {
        this._renderLineChart();
		this._renderLineAxis();
	}
};

PlotKit.CanvasRenderer.prototype._renderLineChart = function() {
    var context = this.element.getContext("2d");
    var colorCount = this.options.colorScheme.length;
    var colorScheme = this.options.colorScheme;
    var setNames = MochiKit.Base.keys(this.layout.datasets);
    var setCount = setNames.length;
    var bind = MochiKit.Base.bind;
    var partial = MochiKit.Base.partial;

    for (var i = 0; i < setCount; i++) {
        var setName = setNames[i];
        var color = colorScheme[i%colorCount];
        var strokeX = this.options.strokeColorTransform;

        // setup graphics context
        context.save();
        context.fillStyle = color.toRGBString();
        if (this.options.strokeColor)
            context.strokeStyle = this.options.strokeColor.toRGBString();
        else if (this.options.strokeColorTransform) 
            context.strokeStyle = color[strokeX]().toRGBString();
        
        context.lineWidth = this.options.strokeWidth;
        
        // create paths
        var makePath = function(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.area.x, this.area.y + this.area.h);
            var addPoint = function(ctx_, point) {
                if (point.name == setName)
                    ctx_.lineTo(this.area.w * point.x + this.area.x,
                                this.area.h * point.y + this.area.y);
            };
            MochiKit.Iter.forEach(this.layout.points, partial(addPoint, ctx), this);
            ctx.lineTo(this.area.w + this.area.x,
                           this.area.h + this.area.y);
            ctx.lineTo(this.area.x, this.area.y + this.area.h);
            ctx.closePath();
        };

        if (this.options.shouldFill) {
            bind(makePath, this)(context);
            context.fill();
        }
        if (this.options.shouldStroke) {
            bind(makePath, this)(context);
            context.stroke();
        }

        context.restore();
    }
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
                label.style.top = (y - this.options.axisLabelFontSize) + "px";
                label.style.left = (x - this.options.padding.left - this.options.axisTickSize) + "px";
                label.style.textAlign = "right";
                label.style.width = (this.options.padding.left - this.options.axisTickSize * 2) + "px";
                MochiKit.DOM.appendChildNodes(this.container, label);
                this.ylabels.push(label);
            };
            
            MochiKit.Iter.forEach(this.layout.yticks, bind(drawTick, this));
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
                label.style.top = (y + this.options.axisTickSize) + "px";
                label.style.left = (x - this.options.axisLabelWidth/2) + "px";
                label.style.textAlign = "center";
                label.style.width = this.options.axisLabelWidth + "px";
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

PlotKit.CanvasRenderer.prototype._renderBackground = function() {
    var context = this.element.getContext("2d");
    context.save();
    context.fillStyle = this.options.backgroundColor.toRGBString();
    context.fillRect(0, 0, this.width, this.height);
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

PlotKit.CanvasRenderer.prototype._initialiseEvents = function() {
    var connect = MochiKit.Signal.connect;
    var bind = MochiKit.Base.bind;
    //MochiKit.Signal.registerSignals(this, ['onmouseover', 'onclick', 'onmouseout', 'onmousemove']);
    //connect(this.element, 'onmouseover', bind(this.onmouseover, this));
    //connect(this.element, 'onmouseout', bind(this.onmouseout, this));
    //connect(this.element, 'onmousemove', bind(this.onmousemove, this));
    connect(this.element, 'onclick', bind(this.onclick, this));
};

PlotKit.CanvasRenderer.prototype._resolveObject = function(e) {
    // does not work in firefox
	//var x = (e.event().offsetX - this.area.x) / this.area.w;
	//var y = (e.event().offsetY - this.area.y) / this.area.h;

    var x = (e.mouse().page.x - PlotKit.Base.findPosX(this.element) - this.area.x) / this.area.w;
    var y = (e.mouse().page.y - PlotKit.Base.findPosY(this.element) - this.area.y) / this.area.h;
	
    //log(x, y);

    var isHit = this.layout.hitTest(x, y);
    if (isHit)
        return isHit;
    return null;
};

PlotKit.CanvasRenderer.prototype._createEventObject = function(layoutObj, e) {
    if (layoutObj == null) {
        return null;
    }

    e.chart = layoutObj
    return e;
};


PlotKit.CanvasRenderer.prototype.onclick = function(e) {
    var layoutObject = this._resolveObject(e);
    var eventObject = this._createEventObject(layoutObject, e);
    if (eventObject != null)
        MochiKit.Signal.signal(this, "onclick", eventObject);
};

PlotKit.CanvasRenderer.prototype.onmouseover = function(e) {
    var layoutObject = this._resolveObject(e);
    var eventObject = this._createEventObject(layoutObject, e);
    if (eventObject != null) 
        signal(this, "onmouseover", eventObject);
};

PlotKit.CanvasRenderer.prototype.onmouseout = function(e) {
    var layoutObject = this._resolveObject(e);
    var eventObject = this._createEventObject(layoutObject, e);
    if (eventObject == null)
        signal(this, "onmouseout", e);
    else 
        signal(this, "onmouseout", eventObject);

};

PlotKit.CanvasRenderer.prototype.onmousemove = function(e) {
    var layoutObject = this._resolveObject(e);
    var eventObject = this._createEventObject(layoutObject, e);

    if ((layoutObject == null) && (this.event_isinside == null)) {
        // TODO: should we emit an event anyway?
        return;
    }

    if ((layoutObject != null) && (this.event_isinside == null))
        signal(this, "onmouseover", eventObject);

    if ((layoutObject == null) && (this.event_isinside != null))
        signal(this, "onmouseout", eventObject);

    if ((layoutObject != null) && (this.event_isinside != null))
        signal(this, "onmousemove", eventObject);

    this.event_isinside = layoutObject;
    //log("move", x, y);    
};

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

