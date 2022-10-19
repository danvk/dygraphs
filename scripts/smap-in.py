#!/usr/bin/python3
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

import base64
import json
import sys

_leader = '//# sourceMappingURL=data:application/json;charset:utf-8;base64,'

if len(sys.argv) != 4:
    sys.stderr.write('E: syntax: smap-in.py in.js in.map out.js\n')
    sys.exit(1)

with open(sys.argv[1], 'r') as f:
    lines = f.readlines()

if lines[-1].startswith('//# sourceMappingURL'):
    lines.pop()

with open(sys.argv[2], 'r') as f:
    smap = json.load(f)

smap = json.dumps(smap, ensure_ascii=False, allow_nan=False,
  indent=None, separators=(',', ':'))
smap = base64.b64encode(smap.encode('UTF-8')).decode('UTF-8')

while lines[-1] == '\n':
    lines.pop()
if not lines[-1].endswith('\n'):
    lines.append('\n')
lines.append('%s%s\n' % (_leader, smap))

with open(sys.argv[3], 'w') as f:
    f.writelines(lines)
