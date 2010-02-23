#!/bin/bash
id=$1;

echo id: $id > ./id.txt
dir=git-$id
mkdir $dir
cd $dir

# TODO(danvk): any way to clone at a particular revision?
git clone --depth 0 git://github.com/danvk/dygraphs.git
cd dygraphs
./generate-combined.sh

# Copy data over to http://www.danvk.org/dygraphs/
cp tests/*.html tests/*.js ~/danvk.org/dygraphs/tests/
cp dygraph.js dygraph-canvas.js dygraph-combined.js gadget.xml excanvas.js thumbnail.png docs/* ~/danvk.org/dygraphs/

cd ../..
rm -rf $dir
