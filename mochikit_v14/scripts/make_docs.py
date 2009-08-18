#!/usr/bin/env python
import os
import sys
try:
    from pkg_resources import require
    require("docutils>0.3.9")
except ImportError:
    pass
from docutils import nodes, utils
from docutils.core import publish_parts
from docutils.parsers.rst import roles

TEMPLATE = u"""%(html_prolog)s
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
%(html_head)s
<link rel="stylesheet" href="../../../include/css/documentation.css" type="text/css" />
<script type="text/javascript" src="../../../packed/MochiKit/MochiKit.js"></script>
<script type="text/javascript" src="../../js/toc.js"></script>
</head>
<body>
%(html_body)s
</body>
</html>
"""
def mochi_name(text):
    name = text.split('(', 1)[0].split()[0]
    base = ''
    if name.startswith('MochiKit.'):
        # cross-reference
        parts = name.split('.')
        base = parts[1] + '.html'
        if parts[-1] in ("call", "apply"):
            parts.pop()
        name = '.'.join(parts[2:])
    return base, name

def role_mochiref(role, rawtext, text, lineno, inliner, options=None, content=[]):
    if options is None:
        options = {}
    base, name = mochi_name(text)
    ref = base
    if name:
        ref += '#fn-' + name.lower()
    roles.set_classes(options)
    options.setdefault('classes', []).append('mochiref')
    node = nodes.reference(
        text, utils.unescape(text), refuri=ref, **options)
    return [node], []

roles.register_canonical_role('mochiref', role_mochiref)

def role_mochidef(role, rawtext, text, lineno, inliner, options=None, content=[]):
    if options is None:
        options = {}
    base, name = mochi_name(text)
    assert base == ''
    ref = 'fn-' + utils.unescape(name.lower())
    anchor = nodes.raw('', '\n<a name="%s"></a>\n' % (ref,), format='html')
    roles.set_classes(options)
    options.setdefault('classes', []).append('mochidef')
    node = nodes.reference(
        text, utils.unescape(text), refuri='#' + ref, **options)
    return [anchor, node], []

roles.register_canonical_role('mochidef', role_mochidef)
        


def main():
    basepath = os.path.join('doc/rst', '')
    destpath = os.path.join('doc/html', '')
    for root, dirs, files in os.walk(basepath):
        if '.svn' in dirs:
            dirs.remove('.svn')
        destroot = destpath + root[len(basepath):]
        if not os.path.exists(destroot):
            os.makedirs(destroot)
        for fn in files:
            basefn, ext = os.path.splitext(fn)
            if ext == '.rst':
                srcfn = os.path.join(root, fn)
                dest = os.path.join(destroot, basefn + '.html')
                if basefn != "index":
                    try:
                        if os.path.getmtime(dest) >= os.path.getmtime(srcfn):
                            print srcfn, "not changed"
                            continue
                    except OSError:
                        pass
                print srcfn
                parts = publish_parts(
                    source_path=srcfn,
                    source=file(srcfn, 'rb').read().decode('utf8'),
                    destination_path=dest,
                    writer_name='html',
                    settings_overrides=dict(
                        embed_stylesheet=False,
                        stylesheet_path='include/css/documentation.css',
                    ),
                )
                parts['html_head'] = parts['html_head'] % ('utf-8',)
                parts['html_prolog'] = parts['html_prolog'] % ('utf-8',)
                doc = (TEMPLATE % parts).encode("utf8")
                out = file(dest, 'wb')
                out.write(doc)
                out.close()

if __name__ == '__main__':
    main()
