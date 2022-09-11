#!/bin/bash
#
# Generates JSDoc in the /jsdoc dir. Clears any existing jsdoc there.

rm -rf jsdoc
echo Generating JSDoc...
jsdoc \
  -d=jsdoc \
  src/dygraph.js \
2>&1 | tee /tmp/dygraphs-jsdocerrors.txt

ed -s /tmp/dygraphs-jsdocerrors.txt <<-\EOF
	1g/java .*jsrun.jar/d
	w
	q
EOF

if [ -s /tmp/dygraphs-jsdocerrors.txt ]; then
  echo Please fix any jsdoc errors/warnings
  exit 1
fi

chmod -R a+rX jsdoc

echo Done
