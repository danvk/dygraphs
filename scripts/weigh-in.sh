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
  mkdir -p disttmp
  gzip -cn9 <dist/dygraph.min.js >disttmp/dygraph.min.js.gz
  python weigh_in.py disttmp/dygraph.min.js.gz
  rm -r disttmp

fi
