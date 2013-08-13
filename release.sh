#!/bin/bash
# This script "releases" a version of dygraphs.

if [ $# -ne 1 ]; then
  echo "Usage: $0 X.Y.Z" >&2
  exit 1
fi

VERSION=$1
echo $VERSION | egrep '\d+\.\d+\.\d+' > /dev/null
if [ $? -ne 0 ]; then
  echo "Version must be of the form 1.2.3 (got '$VERSION')" >&2
  exit 1
fi

# Make sure this is being run from a release branch with the correct name.
branch=$(git rev-parse --abbrev-ref HEAD)
if [ $branch != "release-$VERSION" ]; then
  echo "Must be on a branch named 'release-$VERSION' (found '$branch')" >&2
  exit 1
fi

git status | grep 'working directory clean' > /dev/null
if [ $? -ne 0 ]; then
  echo "Must release with a clean working directory. Commit your changes." >&2
  exit 1
fi

make lint test test-combined
if [ $? -ne 0 ]; then
  echo "Tests failed. Won't release!" >&2
  exit 1
fi

# Push a permanent copy of documentation & generated files to a versioned copy
# of the site. This is where the downloadable files are generated.
# TODO(danvk): make sure this actually generates the downloadable files!
echo "Pushing docs and generated files to dygraphs.com/$VERSION"
./push-to-web.sh dygraphs.com:dygraphs.com/$VERSION
if [ $? -ne 0 ]; then
  echo "Push to web failed" >&2
  exit 1
fi

# Everything is good. Tag this release and push it.
COMMIT=$(git rev-parse HEAD)
echo "Tagging commit $COMMIT as version $VERSION"
git tag -a "v$VERSION" -m "Release of version $VERSION"
git push

echo "Release was successful!"
echo "Don't forget to merge changes on this branch back into master."
