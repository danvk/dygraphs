// A dygraph "auto-loader".

// Check where this script was sourced from. If it was sourced from
// '../dygraph-dev.js', then we should source all the other scripts with the
// same relative path ('../dygraph.js', '../dygraph-canvas.js', ...)
(function() {
  var src=document.getElementsByTagName('script');
  var script = src[src.length-1].getAttribute("src");
  var m = /^(.*)\/[^/]*\.js$/.exec(script);
  if (!m) {
    console.error("Can't grok dygraph-dev.js path: " + script);
  } else {
    var path = m[1];  // captured group, not the full match.

    // This list needs to be kept in sync w/ the one in generate-combined.sh
    // and the one in jsTestDriver.conf.
    var source_files = [
      "strftime/strftime-min.js",
      "rgbcolor/rgbcolor.js",
      "dygraph-layout.js",
      "dygraph-canvas.js",
      "dygraph.js",
      "dygraph-utils.js",
      "dygraph-gviz.js",
      "dygraph-interaction-model.js",
      "dygraph-options-reference.js"  // Shouldn't be included in generate-combined.sh
    ];

    for (var i = 0; i < source_files.length; i++) {
      document.write('<script type="text/javascript" src="' + path + '/' + source_files[i] + '"></script>\n');
    }
  }
})();
