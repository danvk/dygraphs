'''
Shared code for ssi_server.py and ssi_expander.py.
'''

import re
import pathlib

_ssierr = b"<!-- SSI ERROR -->"
_ssiok = b""

def _dovar(vars, match, e, fn):
    cmd = match.group(1)
    var = match.group(2)
    val = match.group(3)

    if cmd == b"set":
        if val is None:
            e("SSI set(%s) without value" % var, fn)
            return _ssierr
        vars[var] = val
        return _ssiok
    elif cmd == b"echo":
        if val is not None:
            e("SSI get(%s) with value" % var, fn)
        if not var in vars:
            e("SSI get(%s) without set" % var, fn)
            return _ssierr
        return vars[var]
    else:
        e("SSI unknown command(%s)" % cmd, fn)
    return _ssierr

def _slurp(path):
  with open(path, 'rb') as f:
    return f.read()

def InlineIncludes(path, errorfn):
  """Read a file, expanding <!-- #include --> statements."""
  content = _slurp(path)
  vars = {}
  content = re.sub(br'<!-- *#include *virtual=[\'"]([^\'"]+)[\'"] *-->',
      lambda x: _slurp(x.group(1)),
      content)
  content = re.sub(br'<!-- *#(set|echo) *var=[\'"]([^\'"]+)[\'"](?: *value=[\'"]([^\'"]+)[\'"])? *-->\s*',
      lambda x: _dovar(vars, x, errorfn, path),
      content)
  return content
