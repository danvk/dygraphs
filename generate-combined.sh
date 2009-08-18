#!/bin/bash
# Generates a single JS file that's easier to include.
# This packed JS includes a partial copy of MochiKit and PlotKit.
cat \
mochikit_v14/packed/MochiKit/MochiKit.js \
plotkit_v091/PlotKit/PlotKit_Packed.js \
dygraph-canvas.js \
dygraph.js \
> dygraph-combined.js
