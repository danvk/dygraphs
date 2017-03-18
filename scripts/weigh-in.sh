#!/bin/bash
# This tracks the effect of pull requests on the size of dygraphs.
# See https://github.com/danvk/travis-weigh-in
set -o errexit

if [ -z "$GITHUB_TOKEN" ]; then
    echo "GITHUB_TOKEN not set. Skipping size checks."
    exit 0

else

  curl -O https://raw.githubusercontent.com/danvk/travis-weigh-in/master/weigh_in.py
  python weigh_in.py dist/dygraph.min.js
  gzip -c dist/dygraph.min.js > dist/dygraph.min.js.gz
  python weigh_in.py dist/dygraph.min.js.gz

fi
