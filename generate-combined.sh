#!/bin/bash
# Generates a single JS file that's easier to include.
# This packed JS includes a partial copy of MochiKit and PlotKit.
# It winds up being 146k uncompressed and 37k gzipped.

# Generate the packed version of the subset of PlotKit needed by dygraphs.
# This saves ~30k
cd plotkit_v091
./scripts/pack.py Base Layout Canvas > /tmp/plotkit-packed.js
cd ..

# Do the same for MochiKit. This save another 77k.
cd mochikit_v14
./scripts/pack.py \
Base Iter DOM Style Color Signal \
> /tmp/mochikit-packed.js
cd ..

# Pack the dygraphs JS. This saves another 22k.
cat \
dygraph-canvas.js \
dygraph.js \
> /tmp/dygraph.js

java -jar plotkit_v091/scripts/custom_rhino.jar -c /tmp/dygraph.js \
> /tmp/dygraph-packed.js

cat \
/tmp/mochikit-packed.js \
/tmp/plotkit-packed.js \
/tmp/dygraph-packed.js \
> dygraph-combined.js
