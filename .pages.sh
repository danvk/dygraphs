#!/bin/sh
set -ex

: drop any pre-installed PhantomJS as they cause breakage
bash -c 'set -o noglob; while true; do found=0; for x in $(which -a phantomjs); do test -e "$x" || continue; found=1; rm -f "$x"; done; test $found = 1 || break; done'

mksh -c true || {
	sudo apt-get install -y mksh
	exec mksh "$0" "$@"
	exit 255
}

set -o pipefail

sudo apt-get install -y ed jsdoc-toolkit \
    libjs-bootstrap libjs-jquery libjs-jquery-ui \
    mksh pax

npm install

npm run build
npm run test
npm run coverage
scripts/post-coverage.sh
scripts/weigh-in.sh

echo dygraph.mirsolutions.de >site/CNAME
rm -rf _site
mv site _site
