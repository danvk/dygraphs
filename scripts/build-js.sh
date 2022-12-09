#!/bin/mksh

# initialisation
set -e
set -o pipefail
if [[ -e node_modules ]]; then
	# NPM setup
	babel_js=babel
else
	# Debian packaging
	babel_js=babeljs
fi
babelrc=$PWD/babel.config.json
set -x

# obtain dygraphs version…
v=$(sed -n '/^Dygraph.VERSION = "\(.*\)";$/s//\1/p' <src/dygraph.js)
if [[ -z $v ]]; then
	echo >&2 'E: could not determine version'
	exit 1
fi
# … as well as the version of the last release (for a snapshot)
if [[ $v = +([0-9]).+([0-9]).+([0-9])-* ]]; then
	relv=${v%%-*}
	IFS=.
	set -- $relv
	IFS=$' \t\n'
	relv=$1.$2.$(($3 - 1))
else
	relv=$v
fi

# licence headers for unminified and minified js, respectively
rm -f LICENCE.js
{
	echo '/*'
	sed -e 's/^/ * /' -e 's/  *$//' <LICENSE.txt
	echo ' */'
} >LICENCE.js
header="/*! @license https://github.com/danvk/dygraphs/blob/v$relv/LICENSE.txt (MIT) */"

# build ES5- and browser-compatible code in a subdirectory
# and the code and test bundles as well as the minified CSS+JS

# copy/transform sources and licence info
rm -rf dist disttmp src-es5
mkdir disttmp
if [[ -e node_modules ]]; then
	pax -rw -l node_modules disttmp/
fi
pax -rw -l auto_tests src disttmp/

$babel_js \
    --config-file "$babelrc" \
    --compact false \
    --source-maps inline \
    -d disttmp \
    LICENCE.js

cd disttmp
if [[ -e node_modules ]]; then
	PATH=$PWD/node_modules/.bin:$PATH
	export PATH
fi

# ES5-compatible source
$babel_js \
    --config-file "$babelrc" \
    --compact false \
    --source-maps inline \
    -d tests5 \
    auto_tests
$babel_js \
    --config-file "$babelrc" \
    --compact false \
    --source-maps inline \
    -d es5 \
    src
rm -rf auto_tests src

# get core-js from Debian, if needed, for XHR test
[[ -e node_modules ]] || ln -s /usr/share/nodejs/core-js .

# bundle dygraph.js{,.map} and tests.js with dev env
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

# bundle and minify dygraph.min.js{,.map} with prod env
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

uglifyjs \
    --compress \
    --mangle \
    --output-opts "preamble='$header'" \
    --source-map "content='dygraph.min.tmp.js.map',includeSources=true,url='dygraph.min.js.map'" \
    -o dygraph.min.js \
    dygraph.min.tmp.js

# copy out results
mkdir ../dist
mv dygraph.js dygraph.js.map dygraph.min.js dygraph.min.js.map tests.js ../dist/
mv es5 ../src-es5
cd ..
rm -rf LICENCE.js disttmp

# minify CSS
cp css/dygraph.css dist/
cleancss css/dygraph.css -o dist/dygraph.min.css --source-map --source-map-inline-sources

# add (ES5-compatible) extras to dist
cd src-es5
pax -rw -l extras ../dist/
cd ..
