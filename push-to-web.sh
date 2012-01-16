#!/bin/bash
# This script generates the combined JS file, pushes all content to a web site
# and then reverts the combined file.

if [ "$1" == "" ] ; then
  echo "usage: $0 destination"
  exit 1
fi

set -x
site=$1
# Produce dygraph-combined.js.
./generate-combined.sh

# Generate documentation.
./generate-documentation.py > docs/options.html
if [ -s docs/options.html ] ; then
  ./generate-jsdoc.sh

  # Copy everything to the site.
  scp -r gallery common tests jsdoc experimental $site \
  && \
  scp dygraph*.js gadget.xml excanvas.js thumbnail.png screenshot.png docs/* $site/
else
  echo "generate-documentation.py failed"
fi

# Revert changes to dygraph-combined.js and docs/options.html
git checkout dygraph-combined.js
rm docs/options.html
