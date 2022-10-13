#!/bin/mksh
# This generates everything under dist:
# bundled JS, minified JS, minified CSS and source maps.
set -o errexit

rm -rf dist disttmp
mkdir dist disttmp

# Create dist/dygraph.js
rm -f LICENCE.js
{
  echo '/*'
  sed -e 's/^/ * /' -e 's/  *$//' <LICENSE.txt
  echo ' */'
} >LICENCE.js
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  LICENCE.js \
  src/dygraph.js \
  >disttmp/dygraph.tmp.js

# Create dist/dygraph.js.map
exorcist --base . dist/dygraph.js.map <disttmp/dygraph.tmp.js >dist/dygraph.js
rm LICENCE.js

# Create "production" bundle for minification
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  >disttmp/dygraph.tmp.js

# Create dist/dygraph.tmp.js.map
exorcist --base . disttmp/dygraph.tmp.js.map <disttmp/dygraph.tmp.js >/dev/null

header='/*! @license Copyright 2022 Dan Vanderkam (danvdk@gmail.com) and others; MIT-licenced: https://opensource.org/licenses/MIT */'

# Create dist/dygraph.js.min{,.map}
uglifyjs --compress --mangle \
  --preamble "$header" \
  --in-source-map disttmp/dygraph.tmp.js.map \
  --source-map-include-sources \
  --source-map dist/dygraph.min.js.map \
  --source-map-url dygraph.min.js.map \
  -o dist/dygraph.min.js \
  disttmp/dygraph.tmp.js

# Minify CSS
cp css/dygraph.css dist/
cleancss css/dygraph.css -o dist/dygraph.min.css --source-map --source-map-inline-sources

# Build ES5-compatible distribution
babel src -d src-es5 --compact false

# Remove temp files.
rm -rf disttmp

# Build documentation.
scripts/build-docs.sh

# This is for on the webserver
rm -rf site
mkdir site
cd docroot
pax -rw . ../site/
rm ../site/.jslibs/* ../site/dist
cp -L .jslibs/* ../site/.jslibs/
cd ..
pax -rw dist site/
rm -f site/dist/tests.js
pax -rw src src-es5 site/
find site -print0 | xargs -0r chmod a+rX --
