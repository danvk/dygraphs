#!/bin/sh
set -ex
cd "$(dirname "$0")/.."
rm -rf disttmp
git clean -dfx -e node_modules -e package-lock.json
