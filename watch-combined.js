#!/bin/bash
watchify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  -o dist/dygraph.js \
  src/dygraph.js
