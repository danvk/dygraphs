#!/bin/sh

echo ::group::Check whether .pages.sh failed anywhere
state=$(cat .post.state || echo state-file-missing)
if test -n "$state"; then
	echo "E: .pages.sh failed in: $state"
	exit 1
fi
echo "I: nope, ok"
echo ::endgroup::
