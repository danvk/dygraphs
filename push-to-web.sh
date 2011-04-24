#!/bin/bash
# This script generates the combined JS file, pushes all content to a web site
# and then reverts the combined file.
set -x
site=$1

# Produce dygraph-combined.js.
./generate-combined.sh

# Generate documentation.
./generate-documentation.py > docs/options.html

# Copy everything to the site.
scp -r tests $site \
&& \
scp dygraph*.js gadget.xml excanvas.js thumbnail.png screenshot.png docs/* $site/

# Revert changes to dygraph-combined.js and docs/options.html
git checkout dygraph-combined.js
rm docs/options.html
