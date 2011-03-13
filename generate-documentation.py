#!/usr/bin/python
import json
import glob
import re

# Pull options reference JSON out of dygraph.js
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

# This is helpful for differentiating uses of options like 'width' and 'height'
# from appearances of identically-named options in CSS.
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

# Find text followed by a colon. These won't all be options, but those that
# have the same name as a Dygraph option probably will be.
prop_re = re.compile(r'\b([a-zA-Z0-9]+):')
for test_file in glob.glob('tests/*.html'):
  braced_html = find_braces(file(test_file).read())
  ms = re.findall(prop_re, braced_html)
  for opt in ms:
    if opt in docs and test_file not in docs[opt]['tests']:
      docs[opt]['tests'].append(test_file)

# Extract a labels list.
labels = []
for nu, opt in docs.iteritems():
  for label in opt['labels']:
    if label not in labels:
      labels.append(label)

print """
<html>
<head>
  <title>Dygraphs Options Reference</title>
  <style type="text/css">
    p.option {
      padding-left: 25px;
      max-width: 800px;
    }
  </style>
</head>
<body>
"""

print 'Options categories:\n'
print '<ul>\n'
for label in sorted(labels):
  print '  <li><a href="#%s">%s</a>\n' % (label, label)
print '</ul>\n\n'

def name(f):
  """Takes 'tests/demo.html' -> 'demo'"""
  return f.replace('tests/', '').replace('.html', '')

for label in sorted(labels):
  print '<a name="%s"><h2>%s</h2>\n' % (label, label)

  for opt_name in sorted(docs.keys()):
    opt = docs[opt_name]
    if label not in opt['labels']: continue
    tests = opt['tests']
    if not tests:
      examples_html = '<font color=red>NONE</font>'
    else:
      examples_html = ' '.join(
        '<a href="%s">%s</a>' % (f, name(f)) for f in tests)

    print """
  <p class='option'><b>%(name)s</b><br/>
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


# This page was super-helpful:
# http://jsbeautifier.org/
