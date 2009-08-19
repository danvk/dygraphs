#!/bin/bash
# Generates a single JS file that's easier to include.
# This packed JS includes a partial copy of MochiKit and PlotKit.

# Generate the packed version of the subset of PlotKit needed by dygraphs.
# This saves ~30k
cd plotkit_v091
./scripts/pack.py Base Layout Canvas > /tmp/plotkit-packed.js
cd ..

cat \
mochikit_v14/packed/MochiKit/MochiKit.js \
/tmp/plotkit-packed.js \
dygraph-canvas.js \
dygraph.js \
> dygraph-combined.js
