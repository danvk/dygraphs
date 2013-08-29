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
  ./generate-download.py > docs/download.html

  temp_dir=$(mktemp -d /tmp/dygraphs-docs.XXXX)
  cd docs
  ./ssi_expander.py $temp_dir
  cd ..

  # Make sure everything will be readable on the web.
  # This is like "chmod -R a+rX", but excludes the .git directory.
  find . -path ./.git -prune -o -print | xargs chmod a+rX

  # Copy everything to the site.
  rsync -avzr gallery strftime rgbcolor common tests jsdoc experimental plugins $site \
  && \
  rsync -avzr --copy-links dashed-canvas.js stacktrace.js dygraph*.js gadget.xml excanvas.js thumbnail.png screenshot.png $temp_dir/* $site/
else
  echo "generate-documentation.py failed"
fi

# Revert changes to dygraph-combined.js and docs.
git checkout dygraph-combined.js
git checkout docs/download.html
rm docs/options.html
rm -rf $temp_dir
