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

/*jshint sub:true */
/*global Dygraph:false */
"use strict";

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _dygraphUtils = require('./dygraph-utils');

var utils = _interopRequireWildcard(_dygraphUtils);

/** @typedef {Array.<{v:number, label:string, label_v:(string|undefined)}>} */
var TickList = undefined; // the ' = undefined' keeps jshint happy.

/** @typedef {function(
 *    number,
 *    number,
 *    number,
 *    function(string):*,
 *    Dygraph=,
 *    Array.<number>=
 *  ): TickList}
 */
var Ticker = undefined; // the ' = undefined' keeps jshint happy.

/** @type {Ticker} */
var numericLinearTicks = function numericLinearTicks(a, b, pixels, opts, dygraph, vals) {
  var nonLogscaleOpts = function nonLogscaleOpts(opt) {
    if (opt === 'logscale') return false;
    return opts(opt);
  };
  return numericTicks(a, b, pixels, nonLogscaleOpts, dygraph, vals);
};

exports.numericLinearTicks = numericLinearTicks;
/** @type {Ticker} */
var numericTicks = function numericTicks(a, b, pixels, opts, dygraph, vals) {
  var pixels_per_tick = /** @type{number} */opts('pixelsPerLabel');
  var ticks = [];
  var i, j, tickV, nTicks;
  if (vals) {
    for (i = 0; i < vals.length; i++) {
      ticks.push({ v: vals[i] });
    }
  } else {
    // TODO(danvk): factor this log-scale block out into a separate function.
    if (opts("logscale")) {
      nTicks = Math.floor(pixels / pixels_per_tick);
      var minIdx = utils.binarySearch(a, PREFERRED_LOG_TICK_VALUES, 1);
      var maxIdx = utils.binarySearch(b, PREFERRED_LOG_TICK_VALUES, -1);
      if (minIdx == -1) {
        minIdx = 0;
      }
      if (maxIdx == -1) {
        maxIdx = PREFERRED_LOG_TICK_VALUES.length - 1;
      }
      // Count the number of tick values would appear, if we can get at least
      // nTicks / 4 accept them.
      var lastDisplayed = null;
      if (maxIdx - minIdx >= nTicks / 4) {
        for (var idx = maxIdx; idx >= minIdx; idx--) {
          var tickValue = PREFERRED_LOG_TICK_VALUES[idx];
          var pixel_coord = Math.log(tickValue / a) / Math.log(b / a) * pixels;
          var tick = { v: tickValue };
          if (lastDisplayed === null) {
            lastDisplayed = {
              tickValue: tickValue,
              pixel_coord: pixel_coord
            };
          } else {
            if (Math.abs(pixel_coord - lastDisplayed.pixel_coord) >= pixels_per_tick) {
              lastDisplayed = {
                tickValue: tickValue,
                pixel_coord: pixel_coord
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
      for (i = 0; i <= nTicks; i++) {
        tickV = low_val + i * scale;
        ticks.push({ v: tickV });
      }
    }
  }

  var formatter = /**@type{AxisLabelFormatter}*/opts('axisLabelFormatter');

  // Add labels to the ticks.
  for (i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue; // Use current label.
    // TODO(danvk): set granularity to something appropriate here.
    ticks[i].label = formatter.call(dygraph, ticks[i].v, 0, opts, dygraph);
  }

  return ticks;
};

exports.numericTicks = numericTicks;
/** @type {Ticker} */
var dateTicker = function dateTicker(a, b, pixels, opts, dygraph, vals) {
  var chosen = pickDateTickGranularity(a, b, pixels, opts);

  if (chosen >= 0) {
    return getDateAxis(a, b, chosen, opts, dygraph);
  } else {
    // this can happen if self.width_ is zero.
    return [];
  }
};

exports.dateTicker = dateTicker;
// Time granularity enumeration
var Granularity = {
  MILLISECONDLY: 0,
  TWO_MILLISECONDLY: 1,
  FIVE_MILLISECONDLY: 2,
  TEN_MILLISECONDLY: 3,
  FIFTY_MILLISECONDLY: 4,
  HUNDRED_MILLISECONDLY: 5,
  FIVE_HUNDRED_MILLISECONDLY: 6,
  SECONDLY: 7,
  TWO_SECONDLY: 8,
  FIVE_SECONDLY: 9,
  TEN_SECONDLY: 10,
  THIRTY_SECONDLY: 11,
  MINUTELY: 12,
  TWO_MINUTELY: 13,
  FIVE_MINUTELY: 14,
  TEN_MINUTELY: 15,
  THIRTY_MINUTELY: 16,
  HOURLY: 17,
  TWO_HOURLY: 18,
  SIX_HOURLY: 19,
  DAILY: 20,
  TWO_DAILY: 21,
  WEEKLY: 22,
  MONTHLY: 23,
  QUARTERLY: 24,
  BIANNUAL: 25,
  ANNUAL: 26,
  DECADAL: 27,
  CENTENNIAL: 28,
  NUM_GRANULARITIES: 29
};

exports.Granularity = Granularity;
// Date components enumeration (in the order of the arguments in Date)
// TODO: make this an @enum
var DateField = {
  DATEFIELD_Y: 0,
  DATEFIELD_M: 1,
  DATEFIELD_D: 2,
  DATEFIELD_HH: 3,
  DATEFIELD_MM: 4,
  DATEFIELD_SS: 5,
  DATEFIELD_MS: 6,
  NUM_DATEFIELDS: 7
};

/**
 * The value of datefield will start at an even multiple of "step", i.e.
 *   if datefield=SS and step=5 then the first tick will be on a multiple of 5s.
 *
 * For granularities <= HOURLY, ticks are generated every `spacing` ms.
 *
 * At coarser granularities, ticks are generated by incrementing `datefield` by
 *   `step`. In this case, the `spacing` value is only used to estimate the
 *   number of ticks. It should roughly correspond to the spacing between
 *   adjacent ticks.
 *
 * @type {Array.<{datefield:number, step:number, spacing:number}>}
 */
var TICK_PLACEMENT = [];
TICK_PLACEMENT[Granularity.MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 1, spacing: 1 };
TICK_PLACEMENT[Granularity.TWO_MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 2, spacing: 2 };
TICK_PLACEMENT[Granularity.FIVE_MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 5, spacing: 5 };
TICK_PLACEMENT[Granularity.TEN_MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 10, spacing: 10 };
TICK_PLACEMENT[Granularity.FIFTY_MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 50, spacing: 50 };
TICK_PLACEMENT[Granularity.HUNDRED_MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 100, spacing: 100 };
TICK_PLACEMENT[Granularity.FIVE_HUNDRED_MILLISECONDLY] = { datefield: DateField.DATEFIELD_MS, step: 500, spacing: 500 };
TICK_PLACEMENT[Granularity.SECONDLY] = { datefield: DateField.DATEFIELD_SS, step: 1, spacing: 1000 * 1 };
TICK_PLACEMENT[Granularity.TWO_SECONDLY] = { datefield: DateField.DATEFIELD_SS, step: 2, spacing: 1000 * 2 };
TICK_PLACEMENT[Granularity.FIVE_SECONDLY] = { datefield: DateField.DATEFIELD_SS, step: 5, spacing: 1000 * 5 };
TICK_PLACEMENT[Granularity.TEN_SECONDLY] = { datefield: DateField.DATEFIELD_SS, step: 10, spacing: 1000 * 10 };
TICK_PLACEMENT[Granularity.THIRTY_SECONDLY] = { datefield: DateField.DATEFIELD_SS, step: 30, spacing: 1000 * 30 };
TICK_PLACEMENT[Granularity.MINUTELY] = { datefield: DateField.DATEFIELD_MM, step: 1, spacing: 1000 * 60 };
TICK_PLACEMENT[Granularity.TWO_MINUTELY] = { datefield: DateField.DATEFIELD_MM, step: 2, spacing: 1000 * 60 * 2 };
TICK_PLACEMENT[Granularity.FIVE_MINUTELY] = { datefield: DateField.DATEFIELD_MM, step: 5, spacing: 1000 * 60 * 5 };
TICK_PLACEMENT[Granularity.TEN_MINUTELY] = { datefield: DateField.DATEFIELD_MM, step: 10, spacing: 1000 * 60 * 10 };
TICK_PLACEMENT[Granularity.THIRTY_MINUTELY] = { datefield: DateField.DATEFIELD_MM, step: 30, spacing: 1000 * 60 * 30 };
TICK_PLACEMENT[Granularity.HOURLY] = { datefield: DateField.DATEFIELD_HH, step: 1, spacing: 1000 * 3600 };
TICK_PLACEMENT[Granularity.TWO_HOURLY] = { datefield: DateField.DATEFIELD_HH, step: 2, spacing: 1000 * 3600 * 2 };
TICK_PLACEMENT[Granularity.SIX_HOURLY] = { datefield: DateField.DATEFIELD_HH, step: 6, spacing: 1000 * 3600 * 6 };
TICK_PLACEMENT[Granularity.DAILY] = { datefield: DateField.DATEFIELD_D, step: 1, spacing: 1000 * 86400 };
TICK_PLACEMENT[Granularity.TWO_DAILY] = { datefield: DateField.DATEFIELD_D, step: 2, spacing: 1000 * 86400 * 2 };
TICK_PLACEMENT[Granularity.WEEKLY] = { datefield: DateField.DATEFIELD_D, step: 7, spacing: 1000 * 604800 };
TICK_PLACEMENT[Granularity.MONTHLY] = { datefield: DateField.DATEFIELD_M, step: 1, spacing: 1000 * 7200 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 / 12
TICK_PLACEMENT[Granularity.QUARTERLY] = { datefield: DateField.DATEFIELD_M, step: 3, spacing: 1000 * 21600 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 / 4
TICK_PLACEMENT[Granularity.BIANNUAL] = { datefield: DateField.DATEFIELD_M, step: 6, spacing: 1000 * 43200 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 / 2
TICK_PLACEMENT[Granularity.ANNUAL] = { datefield: DateField.DATEFIELD_Y, step: 1, spacing: 1000 * 86400 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 * 1
TICK_PLACEMENT[Granularity.DECADAL] = { datefield: DateField.DATEFIELD_Y, step: 10, spacing: 1000 * 864000 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 * 10
TICK_PLACEMENT[Granularity.CENTENNIAL] = { datefield: DateField.DATEFIELD_Y, step: 100, spacing: 1000 * 8640000 * 365.2524 }; // 1e3 * 60 * 60 * 24 * 365.2524 * 100

/**
 * This is a list of human-friendly values at which to show tick marks on a log
 * scale. It is k * 10^n, where k=1..9 and n=-39..+39, so:
 * ..., 1, 2, 3, 4, 5, ..., 9, 10, 20, 30, ..., 90, 100, 200, 300, ...
 * NOTE: this assumes that utils.LOG_SCALE = 10.
 * @type {Array.<number>}
 */
var PREFERRED_LOG_TICK_VALUES = (function () {
  var vals = [];
  for (var power = -39; power <= 39; power++) {
    var range = Math.pow(10, power);
    for (var mult = 1; mult <= 9; mult++) {
      var val = range * mult;
      vals.push(val);
    }
  }
  return vals;
})();

/**
 * Determine the correct granularity of ticks on a date axis.
 *
 * @param {number} a Left edge of the chart (ms)
 * @param {number} b Right edge of the chart (ms)
 * @param {number} pixels Size of the chart in the relevant dimension (width).
 * @param {function(string):*} opts Function mapping from option name -&gt; value.
 * @return {number} The appropriate axis granularity for this chart. See the
 *     enumeration of possible values in dygraph-tickers.js.
 */
var pickDateTickGranularity = function pickDateTickGranularity(a, b, pixels, opts) {
  var pixels_per_tick = /** @type{number} */opts('pixelsPerLabel');
  for (var i = 0; i < Granularity.NUM_GRANULARITIES; i++) {
    var num_ticks = numDateTicks(a, b, i);
    if (pixels / num_ticks >= pixels_per_tick) {
      return i;
    }
  }
  return -1;
};

/**
 * Compute the number of ticks on a date axis for a given granularity.
 * @param {number} start_time
 * @param {number} end_time
 * @param {number} granularity (one of the granularities enumerated above)
 * @return {number} (Approximate) number of ticks that would result.
 */
var numDateTicks = function numDateTicks(start_time, end_time, granularity) {
  var spacing = TICK_PLACEMENT[granularity].spacing;
  return Math.round(1.0 * (end_time - start_time) / spacing);
};

/**
 * Compute the positions and labels of ticks on a date axis for a given granularity.
 * @param {number} start_time
 * @param {number} end_time
 * @param {number} granularity (one of the granularities enumerated above)
 * @param {function(string):*} opts Function mapping from option name -&gt; value.
 * @param {Dygraph=} dg
 * @return {!TickList}
 */
var getDateAxis = function getDateAxis(start_time, end_time, granularity, opts, dg) {
  var formatter = /** @type{AxisLabelFormatter} */opts("axisLabelFormatter");
  var utc = opts("labelsUTC");
  var accessors = utc ? utils.DateAccessorsUTC : utils.DateAccessorsLocal;

  var datefield = TICK_PLACEMENT[granularity].datefield;
  var step = TICK_PLACEMENT[granularity].step;
  var spacing = TICK_PLACEMENT[granularity].spacing;

  // Choose a nice tick position before the initial instant.
  // Currently, this code deals properly with the existent daily granularities:
  // DAILY (with step of 1) and WEEKLY (with step of 7 but specially handled).
  // Other daily granularities (say TWO_DAILY) should also be handled specially
  // by setting the start_date_offset to 0.
  var start_date = new Date(start_time);
  var date_array = [];
  date_array[DateField.DATEFIELD_Y] = accessors.getFullYear(start_date);
  date_array[DateField.DATEFIELD_M] = accessors.getMonth(start_date);
  date_array[DateField.DATEFIELD_D] = accessors.getDate(start_date);
  date_array[DateField.DATEFIELD_HH] = accessors.getHours(start_date);
  date_array[DateField.DATEFIELD_MM] = accessors.getMinutes(start_date);
  date_array[DateField.DATEFIELD_SS] = accessors.getSeconds(start_date);
  date_array[DateField.DATEFIELD_MS] = accessors.getMilliseconds(start_date);

  var start_date_offset = date_array[datefield] % step;
  if (granularity == Granularity.WEEKLY) {
    // This will put the ticks on Sundays.
    start_date_offset = accessors.getDay(start_date);
  }

  date_array[datefield] -= start_date_offset;
  for (var df = datefield + 1; df < DateField.NUM_DATEFIELDS; df++) {
    // The minimum value is 1 for the day of month, and 0 for all other fields.
    date_array[df] = df === DateField.DATEFIELD_D ? 1 : 0;
  }

  // Generate the ticks.
  // For granularities not coarser than HOURLY we use the fact that:
  //   the number of milliseconds between ticks is constant
  //   and equal to the defined spacing.
  // Otherwise we rely on the 'roll over' property of the Date functions:
  //   when some date field is set to a value outside of its logical range,
  //   the excess 'rolls over' the next (more significant) field.
  // However, when using local time with DST transitions,
  // there are dates that do not represent any time value at all
  // (those in the hour skipped at the 'spring forward'),
  // and the JavaScript engines usually return an equivalent value.
  // Hence we have to check that the date is properly increased at each step,
  // returning a date at a nice tick position.
  var ticks = [];
  var tick_date = accessors.makeDate.apply(null, date_array);
  var tick_time = tick_date.getTime();
  if (granularity <= Granularity.HOURLY) {
    if (tick_time < start_time) {
      tick_time += spacing;
      tick_date = new Date(tick_time);
    }
    while (tick_time <= end_time) {
      ticks.push({ v: tick_time,
        label: formatter.call(dg, tick_date, granularity, opts, dg)
      });
      tick_time += spacing;
      tick_date = new Date(tick_time);
    }
  } else {
    if (tick_time < start_time) {
      date_array[datefield] += step;
      tick_date = accessors.makeDate.apply(null, date_array);
      tick_time = tick_date.getTime();
    }
    while (tick_time <= end_time) {
      if (granularity >= Granularity.DAILY || accessors.getHours(tick_date) % step === 0) {
        ticks.push({ v: tick_time,
          label: formatter.call(dg, tick_date, granularity, opts, dg)
        });
      }
      date_array[datefield] += step;
      tick_date = accessors.makeDate.apply(null, date_array);
      tick_time = tick_date.getTime();
    }
  }
  return ticks;
};
exports.getDateAxis = getDateAxis;