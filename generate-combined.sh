#!/bin/bash
# Generates a single JS file that's easier to include.

GetSources () {
  # This list needs to be kept in sync w/ the one in dygraph-dev.js
  # and the one in jsTestDriver.conf. Order matters, except for the plugins.
  for F in \
    dashed-canvas.js \
    dygraph-options.js \
    dygraph-layout.js \
    dygraph-canvas.js \
    dygraph.js \
    dygraph-utils.js \
    dygraph-gviz.js \
    dygraph-interaction-model.js \
    dygraph-tickers.js \
    dygraph-plugin-base.js \
    plugins/*.js \
    dygraph-plugin-install.js \
    datahandler/datahandler.js \
    datahandler/default.js \
    datahandler/default-fractions.js \
    datahandler/bars.js \
    datahandler/bars-custom.js \
    datahandler/bars-error.js \
    datahandler/bars-fractions.js 
  do
      echo "$F"
  done
}

# Pack all the JS together.
CatSources () {
  GetSources \
  | xargs cat \
  | perl -ne 'print unless m,REMOVE_FOR_COMBINED,..m,/REMOVE_FOR_COMBINED,'
}

Copyright () {
  echo '/*! @license Copyright 2014 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */'
}

CatCompressed () {
  Copyright
  CatSources \
  | grep -v '"use strict";' \
  | node_modules/uglify-js/bin/uglifyjs -c warnings=false -m
}

ACTION="${1:-update}"
case "$ACTION" in
ls)
  GetSources
  ;;
cat)
  Copyright
  CatSources
  ;;
compress*|cat_compress*)
  CatCompressed
  ;;
update)
  CatCompressed > dygraph-combined.js
  chmod a+r dygraph-combined.js
  ;;
*)
  echo >&2 "Unknown action '$ACTION'"
  exit 1
  ;;
esac
