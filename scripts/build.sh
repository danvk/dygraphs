#!/bin/bash
# This generates everything under dist:
# bundled JS, minified JS, minified CSS and source maps.
set -o errexit

mkdir -p dist

# Create dist/dygraph.js
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  > dist/dygraph.tmp.js

# Create dist/dygraph.js.map
cat dist/dygraph.tmp.js | exorcist --base . dist/dygraph.js.map > dist/dygraph.js

# Create "production" bundle for minification
browserify \
  -v \
  -t babelify \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  > dist/dygraph.tmp.js

# Create dist/dygraph.tmp.js.map
cat dist/dygraph.tmp.js | exorcist --base . dist/dygraph.tmp.js.map > /dev/null

header='/*! @license Copyright 2017 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */'

# Create dist/dygraph.js.min{,.map}
uglifyjs --compress --mangle \
  --preamble "$header" \
  --in-source-map dist/dygraph.tmp.js.map \
  --source-map-include-sources \
  --source-map dist/dygraph.min.js.map \
  -o dist/dygraph.min.js \
  dist/dygraph.tmp.js

# Minify CSS
cp css/dygraph.css dist/
cleancss css/dygraph.css -o dist/dygraph.min.css --source-map --source-map-inline-sources

# Build ES5-compatible distribution
babel src -d src-es5 --compact false

# Remove temp files.
rm dist/dygraph.tmp.js
rm dist/dygraph.tmp.js.map

# Build documentation
rm -rf docroot
scripts/generate-documentation.py > docs/options.html
chmod a+r docs/options.html
test -s docs/options.html || {
  echo "generate-documentation.py failed"
  exit 1
}
scripts/generate-jsdoc.sh
scripts/generate-download.py > docs/download.html
mkdir docroot
cd docs
./ssi_expander.py "$PWD/../docroot"
cd ../docroot
rm -f NOTES TODO footer.html header.html *.py *.pyc
cd ..
pax -rw -l \
	common \
	gallery \
	jsdoc \
	tests \
	screenshot.png \
	thumbnail.png \
    docroot/
rm -f docs/download.html docs/options.html

# This is for on the webserver
rm -rf site
mkdir site
rsync -avzr src src/extras dist site
rsync -avzr --copy-links dist/* docroot/* site/
find site -print0 | xargs -0r chmod a+rX --
