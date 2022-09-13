'''
Shared code for ssi_server.py and ssi_expander.py.
'''

import re
import pathlib

def _slurp(path):
  with open(path, 'rb') as f:
    return f.read()

def InlineIncludes(path):
  """Read a file, expanding <!-- #include --> statements."""
  content = _slurp(path)
  content = re.sub(br'<!-- *#include *virtual=[\'"]([^\'"]+)[\'"] *-->',
      lambda x: _slurp(x.group(1)),
      content)
  return content
