#!/bin/bash
# This generates:
# - dist/dygraph.js
# - dist/dygraph.js.map
# - dist/dygraph.min.js
# - dist/dygraph.min.js.map
set -o errexit

mkdir -p dist

# Create dist/dygraph.js
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  > dist/dygraph.tmp.js

# Create dist/dygraph.js.map
cat dist/dygraph.tmp.js | exorcist --base . dist/dygraph.js.map > dist/dygraph.js

# Create "production" bundle for minification
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  > dist/dygraph.tmp.js

# Create dist/dygraph.tmp.js.map
cat dist/dygraph.tmp.js | exorcist --base . dist/dygraph.tmp.js.map > /dev/null

header='/*! @license Copyright 2017 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */'

# Create dist/dygraph.js.min{,.map}
uglifyjs --compress --mangle \
  --preamble "$header" \
  --in-source-map dist/dygraph.tmp.js.map \
  --source-map-include-sources \
  --source-map dist/dygraph.min.js.map \
  -o dist/dygraph.min.js \
  dist/dygraph.tmp.js

# Copy to the old location
cp dist/dygraph.min.js dist/dygraph-combined.js

# Build GWT JAR
jar -cf dist/dygraph-gwt.jar -C gwt org

# Remove temp files.
rm dist/dygraph.tmp.js
rm dist/dygraph.tmp.js.map
