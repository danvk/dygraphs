#!/bin/bash
mkdir -p dist

browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  > dist/dygraph.js

# Create dist/dygraph.js.map
cat dist/dygraph.js | exorcist --base . dist/dygraph.js.map > /dev/null

# Create dist/dygraph.js.min{,.map}
uglifyjs --compress --mangle \
  --in-source-map dist/dygraph.js.map \
  --source-map-include-sources \
  --source-map dist/dygraph.min.js.map \
  -o dist/dygraph.min.js \
  dist/dygraph.js

# Copy to the old location
cp dist/dygraph.min.js dist/dygraph-combined.js
