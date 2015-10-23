#!/bin/bash
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  -o dist/tests.js \
  auto_tests/tests/*.js
