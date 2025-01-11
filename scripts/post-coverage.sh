#!/bin/mksh

# uncomment this to skip posting to coveralls.io
# comment the line out to post
#exit 0

if test -n "$CI"; then
  <coverage/lcov.info ./node_modules/.bin/coveralls || \
    echo "N: above errors posting to coveralls.io are ignored"
fi

true  # reset exit code -- failure to post coverage shouldn't be an error.
