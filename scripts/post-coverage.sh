#!/bin/bash
cat coverage/lcov.info | ./node_modules/.bin/coveralls

echo ''  # reset exit code -- failure to post coverage shouldn't be an error.
