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
chmod a+r docs/options.html
if [ -s docs/options.html ] ; then
  ./generate-jsdoc.sh

  # Make sure everything will be readable on the web.
  # This is like "chmod -R a+rX", but excludes the .git directory.
  find . -path ./.git -prune -o -print | xargs chmod a+rX

  # Copy everything to the site.
  rsync -avzr gallery strftime rgbcolor common tests jsdoc experimental plugins $site \
  && \
  rsync -avzr dashed-canvas.js stacktrace.js dygraph*.js gadget.xml excanvas.js thumbnail.png screenshot.png docs/* $site/
else
  echo "generate-documentation.py failed"
fi

# Revert changes to dygraph-combined.js and docs/options.html
git checkout dygraph-combined.js
rm docs/options.html
