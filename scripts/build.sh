#!/bin/bash
# This generates everything under dist:
# bundled JS, minified JS, minified CSS and source maps.
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

# Build GWT JAR
jar -cf dist/dygraph-gwt.jar -C gwt org

# Minify CSS
cp css/dygraph.css dist/
cleancss css/dygraph.css -o dist/dygraph.min.css --source-map --source-map-inline-sources

# Build ES5-compatible distribution
babel src -d src-es5 --compact false

# Remove temp files.
rm dist/dygraph.tmp.js
rm dist/dygraph.tmp.js.map
