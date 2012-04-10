#!/bin/bash
jsc_opts='maxerr:10000,devel:true,browser:true'
rhino_opts='maxerr=10000,devel=true,browser=true'

files=$(ls dygraph*.js | grep -v combined | grep -v dev.js);

if [ -e /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc ]; then
  # use JSC (Safari/JavaScriptCore) to run JSHint -- much faster than Rhino.
  echo 'Running JSHint w/ JavaScriptCore (jsc)...'
  for file in $files; do
    ./jshint/env/jsc.sh $file $jsc_opts
  done
else
  # fall back to Rhino.
  echo 'Running JSHint w/ Rhino...'

  for FILE in $files; do
    LINT_RESULT=$(java -jar ./jsdoc-toolkit/java/classes/js.jar ./jshint/build/jshint-rhino.js $rhino_opts $FILE)
    ERRORS=$(echo ${LINT_RESULT} | egrep [^\s] -c)
    if [[ ${ERRORS} -ne 0 ]]; then
      echo "[jshint] Error(s) in ${FILE}:"
      printf "%s\n" "${LINT_RESULT}"
    else
      echo "[jshint] ${FILE} passed!"
    fi
  done
fi
