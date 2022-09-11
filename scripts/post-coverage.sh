#!/bin/bash
if [ $CI ]; then
  <coverage/lcov.info ./node_modules/.bin/coveralls
fi

true  # reset exit code -- failure to post coverage shouldn't be an error.
