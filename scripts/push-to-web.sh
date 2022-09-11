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

# Make sure everything will be readable on the web.
# This is like "chmod -R a+rX", but excludes the .git and node_modules directories.
find . -print | egrep -v '\.git|node_modules' | xargs chmod a+rX

# Copy everything to the site.
rsync -avzr src src/extras dist $site \
&& \
rsync -avzr --copy-links dist/* site/* $site/
