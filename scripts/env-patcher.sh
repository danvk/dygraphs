#!/bin/mksh
# © 2022, 2026 mirabilos <m$(date +%Y)@mirbsd.de> Ⓕ MIT

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
	rm -f env-patcher.tmp*
	print -ru2 "I: patching $fn for !prod=$rpl"
	python3 "$mydir"/smap-out.py "$fn" env-patcher.tmp-in.js env-patcher.tmp-in.map
	print -r -- 'await require(process.env.s)(process.env.r);' | \
	    s="$mydir"/env-patcher.js r="$rpl" \
	    NODE_REPL_HISTORY= NODE_NO_READLINE=1 $node_js -i
	python3 "$mydir"/smap-in.py env-patcher.tmp-out.js env-patcher.tmp-out.map "$fn" --nonl
done
rm -f env-patcher.tmp*
print -ru2 "I: done patching"
