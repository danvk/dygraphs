// Copyright 2010 Google Inc. All Rights Reserved.

mittens = {};

mittens.log = function(txt) {
  if (console) console.log(txt);
};

// Determines if an object (e.g. {}) is empty.
mittens.isEmpty = function(obj) {
  // this iterates over the keys in the object.
  // non-empty objects will have a key, whereas empty objects will not.
  for (var i in obj) return false;
  return true;
};

// Returns an array of all values for a particular URL parameter.
mittens.urlParamsForKey = function(key) {
  var ret = [];
  var url_parts = window.location.search.substr(1).split("&");
  for (var i = 0; i < url_parts.length; i++) {
    var parts = url_parts[i].split("=");
    if (parts[0] == key) ret.push(parts[1]);
  }
  return ret;
};

/**
 * Utilities for converting a TimeSeriesSet json object into several
 * different formats used by the charting libraries. A place list is
 * supplied for converting the place ids in the series_set into human
 * readable names.
 *
 * @author mmohebbi@google.com
 * @constructor
 */
mittens.ChartData = function(series_set, place_list) {
  this.importTimeSeriesSet_(series_set);
  this.place_info_ = new mittens.PlaceInfo(place_list);
};

/**
 * Converts a series_set (a set of timeseries, one for each event
 * name) into the following member variables.
 *
 * this.data: date -> place_id -> name -> value
 * this.dates: sorted list of dates in the data
 * this.place_ids: sorted list of places in the data
 * this.names: sorted list of names in the data
 */
mittens.ChartData.prototype.importTimeSeriesSet_ = function(series_set) {
  this.data = {};

  // all dates, places, and names encountered in the series_set
  var dates = {};
  var place_ids = {};
  var names = {};

  for (var i = 0; i < series_set['series'].length; i++) {
    var name = series_set['series'][i]['name'];
    names[name] = true;

    for (var j = 0; j < series_set['series'][i]['point'].length; j++) {
      var point = series_set['series'][i]['point'][j];
      var date = point['date'];
      var place_id = point['place_id'];

      if (!(date in this.data)) {
        this.data[date] = {};
        dates[date] = true;
      }

      if (!(place_id in this.data[date])) {
        this.data[date][place_id] = {};
        place_ids[place_id] = true;
      }

      this.data[date][place_id][name] = point['value'];
    }
  }

  this.dates = [];
  for (var date in dates) {
    this.dates.push(date);
  }
  this.dates.sort();

  this.place_ids = [];
  for (var place_id in place_ids) {
    this.place_ids.push(place_id);
  }
  this.place_ids.sort();

  this.names = [];
  for (var name in names) {
    this.names.push(name);
  }
};

/**
 * Returns the chart data value for the given (name, place, date)
 * tuple. Returns the default_value otherwise.
 */
mittens.ChartData.prototype.getValue = function(name, place_id, date, default_value) {
  if (date in this.data &&
      place_id in this.data[date] &&
      name in this.data[date][place_id]) {
    return this.data[date][place_id][name];
  } else {
    return default_value;
  }
};

/**
 * Returns a label for the given name, place_id, and date. If a
 * dimension has just one element, it is not included in the
 * label. Names, however, are always included in the label. If an
 * argument is undefined, it is not included in the label. Examples:
 *
 *   With all dims length > 1
 *
 *     getLabel("foo", 13441, undefined) -> "foo 13441"
 *     getLabel("foo", undefined, "2003-01-01") -> "foo 2003-01-01"
 *
 *   With place_id dim == 1 and all other dims > 1
 *
 *     getLabel("foo", 13441, undefined) -> "foo"
 *     getLabel("foo", undefined, "2003-01-01") -> "foo 2003-01-01"
 */
mittens.ChartData.prototype.getLabel = function(name, place_id, date) {
  var label = "";
  if (name != undefined) {
    label += name;
  }
  if (this.place_ids.length != 1 && place_id != undefined) {
    var place_name = this.place_info_.getName(place_id);
    if (label) {
      label += " ";
    }
    label += place_name;
  }
  if (this.dates.length != 1 && date != undefined) {
    if (label) {
      label += " ";
    }
    label += date;
  }
  return label;
};

/**
 * Returns a Google Visualization DataTable for all of the chart data
 * suitable for timeseries visualations. Each column is a (timeseries
 * name, place_id) tuple.
 */
mittens.ChartData.prototype.getDataTable = function() {
  var datatable_json = {};

  // HEADERS
  var cols = datatable_json["cols"] = [];
  cols.push({id: 'date', label: 'Date', type: 'date'});

  for (var i = 0; i < this.place_ids.length; i++) {
    var place_id = this.place_ids[i];
    for (var j = 0; j < this.names.length; j++) {
      var name = this.names[j];
      var label = this.getLabel(name, place_id, undefined);
      cols.push({label: label, type: 'number'});
    }
  }

  // DATA
  var rows = datatable_json["rows"] = [];
  for (var i = 0; i < this.dates.length; i++) {
    var date = this.dates[i];

    // NOTE: In Chrome, "new Date" accepts dates in "YYYY-MM-DD" format, but
    // this fails in Safari. Both accept "YYYY/MM/DD", so we use that format.
    var row = {};
    row.c = [];
    row.c.push({v: new Date(date.replace(/-/g, '/'))});

    for (var j = 0; j < this.place_ids.length; j++) {
      var place_id = this.place_ids[j];
      for (var k = 0; k < this.names.length; k++) {
        var name = this.names[k];
        var value = this.getValue(name, place_id, date, undefined);
        row.c.push({v: value});
      }
    }
    rows.push(row);
  }
  return new google.visualization.DataTable(datatable_json);
};

/**
 * Returns a Google Visualization DataTable for all of the chart data
 * suitable for state geomap visualation. Each column is an
 * event. Each row is a place. Date dimention size must be 1.
 */
mittens.ChartData.prototype.getStateDataTable = function() {
  if (this.dates.length != 1) {
    mittens.log("getStateDataTable require one time slice, got " +
                this.dates.length);
    return null;
  }
  var date = this.dates[0];

  var datatable_json = {};

  // HEADERS
  var cols = datatable_json["cols"] = [];
  cols.push({label: 'State', type: 'string'});
  for (var i = 0; i < this.names.length; i++) {
    var name = this.names[i];
    cols.push({label: name, type: 'number'});
  }

  // DATA
  var rows = datatable_json["rows"] = [];
  for (var i = 0; i < this.place_ids.length; i++) {
    var place_id = this.place_ids[i];
    var place_name = this.place_info_.getName(place_id);

    var row = {};
    row.c = [];
    row.c.push({v: place_name});

    for (var j = 0; j < this.names.length; j++) {
      var name = this.names[j];
      var value = this.getValue(name, place_id, date, undefined);
      var formatted = value;
      if (value) {
        if (value.toString().length > 5) {
          formatted = value.toPrecision(4);
        }
      } else {
        formatted = 'undefined';
      }
      row.c.push({v: value, f: formatted});
    }
    rows.push(row);
  }
  return new google.visualization.DataTable(datatable_json);
};

/**
 * Returns all the chart data in the protovis json format. Must have
 * exactly two time series in the timeseries set else null is
 * returned. Example:
 *
 *   [{label: "2008-01-01", x: 437.843263, y: 622.847459, z: 10.0},
 *    {label: "2008-01-07", x:  37.843263, y:  22.847459, z: 10.0}];
 */
mittens.ChartData.prototype.getProtovisJson = function() {
  if (this.names.length != 2) {
    mittens.log("getProtovisJson requires two series, got " +
                this.names.length);
    return null;
  }

  var protovis_json = [];
  for (var i = 0; i < this.dates.length; i++) {
    var date = this.dates[i];
    for (var j = 0; j < this.place_ids.length; j++) {
      var place_id = this.place_ids[j];
      var p = {};
      // Don't include the name in the label as each point on the
      // scatter plot is for two names, one on the X-axis and one on
      // the Y-axis.
      p.label = this.getLabel(undefined, place_id, date);
      p.x = this.getValue(this.names[0], place_id, date, 0.0);
      p.y = this.getValue(this.names[1], place_id, date, 0.0);
      p.z = 10;
      protovis_json.push(p);
    }
  }
  return protovis_json;
};

/**
 * Converts place_ids to place names. The place list should be a
 * vector of place objects each of which should contain a place_id and
 * name.
 *
 * @author mmohebbi@google.com
 * @constructor
 */
mittens.PlaceInfo = function(place_list) {
  this.place_id_to_name_ = {};
  for (var i = 0; i < place_list['place'].length; i++) {
    var p = place_list['place'][i];
    this.place_id_to_name_[p['place_id']] = p['name'];
  }
};

/**
 * Returns a human readable name for a given place_id or undefined
 * otherwise.
 */
mittens.PlaceInfo.prototype.getName = function(place_id) {
  return this.place_id_to_name_[place_id];
};

/**
 * Resizes a DOM element. el may be either a string ID or a DOM
 * object. dims should have a 'w' and/or 'h' property, which specify
 * the width/height in pixels.
 */
function setSize(el, dims) {
  if (el.indexOf) {
    // if it's a string, get the dom element.
    el = document.getElementById(el);
  }

  if (dims.hasOwnProperty('w')) {
    el.style.width = dims.w + 'px';
  }
  if (dims.hasOwnProperty('h')) {
    el.style.height = dims.h + 'px';
  }
}

/**
 * Draws the chart type indicated by id by calling the appropriate
 * helper function. chart_data should be a ChartData object containing
 * the data to display. Dims should be a suggested dimension object,
 * with a w and h field.
 */
function drawChart(id, chart_data, dims) {
  if (id == "line") {
    drawLineChart("mittens-" + id, chart_data, dims);
  } else if (id == "scatter") {
    drawScatterChart("mittens-" + id, chart_data, dims);
  } else if (id == "table") {
    drawTable("mittens-" + id, chart_data, dims);
  } else if (id == "state-geomap") {
    drawStateGeoMap("mittens-" + id, chart_data);
  }
}

/**
 * Draws the chart type indicated by the id. Ensures that this chart
 * is visiable and all other charts are hidden. chart_data should be a
 * ChartData object containing the data to display.
 */
function displayChart(id, chart_data, dims) {
  var chart = document.getElementById("mittens-" + id);
  if (!chart.drawn) {
    // only draw the chart if we haven't drawn it yet
    drawChart(id, chart_data, dims);
  }
  chart.drawn = true;

  // Disable any other charts
  var els = document.getElementsByClassName("chart");
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (el.id != id) {
      el.style.display = "none";
    }
  }

  // Enable this chart
  chart.style.display = "block";
}

/**
 * Draws a scatter chart using the protovis library with the div id as
 * the canvas. chart_data should be a ChartData object containing the
 * data to display. The color/size of each circle comes from the z
 * value which is currently fixed at 10.
 *
 * TODO(mmohebbi): Make better use of the z value.
 */
function drawScatterChart(id, chart_data, dims) {
  var json = chart_data.getProtovisJson();

  // Select a range for the axes that includes all our data but goes 10% beyond
  // on either axis. This prevents points from being very close to the edge. If
  // adding 10% pushes us past zero, then we use zero for the edge instead.
  var max_x = 0.0;
  var max_y = 0.0;
  var min_x = Infinity;
  var min_y = Infinity;

  for (var i = 0; i < json.length; i++) {
    max_x = Math.max(max_x, json[i].x);
    max_y = Math.max(max_y, json[i].y);
    min_x = Math.min(min_x, json[i].x);
    min_y = Math.min(min_y, json[i].y);
  }

  var x_range = (max_x - min_x);
  var y_range = (max_y - min_y);
  if (min_x >= 0.0 && min_x < 0.1 * x_range) {
    min_x = 0.0;
  } else {
    min_x -= 0.1 * x_range;
  }
  max_x += 0.1 * x_range;
  if (min_y >= 0.0 && min_y < 0.1 * y_range) {
    min_y = 0.0;
  } else {
    min_y -= 0.1 * y_range;
  }
  max_y += 0.1 * y_range;

  // Calculate a linear regression: y = ax + b
  var sum_xy = 0.0, sum_x = 0.0, sum_y = 0.0, sum_x2 = 0.0, num = 0;
  for (var i = 0; i < json.length; i++) {
    var x = json[i].x;
    var y = json[i].y;

    num++;
    sum_x += x;
    sum_y += y;
    sum_xy += x * y;
    sum_x2 += x * x;
  }

  var a = (sum_xy - sum_x * sum_y / num) / (sum_x2 - sum_x * sum_x / num);
  var b = (sum_y - a * sum_x) / num;

  // The code block below comes from the protovis scatter example
  //   http://vis.stanford.edu/protovis/ex/dot.html

  /* Sizing and scales. 20px padding to avoid a scrollbar. */
  var x = pv.Scale.linear(min_x, max_x).range(0, dims.w - 20),
      y = pv.Scale.linear(min_y, max_y).range(0, dims.h - 20),
      c = pv.Scale.log(1, 100).range("orange", "brown");

  // This is the inverse of the "x" linear scale, above.
  var inverse_x = pv.Scale.linear(0, dims.w - 20).range(min_x, max_x);

  // Size the container div.
  setSize(id, dims);

  /* The root panel. */
  var vis = new pv.Panel()
      .canvas(id)
      .width(dims.w - 20)
      .height(dims.h - 20)
      .bottom(20)
      .left(20)
      .right(10)
      .top(5);

  /* Y-axis and ticks. */
  vis.add(pv.Rule)
      .data(y.ticks())
      .bottom(y)
      .strokeStyle(function(d) { return d ? "#eee" : "#000" })
      .anchor("left").add(pv.Label)
      .left(20)
      .visible(function(d) { return d > 0 && d < max_y })
      .text(y.tickFormat);

  /* X-axis and ticks. */
  vis.add(pv.Rule)
      .data(x.ticks())
      .left(x)
      .strokeStyle(function(d) { return d ? "#eee" : "#000" })
      .add(pv.Label)
      .bottom(20)
      .visible(function(d) { return d > 0 && d < max_x })
      .textAlign("center")
      .text(x.tickFormat);

  /* The dot plot! */
  vis.add(pv.Panel)
      .data(json)
      .add(pv.Dot)
      .left(function(d) { return x(d.x) })
      .bottom(function(d) { return y(d.y) })
      .strokeStyle(function(d) { return c(d.z) })
      .fillStyle(function() { return this.strokeStyle().alpha(.2) })
      .size(function(d) { return d.z })
      .title(function(d) { return d.label + ": (" + d.x.toPrecision(4) +
              ", " + d.y.toPrecision(4) + ")" });

  // Regression line
  vis.add(pv.Line)
      .strokeStyle(function(d) { return c(10.0) })
      .lineWidth(1)
      .data([20, dims.w - 40])
      .left(function(pixels_x) {
        return pixels_x;
      })
      .bottom(function(pixels_x) {
        return y(a * inverse_x(pixels_x) + b);
      });

  // The x-axis label
  vis.add(pv.Label)
      .left(dims.w / 2)
      .bottom(0)
      .textAlign("center")
      .font("20px sans-serif")
      .text(chart_data.names[0]);

  // The y-axis label
  vis.add(pv.Label)
      .left(0)
      .top(dims.h / 2)
      .textAngle(-Math.PI / 2)
      .font("20px sans-serif")
      .text(chart_data.names[1]);

  vis.render();
}

/**
 * Draws a line chart using the dygraphs library with the div id as
 * the canvas. chart_data should be a ChartData object containing the
 * data to display.
 */
function drawLineChart(id, chart_data, dims) {
  var datatable = chart_data.getDataTable();

  var opts = {
    labelsKMB: true,
    includeZero: true,
    width: dims.w,
    height: dims.h,
    labelsSeparateLines: (chart_data.names.length > 1)
  };

  var chart = document.getElementById(id);
  setSize(chart, dims);
  var g = new Dygraph.GVizChart(chart);
  g.draw(datatable, opts);
}

/**
 * "Draws" a table of the data using the gviz table module.
 */
function drawTable(id, chart_data, dims) {
  var datatable;
  if (chartTypeForData(chart_data) == 'state-geomap') {
    datatable = chart_data.getStateDataTable();
  } else {
    datatable = chart_data.getDataTable();
  }

  var opts = {
    showRowNumber: false
  };

  // We let gviz size the table for us.
  var g = new google.visualization.Table(document.getElementById(id));
  g.draw(datatable, opts);
}

/**
 * Draws a US State GeoMap using the Google Visualization Library with
 * the div id as the canvas. chart_data should be a ChartData object
 * containing the data to display.
 */
function drawStateGeoMap(id, chart_data) {
  var data = chart_data.getStateDataTable();
  var dims = getChartSize();

  var opts = {
    region: 'US',
    width: dims.w / 2 - 10,
    height: dims.h,
    showLegend: false,
  };

  var chart = document.getElementById(id);
  setSize(chart, dims);

  var view_a = new google.visualization.DataView(data);
  view_a.setColumns([0, 1]);
  var map_a =
      new google.visualization.GeoMap(document.getElementById(id + "-a"));
  map_a.draw(view_a, opts);
  var num_maps = 1;

  var view_b = null, map_b = null;
  if (chart_data.names.length == 2) {
    view_b = new google.visualization.DataView(data);
    view_b.setColumns([0, 2]);
    map_b = new google.visualization.GeoMap(document.getElementById(id + "-b"));
    map_b.draw(view_b, opts);
    num_maps += 1;
  }

  // Super gross hack. The visualization API adds a child div to the
  // parent div supplied when creating the map. This is bad as we want
  // it to be a span so that we can have two maps side-by-side on the
  // page. We modify these child divs after drawing is done so that
  // the display style is inline. However, in order for the page to
  // redraw to take this change into account we have to set the
  // display style of the parent div to none and then once both
  // drawing calls are finished AND the child divs have the correct
  // display style, we switch back the parent div's display style
  // which causes the browser to redraw.
  chart.style.display = "none";
  var num_draws = 0;

  var f = function(child_id) {
    document.getElementById(child_id).style.display = "inline";
    num_draws++;
    if (num_draws == num_maps) {
      setTimeout(function() {
          document.getElementById(id).style.display = "";
        }, 0);
    }
  };

  google.visualization.events.addListener(
      map_a, 'drawingDone', function() { f("google-visualization-geomap-0"); });

  if (map_b) {
    google.visualization.events.addListener(
        map_b, 'drawingDone', function() { f("google-visualization-geomap-1"); });
  }
}

/**
 * Helper function which determines a good height/width for the chart.
 * We want a large chart with a fixed aspect ratio.  This code is
 * taken from the geohistory server.
 */
function getChartSize() {
  var width = (window.innerWidth - 20);
  var height = (window.innerHeight - 60);  // leave room for menu bar.
  var aspectRatio = 1.0 * width / height;
  var correctRatio = 8.0 / 5.0; if (aspectRatio < correctRatio) {
    // it's too tall: reduce the height.
    height = width / correctRatio;
  } else if (aspectRatio > correctRatio) {
    // it's too wide: reduce the width.
    width = correctRatio * height;
  } else {
    // just right!
  }

  return { "w": width, "h": height };
}

/**
 * Given the ChartData, return a good visualization type for it. This
 * type can be passed in to drawChart.
 */
function chartTypeForData(cd) {
  if (cd.dates.length == 1) {
    return "state-geomap";
  } else {
    return "line";
  }
}

/**
 * Called when a user selects a new vertical using the dropdown.
 */
function handleVerticalSelect(selectField) {
  var selectedIndex = selectField.selectedIndex;
  var selectedValue = selectField.options[selectedIndex].value;

  var tables = document.getElementsByClassName("result-table");
  for (var table_i = 0; table_i < tables.length; table_i++) {
    var table = tables[table_i];
    for (var row_i = 0; row_i < table.rows.length; row_i++) {
      var row = table.rows[row_i];
      if (!row.getAttribute) {
        continue;
      }
      var verticals = row.getAttribute("data-verticals");
      if (verticals == null) {
        continue;
      } else {
        if (verticals.indexOf("(" + selectedValue + ")") != -1) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      }
    }
  }
}

/**
 * Called when a user selects a new time slice using the dropdown.
 */
function handleTimeSliceSelect(place_list) {
  var time_slice = -1;
  var time_select = document.getElementById("time-slice");
  for (var i = 0; i < time_select.options.length; i++) {
    if (time_select.options[i].selected) {
      time_slice = parseInt(time_select.options[i].value, 0);
    }
  }

  var place_select = document.getElementById("place-id");
  var places = place_list.place;
  var places_for_time = [];
  var place_ids_for_time = {};
  for (var i = 0; i < places.length; i++) {
    for (var j = 0; j < places[i].time_slice.length; j++) {
      if (places[i].time_slice[j] == time_slice) {
        places_for_time.push(places[i]);
        place_ids_for_time[places[i].place_id] = true;
      }
    }
  }

  var place_ids_to_select = {};
  // parse the place_ids params in the URL
  var place_ids = mittens.urlParamsForKey("place_id");
  for (var i = 0; i < place_ids.length; i++) {
    var place_id = place_ids[i];
    if (place_id in place_ids_for_time) {
      place_ids_to_select[place_ids[i]] = true;
    }
  }

  // AGGREGATE's default is all places (nothing selected). All other
  // places use the place_id param(s) if set to a valid place for the
  // tss or default to the United States.
  if (mittens.isEmpty(place_ids_to_select) && time_slice != 0) {
    place_ids_to_select[13441] = true;
  }

  place_select.options.length = 0;  // clear existing options.
  var n = 0;
  for (var i = 0; i < places_for_time.length; i++) {
    if (!("name" in places_for_time[i])) continue;  // skip place_ids w/o names.
    var selected = (places_for_time[i].place_id in place_ids_to_select);
    place_select.options[n++] = new Option(places_for_time[i].name,
                                           places_for_time[i].place_id,
                                           false,
                                           selected);
  }
}

/**
 * Update the URL hash, as given by the input map. our output hash
 * format is #maptype,pagenumber.  This could change!
 **/
function updateHash(h) {
  if (h['maptype'] == 'default' && h['num_results'] == 10) {
    window.location.hash = '';
  } else {
    var hash_string = h['maptype'] + ',' + h['num_results'];
    window.location.hash = hash_string;
  }
}

/**
 * Parses a window.location.hash, as updated by updateHash above. Returns a map.
 **/
function parseHash() {
  var hash = {'maptype': 'default', 'num_results': 10};
  if (window.location.hash) {
    var hash_string = window.location.hash;
    hash_string = hash_string.substring(1);
    var parts = hash_string.split(',');
    if (parts.length == 2) {
      hash['maptype'] = parts[0];
      hash['num_results'] = parseInt(parts[1]);
    }
  }
  return hash;
}

/**
 * Add a hash to the given link: Called from either result list or
 * model. Intended to be an onclick handler. Sets the link target's
 * URL hash to be the current page's.
 **/
function addHash(link) {
  var current_hash = link['href'].search('#');
  // if there's already a hash, we remove it first.
  if (current_hash != -1) {
    link['href'] = link['href'].substring(0, current_hash);
  }
  if (window.location.href.search('filter=') != -1 &&
      link['href'].search('filter=') == -1) {
    var filter_loc = window.location.href.search('filter=');

    var filter_val = window.location.href.substring(filter_loc, filter_loc + 8);
    link['href'] += '&' + filter_val;
  }
  if (window.location.hash) {
    link['href'] += window.location.hash;
  }
  return true;  // required to allow the link to proceed.
}

/**
 * Called on page load and when a user selects a different visualization
 */
// TODO(mmohebbi): Make this a member var of a class
// types that have already been drawn
var drawn = {};
function handleVisChange(cd, type) {
  var types = ['line', 'state-geomap', 'scatter'];
  for (var i = 0; i < types.length; i++) {
    document.getElementById(types[i]).style.display = 'none';
    document.getElementById(types[i] + '-toggle-on').style.display = 'none';
    document.getElementById(types[i] + '-toggle-off').style.display = 'none';
  }

  var hash = parseHash();
  var type_for_data = chartTypeForData(cd);
  if (type == type_for_data) {
    hash['maptype'] = 'default';
  } else {
    hash['maptype'] = type;
  }
  updateHash(hash);

  document.getElementById(type).style.display = 'inline';
  if (type == 'line') {
    document.getElementById('line-toggle-on').style.display = '';
    document.getElementById('scatter-toggle-off').style.display = '';
  } else if (type == 'state-geomap') {
    document.getElementById('state-geomap-toggle-on').style.display = '';
    document.getElementById('scatter-toggle-off').style.display = '';
  } else {
    // scatter
    document.getElementById('scatter-toggle-on').style.display = '';
    var type_for_data = chartTypeForData(cd);
    document.getElementById(type_for_data + '-toggle-off').style.display = '';
  }

  if (drawn[type]) {
    return;
  }
  drawn[type] = true;

  if (type == 'line') {
    // Create a dygraph displaying two data series.
    var opts = {
      labelsKMB: true,
      includeZero: true,
      width: 670,
      height: 350,
      labelsDiv: 'line-legend',
      labelsSeparateLines: false,
      xAxisLabelFormatter: function(d, g) {
        if (g == Dygraph.ANNUAL) {
          return d.getFullYear();
        } else {
          return Dygraph.dateAxisFormatter(d, g);
        }
      },
      labelsDivStyles: {
        'text-size': '13px',
      },
      // XXX This param is not documented in the dygraphs docs
      axisLabelFontSize: 13,
    };

    var g = new Dygraph.GVizChart(document.getElementById(type + '-chart'));
    g.draw(cd.getDataTable(), opts);

  } else if (type == 'state-geomap') {
    // HACK while we support both versions of our frontend
    getChartSize = function() {
      return { 'w': 700, 'h': 200};
    }
    drawStateGeoMap(type, cd);

  } else {
    drawScatterChart(type, cd, {w: 670, h: 350});
  }
}

function handleCSVDownload() {
  var events = [];
  function appendEvents(results) {
    for (var result_i = 0; result_i < results.length; result_i++) {
      var result = results[result_i];
      if (result.style.display != "none") {
        events.push(result.getAttribute("event"));
      }
    }
  }
  appendEvents(document.getElementsByClassName("result-positive"));
  appendEvents(document.getElementsByClassName("result-negative"));

  // clone the form so if the user requests the download more than
  // once, we don't repeat queries
  var form = $('.csv-download-form').clone()[0];

  for (var i = 0; i < events.length; i++) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = "e";
    input.value = events[i];
    form.appendChild(input);
  }

  form.submit();
}

/**
 * Asynchronously send feedback to the mittens server for logging.
 */
function sendFeedback(feedback) {
  var content = "url=" + escape(document.location) +
      "&feedback=" + escape(feedback);
  $.ajax({
    type: "POST",
    url: "/feedback",
    data: content,
    success: function(msg) {
      // might potentially want to display something here.
    }
  });
}

// "export" a few types.
ChartData = mittens.ChartData;
PlaceInfo = mittens.PlaceInfo;
