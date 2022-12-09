#!/bin/mksh
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

set -eo pipefail
mydir=$(realpath "$0/..")

infile=$1
outfile=$2
if [[ -z $infile || ! -s $infile || -z $outfile ]]; then
	print -ru2 "E: syntax error"
	exit 1
fi

if command -v nodejs >/dev/null 2>&1; then
	node_js=nodejs
else
	node_js=node
fi

rm -f "$outfile" "$outfile.tmp.js" "$outfile.tmp.js.map"
print -ru2 "I: converting $infile to $outfile"
$node_js "$mydir"/txt2js.js "$infile" "$outfile.tmp.js"
"$mydir"/smap-in.py "$outfile.tmp.js" "$outfile.tmp.js.map" "$outfile" --nonl
rm -f "$outfile.tmp.js" "$outfile.tmp.js.map"
