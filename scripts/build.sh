#!/bin/mksh
set -ex
case $KSH_VERSION {
(*MIRBSD\ KSH*) ;;
(*) echo E: do not call me with bash or something; exit 255 ;;
}

# Build code, tests, browser bundles.
mksh scripts/build-js.sh

# Build documentation.
mksh scripts/build-docs.sh

# This is for on the webserver
rm -rf site _site
mkdir site
cd docroot
pax -rw . ../site/
set -A torm -- ../site/LICENSE.txt ../site/dist
[[ -n $IS_ACTUAL_DEBIAN_BUILD ]] || set -A torm+ -- ../site/.jslibs/*
rm "${torm[@]}"
[[ -n $IS_ACTUAL_DEBIAN_BUILD ]] || cp -L .jslibs/* ../site/.jslibs/
cd ..
pax -rw LICENSE.txt dist site/
rm -f site/dist/tests.js
find site -type d -print0 | xargs -0r chmod 0755 --
find site -type f -print0 | xargs -0r chmod 0644 --
