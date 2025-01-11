#!/bin/mksh
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

set -eo pipefail
case $KSH_VERSION {
(*MIRBSD\ KSH*) ;;
(*) echo E: do not call me with bash or something; exit 255 ;;
}
mydir=$(realpath "$0/..")

if [[ $1 = development ]]; then
	rpl=true
elif [[ $1 = production ]]; then
	rpl=false
else
	print -ru2 "$0: syntax error"
	exit 1
fi
shift

if command -v nodejs >/dev/null 2>&1; then
	node_js=nodejs
else
	node_js=node
fi

grep -FrlZ process.env.NODE_ENV "$@" | while IFS= read -d '' -r fn; do
	print -ru2 "I: patching $fn for !prod=$rpl"
	"$mydir"/smap-out.py "$fn" env-patcher.tmp.js env-patcher.tmp.map
	$node_js "$mydir"/env-patcher.js "$rpl"
	"$mydir"/smap-in.py env-patcher.tmp.js env-patcher.tmp.map "$fn" --nonl
done
rm -f env-patcher.tmp.js env-patcher.tmp.map
print -ru2 "I: done patching"
