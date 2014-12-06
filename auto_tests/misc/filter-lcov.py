#!/usr/bin/env python
"""Remove unwanted files from LCOV data.

jstd and node-coveralls won't do this themselves, so we have to!

Usage:
    cat lcov.dat | ./filter-lcov.py > filtered-lcov.dat
"""

import fileinput
import re

# Exclude paths which match any of these regular expressions.
exclude_res = [
    re.compile(r'auto_tests')
]

def is_ok(path):
    for regex in exclude_res:
        if re.search(regex, path):
            return False
    return True


writing = False
for line in fileinput.input():
    line = line.strip();
    if line.startswith('SF:'):
        path = line[3:]
        writing = is_ok(path)
    if writing:
        print line
