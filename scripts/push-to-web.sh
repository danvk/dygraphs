#!/bin/bash
# This script generates the bundled JS files and pushes all content to a web site using rsync.

if [ "$1" == "" ] ; then
  echo "usage: $0 destination"
  exit 1
fi

set -x
set -o errexit
site=$1

# Produce dist/*.js
npm run build

# Generate documentation.
./scripts/generate-documentation.py > docs/options.html
chmod a+r docs/options.html
if [ -s docs/options.html ] ; then
  ./scripts/generate-jsdoc.sh
  ./scripts/generate-download.py > docs/download.html

  temp_dir=$(mktemp -d /tmp/dygraphs-docs.XXXX)
  cd docs
  ./ssi_expander.py $temp_dir
  cd ..

  # Make sure everything will be readable on the web.
  # This is like "chmod -R a+rX", but excludes the .git and node_modules directories.
  find . -print | egrep -v '\.git|node_modules' | xargs chmod a+rX

  # Copy everything to the site.
  rsync -avzr src src/extras gallery common tests jsdoc dist $site \
  && \
  rsync -avzr --copy-links dist/* thumbnail.png screenshot.png $temp_dir/* $site/
else
  echo "generate-documentation.py failed"
fi

# Revert changes to docs.
git checkout docs/download.html
rm docs/options.html
rm -rf $temp_dir
