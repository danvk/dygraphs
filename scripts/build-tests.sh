#!/bin/bash
# Create dist/tests.js
# To run the tests, run `npm run test`
# To iterate on the tests, use `npm run watch`

browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  -o dist/tests.js \
  auto_tests/tests/*.js
