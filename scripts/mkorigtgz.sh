#!/bin/mksh
# © 2019, 2023 mirabilos <tg@debian.org> Ⓕ CC0

thisprojecttopdir=dygraphs-
thisprojectprefix=dygraphs_
thisprojectsuffix=.orig.tar.gz
set -A usecompressor -- gzip -n9
function thisprojectversionmapping {
	REPLY=${1#v}
}

export LC_ALL=C
unset LANGUAGE
set -e
set -o pipefail

r=$(git rev-parse --show-toplevel)
[[ $r != /* ]] || r=$(realpath "$r")
if [[ $r != /* || "$(realpath .)" != "$r"?(/*) ]]; then
	print -ru2 -- "E: could not determine repository root"
	exit 1
fi
w=$PWD
cd "$r"

x=$(git status --porcelain) || x='<<ERROR>>'
if [[ -n $x ]]; then
	print -ru2 -- "N: git status info follows"
	print -r -- "$x" | sed 's/^/N:  /' >&2
	print -ru2 -- "E: source tree not clean"
	exit 1
fi

v=$(git describe --always --dirty --tags) || x='<<ERROR>>'
if [[ $v != [0-9A-Za-z]+([0-9A-Za-z.-]) ]]; then
	print -ru2 -- "E: cannot describe version"
	print -ru2 -- "N: $v"
	exit 1
fi
set -x
v=${|thisprojectversionmapping "$v";}
d=${thisprojecttopdir}$v
f=${thisprojectprefix}$v${thisprojectsuffix}
T=$(mktemp -d "$r/.tmp.XXXXXXXXXX")
trap 'set +e; cd "$r"; rm -rf "$T"' EXIT
mkdir -p "$T/$d"

x=$(git show --no-notes -s --pretty=tformat:%cd --date=format:%Y%m%d%H%M.%S)
[[ $x = 2[01][0-9][0-9][0-1][0-9][0-3][0-9][0-2][0-9][0-5][0-9].[0-6][0-9] ]]
git ls-tree -r --name-only -z HEAD | sort -z >"$T/.flst"

<"$T/.flst" xargs -0 touch -h -t "$x" --
<"$T/.flst" pax -rw -0 -l -pe "$T/$d/"
cd "$T"
jdupes -rL .

export d
<"$T/.flst" perl -0nle 'print "$ENV{d}/$_";' | \
    pax -w -0 -P -x ustar -o write_opt=nodir -b 512 -M dist | \
    "${usecompressor[@]}" >"$w/${f}~"
mv "$w/${f}~" "$w/$f"
