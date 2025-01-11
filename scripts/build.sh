#!/bin/mksh
set -ex
case $KSH_VERSION {
(*MIRBSD\ KSH*) ;;
(*) echo E: do not call me with bash or something; exit 255 ;;
}

# Build code, tests, browser bundles.
mksh scripts/build-js.sh

# Build documentation.
mksh scripts/build-docs.sh

# This is for on the webserver
rm -rf site _site
mkdir site
cd docroot
pax -rw . ../site/
set -A torm -- ../site/LICENSE.txt ../site/dist
[[ -n $IS_ACTUAL_DEBIAN_BUILD ]] || set -A torm+ -- ../site/.jslibs/*
rm "${torm[@]}"
[[ -n $IS_ACTUAL_DEBIAN_BUILD ]] || cp -L .jslibs/* ../site/.jslibs/
cd ..
pax -rw LICENSE.txt dist site/
rm -f site/dist/tests.js
find site -type d -print0 | xargs -0r chmod 0755 --
find site -type f -print0 | xargs -0r chmod 0644 --
set +ex
rv=0
x=$(find site \( ! -type d -a ! -type f -a ! -type l \) -ls) || {
	print -ru2 -- "E: could not check for bogus filetypes"
	rv=1
	x=
}
[[ -z $x ]] || {
	print -ru2 -- "E: bogus filetypes found"
	print -r -- "$x" | sed 's/^/N: /' >&2
	rv=1
}
if [[ $(find --help 2>&1) = *' -printf '* ]]; then
	x=$(find site -type l -printf '(%Y)%p\n') || {
		print -ru2 -- "E: could not check for dangling symlinks"
		rv=1
		x=
	}
	[[ -z $(print -r -- "$x" | grep -v '^[(][dfN][)]') ]] || {
		print -ru2 -- "E: bad filetypes found"
		print -r -- "$x" | sed 's/^/N: /' >&2
		rv=1
	}
	x=$(print -r -- "$x" | grep '^[(]N[)]')
	[[ -z $x ]] || {
		if [[ -n $IS_ACTUAL_DEBIAN_BUILD ]]; then
			pf=W:
			(( rv |= 2 ))
		else
			pf=E:
			rv=1
		fi
		print -ru2 -- "$pf dangling symlinks found"
		print -r -- "$x" | sed 's/^/N: /' >&2
	}
fi
if (( rv & 1 )); then
	exit 1
elif (( rv == 0 )); then
	print -ru2 -- "I: build done"
fi
exit 0
