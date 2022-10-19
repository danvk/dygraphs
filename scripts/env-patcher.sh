#!/bin/mksh
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

set -eo pipefail
mydir=$(realpath "$0/..")

if [[ $1 = development ]]; then
#	rpl=true
	rpl=\"$1\"
elif [[ $1 = production ]]; then
#	rpl=false
	rpl=\"$1\"
else
	print -ru2 "$0: syntax error"
	exit 1
fi
shift

grep -FrlZ process.env.NODE_ENV "$@" | while IFS= read -d '' -r fn; do
	print -ru2 "I: patching $fn for !prod=$rpl"
	"$mydir"/smap-out.py "$fn" env-patcher.tmp.js env-patcher.tmp.map
	nodejs "$mydir"/env-patcher.js "$rpl"
	"$mydir"/smap-in.py env-patcher.tmp.js env-patcher.tmp.map "$fn" --nonl
done
rm -f env-patcher.tmp.js env-patcher.tmp.map
print -ru2 "I: done patching"
