#!/bin/sh

sudoapt() {
	local _sudoapt_e=''

	if command -v eatmydata >/dev/null 2>&1; then
		_sudoapt_e=eatmydata
	fi
	sudo env DEBIAN_FRONTEND=noninteractive $_sudoapt_e apt-get "$@"
}
sudoagi='sudoapt --purge install --no-install-recommends -y'

set -ex

mksh -c true || {
	$sudoagi mksh
	exec mksh "$0" "$@"
	exit 255
}

export LC_ALL=C
unset LANGUAGE

set -o pipefail

$sudoagi eatmydata
sudoapt clean
sudoapt update
#sudoapt --purge dist-upgrade -y
$sudoagi eatmydata git \
    ed jq jsdoc-toolkit \
    libjs-bootstrap libjs-jquery libjs-jquery-ui \
    mksh pax python3

: drop any pre-installed PhantomJS as they cause breakage
bash -c 'set -o noglob; while true; do found=0; for x in $(which -a phantomjs); do test -e "$x" || continue; found=1; rm -f "$x"; done; test $found = 1 || break; done'

eatmydata env TMPDIR=/tmp npm install -g phantomjs@1.9.7-15
eatmydata env TMPDIR=/tmp npm install

(eatmydata npm run clean || :)
eatmydata npm run build
eatmydata npm run test
eatmydata npm run test-min
if [[ $GITHUB_REPOSITORY = danvk/dygraphs ]]; then
	eatmydata npm run coverage
	eatmydata scripts/post-coverage.sh
	eatmydata scripts/weigh-in.sh
fi

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
