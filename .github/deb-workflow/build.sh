#!/bin/sh
#-
# © mirabilos Ⓕ MirBSD or CC0

# Workaround for Microslop GitHub Actions incapabilities

me=$0
case $me in
(-*) echo 'E: huh?'; exit 255 ;;
(build.sh|*/build.sh) ;;
(*) echo 'E: cannot find myself'; exit 255 ;;
esac
test -s "$me" || { echo 'E: I am empty?'; exit 255; }

if test -e .deb.statefile; then
	echo 'E: repeat run, working directory not clean'
	exit 255
fi

bash "${me%sh}real" "$@" || echo 'W: nonzero exit status, failing later'
