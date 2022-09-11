#!/bin/bash
#
# Generates JSDoc in the /jsdoc dir. Clears any existing jsdoc there.

rm -rf jsdoc
echo Generating JSDoc...
srcfiles=src/dygraph.js
#srcfiles+=\ src/iframe-tarp.js
srcfiles+=\ src/dygraph-canvas.js
srcfiles+=\ src/dygraph-default-attrs.js
srcfiles+=\ src/dygraph-gviz.js
srcfiles+=\ src/dygraph-interaction-model.js
srcfiles+=\ src/dygraph-internal.externs.js
srcfiles+=\ src/dygraph-layout.js
srcfiles+=\ src/dygraph-options-reference.js
srcfiles+=\ src/dygraph-options.js
srcfiles+=\ src/dygraph-plugin-install.js
srcfiles+=\ src/dygraph-tickers.js
srcfiles+=\ src/dygraph-types.js
#srcfiles+=\ src/dygraph-utils.js
#srcfiles+=\ src/datahandler/datahandler.js
#srcfiles+=\ src/datahandler/default-fractions.js
#srcfiles+=\ src/datahandler/default.js
#srcfiles+=\ src/datahandler/bars.js
#srcfiles+=\ src/datahandler/bars-custom.js
#srcfiles+=\ src/datahandler/bars-error.js
#srcfiles+=\ src/datahandler/bars-fractions.js
srcfiles+=\ src/plugins/annotations.js
srcfiles+=\ src/plugins/axes.js
srcfiles+=\ src/plugins/chart-labels.js
srcfiles+=\ src/plugins/grid.js
#srcfiles+=\ src/plugins/legend.js
#srcfiles+=\ src/plugins/range-selector.js
#srcfiles+=\ src/extras/crosshair.js
#srcfiles+=\ src/extras/hairlines.js
#srcfiles+=\ src/extras/rebase.js
srcfiles+=\ src/extras/shapes.js
srcfiles+=\ src/extras/smooth-plotter.js
#srcfiles+=\ src/extras/super-annotations.js
srcfiles+=\ src/extras/synchronizer.js
#srcfiles+=\ src/extras/unzoom.js
jsdoc \
  -d=jsdoc \
  $srcfiles \
2>&1 | tee /tmp/dygraphs-jsdocerrors.txt

ed -s /tmp/dygraphs-jsdocerrors.txt <<-\EOF
	1g/java .*jsrun.jar/d
	w
	q
EOF

if [ -s /tmp/dygraphs-jsdocerrors.txt ]; then
  echo Please fix any jsdoc errors/warnings
  exit 1
fi

chmod -R a+rX jsdoc

echo Done
