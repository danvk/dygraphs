#!/bin/mksh
set -e

v=$(sed -n '/^Dygraph.VERSION = "\(.*\)";$/s//\1/p' <src/dygraph.js)
test -n "$v" || {
  echo 'E: could not determine version'
  exit 1
}

if [[ -d debian ]]; then
  dv=$v
else
  dv=
fi

rm -f docs/download.html docs/options.html docs/versions.html
scripts/generate-download.py ${dv:+"$dv"} >docs/download.html
scripts/generate-documentation.py >docs/options.html
scripts/generate-versions.sh >docs/versions.html
chmod a+r docs/download.html docs/options.html docs/versions.html
for file in docs/download.html docs/options.html docs/versions.html; do
  test -s "$file" || {
    echo >&2 "E: generating $file failed"
    exit 1
  }
done

scripts/generate-jsdoc.sh

rm -rf docroot
mkdir docroot
cd docs
pax -rw . ../docroot/
./ssi_expander.py ../docroot/
cd ../docroot
rm -f NOTES TODO common footer.html header.html *.py
mv README README-docs.txt
cd ..
rm -f docs/download.html docs/options.html docs/versions.html
pax -rw -l \
	common \
	gallery \
	jsdoc \
	tests \
	README.md \
	Screenshot.png \
	thumbnail.png \
    docroot/
rm -rf */__pycache__
