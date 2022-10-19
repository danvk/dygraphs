#!/bin/mksh
set -e
header=$1

rm -rf disttmp2
mkdir disttmp2
pax -rw -l LICENCE.js node_modules disttmp2/

babel --compact false -d disttmp2/es5 src

cd disttmp2
find es5/ -type f -print0 | while IFS= read -d '' -r fn; do
	print >>"$fn"
done
PATH=$PWD/node_modules/.bin:$PATH

cp -r es5 src
browserify \
  -v \
  -t [ envify --NODE_ENV development ] \
  --debug \
  --standalone Dygraph \
  LICENCE.js \
  src/dygraph.js \
  >dygraph.tmp.js
exorcist --base . dygraph.js.map <dygraph.tmp.js >dygraph.js

#cp -r es5 src
browserify \
  -v \
  -t [ envify --NODE_ENV production ] \
  --debug \
  --standalone Dygraph \
  src/dygraph.js \
  >dygraph.min.tmp.js
exorcist --base . dygraph.min.tmp.js.map <dygraph.min.tmp.js >/dev/null

uglifyjs --compress --mangle \
  --preamble "$header" \
  --in-source-map dygraph.min.tmp.js.map \
  --source-map-include-sources \
  --source-map dygraph.min.js.map \
  -o dygraph.min.js \
  dygraph.min.tmp.js

cd ..
