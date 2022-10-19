#!/usr/bin/python3
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

import base64
import json
import sys

_leader = '//# sourceMappingURL=data:application/json;charset:utf-8;base64,'

if len(sys.argv) == 4:
    smapname = sys.argv[3]
elif len(sys.argv) == 5:
    smapname = sys.argv[4]
else:
    sys.stderr.write('E: syntax: smap-out.py in.js out.js out.map [maplink]\n')
    sys.exit(1)

with open(sys.argv[1], 'r') as f:
    lines = f.readlines()

if not lines[-1].startswith('//# sourceMappingURL'):
    sys.stderr.write('E: file does not contain a source map\n')
    sys.exit(1)

if not lines[-1].startswith(_leader):
    sys.stderr.write('E: incomprehensible source map\n')
    sys.exit(1)

smap = lines.pop()
smap = smap[len(_leader):]
smap = base64.b64decode(smap.rstrip('\n'), validate=True).decode('UTF-8')
smap = json.loads(smap)

with open(sys.argv[3], 'w') as f:
    json.dump(smap, f, ensure_ascii=False, allow_nan=False,
      indent=2, separators=(',', ': '))

while lines[-1] == '\n':
    lines.pop()
if not lines[-1].endswith('\n'):
    lines.append('\n')
lines.append('//# sourceMappingURL=%s\n' % smapname)

with open(sys.argv[2], 'w') as f:
    f.writelines(lines)
