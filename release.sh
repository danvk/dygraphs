#!/bin/bash

VERSION=$1
if [ "${VERSION}" == "" ] ; then
  echo "usage: $0 VERSION"
  exit 1
fi

function fail() {
  echo $*
  exit 1
}

TMP=/tmp
TMPDIR_BASE=$(mktemp -d ${TMP}/dygraph-build.XXXXXX)
LOCALDIR=dygraphs-${VERSION}
TMPDIR=${TMPDIR_BASE}/${LOCALDIR}
ZIPFILE=${TMPDIR}/dygraphs-${VERSION}.zip
LOG_FILE=${TMPDIR}/build.log

# Build the release to $ZIPFILE, output going to stdout and stderr, to be logged
# by the caller.
#
function do_release() {
  echo Starting to build dygraphs
  echo ==============
  echo Release ${VERSION}
  echo in ${TMPDIR}
  echo at $(date)
  echo commit is $(git log -n 1 --pretty=%H)
  echo =================

  make clean || fail "Clean failed"

  mkdir ${TMPDIR}/docs

  make test || fail "Tests failed"
  make test-combined || fail "Combined tests failed"
  make lint || fail "Lint failed"
  make generate-combined || fail "generate-combined failed"

  # TODO(konigsberg): Should this .js be numbered? I think so.
  cp dygraphs-combined.js ${TMPDIR}/dygraphs-combined.js

  make generate-documentation || fail "generate-documentation failed"
  cp -pR docs ${TMPDIR}/docs

  cd ${TMPDIR_BASE} ; zip -9r ${ZIPFILE} ./${LOCALDIR} ; cd - >/dev/null
}

mkdir -p ${TMPDIR}
touch ${LOG_FILE}
echo log is at ${LOG_FILE}

do_release 2>&1 | tee ${LOG_FILE}

# Freshen the build log
cd ${TMPDIR_BASE} ; zip -9 ${ZIPFILE} ./${LOCALDIR}/build.log ; cd -

echo ZIP at ${ZIPFILE}
make clean || fail "Clean failed"
echo rm -rf ${TMPDIR}
