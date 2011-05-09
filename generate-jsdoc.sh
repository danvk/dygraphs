#!/bin/bash
#
# Generates JSDoc in the /jsdoc dir. Clears any existing jsdoc there.

rm -rf jsdoc
java -jar jsdoc-toolkit/jsrun.jar \
  jsdoc-toolkit/app/run.js \
  -a -d=jsdoc -t=jsdoc-toolkit/templates/jsdoc \
  dygraph.js
