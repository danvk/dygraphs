#!/bin/bash
# Generate code coverage data for posting to Coveralls.
# This requires dist/*.js to be in place.
# Output is coverage/lcov.info

set -o errexit
set -x

# Generate per-file ES6 --> ES5 transpilations
babel --retain-lines src --out-dir dist/src
babel --retain-lines auto_tests/tests --out-dir dist/auto_tests/tests

# Instrument the source code with Istanbul's __coverage__ variable.
rm -rf coverage/*  # Clear out everything to ensure a hermetic run.
mkdir -p coverage
istanbul instrument --output coverage/src dist/src
cp -r dist/auto_tests coverage/

# Build a combined file for running the tests in-browser
browserify coverage/auto_tests/tests/*.js -o coverage/tests.js

# Run http-server and save its PID for cleanup
http-server > /dev/null &
SERVER_PID=$!
function finish() {
  kill -TERM $SERVER_PID
}
trap finish EXIT

# Give the server a chance to start up
sleep 1

# Run the tests using mocha-phantomjs & mocha-phantomjs-istanbul
# This produces coverage/coverage.json
phantomjs \
  ./node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee \
  http://localhost:8080/auto_tests/coverage.html \
  spec '{"hooks": "mocha-phantomjs-istanbul", "coverageFile": "coverage/coverage.json"}'

if [ $CI ]; then
  # Convert the JSON coverage to LCOV for coveralls.
  istanbul report --include coverage/*.json lcovonly

  # Monkey patch in the untransformed source paths.
  perl -i -pe 's,dist/,,' coverage/lcov.info
  echo ''  # reset exit code -- failure to post coverage shouldn't be an error.

else

  # Convert the JSON coverage to HTML for viewing
  istanbul report --include coverage/*.json html
  set +x

  echo 'To browse coverage, run:'
  echo
  echo '  open coverage/index.html'
  echo

fi
