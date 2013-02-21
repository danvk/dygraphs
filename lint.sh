#!/bin/bash
#
# Usage:
#   ./lint.sh [file.js]
#
# The zero-argument form lints everything.

# See jshint/build/jshint-rhino.js for documentation on these parameters.
# devel   defines logging globals (i.e. "console.log")
# browser defines standard web browser globals (i.e. "document")
# shadow  disables warnings on multiple var definitions in one scope (i.e. two
#         loops with "var i")
jsc_opts='maxerr:10000,devel:true,browser:true,shadow:true'
rhino_opts='maxerr=10000,devel=true,browser=true,shadow=true'

if [ $# -gt 1 ]; then
  echo "Usage: $0 [file.js]"
  exit 1
fi

RETURN_VALUE=0

if [ $# -eq 0 ]; then
  files=$(ls dygraph*.js plugins/*.js | grep -v combined | grep -v dev.js| grep -v externs)
else
  files=$1
fi

if [ -e /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc ]; then
  # use JSC (Safari/JavaScriptCore) to run JSHint -- much faster than Rhino.
  echo 'Running JSHint w/ JavaScriptCore (jsc)...'
  for file in $files; do
    ./jshint/env/jsc.sh $file $jsc_opts || RETURN_VALUE=1
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
      RETURN_VALUE=1
    else
      echo "[jshint] ${FILE} passed!"
    fi
  done
fi

exit $RETURN_VALUE
