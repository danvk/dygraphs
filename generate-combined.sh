#!/bin/bash
# Generates a single JS file that's easier to include.

# Pack the dygraphs JS and rgbcolor
cat \
dygraph-canvas.js \
dygraph.js \
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
