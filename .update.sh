#!/bin/mksh

set -exo pipefail

cd "$(dirname "$0")"

if [[ $1 != +([0-9a-f]) ]]; then
	print -ru2 "E: syntax: ./.update.sh commithashtorevert"
	exit 1
fi

x=$(git status --porcelain)
if [[ -n $x ]]; then
	print -ru2 "E: working tree unclean"
	print -r -- "$x" | sed 's/^/N: /' >&2
	exit 1
fi

git revert --no-edit "$1"
unzip -p ~/github-pages.zip artifact.tar | tar xf -
ts=$(date -Is -ud @"$(TZ=UTC stat -c %Y tests/index.html)")
git add -f .
git commit -a -S --date="$ts" -m 'update to GHA output file'
