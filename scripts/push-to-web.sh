#!/bin/mksh
# This script generates the bundled JS files and pushes all content to a web site using rsync.

if [[ -n $1 ]]; then
  echo "usage: $0 destination"
  exit 1
fi

set -x
set -o errexit
site=$1

# Produce dist/*.js and docroot/ and all in site/
npm run build

# Copy everything to the site.
rsync -avzr site/ $site/
