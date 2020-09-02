/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview This file contains utility functions used by dygraphs. These
 * are typically static (i.e. not related to any particular dygraph). Examples
 * include date/time formatting functions, basic algorithms (e.g. binary
 * search) and generic DOM-manipulation functions.
 */

/*jshint globalstrict: true */
/*global Dygraph:false, G_vmlCanvasManager:false, Node:false, printStackTrace: false */
"use strict";

Dygraph.LOG_SCALE = 10;
Dygraph.LN_TEN = Math.log(Dygraph.LOG_SCALE);

/**
 * @private
 * @param {number} x
 * @return {number}
 */
Dygraph.log10 = function(x) {
  return Math.log(x) / Dygraph.LN_TEN;
};

// Various logging levels.
Dygraph.DEBUG = 1;
Dygraph.INFO = 2;
Dygraph.WARNING = 3;
Dygraph.ERROR = 3;

// Set this to log stack traces on warnings, etc.
// This requires stacktrace.js, which is up to you to provide.
// A copy can be found in the dygraphs repo, or at
// https://github.com/eriwen/javascript-stacktrace
Dygraph.LOG_STACK_TRACES = false;

/** A dotted line stroke pattern. */
Dygraph.DOTTED_LINE = [2, 2];
/** A dashed line stroke pattern. */
Dygraph.DASHED_LINE = [7, 3];
/** A dot dash stroke pattern. */
Dygraph.DOT_DASH_LINE = [7, 2, 2, 2];

/**
 * Log an error on the JS console at the given severity.
 * @param {number} severity One of Dygraph.{DEBUG,INFO,WARNING,ERROR}
 * @param {string} message The message to log.
 * @private
 */
Dygraph.log = function(severity, message) {
  var st;
  if (typeof(printStackTrace) != 'undefined') {
    try {
      // Remove uninteresting bits: logging functions and paths.
      st = printStackTrace({guess:false});
      while (st[0].indexOf("stacktrace") != -1) {
        st.splice(0, 1);
      }

      st.splice(0, 2);
      for (var i = 0; i < st.length; i++) {
        st[i] = st[i].replace(/\([^)]*\/(.*)\)/, '@$1')
            .replace(/\@.*\/([^\/]*)/, '@$1')
            .replace('[object Object].', '');
      }
      var top_msg = st.splice(0, 1)[0];
      message += ' (' + top_msg.replace(/^.*@ ?/, '') + ')';
    } catch(e) {
      // Oh well, it was worth a shot!
    }
  }

  if (typeof(window.console) != 'undefined') {
    // In older versions of Firefox, only console.log is defined.
    var console = window.console;
    var log = function(console, method, msg) {
      if (method && typeof(method) == 'function') {
        method.call(console, msg);
      } else {
        console.log(msg);
      }
    };

    switch (severity) {
      case Dygraph.DEBUG:
        log(console, console.debug, 'dygraphs: ' + message);
        break;
      case Dygraph.INFO:
        log(console, console.info, 'dygraphs: ' + message);
        break;
      case Dygraph.WARNING:
        log(console, console.warn, 'dygraphs: ' + message);
        break;
      case Dygraph.ERROR:
        log(console, console.error, 'dygraphs: ' + message);
        break;
    }
  }

  if (Dygraph.LOG_STACK_TRACES) {
    window.console.log(st.join('\n'));
  }
};

/**
 * @param {string} message
 * @private
 */
Dygraph.info = function(message) {
  Dygraph.log(Dygraph.INFO, message);
};
/**
 * @param {string} message
 * @private
 */
Dygraph.prototype.info = Dygraph.info;

/**
 * @param {string} message
 * @private
 */
Dygraph.warn = function(message) {
  Dygraph.log(Dygraph.WARNING, message);
};
/**
 * @param {string} message
 * @private
 */
Dygraph.prototype.warn = Dygraph.warn;

/**
 * @param {string} message
 */
Dygraph.error = function(message) {
  Dygraph.log(Dygraph.ERROR, message);
};
/**
 * @param {string} message
 * @private
 */
Dygraph.prototype.error = Dygraph.error;

/**
 * Return the 2d context for a dygraph canvas.
 *
 * This method is only exposed for the sake of replacing the function in
 * automated tests, e.g.
 *
 * var oldFunc = Dygraph.getContext();
 * Dygraph.getContext = function(canvas) {
 *   var realContext = oldFunc(canvas);
 *   return new Proxy(realContext);
 * };
 * @param {!HTMLCanvasElement} canvas
 * @return {!CanvasRenderingContext2D}
 * @private
 */
Dygraph.getContext = function(canvas) {
  return /** @type{!CanvasRenderingContext2D}*/(canvas.getContext("2d"));
};

/**
 * Add an event handler. This smooths a difference between IE and the rest of
 * the world.
 * @param { !Element } elem The element to add the event to.
 * @param { string } type The type of the event, e.g. 'click' or 'mousemove'.
 * @param { function(Event):(boolean|undefined) } fn The function to call
 *     on the event. The function takes one parameter: the event object.
 * @private
 */
Dygraph.addEvent = function addEvent(elem, type, fn) {
  if (elem.addEventListener) {
    elem.addEventListener(type, fn, false);
  } else {
    elem[type+fn] = function(){fn(window.event);};
    elem.attachEvent('on'+type, elem[type+fn]);
  }
};

/**
 * Add an event handler. This event handler is kept until the graph is
 * destroyed with a call to graph.destroy().
 *
 * @param { !Element } elem The element to add the event to.
 * @param { string } type The type of the event, e.g. 'click' or 'mousemove'.
 * @param { function(Event):(boolean|undefined) } fn The function to call
 *     on the event. The function takes one parameter: the event object.
 * @private
 */
Dygraph.prototype.addAndTrackEvent = function(elem, type, fn) {
  Dygraph.addEvent(elem, type, fn);
  this.registeredEvents_.push({ elem : elem, type : type, fn : fn });
};

/**
 * Remove an event handler. This smooths a difference between IE and the rest
 * of the world.
 * @param {!Element} elem The element to add the event to.
 * @param {string} type The type of the event, e.g. 'click' or 'mousemove'.
 * @param {function(Event):(boolean|undefined)} fn The function to call
 *     on the event. The function takes one parameter: the event object.
 * @private
 */
Dygraph.removeEvent = function(elem, type, fn) {
  if (elem.removeEventListener) {
    elem.removeEventListener(type, fn, false);
  } else {
    try {
      elem.detachEvent('on'+type, elem[type+fn]);
    } catch(e) {
      // We only detach event listeners on a "best effort" basis in IE. See:
      // http://stackoverflow.com/questions/2553632/detachevent-not-working-with-named-inline-functions
    }
    elem[type+fn] = null;
  }
};

Dygraph.prototype.removeTrackedEvents_ = function() {
  if (this.registeredEvents_) {
    for (var idx = 0; idx < this.registeredEvents_.length; idx++) {
      var reg = this.registeredEvents_[idx];
      Dygraph.removeEvent(reg.elem, reg.type, reg.fn);
    }
  }

  this.registeredEvents_ = [];
};

/**
 * Cancels further processing of an event. This is useful to prevent default
 * browser actions, e.g. highlighting text on a double-click.
 * Based on the article at
 * http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
 * @param { !Event } e The event whose normal behavior should be canceled.
 * @private
 */
Dygraph.cancelEvent = function(e) {
  e = e ? e : window.event;
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.cancelBubble = true;
  e.cancel = true;
  e.returnValue = false;
  return false;
};

/**
 * Convert hsv values to an rgb(r,g,b) string. Taken from MochiKit.Color. This
 * is used to generate default series colors which are evenly spaced on the
 * color wheel.
 * @param { number } hue Range is 0.0-1.0.
 * @param { number } saturation Range is 0.0-1.0.
 * @param { number } value Range is 0.0-1.0.
 * @return { string } "rgb(r,g,b)" where r, g and b range from 0-255.
 * @private
 */
Dygraph.hsvToRGB = function (hue, saturation, value) {
  var red;
  var green;
  var blue;
  if (saturation === 0) {
    red = value;
    green = value;
    blue = value;
  } else {
    var i = Math.floor(hue * 6);
    var f = (hue * 6) - i;
    var p = value * (1 - saturation);
    var q = value * (1 - (saturation * f));
    var t = value * (1 - (saturation * (1 - f)));
    switch (i) {
      case 1: red = q; green = value; blue = p; break;
      case 2: red = p; green = value; blue = t; break;
      case 3: red = p; green = q; blue = value; break;
      case 4: red = t; green = p; blue = value; break;
      case 5: red = value; green = p; blue = q; break;
      case 6: // fall through
      case 0: red = value; green = t; blue = p; break;
    }
  }
  red = Math.floor(255 * red + 0.5);
  green = Math.floor(255 * green + 0.5);
  blue = Math.floor(255 * blue + 0.5);
  return 'rgb(' + red + ',' + green + ',' + blue + ')';
};

// The following functions are from quirksmode.org with a modification for Safari from
// http://blog.firetree.net/2005/07/04/javascript-find-position/
// http://www.quirksmode.org/js/findpos.html
// ... and modifications to support scrolling divs.

/**
 * Find the x-coordinate of the supplied object relative to the left side
 * of the page.
 * TODO(danvk): change obj type from Node -&gt; !Node
 * @param {Node} obj
 * @return {number}
 * @private
 */
Dygraph.findPosX = function(obj) {
  var curleft = 0;
  if(obj.offsetParent) {
    var copyObj = obj;
    while(1) {
      // NOTE: the if statement here is for IE8.
      var borderLeft = "0";
      if (window.getComputedStyle) {
        borderLeft = window.getComputedStyle(copyObj, null).borderLeft || "0";
      }
      curleft += parseInt(borderLeft, 10) ;
      curleft += copyObj.offsetLeft;
      if(!copyObj.offsetParent) {
        break;
      }
      copyObj = copyObj.offsetParent;
    }
  } else if(obj.x) {
    curleft += obj.x;
  }
  // This handles the case where the object is inside a scrolled div.
  while(obj && obj != document.body) {
    curleft -= obj.scrollLeft;
    obj = obj.parentNode;
  }
  return curleft;
};

/**
 * Find the y-coordinate of the supplied object relative to the top of the
 * page.
 * TODO(danvk): change obj type from Node -&gt; !Node
 * TODO(danvk): consolidate with findPosX and return an {x, y} object.
 * @param {Node} obj
 * @return {number}
 * @private
 */
Dygraph.findPosY = function(obj) {
  var curtop = 0;
  if(obj.offsetParent) {
    var copyObj = obj;
    while(1) {
      // NOTE: the if statement here is for IE8.
      var borderTop = "0";
      if (window.getComputedStyle) {
        borderTop = window.getComputedStyle(copyObj, null).borderTop || "0";
      }
      curtop += parseInt(borderTop, 10) ;
      curtop += copyObj.offsetTop;
      if(!copyObj.offsetParent) {
        break;
      }
      copyObj = copyObj.offsetParent;
    }
  } else if(obj.y) {
    curtop += obj.y;
  }
  // This handles the case where the object is inside a scrolled div.
  while(obj && obj != document.body) {
    curtop -= obj.scrollTop;
    obj = obj.parentNode;
  }
  return curtop;
};

/**
 * Returns the x-coordinate of the event in a coordinate system where the
 * top-left corner of the page (not the window) is (0,0).
 * Taken from MochiKit.Signal
 * @param {!Event} e
 * @return {number}
 * @private
 */
Dygraph.pageX = function(e) {
  if (e.pageX) {
    return (!e.pageX || e.pageX < 0) ? 0 : e.pageX;
  } else {
    var de = document.documentElement;
    var b = document.body;
    return e.clientX +
        (de.scrollLeft || b.scrollLeft) -
        (de.clientLeft || 0);
  }
};

/**
 * Returns the y-coordinate of the event in a coordinate system where the
 * top-left corner of the page (not the window) is (0,0).
 * Taken from MochiKit.Signal
 * @param {!Event} e
 * @return {number}
 * @private
 */
Dygraph.pageY = function(e) {
  if (e.pageY) {
    return (!e.pageY || e.pageY < 0) ? 0 : e.pageY;
  } else {
    var de = document.documentElement;
    var b = document.body;
    return e.clientY +
        (de.scrollTop || b.scrollTop) -
        (de.clientTop || 0);
  }
};

/**
 * This returns true unless the parameter is 0, null, undefined or NaN.
 * TODO(danvk): rename this function to something like 'isNonZeroNan'.
 *
 * @param {number} x The number to consider.
 * @return {boolean} Whether the number is zero or NaN.
 * @private
 */
Dygraph.isOK = function(x) {
  return !!x && !isNaN(x);
};

/**
 * @param { {x:?number,y:?number,yval:?number} } p The point to consider, valid
 *     points are {x, y} objects
 * @param { boolean } allowNaNY Treat point with y=NaN as valid
 * @return { boolean } Whether the point has numeric x and y.
 * @private
 */
Dygraph.isValidPoint = function(p, allowNaNY) {
  if (!p) return false;  // null or undefined object
  if (p.yval === null) return false;  // missing point
  if (p.x === null || p.x === undefined) return false;
  if (p.y === null || p.y === undefined) return false;
  if (isNaN(p.x) || (!allowNaNY && isNaN(p.y))) return false;
  return true;
};

/**
 * Number formatting function which mimicks the behavior of %g in printf, i.e.
 * either exponential or fixed format (without trailing 0s) is used depending on
 * the length of the generated string.  The advantage of this format is that
 * there is a predictable upper bound on the resulting string length,
 * significant figures are not dropped, and normal numbers are not displayed in
 * exponential notation.
 *
 * NOTE: JavaScript's native toPrecision() is NOT a drop-in replacement for %g.
 * It creates strings which are too long for absolute values between 10^-4 and
 * 10^-6, e.g. '0.00001' instead of '1e-5'. See tests/number-format.html for
 * output examples.
 *
 * @param {number} x The number to format
 * @param {number=} opt_precision The precision to use, default 2.
 * @return {string} A string formatted like %g in printf.  The max generated
 *                  string length should be precision + 6 (e.g 1.123e+300).
 */
Dygraph.floatFormat = function(x, opt_precision) {
  // Avoid invalid precision values; [1, 21] is the valid range.
  var p = Math.min(Math.max(1, opt_precision || 2), 21);

  // This is deceptively simple.  The actual algorithm comes from:
  //
  // Max allowed length = p + 4
  // where 4 comes from 'e+n' and '.'.
  //
  // Length of fixed format = 2 + y + p
  // where 2 comes from '0.' and y = # of leading zeroes.
  //
  // Equating the two and solving for y yields y = 2, or 0.00xxxx which is
  // 1.0e-3.
  //
  // Since the behavior of toPrecision() is identical for larger numbers, we
  // don't have to worry about the other bound.
  //
  // Finally, the argument for toExponential() is the number of trailing digits,
  // so we take off 1 for the value before the '.'.
  return (Math.abs(x) < 1.0e-3 && x !== 0.0) ?
      x.toExponential(p - 1) : x.toPrecision(p);
};

/**
 * Converts '9' to '09' (useful for dates)
 * @param {number} x
 * @return {string}
 * @private
 */
Dygraph.zeropad = function(x) {
  if (x < 10) return "0" + x; else return "" + x;
};

/**
 * Return a string version of the hours, minutes and seconds portion of a date.
 *
 * @param {number} date The JavaScript date (ms since epoch)
 * @return {string} A time of the form "HH:MM:SS"
 * @private
 */
Dygraph.hmsString_ = function(date) {
  var zeropad = Dygraph.zeropad;
  var d = new Date(date);
  if (d.getSeconds()) {
    return zeropad(d.getHours()) + ":" +
           zeropad(d.getMinutes()) + ":" +
           zeropad(d.getSeconds());
  } else {
    return zeropad(d.getHours()) + ":" + zeropad(d.getMinutes());
  }
};

/**
 * Round a number to the specified number of digits past the decimal point.
 * @param {number} num The number to round
 * @param {number} places The number of decimals to which to round
 * @return {number} The rounded number
 * @private
 */
Dygraph.round_ = function(num, places) {
  var shift = Math.pow(10, places);
  return Math.round(num * shift)/shift;
};

/**
 * Implementation of binary search over an array.
 * Currently does not work when val is outside the range of arry's values.
 * @param {number} val the value to search for
 * @param {Array.<number>} arry is the value over which to search
 * @param {number} abs If abs > 0, find the lowest entry greater than val
 *     If abs < 0, find the highest entry less than val.
 *     If abs == 0, find the entry that equals val.
 * @param {number=} low The first index in arry to consider (optional)
 * @param {number=} high The last index in arry to consider (optional)
 * @return {number} Index of the element, or -1 if it isn't found.
 * @private
 */
Dygraph.binarySearch = function(val, arry, abs, low, high) {
  if (low === null || low === undefined ||
      high === null || high === undefined) {
    low = 0;
    high = arry.length - 1;
  }
  if (low > high) {
    return -1;
  }
  if (abs === null || abs === undefined) {
    abs = 0;
  }
  var validIndex = function(idx) {
    return idx >= 0 && idx < arry.length;
  };
  var mid = parseInt((low + high) / 2, 10);
  var element = arry[mid];
  var idx;
  if (element == val) {
    return mid;
  } else if (element > val) {
    if (abs > 0) {
      // Accept if element > val, but also if prior element < val.
      idx = mid - 1;
      if (validIndex(idx) && arry[idx] < val) {
        return mid;
      }
    }
    return Dygraph.binarySearch(val, arry, abs, low, mid - 1);
  } else if (element < val) {
    if (abs < 0) {
      // Accept if element < val, but also if prior element > val.
      idx = mid + 1;
      if (validIndex(idx) && arry[idx] > val) {
        return mid;
      }
    }
    return Dygraph.binarySearch(val, arry, abs, mid + 1, high);
  }
  return -1;  // can't actually happen, but makes closure compiler happy
};

/**
 * Parses a date, returning the number of milliseconds since epoch. This can be
 * passed in as an xValueParser in the Dygraph constructor.
 * TODO(danvk): enumerate formats that this understands.
 *
 * @param {string} dateStr A date in a variety of possible string formats.
 * @return {number} Milliseconds since epoch.
 * @private
 */
Dygraph.dateParser = function(dateStr) {
  var dateStrSlashed;
  var d;

  // Let the system try the format first, with one caveat:
  // YYYY-MM-DD[ HH:MM:SS] is interpreted as UTC by a variety of browsers.
  // dygraphs displays dates in local time, so this will result in surprising
  // inconsistencies. But if you specify "T" or "Z" (i.e. YYYY-MM-DDTHH:MM:SS),
  // then you probably know what you're doing, so we'll let you go ahead.
  // Issue: http://code.google.com/p/dygraphs/issues/detail?id=255
  if (dateStr.search("-") == -1 ||
      dateStr.search("T") != -1 || dateStr.search("Z") != -1) {
    d = Dygraph.dateStrToMillis(dateStr);
    if (d && !isNaN(d)) return d;
  }

  if (dateStr.search("-") != -1) {  // e.g. '2009-7-12' or '2009-07-12'
    dateStrSlashed = dateStr.replace("-", "/", "g");
    while (dateStrSlashed.search("-") != -1) {
      dateStrSlashed = dateStrSlashed.replace("-", "/");
    }
    d = Dygraph.dateStrToMillis(dateStrSlashed);
  } else if (dateStr.length == 8) {  // e.g. '20090712'
    // TODO(danvk): remove support for this format. It's confusing.
    dateStrSlashed = dateStr.substr(0,4) + "/" + dateStr.substr(4,2) + "/" +
        dateStr.substr(6,2);
    d = Dygraph.dateStrToMillis(dateStrSlashed);
  } else {
    // Any format that Date.parse will accept, e.g. "2009/07/12" or
    // "2009/07/12 12:34:56"
    d = Dygraph.dateStrToMillis(dateStr);
  }

  if (!d || isNaN(d)) {
    Dygraph.error("Couldn't parse " + dateStr + " as a date");
  }
  return d;
};

/**
 * This is identical to JavaScript's built-in Date.parse() method, except that
 * it doesn't get replaced with an incompatible method by aggressive JS
 * libraries like MooTools or Joomla.
 * @param {string} str The date string, e.g. "2011/05/06"
 * @return {number} millis since epoch
 * @private
 */
Dygraph.dateStrToMillis = function(str) {
  return new Date(str).getTime();
};

// These functions are all based on MochiKit.
/**
 * Copies all the properties from o to self.
 *
 * @param {!Object} self
 * @param {!Object} o
 * @return {!Object}
 */
Dygraph.update = function(self, o) {
  if (typeof(o) != 'undefined' && o !== null) {
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        self[k] = o[k];
      }
    }
  }
  return self;
};

/**
 * Copies all the properties from o to self.
 *
 * @param {!Object} self
 * @param {!Object} o
 * @return {!Object}
 * @private
 */
Dygraph.updateDeep = function (self, o) {
  // Taken from http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
  function isNode(o) {
    return (
      typeof Node === "object" ? o instanceof Node :
      typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
    );
  }

  if (typeof(o) != 'undefined' && o !== null) {
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        if (o[k] === null) {
          self[k] = null;
        } else if (Dygraph.isArrayLike(o[k])) {
          self[k] = o[k].slice();
        } else if (isNode(o[k])) {
          // DOM objects are shallowly-copied.
          self[k] = o[k];
        } else if (typeof(o[k]) == 'object') {
          if (typeof(self[k]) != 'object' || self[k] === null) {
            self[k] = {};
          }
          Dygraph.updateDeep(self[k], o[k]);
        } else {
          self[k] = o[k];
        }
      }
    }
  }
  return self;
};

/**
 * @param {Object} o
 * @return {boolean}
 * @private
 */
Dygraph.isArrayLike = function(o) {
  var typ = typeof(o);
  if (
      (typ != 'object' && !(typ == 'function' &&
        typeof(o.item) == 'function')) ||
      o === null ||
      typeof(o.length) != 'number' ||
      o.nodeType === 3
     ) {
    return false;
  }
  return true;
};

/**
 * @param {Object} o
 * @return {boolean}
 * @private
 */
Dygraph.isDateLike = function (o) {
  if (typeof(o) != "object" || o === null ||
      typeof(o.getTime) != 'function') {
    return false;
  }
  return true;
};

/**
 * Note: this only seems to work for arrays.
 * @param {!Array} o
 * @return {!Array}
 * @private
 */
Dygraph.clone = function(o) {
  // TODO(danvk): figure out how MochiKit's version works
  var r = [];
  for (var i = 0; i < o.length; i++) {
    if (Dygraph.isArrayLike(o[i])) {
      r.push(Dygraph.clone(o[i]));
    } else {
      r.push(o[i]);
    }
  }
  return r;
};

/**
 * Create a new canvas element. This is more complex than a simple
 * document.createElement("canvas") because of IE and excanvas.
 *
 * @return {!HTMLCanvasElement}
 * @private
 */
Dygraph.createCanvas = function() {
  var canvas = document.createElement("canvas");

  var isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);
  if (isIE && (typeof(G_vmlCanvasManager) != 'undefined')) {
    canvas = G_vmlCanvasManager.initElement(
        /**@type{!HTMLCanvasElement}*/(canvas));
  }

  return canvas;
};

/**
 * Checks whether the user is on an Android browser.
 * Android does not fully support the <canvas> tag, e.g. w/r/t/ clipping.
 * @return {boolean}
 * @private
 */
Dygraph.isAndroid = function() {
  return (/Android/).test(navigator.userAgent);
};


/**
 * TODO(danvk): use @template here when it's better supported for classes.
 * @param {!Array} array
 * @param {number} start
 * @param {number} length
 * @param {function(!Array,?):boolean=} predicate
 * @constructor
 */
Dygraph.Iterator = function(array, start, length, predicate) {
  start = start || 0;
  length = length || array.length;
  this.hasNext = true; // Use to identify if there's another element.
  this.peek = null; // Use for look-ahead
  this.start_ = start;
  this.array_ = array;
  this.predicate_ = predicate;
  this.end_ = Math.min(array.length, start + length);
  this.nextIdx_ = start - 1; // use -1 so initial advance works.
  this.next(); // ignoring result.
};

/**
 * @return {Object}
 */
Dygraph.Iterator.prototype.next = function() {
  if (!this.hasNext) {
    return null;
  }
  var obj = this.peek;

  var nextIdx = this.nextIdx_ + 1;
  var found = false;
  while (nextIdx < this.end_) {
    if (!this.predicate_ || this.predicate_(this.array_, nextIdx)) {
      this.peek = this.array_[nextIdx];
      found = true;
      break;
    }
    nextIdx++;
  }
  this.nextIdx_ = nextIdx;
  if (!found) {
    this.hasNext = false;
    this.peek = null;
  }
  return obj;
};

/**
 * Returns a new iterator over array, between indexes start and
 * start + length, and only returns entries that pass the accept function
 *
 * @param {!Array} array the array to iterate over.
 * @param {number} start the first index to iterate over, 0 if absent.
 * @param {number} length the number of elements in the array to iterate over.
 *     This, along with start, defines a slice of the array, and so length
 *     doesn't imply the number of elements in the iterator when accept doesn't
 *     always accept all values. array.length when absent.
 * @param {function(?):boolean=} opt_predicate a function that takes
 *     parameters array and idx, which returns true when the element should be
 *     returned.  If omitted, all elements are accepted.
 * @private
 */
Dygraph.createIterator = function(array, start, length, opt_predicate) {
  return new Dygraph.Iterator(array, start, length, opt_predicate);
};

// Shim layer with setTimeout fallback.
// From: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// Should be called with the window context:
//   Dygraph.requestAnimFrame.call(window, function() {})
Dygraph.requestAnimFrame = (function() {
  return window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function (callback) {
            window.setTimeout(callback, 1000 / 60);
          };
})();

/**
 * Call a function at most maxFrames times at an attempted interval of
 * framePeriodInMillis, then call a cleanup function once. repeatFn is called
 * once immediately, then at most (maxFrames - 1) times asynchronously. If
 * maxFrames==1, then cleanup_fn() is also called synchronously.  This function
 * is used to sequence animation.
 * @param {function(number)} repeatFn Called repeatedly -- takes the frame
 *     number (from 0 to maxFrames-1) as an argument.
 * @param {number} maxFrames The max number of times to call repeatFn
 * @param {number} framePeriodInMillis Max requested time between frames.
 * @param {function()} cleanupFn A function to call after all repeatFn calls.
 * @private
 */
Dygraph.repeatAndCleanup = function(repeatFn, maxFrames, framePeriodInMillis,
    cleanupFn) {
  var frameNumber = 0;
  var previousFrameNumber;
  var startTime = new Date().getTime();
  repeatFn(frameNumber);
  if (maxFrames == 1) {
    cleanupFn();
    return;
  }
  var maxFrameArg = maxFrames - 1;

  (function loop() {
    if (frameNumber >= maxFrames) return;
    Dygraph.requestAnimFrame.call(window, function() {
      // Determine which frame to draw based on the delay so far.  Will skip
      // frames if necessary.
      var currentTime = new Date().getTime();
      var delayInMillis = currentTime - startTime;
      previousFrameNumber = frameNumber;
      frameNumber = Math.floor(delayInMillis / framePeriodInMillis);
      var frameDelta = frameNumber - previousFrameNumber;
      // If we predict that the subsequent repeatFn call will overshoot our
      // total frame target, so our last call will cause a stutter, then jump to
      // the last call immediately.  If we're going to cause a stutter, better
      // to do it faster than slower.
      var predictOvershootStutter = (frameNumber + frameDelta) > maxFrameArg;
      if (predictOvershootStutter || (frameNumber >= maxFrameArg)) {
        repeatFn(maxFrameArg);  // Ensure final call with maxFrameArg.
        cleanupFn();
      } else {
        if (frameDelta !== 0) {  // Don't call repeatFn with duplicate frames.
          repeatFn(frameNumber);
        }
        loop();
      }
    });
  })();
};

/**
 * This function will scan the option list and determine if they
 * require us to recalculate the pixel positions of each point.
 * @param {!Array.<string>} labels a list of options to check.
 * @param {!Object} attrs
 * @return {boolean} true if the graph needs new points else false.
 * @private
 */
Dygraph.isPixelChangingOptionList = function(labels, attrs) {
  // A whitelist of options that do not change pixel positions.
  var pixelSafeOptions = {
    'annotationClickHandler': true,
    'annotationDblClickHandler': true,
    'annotationMouseOutHandler': true,
    'annotationMouseOverHandler': true,
    'axisLabelColor': true,
    'axisLineColor': true,
    'axisLineWidth': true,
    'clickCallback': true,
    'digitsAfterDecimal': true,
    'drawCallback': true,
    'drawHighlightPointCallback': true,
    'drawPoints': true,
    'drawPointCallback': true,
    'drawXGrid': true,
    'drawYGrid': true,
    'fillAlpha': true,
    'gridLineColor': true,
    'gridLineWidth': true,
    'hideOverlayOnMouseOut': true,
    'highlightCallback': true,
    'highlightCircleSize': true,
    'interactionModel': true,
    'isZoomedIgnoreProgrammaticZoom': true,
    'labelsDiv': true,
    'labelsDivStyles': true,
    'labelsDivWidth': true,
    'labelsKMB': true,
    'labelsKMG2': true,
    'labelsSeparateLines': true,
    'labelsShowZeroValues': true,
    'legend': true,
    'maxNumberWidth': true,
    'panEdgeFraction': true,
    'pixelsPerYLabel': true,
    'pointClickCallback': true,
    'pointSize': true,
    'rangeSelectorPlotFillColor': true,
    'rangeSelectorPlotStrokeColor': true,
    'showLabelsOnHighlight': true,
    'showRoller': true,
    'sigFigs': true,
    'strokeWidth': true,
    'underlayCallback': true,
    'unhighlightCallback': true,
    'xAxisLabelFormatter': true,
    'xTicker': true,
    'xValueFormatter': true,
    'yAxisLabelFormatter': true,
    'yValueFormatter': true,
    'zoomCallback': true
  };

  // Assume that we do not require new points.
  // This will change to true if we actually do need new points.
  var requiresNewPoints = false;

  // Create a dictionary of series names for faster lookup.
  // If there are no labels, then the dictionary stays empty.
  var seriesNamesDictionary = { };
  if (labels) {
    for (var i = 1; i < labels.length; i++) {
      seriesNamesDictionary[labels[i]] = true;
    }
  }

  // Iterate through the list of updated options.
  for (var property in attrs) {
    // Break early if we already know we need new points from a previous option.
    if (requiresNewPoints) {
      break;
    }
    if (attrs.hasOwnProperty(property)) {
      // Find out of this field is actually a series specific options list.
      if (seriesNamesDictionary[property]) {
        // This property value is a list of options for this series.
        // If any of these sub properties are not pixel safe, set the flag.
        for (var subProperty in attrs[property]) {
          // Break early if we already know we need new points from a previous option.
          if (requiresNewPoints) {
            break;
          }
          if (attrs[property].hasOwnProperty(subProperty) && !pixelSafeOptions[subProperty]) {
            requiresNewPoints = true;
          }
        }
      // If this was not a series specific option list, check if its a pixel changing property.
      } else if (!pixelSafeOptions[property]) {
        requiresNewPoints = true;
      }
    }
  }

  return requiresNewPoints;
};

/**
 * Compares two arrays to see if they are equal. If either parameter is not an
 * array it will return false. Does a shallow compare
 * Dygraph.compareArrays([[1,2], [3, 4]], [[1,2], [3,4]]) === false.
 * @param {!Array.<T>} array1 first array
 * @param {!Array.<T>} array2 second array
 * @return {boolean} True if both parameters are arrays, and contents are equal.
 * @template T
 */
Dygraph.compareArrays = function(array1, array2) {
  if (!Dygraph.isArrayLike(array1) || !Dygraph.isArrayLike(array2)) {
    return false;
  }
  if (array1.length !== array2.length) {
    return false;
  }
  for (var i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
};

/**
 * @param {!CanvasRenderingContext2D} ctx the canvas context
 * @param {number} sides the number of sides in the shape.
 * @param {number} radius the radius of the image.
 * @param {number} cx center x coordate
 * @param {number} cy center y coordinate
 * @param {number=} rotationRadians the shift of the initial angle, in radians.
 * @param {number=} delta the angle shift for each line. If missing, creates a
 *     regular polygon.
 * @private
 */
Dygraph.regularShape_ = function(
    ctx, sides, radius, cx, cy, rotationRadians, delta) {
  rotationRadians = rotationRadians || 0;
  delta = delta || Math.PI * 2 / sides;

  ctx.beginPath();
  var initialAngle = rotationRadians;
  var angle = initialAngle;

  var computeCoordinates = function() {
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
Dygraph.shapeFunction_ = function(sides, rotationRadians, delta) {
  return function(g, name, ctx, cx, cy, color, radius) {
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    Dygraph.regularShape_(ctx, sides, radius, cx, cy, rotationRadians, delta);
  };
};

Dygraph.Circles = {
  DEFAULT : function(g, name, ctx, canvasx, canvasy, color, radius) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(canvasx, canvasy, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  },
  TRIANGLE : Dygraph.shapeFunction_(3),
  SQUARE : Dygraph.shapeFunction_(4, Math.PI / 4),
  DIAMOND : Dygraph.shapeFunction_(4),
  PENTAGON : Dygraph.shapeFunction_(5),
  HEXAGON : Dygraph.shapeFunction_(6),
  CIRCLE : function(g, name, ctx, cx, cy, color, radius) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  },
  STAR : Dygraph.shapeFunction_(5, 0, 4 * Math.PI / 5),
  PLUS : function(g, name, ctx, cx, cy, color, radius) {
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
  EX : function(g, name, ctx, cx, cy, color, radius) {
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

/**
 * To create a "drag" interaction, you typically register a mousedown event
 * handler on the element where the drag begins. In that handler, you register a
 * mouseup handler on the window to determine when the mouse is released,
 * wherever that release happens. This works well, except when the user releases
 * the mouse over an off-domain iframe. In that case, the mouseup event is
 * handled by the iframe and never bubbles up to the window handler.
 *
 * To deal with this issue, we cover iframes with high z-index divs to make sure
 * they don't capture mouseup.
 *
 * Usage:
 * element.addEventListener('mousedown', function() {
 *   var tarper = new Dygraph.IFrameTarp();
 *   tarper.cover();
 *   var mouseUpHandler = function() {
 *     ...
 *     window.removeEventListener(mouseUpHandler);
 *     tarper.uncover();
 *   };
 *   window.addEventListener('mouseup', mouseUpHandler);
 * };
 *
 * @constructor
 */
Dygraph.IFrameTarp = function() {
  /** @type {Array.<!HTMLDivElement>} */
  this.tarps = [];
};

/**
 * Find all the iframes in the document and cover them with high z-index
 * transparent divs.
 */
Dygraph.IFrameTarp.prototype.cover = function() {
  var iframes = document.getElementsByTagName("iframe");
  for (var i = 0; i < iframes.length; i++) {
    var iframe = iframes[i];
    var x = Dygraph.findPosX(iframe),
        y = Dygraph.findPosY(iframe),
        width = iframe.offsetWidth,
        height = iframe.offsetHeight;

    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    div.style.zIndex = 999;
    document.body.appendChild(div);
    this.tarps.push(div);
  }
};

/**
 * Remove all the iframe covers. You should call this in a mouseup handler.
 */
Dygraph.IFrameTarp.prototype.uncover = function() {
  for (var i = 0; i < this.tarps.length; i++) {
    this.tarps[i].parentNode.removeChild(this.tarps[i]);
  }
  this.tarps = [];
};

/**
 * Determine whether |data| is delimited by CR, CRLF, LF, LFCR.
 * @param {string} data
 * @return {?string} the delimiter that was detected (or null on failure).
 */
Dygraph.detectLineDelimiter = function(data) {
  for (var i = 0; i < data.length; i++) {
    var code = data.charAt(i);
    if (code === '\r') {
      // Might actually be "\r\n".
      if (((i + 1) < data.length) && (data.charAt(i + 1) === '\n')) {
        return '\r\n';
      }
      return code;
    }
    if (code === '\n') {
      // Might actually be "\n\r".
      if (((i + 1) < data.length) && (data.charAt(i + 1) === '\r')) {
        return '\n\r';
      }
      return code;
    }
  }

  return null;
};

/**
 * Is one node contained by another?
 * @param {Node} containee The contained node.
 * @param {Node} container The container node.
 * @return {boolean} Whether containee is inside (or equal to) container.
 * @private
 */
Dygraph.isNodeContainedBy = function(containee, container) {
  if (container === null || containee === null) {
    return false;
  }
  var containeeNode = /** @type {Node} */ (containee);
  while (containeeNode && containeeNode !== container) {
    containeeNode = containeeNode.parentNode;
  }
  return (containeeNode === container);
};


// This masks some numeric issues in older versions of Firefox,
// where 1.0/Math.pow(10,2) != Math.pow(10,-2).
/** @type {function(number,number):number} */
Dygraph.pow = function(base, exp) {
  if (exp < 0) {
    return 1.0 / Math.pow(base, -exp);
  }
  return Math.pow(base, exp);
};

// For Dygraph.setDateSameTZ, below.
Dygraph.dateSetters = {
  ms: Date.prototype.setMilliseconds,
  s: Date.prototype.setSeconds,
  m: Date.prototype.setMinutes,
  h: Date.prototype.setHours
};

/**
 * This is like calling d.setSeconds(), d.setMinutes(), etc, except that it
 * adjusts for time zone changes to keep the date/time parts consistent.
 *
 * For example, d.getSeconds(), d.getMinutes() and d.getHours() will all be
 * the same before/after you call setDateSameTZ(d, {ms: 0}). The same is not
 * true if you call d.setMilliseconds(0).
 *
 * @type {function(!Date, Object.<number>)}
 */
Dygraph.setDateSameTZ = function(d, parts) {
  var tz = d.getTimezoneOffset();
  for (var k in parts) {
    if (!parts.hasOwnProperty(k)) continue;
    var setter = Dygraph.dateSetters[k];
    if (!setter) throw "Invalid setter: " + k;
    setter.call(d, parts[k]);
    if (d.getTimezoneOffset() != tz) {
      d.setTime(d.getTime() + (tz - d.getTimezoneOffset()) * 60 * 1000);
    }
  }
};
