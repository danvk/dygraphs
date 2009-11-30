#!/bin/bash
# Generates a single JS file that's easier to include.

# Pack up just the bits of MochiKit that we need.
cd mochikit_v14
./scripts/pack.py \
Base \
> /tmp/mochikit-packed.js
cd ..

# Pack the dygraphs JS and rgbcolor
cat \
dygraph-canvas.js \
dygraph.js \
rgbcolor/rgbcolor.js \
> /tmp/dygraph.js

java -jar custom_rhino.jar -c /tmp/dygraph.js \
> /tmp/dygraph-packed.js

# TODO(danvk): ensure the dygraphs copyright, etc. gets into the packed js.

cat \
/tmp/mochikit-packed.js \
strftime/strftime-min.js \
/tmp/dygraph-packed.js \
> dygraph-combined.js
