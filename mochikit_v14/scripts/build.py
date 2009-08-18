#!/usr/bin/env python
execfile('scripts/make_docs.py')
execfile('scripts/pack.py')
import os
import sys
import glob
import zipfile
import re
def json_encode(o, indent=0):
    if isinstance(o, dict):
        if len(o) == 0:
            yield '{}'
        else:
            yield '{\n'
            first = True
            for key, value in o.iteritems():
                if first:
                    first = False
                else:
                    yield ',\n'
                yield ' ' * (indent + 4)
                assert isinstance(key, (basestring, float, int, long))
                for chunk in json_encode(key):
                    yield chunk
                yield ': '
                for chunk in json_encode(value, indent + 4):
                    yield chunk
            yield '\n' + (' ' * indent) + '}'
    elif isinstance(o, list):
        if len(o) == 0:
            yield '[]'
        else:
            yield '[\n'
            first = True
            for value in o:
                if first:
                    first = False
                else:
                    yield ',\n'
                yield ' ' * (indent + 4)
                for chunk in json_encode(value, indent + 4):
                    yield chunk
            yield '\n' + (' ' * indent) + ']'
    elif isinstance(o, basestring):
        yield '"' + o.replace('\\', '\\\\').replace('"', '\\"') + '"'
    elif isinstance(o, (float, int, long)):
        yield str(o)
    else:
        raise NotImplementedError
VERSION = re.search(
    r"""(?mxs)MochiKit.MochiKit.VERSION\s*=\s*['"]([^'"]+)""",
    file('MochiKit/MochiKit.js').read()
).group(1)
META = dict(
    name='MochiKit',
    author=['Bob Ippolito <bob@redivi.com>'],
    abstract='Python-inspired JavaScript kit',
    license='mit',
    version=VERSION,
    build_requires={'Test.Simple': '0.11'},
    recommends={'JSAN': '0.10'},
    provides={},
    generated_by="MochiKit's build script",
)
FILES = glob.glob('lib/MochiKit/*.js')
for fn in FILES:
    modname = os.path.splitext(os.path.basename(fn))[0]
    META['provides'][modname] = dict(file=fn, version=VERSION)
if not os.path.exists('dist'):
    os.makedirs('dist')

pkg = '%(name)s-%(version)s' % META
z = zipfile.ZipFile(
    os.path.join('dist', pkg) + '.zip',
    'w',
    zipfile.ZIP_DEFLATED
)
MANIFEST = ['Changes', 'META.json', 'MANIFEST\t\t\tThis list of files']
z.writestr(os.path.join(pkg, 'META.json'), ''.join(json_encode(META)))
z.write(
    os.path.join('doc', 'rst', 'MochiKit', 'VersionHistory.rst'),
    os.path.join(pkg, 'Changes')
)

IGNOREDIRS = ['.svn', 'dist', 'scripts']
src = os.path.join('.', '')
dst = os.path.join(pkg, '')

for root, dirs, files in os.walk(src):
    for ex in IGNOREDIRS:
        if ex in dirs:
            dirs.remove(ex)
    for fn in files:
        if fn.startswith('.'):
            continue
        fn = os.path.join(root, fn)
        mfn = fn[len(src):]
        MANIFEST.append(mfn)
        if mfn.startswith('MochiKit/'):
            mfn = 'lib/' + mfn
        dstfn = os.path.join(dst, mfn)
        if os.path.splitext(fn)[1] == '.html':
            s = file(fn).read()
            s = s.replace('/MochiKit/', '/lib/MochiKit/')
            s = s.replace(
                "JSAN.addRepository('..');",
                'JSAN.addRepository("../lib");',
            )
            z.writestr(dstfn, s)
        else:
            z.write(fn, dstfn)

z.writestr(os.path.join(pkg, 'MANIFEST'), '\n'.join(MANIFEST + ['']))

z.close()
