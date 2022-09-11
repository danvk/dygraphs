#!/bin/bash

# uncomment this to skip posting to coveralls.io
# comment the line out to post
exit 0

if [ $CI ]; then
  <coverage/lcov.info ./node_modules/.bin/coveralls
fi

true  # reset exit code -- failure to post coverage shouldn't be an error.
