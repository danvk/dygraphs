#!/bin/bash
#-
# © mirabilos Ⓕ MirBSD or CC0

echo ::group::Init
switchgroup() {
	printf '::%s\n' 'endgroup::' "group::$*"
}
exec 2>&1
set -ex
set -o pipefail
unset LANGUAGE
export LC_ALL=C.UTF-8 DEBIAN_FRONTEND=noninteractive

echo init >.deb.statefile
wd=$(realpath .)
[[ $wd = /* ]]
me=$(realpath "$0")
[[ $me = /* ]]
me=$(dirname "$me")
[[ $me = /* ]]
dr=$wd/result-$2
db=$dr/build
mkdir "$dr"

switchstate() {
	printf '%s\n' "$*" >"$wd/.deb.statefile"
}

switchgroup Setup $0 on Debian $2
cat >/etc/apt/apt.conf.d/92bla <<\EOF
debug::pkgproblemresolver "true";
Dpkg::Progress-Fancy "false";
// undo lenny breakage
APT::Install-Recommends "0";
APT::Install-Suggests "0";
APT::Get::Always-Include-Phased-Updates "true";
APT::Periodic::Enable "0";
EOF
rm -f /etc/apt/sources.list /etc/apt/sources.list.d/*
switchstate apt
cp "$me/$1.sources" /etc/apt/sources.list.d/
apt-get clean
apt-get update
apt-get install -y eatmydata
eatmydata apt-get --purge -y dist-upgrade
eatmydata apt-get install -y adduser build-essential debhelper devscripts

switchstate envsetup
switchgroup Set up build environment
cp -r repo "$db"
echo include-binaries >>"$db/debian/source/local-options"
adduser --system --group --shell /bin/bash --home "$dr" --no-create-home bauer
chown -R bauer:bauer "$db"
chgrp bauer "$dr"
chmod 2775 "$dr"
switchstate b-d
eatmydata apt-get -y build-dep "$db"

switchstate uscan
switchgroup Acquire origtgz
su - bauer -c 'cd build && exec uscan --verbose --rename --force-download'

switchstate building
switchgroup Build the package
su - bauer -c 'cd build && exec dpkg-buildpackage -e"Autobuilder <nobody@example.org>" --sanitize-env -us -uc'

switchstate postbuild
switchgroup Post-build steps
cp -r "$db"/dist "$wd/repo/"
# saves space in the upload thingy
(cd "$dr" && tar -cf - build | xz -e >build.txz && rm -rf build || rm -f build.txz)

switchstate apt-lintian
eatmydata apt-get install -y --install-recommends lintian
switchstate lintian
switchgroup Run lintian
su - bauer -c 'lintian -vIiE --pedantic --fail-on none *.changes'

switchgroup Set up NPM, to run the tests
switchstate npm-setup
# phantomjs needs libfontconfig and libfreetype
eatmydata apt-get install -y fontconfig npm
eatmydata env TMPDIR=/tmp npm install -g phantomjs@1.9.7-15
su - bauer -c 'cd ../repo && eatmydata env TMPDIR=/tmp npm install'
switchstate npm-test-source
switchgroup Run tests
su - bauer -c 'cd ../repo && eatmydata npm run test'
switchstate npm-test-min
su - bauer -c 'cd ../repo && eatmydata npm run test-min'

echo ::endgroup::
switchstate klaar
