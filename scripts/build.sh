#!/bin/mksh
# This generates everything under dist:
# bundled JS, minified JS, minified CSS and source maps.
set -o errexit

v=$(sed -n '/^Dygraph.VERSION = "\(.*\)";$/s//\1/p' <src/dygraph.js)
test -n "$v" || {
  echo 'E: could not determine version'
  exit 1
}

rm -f LICENCE.js
{
  echo '/*'
  sed -e 's/^/ * /' -e 's/  *$//' <LICENSE.txt
  echo ' */'
} >LICENCE.js
header="/*! @license https://github.com/mirabilos/dygraphs/blob/v$v/LICENSE.txt (MIT) */"

mksh scripts/b-old.sh "$header"

# Minify CSS
cp css/dygraph.css dist/
cleancss css/dygraph.css -o dist/dygraph.min.css --source-map --source-map-inline-sources

# Add extras to dist, in ES5-compatible version
cd src-es5
pax -rw -l extras ../dist/
cd ..

# Remove temp files.
rm -rf LICENCE.js disttmp

# Build documentation.
scripts/build-docs.sh

# This is for on the webserver
rm -rf site
mkdir site
cd docroot
pax -rw . ../site/
rm ../site/.jslibs/* ../site/LICENSE.txt ../site/dist
cp -L .jslibs/* ../site/.jslibs/
cd ..
pax -rw LICENSE.txt dist site/
rm -f site/dist/tests.js
find site -print0 | xargs -0r chmod a+rX --
