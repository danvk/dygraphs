#!/bin/mksh

set -ex

rm -rf site2
mkdir site2
cd docroot
pax -rw . ../site2/
rm ../site2/.jslibs/*
cp -L .jslibs/* ../site2/.jslibs/
cd ..
pax -rw dist site2/
rm -f site2/dist/tests.js
# this can probably go {{{
#cd src
#pax -rw extras ../site2/
#cd ..
ln -s src/extras site2/
# this can probably go }}}
pax -rw src site2/
cd site2
ln -s dist/* ./
