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

  var source_files = ['dygraph/plugins/annotations.js','dygraph/plugins/axes.js','dygraph/plugins/chart-labels.js','dygraph/plugins/grid.js','dygraph/plugins/legend.js','dygraph/plugins/range-selector.js','dygraph/dygraph-plugin-install.js','dygraphs/dygraph-options-reference.js','dygraphs/datahandler/datahandler.js','dygraphs/datahandler/default.js','dygraphs/datahandler/default-fractions.js','dygraphs/datahandler/bars.js','dygraphs/datahandler/bars-error.js','dygraphs/datahandler/bars-custom.js','dygraphs/datahandler/bars-fractions.js'];


  for (var i = 0; i < source_files.length; i++) {
    document.write('<script type="text/javascript" src="' + script.replace('dygraph-dev.js', source_files[i]) + '"></script>\n');
  }
})();
