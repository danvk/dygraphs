#!/bin/bash
# Checks that no ".only" has made it into tests. This should never be commited,
# since it will disable the vast majority of tests.

if grep -R '\.only(' auto_tests/tests; then
  echo 'Remove .only from tests before committing.'
  exit 1
fi

exit 0
