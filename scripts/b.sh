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
pax -rw src src-es5 site2/
