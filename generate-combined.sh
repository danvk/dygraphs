#!/bin/bash
# Generates a single JS file that's easier to include.
# This packed JS includes a partial copy of MochiKit and PlotKit.
# It winds up being 146k uncompressed and 37k gzipped.

# Do the same for MochiKit. This save another 77k.
cd mochikit_v14
./scripts/pack.py \
Base DOM Style Color Signal \
> /tmp/mochikit-packed.js
cd ..

# Pack the dygraphs JS. This saves another 22k.
cat \
dygraph-canvas.js \
dygraph.js \
> /tmp/dygraph.js

java -jar custom_rhino.jar -c /tmp/dygraph.js \
> /tmp/dygraph-packed.js

# TODO(danvk): ensure the dygraphs copyright, etc. gets into the packed js.

cat \
/tmp/mochikit-packed.js \
strftime/strftime-min.js \
/tmp/dygraph-packed.js \
> dygraph-combined.js
