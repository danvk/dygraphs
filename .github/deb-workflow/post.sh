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

set +x
switchgroup Check whether build failed anywhere
state=$(cat .deb.statefile || echo state-file-missing)
if [[ $state != klaar ]]; then
	echo "E: build failed in: $state"
	exit 1
fi
echo "I: nope, ok"
echo ::endgroup::
