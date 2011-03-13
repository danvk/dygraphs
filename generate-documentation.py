#!/usr/bin/python
import json
import glob
import re

js = ''
in_json = False
for line in file('dygraph.js'):
  if '<JSON>' in line:
    in_json = True
  elif '</JSON>' in line:
    in_json = False
  elif in_json:
    js += line

# TODO(danvk): better errors here.
assert js
docs = json.loads(js)

# Go through the tests and find uses of each option.
for opt in docs:
  docs[opt]['tests'] = []

def find_braces(txt):
  """Really primitive method to find text inside of {..} braces.
  Doesn't work if there's an unmatched brace in a string, e.g. '{'. """
  out = ''
  level = 0
  for char in txt:
    if char == '{':
      level += 1
    if level >= 1:
      out += char
    if char == '}':
      level -= 1
  return out

prop_re = re.compile(r'\b([a-zA-Z]+):')
for test_file in glob.glob('tests/*.html'):
  braced_html = find_braces(file(test_file).read())
  ms = re.findall(prop_re, braced_html)
  for opt in ms:
    if opt in docs and test_file not in docs[opt]['tests']:
      docs[opt]['tests'].append(test_file)

def name(f):
  return f.replace('tests/', '').replace('.html', '')

for opt_name in sorted(docs.keys()):
  opt = docs[opt_name]
  tests = opt['tests']
  if not tests:
    examples_html = '<font color=red>NONE</font>'
  else:
    examples_html = ' '.join(
      '<a href="%s">%s</a>' % (f, name(f)) for f in tests)

  print """
<p><b>%(name)s</b><br/>
%(desc)s<br/>
<i>Type: %(type)s<br/>
Default: %(default)s</i><br/>
Examples: %(examples_html)s<br/>
<br/>
""" % { 'name': opt_name,
        'type': opt['type'],
        'default': opt['default'],
        'desc': opt['description'],
        'examples_html': examples_html}

