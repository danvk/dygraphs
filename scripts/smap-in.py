#!/usr/bin/python3
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

import base64
import json
import sys

_b64leader = 'sourceMappingURL=data:application/json;charset=UTF-8;base64,'
_linefmt = '//# %s%s\n'

if len(sys.argv) == 4:
    donl = True
elif len(sys.argv) == 5 and sys.argv[4] == '--nonl':
    # evil hack for browserify
    donl = False
else:
    sys.stderr.write('E: syntax: python3 smap-in.py in.js in.map out.js\n')
    sys.exit(1)

with open(sys.argv[1], 'r') as f:
    lines = f.readlines()

if lines[-1].startswith('//# sourceMappingURL='):
    lines.pop()
elif lines[-1].startswith('/*# sourceMappingURL='):
    _linefmt = '/*# %s%s */\n'
    lines.pop()

with open(sys.argv[2], 'r') as f:
    smap = json.load(f)

# clear "file" key as it’s inappropriate for embedded maps
smap.pop('file', None)

smap = json.dumps(smap, ensure_ascii=False, allow_nan=False,
  indent=None, separators=(',', ':'))
smap = base64.b64encode(smap.encode('UTF-8')).decode('UTF-8')

while lines[-1] == '\n':
    lines.pop()
if not lines[-1].endswith('\n'):
    lines.append('\n')
if not donl:
    # evil hack for browserify
    _linefmt = _linefmt.rstrip('\n')
lines.append(_linefmt % (_b64leader, smap))

with open(sys.argv[3], 'w') as f:
    f.writelines(lines)
