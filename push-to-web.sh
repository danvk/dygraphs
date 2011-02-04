#!/bin/bash
# This script generates the combined JS file, pushes all content to a web site
# and then reverts the combined file.
set -x
site=$1

# Produce dygraph-combined.js.
./generate-combined.sh

# Copy everything to the site.
scp tests/*.html tests/*.js tests/*.png $site/tests/ \
&& \
scp dygraph*.js gadget.xml excanvas.js thumbnail.png screenshot.png docs/* $site/

# Revert changes to dygraph-combined.js
git checkout dygraph-combined.js
