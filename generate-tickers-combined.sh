#!/bin/bash
# Generates a single JS file that's easier to include.
# This includes only code for generating ticks.

GetSources () {
  for F in \
    stacktrace.js \
    dygraph-utils.js \
    dygraph-tickers.js
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

Shim () {
  echo 'this.Dygraph=this.Dygraph||{};Dygraph.prototype=Dygraph.prototype||{};'
}

Copyright () {
  echo '/*! @license Copyright 2011 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */'
}

CatCompressed () {
  Copyright
  Shim
  CatSources \
  | java -jar yuicompressor-2.4.2.jar --type js
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
  CatCompressed > dygraph-tickers-combined.js
  chmod a+r dygraph-tickers-combined.js
  ;;
*)
  echo >&2 "Unknown action '$ACTION'"
  exit 1
  ;;
esac
