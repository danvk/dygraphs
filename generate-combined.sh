#!/bin/bash
# Generates a single JS file that's easier to include.

# Pack all the JS together.

# This list needs to be kept in sync w/ the one in dygraph-dev.js
cat \
dygraph-layout.js \
dygraph-canvas.js \
dygraph.js \
dygraph-gviz.js \
rgbcolor/rgbcolor.js \
strftime/strftime-min.js \
| perl -ne 'print unless m,REMOVE_FOR_COMBINED,..m,/REMOVE_FOR_COMBINED,' \
> /tmp/dygraph.js

java -jar yuicompressor-2.4.2.jar /tmp/dygraph.js \
> /tmp/dygraph-packed.js

# TODO(danvk): ensure the dygraphs copyright, etc. gets into the packed js.

cat \
/tmp/dygraph-packed.js \
> dygraph-combined.js
