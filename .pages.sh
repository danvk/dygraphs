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

sudo apt-get install -y eatmydata
sudo eatmydata apt-get clean
sudo eatmydata apt-get update
sudo eatmydata apt-get install -y ed jsdoc-toolkit \
    libjs-bootstrap libjs-jquery libjs-jquery-ui \
    mksh pax

: drop any pre-installed PhantomJS as they cause breakage
bash -c 'set -o noglob; while true; do found=0; for x in $(which -a phantomjs); do test -e "$x" || continue; found=1; rm -f "$x"; done; test $found = 1 || break; done'

TMPDIR=/tmp eatmydata npm install -g phantomjs@1.9.20
TMPDIR=/tmp eatmydata npm install

(eatmydata npm run clean || :)
eatmydata npm run build
eatmydata npm run test
#npm run coverage && scripts/post-coverage.sh
#scripts/weigh-in.sh

rm -rf _site
mv site _site
cd _site
find . -type d -print0 | sort -z | xargs -0 mksh ../scripts/mkdiridx.sh
if [[ $GITHUB_REF = refs/heads/debian && $GITHUB_REPOSITORY = mirabilos/dygraphs ]]; then
	echo dygraph.github.mirsolutions.de >CNAME
	imprint_text='<a href="https://github.com/mirabilos/Impressum/tree/master/dygraphs#imprint-text" xml:lang="de-DE-1901"><b>Impressum</b> und Datenschutzerklärung</a>'
else
	imprint_text=
fi
if [[ -n $imprint_text ]]; then
	grep -FrlZ '@@@PLACE_IMPRINT_LINK_HERE_IF_NECESSARY@@@' . | \
	    xargs -0 perl -pi -e '
		s'\''<!--@@@IFIMPRINT:(.*?)@@@PLACE_IMPRINT_LINK_HERE_IF_NECESSARY@@@(.*?):FIIMPRINT@@@-->'\''$1.q{'"$imprint_text"'}.$2'\''eo
	    '
fi
cd ..
