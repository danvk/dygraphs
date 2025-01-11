#!/bin/mksh
set -exo pipefail
case $KSH_VERSION {
(*MIRBSD\ KSH*) ;;
(*) echo E: do not call me with bash or something; exit 255 ;;
}

cd "$(dirname "$0")/.."

gitstatus=$(git status --porcelain)
if [[ -n $gitstatus ]]; then
	: repo unclean
	false
fi

curbranch=$(git branch --show-current)
[[ -n $curbranch ]]
curremote=$(git config --get "branch.$curbranch.remote")
[[ -n $curremote ]]
curremurl=$(git config --get "remote.$curremote.url")
[[ $curremurl = git@github.com:+([!\\\"])/+([!\\\"]).git ]]
shortrem=${curremurl%.git}
shortrem=${shortrem#git@github.com:}

curpkg=$(<package.json)
print -r -- "${curpkg%\}}" \
    ", \"repository\": { \"type\": \"git\", \"url\": \"https://github.com/$shortrem.git\" }" \
    ", \"name\": \"@$shortrem\"" \
    "}" | jq . >package.json

set +e
npm_config_registry=https://npm.pkg.github.com npm publish "$@"
rv=$?
git checkout package.json || rv=255
exit $rv
