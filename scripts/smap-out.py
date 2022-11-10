#!/usr/bin/python3
# © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

import base64
import json
import re
import sys

_linefmt = '//# %s%s\n'
_smap = re.compile('^(?://# |(?P<iscss>/\\*# ))sourceMappingURL=data:application/json(?:;charset[=:](?i:iso-ir-6|ANSI_X3\\.4-19[68][86]|ISO_646\\.irv:1991|ISO646-US|(?:US-|cs)?ASCII|us|(?:IBM|cp)367|(?:cs)?utf-?8))?;base64,(?P<b64>(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}[A-Za-z0-9+/=]=)?)(?(iscss) \\*/)\n?$', re.ASCII)

if len(sys.argv) == 2 and sys.argv[1] == '--test':
    rv = 0
    def t(s, css=False):
        global rv
        m = _smap.match(s)
        if m is None:
            print('no match', s)
            rv = 1
            return
        hascss = m.group('iscss') is not None
        if hascss != css:
            print('bogus css', hascss, s)
            rv = 1
        print('got b64', m.group('b64'))
    def f(s):
        global rv
        if _smap.match(s) is not None:
            print('bogus match', s)
            rv = 1

    t('//# sourceMappingURL=data:application/json;base64,')
    t('//# sourceMappingURL=data:application/json;base64,eh==')
    t('//# sourceMappingURL=data:application/json;base64,foo=')
    t('//# sourceMappingURL=data:application/json;base64,Zm9v')
    t('//# sourceMappingURL=data:application/json;base64,Zm9veh==')
    t('//# sourceMappingURL=data:application/json;base64,Zm9vfoo=')
    t('//# sourceMappingURL=data:application/json;base64,Zm9vYmFy\n')
    t('//# sourceMappingURL=data:application/json;charset=iso-ir-6;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=ANSI_X3.4-1968;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=ANSI_X3.4-1986;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=ISO_646.irv:1991;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=ISO646-US;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=US-ASCII;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=us;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=IBM367;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=cp367;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=csASCII;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=UTF-8;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset=csUTF8;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset:utf8;base64,foo=')
    t('//# sourceMappingURL=data:application/json;charset:ascii;base64,foo=')
    t('/*# sourceMappingURL=data:application/json;base64,css= */', css=True)
    f('//# sourceMappingURL=data:application/json;charset:latin1;base64,foo=')
    f('//# sourceMappingURL=data:application/json;charset:ascii;base64,foo')
    f('//# sourceMappingURL=data:application/json;charset:ascii;base64,foo-')
    f('//# sourceMappingURL=data:application/json;base64,Zm9vYmFy\r\n')
    print('test finished')
    sys.exit(rv)

if len(sys.argv) == 4:
    smapname = sys.argv[3]
elif len(sys.argv) == 5:
    smapname = sys.argv[4]
else:
    sys.stderr.write('E: syntax: smap-out.py in.js out.js out.map [maplink]\n')
    sys.exit(1)

with open(sys.argv[1], 'r') as f:
    lines = f.readlines()

if lines[-1].find('sourceMappingURL=') == -1:
    sys.stderr.write('E: file does not contain a source map\n')
    sys.exit(1)

smap = _smap.match(lines[-1])
if smap is None:
    sys.stderr.write('E: incomprehensible source map\n')
    sys.exit(1)

lines.pop()
if smap.group('iscss') is not None:
    _linefmt = '/*# %s%s */\n'
smap = smap.group('b64')
smap = base64.b64decode(smap.rstrip('\n'), validate=True).decode('UTF-8')
smap = json.loads(smap)

# clear "file" key as browserify writes the wrong one and it’s optional anyway
smap.pop('file', None)

with open(sys.argv[3], 'w') as f:
    json.dump(smap, f, ensure_ascii=False, allow_nan=False,
      indent=2, separators=(',', ': '))
    f.write('\n')

while lines[-1] == '\n':
    lines.pop()
if not lines[-1].endswith('\n'):
    lines.append('\n')
lines.append(_linefmt % ('sourceMappingURL=', smapname))

with open(sys.argv[2], 'w') as f:
    f.writelines(lines)
