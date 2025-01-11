#!/bin/mksh
set -ex
case $KSH_VERSION {
(*MIRBSD\ KSH*) ;;
(*) echo E: do not call me with bash or something; exit 255 ;;
}

# Build code, tests, browser bundles.
scripts/build-js.sh

# Build documentation.
scripts/build-docs.sh

# This is for on the webserver
rm -rf site _site
mkdir site
cd docroot
pax -rw . ../site/
rm ../site/.jslibs/* ../site/LICENSE.txt ../site/dist
cp -L .jslibs/* ../site/.jslibs/
cd ..
pax -rw LICENSE.txt dist site/
rm -f site/dist/tests.js
find site -print0 | xargs -0r chmod a+rX --
