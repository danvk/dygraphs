#!/bin/mksh
set -e
header=$1

rm -rf dist disttmp
mkdir dist disttmp

# Create dist/dygraph.js
browserify \
  -v \
  -t [ babelify --compact false ] \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  LICENCE.js \
  src/dygraph.js \
  >disttmp/dygraph.tmp.js

# Create dist/dygraph.js.map
exorcist --base . dist/dygraph.js.map <disttmp/dygraph.tmp.js >dist/dygraph.js

# Create "production" bundle for minification
browserify \
  -v \
  -t [ babelify --compact false ] \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  >disttmp/dygraph.tmp.js

# Create dist/dygraph.tmp.js.map
exorcist --base . disttmp/dygraph.tmp.js.map <disttmp/dygraph.tmp.js >/dev/null

# Create dist/dygraph.js.min{,.map}
uglifyjs --compress --mangle \
  --preamble "$header" \
  --in-source-map disttmp/dygraph.tmp.js.map \
  --source-map-include-sources \
  --source-map dist/dygraph.min.js.map \
  --source-map-url dygraph.min.js.map \
  -o dist/dygraph.min.js \
  disttmp/dygraph.tmp.js

# Build ES5-compatible distribution
babel src -d src-es5 --compact false
