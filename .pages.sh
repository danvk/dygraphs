#!/bin/sh
set -ex

mksh -c true || {
	sudo apt-get install -y mksh
	exec mksh "$0" "$@"
	exit 255
}

export LC_ALL=C
unset LANGUAGE

set -o pipefail

sudo apt-get install -y ed jsdoc-toolkit \
    libjs-bootstrap libjs-jquery libjs-jquery-ui \
    mksh pax

: drop any pre-installed PhantomJS as they cause breakage
bash -c 'set -o noglob; while true; do found=0; for x in $(which -a phantomjs); do test -e "$x" || continue; found=1; rm -f "$x"; done; test $found = 1 || break; done'

TMPDIR=/tmp npm install -g phantomjs@1.9.20
TMPDIR=/tmp npm install

npm run build
npm run test
npm run coverage
scripts/post-coverage.sh
scripts/weigh-in.sh

echo dygraph.github.mirsolutions.de >site/CNAME
rm -rf _site
mv site _site
cd _site
find . -type d -print0 | sort -z | xargs -0 mksh ../scripts/mkdiridx.sh
cd ..