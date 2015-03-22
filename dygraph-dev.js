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
    "src/polyfills/console.js",
    "src/polyfills/dashed-canvas.js",
    "src/dygraph-options.js",
    "src/dygraph-layout.js",
    "src/dygraph-canvas.js",
    "src/dygraph.js",
    "src/dygraph-utils.js",
    "src/dygraph-gviz.js",
    "src/dygraph-interaction-model.js",
    "src/dygraph-tickers.js",
    "src/dygraph-plugin-base.js",
    "src/plugins/annotations.js",
    "src/plugins/axes.js",
    "src/plugins/chart-labels.js",
    "src/plugins/grid.js",
    "src/plugins/legend.js",
    "src/plugins/range-selector.js",
    "src/dygraph-plugin-install.js",
    "src/dygraph-options-reference.js",  // Shouldn't be included in generate-combined.sh
    "src/datahandler/datahandler.js",
    "src/datahandler/default.js",
    "src/datahandler/default-fractions.js",
    "src/datahandler/bars.js",
    "src/datahandler/bars-error.js",
    "src/datahandler/bars-custom.js",
    "src/datahandler/bars-fractions.js"
  ];

  for (var i = 0; i < source_files.length; i++) {
    document.write('<script type="text/javascript" src="' + script.replace('dygraph-dev.js', source_files[i]) + '"></script>\n');
  }
})();
