#!/bin/mksh
# This generates everything under dist:
# bundled JS, minified JS, minified CSS and source maps.
set -o errexit

v=$(sed -n '/^Dygraph.VERSION = "\(.*\)";$/s//\1/p' <src/dygraph.js)
test -n "$v" || {
  echo 'E: could not determine version'
  exit 1
}
if [[ $v = +([0-9]).+([0-9]).+([0-9])-* ]]; then
	rv=${v%%-*}
	IFS=.
	set -A rv -- $rv
	IFS=$' \t\n'
	rv=$1.$2.$(($3-1))
else
	rv=$v
fi

rm -f LICENCE.js
{
  echo '/*'
  sed -e 's/^/ * /' -e 's/  *$//' <LICENSE.txt
  echo ' */'
} >LICENCE.js
header="/*! @license https://github.com/mirabilos/dygraphs/blob/v$rv/LICENSE.txt (MIT) */"

# Build browser-compatible and ES5 versions in a subdirectory
rm -rf dist disttmp src-es5
mkdir dist disttmp
pax -rw -l auto_tests node_modules src disttmp/

babel \
  --compact false \
  --source-maps inline \
  -d disttmp \
  LICENCE.js

cd disttmp
PATH=$PWD/node_modules/.bin:$PATH

# ES5-compatible source
babel \
  --compact false \
  --source-maps inline \
  -d tests5 \
  auto_tests
babel \
  --compact false \
  --source-maps inline \
  -d es5 \
  src
rm -rf auto_tests src

# dygraph.js{,.map} and tests.js
cp -r es5 src
../scripts/env-patcher.sh development src
browserify \
  -v \
  --debug \
  --standalone Dygraph \
  LICENCE.js \
  src/dygraph.js \
  >dygraph.tmp.js
browserify \
  -v \
  --debug \
  LICENCE.js \
  tests5/tests/*.js \
  >tests.js
rm -rf src
../scripts/smap-out.py dygraph.tmp.js dygraph.js dygraph.js.map

# dygraph.min.js{,.map}
cp -r es5 src
../scripts/env-patcher.sh production src
browserify \
  -v \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  >dygraph.min.tmp.js
rm -rf src
../scripts/smap-out.py dygraph.min.tmp.js /dev/null dygraph.min.tmp.js.map

uglifyjs --compress --mangle \
  --preamble "$header" \
  --in-source-map dygraph.min.tmp.js.map \
  --source-map-include-sources \
  --source-map dygraph.min.js.map \
  -o dygraph.min.js \
  dygraph.min.tmp.js

# Copy out results
mv dygraph.js dygraph.js.map dygraph.min.js dygraph.min.js.map tests.js ../dist/
mv es5 ../src-es5
cd ..
rm -rf LICENCE.js disttmp

# Minify CSS
cp css/dygraph.css dist/
cleancss css/dygraph.css -o dist/dygraph.min.css --source-map --source-map-inline-sources

# Add extras to dist, in ES5-compatible version
cd src-es5
pax -rw -l extras ../dist/
cd ..

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
