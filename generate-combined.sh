#!/bin/bash
# Generates a single JS file that's easier to include.
# This packed JS includes a partial copy of MochiKit and PlotKit.

# Generate the packed version of the subset of PlotKit needed by dygraphs.
# This saves ~30k
cd plotkit_v091
./scripts/pack.py Base Layout Canvas > /tmp/plotkit-packed.js
cd ..

# Do the same for MochiKit. This save ~90k.
cd mochikit_v14
./scripts/pack.py \
Base Iter Format DOM Style Color Signal \
> /tmp/mochikit-packed.js
cd ..

cat \
/tmp/mochikit-packed.js \
/tmp/plotkit-packed.js \
dygraph-canvas.js \
dygraph.js \
> dygraph-combined.js
