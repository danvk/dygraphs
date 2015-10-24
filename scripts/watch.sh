#!/bin/bash
# Continually regenerate these two files:
# - dist/dygraph.js
# - dist/tests.js
# As source/test files change.

# Clean background processes after quit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

mkdir -p dist  # in case it doesn't exist; watchify needs it

watchify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  -o dist/dygraph.js \
  src/dygraph.js &

watchify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  -o dist/tests.js \
  auto_tests/tests/*.js &

# Wait until background processes end
wait
