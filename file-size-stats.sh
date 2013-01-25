#!/bin/bash

# Reports compressed file sizes for each JS file in dygraphs.

# This list needs to be kept in sync w/ the one in dygraph-dev.js
# and the one in jsTestDriver.conf.
for file in \
dygraph-layout.js \
dygraph-canvas.js \
dygraph.js \
dygraph-utils.js \
dygraph-gviz.js \
dygraph-interaction-model.js \
dygraph-tickers.js \
rgbcolor/rgbcolor.js \
strftime/strftime-min.js \
dashed-canvas.js \
dygraph-plugin-base.js \
plugins/annotations.js \
plugins/axes.js \
plugins/range-selector.js \
plugins/chart-labels.js \
plugins/grid.js \
plugins/legend.js \
dygraph-plugin-install.js \
; do
  base_size=$(cat $file | wc -c)
  cat $file \
    | perl -ne 'print unless m,REMOVE_FOR_COMBINED,..m,/REMOVE_FOR_COMBINED,' \
    > /tmp/dygraph.js
  min_size=$(java -jar yuicompressor-2.4.2.jar /tmp/dygraph.js | gzip -c | wc -c)

  echo "$min_size ($base_size) $file"
done
