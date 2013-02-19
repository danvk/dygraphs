#!/bin/bash
which phantomjs > /dev/null
if [ $? != 0 ]; then
  echo You must install phantomjs to use command-line testing.
  echo Visit http://www.phantomjs.org/ to get it.
  echo
  echo OR open auto_tests/misc/local.html in a browser.
  echo OR follow the instructions in auto_tests/README
  exit 1
fi

phantomjs phantom-driver.js $*
