#!/bin/bash
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  | uglifyjs -c -m \
  > dist/dygraph.js
