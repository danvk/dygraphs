#!/bin/bash
# Generates a single JS file that's easier to include.

# Pack all the JS together.

# This list needs to be kept in sync w/ the one in dygraph-dev.js
# and the one in jsTestDriver.conf.
cat \
dygraph-layout.js \
dygraph-canvas.js \
dygraph.js \
dygraph-utils.js \
dygraph-gviz.js \
dygraph-interaction-model.js \
dygraph-range-selector.js \
dygraph-tickers.js \
rgbcolor/rgbcolor.js \
strftime/strftime-min.js \
plugins/base.js \
plugins/legend.js \
plugins/chart-labels \
plugins/install.js \
| perl -ne 'print unless m,REMOVE_FOR_COMBINED,..m,/REMOVE_FOR_COMBINED,' \
> /tmp/dygraph.js

java -jar yuicompressor-2.4.2.jar /tmp/dygraph.js \
> /tmp/dygraph-packed.js

(
  echo '/*! @license Copyright 2011 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */'
  cat /tmp/dygraph-packed.js
) > dygraph-combined.js
chmod a+r dygraph-combined.js
