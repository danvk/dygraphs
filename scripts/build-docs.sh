#!/bin/bash
set -e

rm -f docs/download.html docs/options.html
scripts/generate-documentation.py > docs/options.html
chmod a+r docs/options.html
test -s docs/options.html || {
  echo "generate-documentation.py failed"
  exit 1
}
scripts/generate-jsdoc.sh
scripts/generate-download.py > docs/download.html
rm -rf docroot
mkdir docroot
cd docs
pax -rw . ../docroot/
./ssi_expander.py ../docroot/
cd ../docroot
rm -f NOTES TODO footer.html header.html *.py
cd ..
rm -f docs/download.html docs/options.html
pax -rw -l \
	common \
	gallery \
	jsdoc \
	tests \
	screenshot.png \
	thumbnail.png \
    docroot/
rm -rf */__pycache__
