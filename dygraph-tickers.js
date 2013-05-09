/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview Description of this file.
 * @author danvk@google.com (Dan Vanderkam)
 *
 * A ticker is a function with the following interface:
 *
 * function(a, b, pixels, options_view, dygraph, forced_values);
 * -> [ { v: tick1_v, label: tick1_label[, label_v: label_v1] },
 *      { v: tick2_v, label: tick2_label[, label_v: label_v2] },
 *      ...
 *    ]
 *
 * The returned value is called a "tick list".
 *
 * Arguments
 * ---------
 *
 * [a, b] is the range of the axis for which ticks are being generated. For a
 * numeric axis, these will simply be numbers. For a date axis, these will be
 * millis since epoch (convertable to Date objects using "new Date(a)" and "new
 * Date(b)").
 *
 * opts provides access to chart- and axis-specific options. It can be used to
 * access number/date formatting code/options, check for a log scale, etc.
 *
 * pixels is the length of the axis in pixels. opts('pixelsPerLabel') is the
 * minimum amount of space to be allotted to each label. For instance, if
 * pixels=400 and opts('pixelsPerLabel')=40 then the ticker should return
 * between zero and ten (400/40) ticks.
 *
 * dygraph is the Dygraph object for which an axis is being constructed.
 *
 * forced_values is used for secondary y-axes. The tick positions are typically
 * set by the primary y-axis, so the secondary y-axis has no choice in where to
 * put these. It simply has to generate labels for these data values.
 *
 * Tick lists
 * ----------
 * Typically a tick will have both a grid/tick line and a label at one end of
 * that line (at the bottom for an x-axis, at left or right for the y-axis).
 *
 * A tick may be missing one of these two components:
 * - If "label_v" is specified instead of "v", then there will be no tick or
 *   gridline, just a label.
 * - Similarly, if "label" is not specified, then there will be a gridline
 *   without a label.
 *
 * This flexibility is useful in a few situations:
 * - For log scales, some of the tick lines may be too close to all have labels.
 * - For date scales where years are being displayed, it is desirable to display
 *   tick marks at the beginnings of years but labels (e.g. "2006") in the
 *   middle of the years.
 */

/*jshint globalstrict:true, sub:true */
/*global Dygraph:false */
"use strict";

/** @typedef {Array.<{v:number, label:string, label_v:(string|undefined)}>} */
Dygraph.TickList = undefined;  // the ' = undefined' keeps jshint happy.

/** @typedef {function(
 *    number,
 *    number,
 *    number,
 *    function(string):*,
 *    Dygraph=,
 *    Array.<number>=
 *  ): Dygraph.TickList}
 */
Dygraph.Ticker = undefined;  // the ' = undefined' keeps jshint happy.

/** @type {Dygraph.Ticker} */
Dygraph.numericLinearTicks = function(a, b, pixels, opts, dygraph, vals) {
  var nonLogscaleOpts = function(opt) {
    if (opt === 'logscale') return false;
    return opts(opt);
  };
  return Dygraph.numericTicks(a, b, pixels, nonLogscaleOpts, dygraph, vals);
};

/** @type {Dygraph.Ticker} */
Dygraph.numericTicks = function(a, b, pixels, opts, dygraph, vals) {
  var pixels_per_tick = /** @type{number} */(opts('pixelsPerLabel'));
  var ticks = [];
  var i, j, tickV, nTicks;
  if (vals) {
    for (i = 0; i < vals.length; i++) {
      ticks.push({v: vals[i]});
    }
  } else {
    // TODO(danvk): factor this log-scale block out into a separate function.
    if (opts("logscale")) {
      nTicks  = Math.floor(pixels / pixels_per_tick);
      var minIdx = Dygraph.binarySearch(a, Dygraph.PREFERRED_LOG_TICK_VALUES, 1);
      var maxIdx = Dygraph.binarySearch(b, Dygraph.PREFERRED_LOG_TICK_VALUES, -1);
      if (minIdx == -1) {
        minIdx = 0;
      }
      if (maxIdx == -1) {
        maxIdx = Dygraph.PREFERRED_LOG_TICK_VALUES.length - 1;
      }
      // Count the number of tick values would appear, if we can get at least
      // nTicks / 4 accept them.
      var lastDisplayed = null;
      if (maxIdx - minIdx >= nTicks / 4) {
        for (var idx = maxIdx; idx >= minIdx; idx--) {
          var tickValue = Dygraph.PREFERRED_LOG_TICK_VALUES[idx];
          var pixel_coord = Math.log(tickValue / a) / Math.log(b / a) * pixels;
          var tick = { v: tickValue };
          if (lastDisplayed === null) {
            lastDisplayed = {
              tickValue : tickValue,
              pixel_coord : pixel_coord
            };
          } else {
            if (Math.abs(pixel_coord - lastDisplayed.pixel_coord) >= pixels_per_tick) {
              lastDisplayed = {
                tickValue : tickValue,
                pixel_coord : pixel_coord
              };
            } else {
              tick.label = "";
            }
          }
          ticks.push(tick);
        }
        // Since we went in backwards order.
        ticks.reverse();
      }
    }

    // ticks.length won't be 0 if the log scale function finds values to insert.
    if (ticks.length === 0) {
      // Basic idea:
      // Try labels every 1, 2, 5, 10, 20, 50, 100, etc.
      // Calculate the resulting tick spacing (i.e. this.height_ / nTicks).
      // The first spacing greater than pixelsPerYLabel is what we use.
      // TODO(danvk): version that works on a log scale.
      var kmg2 = opts("labelsKMG2");
      var mults, base;
      if (kmg2) {
        mults = [1, 2, 4, 8, 16, 32, 64, 128, 256];
        base = 16;
      } else {
        mults = [1, 2, 5, 10, 20, 50, 100];
        base = 10;
      }

      // Get the maximum number of permitted ticks based on the
      // graph's pixel size and pixels_per_tick setting.
      var max_ticks = Math.ceil(pixels / pixels_per_tick);

      // Now calculate the data unit equivalent of this tick spacing.
      // Use abs() since graphs may have a reversed Y axis.
      var units_per_tick = Math.abs(b - a) / max_ticks;

      // Based on this, get a starting scale which is the largest
      // integer power of the chosen base (10 or 16) that still remains
      // below the requested pixels_per_tick spacing.
      var base_power = Math.floor(Math.log(units_per_tick) / Math.log(base));
      var base_scale = Math.pow(base, base_power);

      // Now try multiples of the starting scale until we find one
      // that results in tick marks spaced sufficiently far apart.
      // The "mults" array should cover the range 1 .. base^2 to
      // adjust for rounding and edge effects.
      var scale, low_val, high_val, spacing;
      for (j = 0; j < mults.length; j++) {
        scale = base_scale * mults[j];
        low_val = Math.floor(a / scale) * scale;
        high_val = Math.ceil(b / scale) * scale;
        nTicks = Math.abs(high_val - low_val) / scale;
        spacing = pixels / nTicks;
        if (spacing > pixels_per_tick) break;
      }

      // Construct the set of ticks.
      // Allow reverse y-axis if it's explicitly requested.
      if (low_val > high_val) scale *= -1;
      for (i = 0; i < nTicks; i++) {
        tickV = low_val + i * scale;
        ticks.push( {v: tickV} );
      }
    }
  }

  var formatter = /**@type{AxisLabelFormatter}*/(opts('axisLabelFormatter'));

  // Add labels to the ticks.
  for (i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue;  // Use current label.
    // TODO(danvk): set granularity to something appropriate here.
    ticks[i].label = formatter(ticks[i].v, 0, opts, dygraph);
  }

  return ticks;
};


/** @type {Dygraph.Ticker} */
Dygraph.dateTicker = function(a, b, pixels, opts, dygraph, vals) {
  var chosen = Dygraph.pickDateTickGranularity(a, b, pixels, opts);

  if (chosen >= 0) {
    return Dygraph.getDateAxis(a, b, chosen, opts, dygraph);
  } else {
    // this can happen if self.width_ is zero.
    return [];
  }
};

// Time granularity enumeration
// TODO(danvk): make this an @enum
Dygraph.SECONDLY = 0;
Dygraph.TWO_SECONDLY = 1;
Dygraph.FIVE_SECONDLY = 2;
Dygraph.TEN_SECONDLY = 3;
Dygraph.THIRTY_SECONDLY  = 4;
Dygraph.MINUTELY = 5;
Dygraph.TWO_MINUTELY = 6;
Dygraph.FIVE_MINUTELY = 7;
Dygraph.TEN_MINUTELY = 8;
Dygraph.THIRTY_MINUTELY = 9;
Dygraph.HOURLY = 10;
Dygraph.TWO_HOURLY = 11;
Dygraph.SIX_HOURLY = 12;
Dygraph.DAILY = 13;
Dygraph.WEEKLY = 14;
Dygraph.MONTHLY = 15;
Dygraph.QUARTERLY = 16;
Dygraph.BIANNUAL = 17;
Dygraph.ANNUAL = 18;
Dygraph.DECADAL = 19;
Dygraph.CENTENNIAL = 20;
Dygraph.NUM_GRANULARITIES = 21;

/** @type {Array.<number>} */
Dygraph.SHORT_SPACINGS = [];
Dygraph.SHORT_SPACINGS[Dygraph.SECONDLY]        = 1000 * 1;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_SECONDLY]    = 1000 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.FIVE_SECONDLY]   = 1000 * 5;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_SECONDLY]    = 1000 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_SECONDLY] = 1000 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.MINUTELY]        = 1000 * 60;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_MINUTELY]    = 1000 * 60 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.FIVE_MINUTELY]   = 1000 * 60 * 5;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_MINUTELY]    = 1000 * 60 * 10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_MINUTELY] = 1000 * 60 * 30;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]          = 1000 * 3600;
Dygraph.SHORT_SPACINGS[Dygraph.TWO_HOURLY]      = 1000 * 3600 * 2;
Dygraph.SHORT_SPACINGS[Dygraph.SIX_HOURLY]      = 1000 * 3600 * 6;
Dygraph.SHORT_SPACINGS[Dygraph.DAILY]           = 1000 * 86400;
Dygraph.SHORT_SPACINGS[Dygraph.WEEKLY]          = 1000 * 604800;

/** 
 * A collection of objects specifying where it is acceptable to place tick
 * marks for granularities larger than WEEKLY.  
 * 'months' is an array of month indexes on which to place tick marks.
 * 'year_mod' ticks are placed when year % year_mod = 0.
 * @type {Array.<Object>} 
 */
Dygraph.LONG_TICK_PLACEMENTS = [];
Dygraph.LONG_TICK_PLACEMENTS[Dygraph.MONTHLY] = {
  months : [0,1,2,3,4,5,6,7,8,9,10,11], 
  year_mod : 1
};
Dygraph.LONG_TICK_PLACEMENTS[Dygraph.QUARTERLY] = {
  months: [0,3,6,9], 
  year_mod: 1
};
Dygraph.LONG_TICK_PLACEMENTS[Dygraph.BIANNUAL] = {
  months: [0,6], 
  year_mod: 1
};
Dygraph.LONG_TICK_PLACEMENTS[Dygraph.ANNUAL] = {
  months: [0], 
  year_mod: 1
};
Dygraph.LONG_TICK_PLACEMENTS[Dygraph.DECADAL] = {
  months: [0], 
  year_mod: 10
};
Dygraph.LONG_TICK_PLACEMENTS[Dygraph.CENTENNIAL] = {
  months: [0], 
  year_mod: 100
};

/**
 * This is a list of human-friendly values at which to show tick marks on a log
 * scale. It is k * 10^n, where k=1..9 and n=-39..+39, so:
 * ..., 1, 2, 3, 4, 5, ..., 9, 10, 20, 30, ..., 90, 100, 200, 300, ...
 * NOTE: this assumes that Dygraph.LOG_SCALE = 10.
 * @type {Array.<number>}
 */
Dygraph.PREFERRED_LOG_TICK_VALUES = function() {
  var vals = [];
  for (var power = -39; power <= 39; power++) {
    var range = Math.pow(10, power);
    for (var mult = 1; mult <= 9; mult++) {
      var val = range * mult;
      vals.push(val);
    }
  }
  return vals;
}();

/**
 * Determine the correct granularity of ticks on a date axis.
 *
 * @param {number} a Left edge of the chart (ms)
 * @param {number} b Right edge of the chart (ms)
 * @param {number} pixels Size of the chart in the relevant dimension (width).
 * @param {function(string):*} opts Function mapping from option name ->
 *     value.
 * @return {number} The appropriate axis granularity for this chart. See the
 *     enumeration of possible values in dygraph-tickers.js.
 */
Dygraph.pickDateTickGranularity = function(a, b, pixels, opts) {
  var pixels_per_tick = /** @type{number} */(opts('pixelsPerLabel'));
  for (var i = 0; i < Dygraph.NUM_GRANULARITIES; i++) {
    var num_ticks = Dygraph.numDateTicks(a, b, i);
    if (pixels / num_ticks >= pixels_per_tick) {
      return i;
    }
  }
  return -1;
};

/**
 * @param {number} start_time
 * @param {number} end_time
 * @param {number} granularity (one of the granularities enumerated above)
 * @return {number} Number of ticks that would result.
 */
Dygraph.numDateTicks = function(start_time, end_time, granularity) {
  if (granularity < Dygraph.MONTHLY) {
    // Generate one tick mark for every fixed interval of time.
    var spacing = Dygraph.SHORT_SPACINGS[granularity];
    return Math.floor(0.5 + 1.0 * (end_time - start_time) / spacing);
  } else {
    var tickPlacement = Dygraph.LONG_TICK_PLACEMENTS[granularity];

    var msInYear = 365.2524 * 24 * 3600 * 1000;
    var num_years = 1.0 * (end_time - start_time) / msInYear;
    return Math.floor(0.5 + 1.0 * num_years * tickPlacement.months.length / tickPlacement.year_mod);
  }
};

/**
 * @param {number} start_time
 * @param {number} end_time
 * @param {number} granularity (one of the granularities enumerated above)
 * @param {function(string):*} opts Function mapping from option name -&gt; value.
 * @param {Dygraph=} dg
 * @return {!Dygraph.TickList}
 */
Dygraph.getDateAxis = function(start_time, end_time, granularity, opts, dg) {
  var formatter = /** @type{AxisLabelFormatter} */(
      opts("axisLabelFormatter"));
  var ticks = [];
  var t;

  if (granularity < Dygraph.MONTHLY) {
    // Generate one tick mark for every fixed interval of time.
    var spacing = Dygraph.SHORT_SPACINGS[granularity];

    // Find a time less than start_time which occurs on a "nice" time boundary
    // for this granularity.
    var g = spacing / 1000;
    var d = new Date(start_time);
    Dygraph.setDateSameTZ(d, {ms: 0});

    var x;
    if (g <= 60) {  // seconds
      x = d.getSeconds();
      Dygraph.setDateSameTZ(d, {s: x - x % g});
    } else {
      Dygraph.setDateSameTZ(d, {s: 0});
      g /= 60;
      if (g <= 60) {  // minutes
        x = d.getMinutes();
        Dygraph.setDateSameTZ(d, {m: x - x % g});
      } else {
        Dygraph.setDateSameTZ(d, {m: 0});
        g /= 60;

        if (g <= 24) {  // days
          x = d.getHours();
          d.setHours(x - x % g);
        } else {
          d.setHours(0);
          g /= 24;

          if (g == 7) {  // one week
            d.setDate(d.getDate() - d.getDay());
          }
        }
      }
    }
    start_time = d.getTime();

    // For spacings coarser than two-hourly, we want to ignore daylight
    // savings transitions to get consistent ticks. For finer-grained ticks,
    // it's essential to show the DST transition in all its messiness.
    var start_offset_min = new Date(start_time).getTimezoneOffset();
    var check_dst = (spacing >= Dygraph.SHORT_SPACINGS[Dygraph.TWO_HOURLY]);

    for (t = start_time; t <= end_time; t += spacing) {
      d = new Date(t);

      // This ensures that we stay on the same hourly "rhythm" across
      // daylight savings transitions. Without this, the ticks could get off
      // by an hour. See tests/daylight-savings.html or issue 147.
      if (check_dst && d.getTimezoneOffset() != start_offset_min) {
        var delta_min = d.getTimezoneOffset() - start_offset_min;
        t += delta_min * 60 * 1000;
        d = new Date(t);
        start_offset_min = d.getTimezoneOffset();

        // Check whether we've backed into the previous timezone again.
        // This can happen during a "spring forward" transition. In this case,
        // it's best to skip this tick altogether (we may be shooting for a
        // non-existent time like the 2AM that's skipped) and go to the next
        // one.
        if (new Date(t + spacing).getTimezoneOffset() != start_offset_min) {
          t += spacing;
          d = new Date(t);
          start_offset_min = d.getTimezoneOffset();
        }
      }

      ticks.push({ v:t,
                   label: formatter(d, granularity, opts, dg)
                 });
    }
  } else {
    // Display a tick mark on the first of a set of months of each year.
    // Years get a tick mark iff y % year_mod == 0. This is useful for
    // displaying a tick mark once every 10 years, say, on long time scales.
    var months;
    var year_mod = 1;  // e.g. to only print one point every 10 years.

    if (granularity < Dygraph.NUM_GRANULARITIES) {
      months = Dygraph.LONG_TICK_PLACEMENTS[granularity].months;
      year_mod = Dygraph.LONG_TICK_PLACEMENTS[granularity].year_mod;
    } else {
      Dygraph.warn("Span of dates is too long");
    }

    var start_year = new Date(start_time).getFullYear();
    var end_year   = new Date(end_time).getFullYear();
    var zeropad = Dygraph.zeropad;
    for (var i = start_year; i <= end_year; i++) {
      if (i % year_mod !== 0) continue;
      for (var j = 0; j < months.length; j++) {
        var date_str = i + "/" + zeropad(1 + months[j]) + "/01";
        t = Dygraph.dateStrToMillis(date_str);
        if (t < start_time || t > end_time) continue;
        ticks.push({ v:t,
                     label: formatter(new Date(t), granularity, opts, dg)
                   });
      }
    }
  }

  return ticks;
};

// These are set here so that this file can be included after dygraph.js
// or independently.
if (Dygraph &&
    Dygraph.DEFAULT_ATTRS &&
    Dygraph.DEFAULT_ATTRS['axes'] &&
    Dygraph.DEFAULT_ATTRS['axes']['x'] &&
    Dygraph.DEFAULT_ATTRS['axes']['y'] &&
    Dygraph.DEFAULT_ATTRS['axes']['y2']) {
  Dygraph.DEFAULT_ATTRS['axes']['x']['ticker'] = Dygraph.dateTicker;
  Dygraph.DEFAULT_ATTRS['axes']['y']['ticker'] = Dygraph.numericTicks;
  Dygraph.DEFAULT_ATTRS['axes']['y2']['ticker'] = Dygraph.numericTicks;
}
