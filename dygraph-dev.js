/**
 * @license
 * Copyright 2011 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

// A dygraph "auto-loader".

// Check where this script was sourced from. If it was sourced from
// '../dygraph-dev.js', then we should source all the other scripts with the
// same relative path ('../dygraph.js', '../dygraph-canvas.js', ...)
(function() {
  var src=document.getElementsByTagName('script');
  var script = src[src.length-1].getAttribute("src");

  // This list needs to be kept in sync w/ the one in generate-combined.sh
  // and the one in jsTestDriver.conf.
  var source_files = [
    "strftime/strftime-min.js",
    "rgbcolor/rgbcolor.js",
    "stacktrace.js",
    "dashed-canvas.js",
    "dygraph-layout.js",
    "dygraph-canvas.js",
    "dygraph.js",
    "dygraph-utils.js",
    "dygraph-gviz.js",
    "dygraph-interaction-model.js",
    "dygraph-range-selector.js",
    "dygraph-tickers.js",
    "plugins/base.js",
    "plugins/annotations.js",
    "plugins/axes.js",
    "plugins/chart-labels.js",
    "plugins/grid.js",
    "plugins/legend.js",
    "plugins/install.js",
    "dygraph-options-reference.js"  // Shouldn't be included in generate-combined.sh
  ];

  for (var i = 0; i < source_files.length; i++) {
    document.write('<script type="text/javascript" src="' + script.replace('dygraph-dev.js', source_files[i]) + '"></script>\n');
  }
})();
