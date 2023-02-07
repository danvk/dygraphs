# v2.2.0

This is the first “full” release after v2.1.0 with the following news:

## Breaking changes
- Stop parsing the deprecated 8-digit ‘YYYYMMDD’ date format (#984) (#985) (#1023)
- GWT “support” is no longer pertinent as we cannot recompile the binary JAR;
  the latter is still available from the website for now

## New features
- Add option to colour the range selector’s veil (#856)
- Added strokeStyle option to crosshair plugin (#955)
- Support DocumentFragment as a result from a legendFormatter function (#958) (#959)
- Add data index to legendFormatter data (#965)
- Implement #RRGGBB[AA] hex colour parsing
- Make animateBackgroundFade into an option
- Add new “resizable” option using ResizeObserver on maindiv + CSS
- Add offset config for legend div in follow mode (#946)

## Bugfixes
- Fix duplicate annotation when having duplicate points (#826)
- Make sure that canvasx and canvasy properties are initialised from the start (#896)
- Fix issue #781 when the y range is zero (#909)
- Synchroniser now calls highlightCallback (#935)
- Fix drawAxes to allow one of two Y axes to be drawn (#936)
- LEGEND: Don’t show Y if value is undefined (#853) (#947)
- Fixed 'Cannot read property 'length' of undefined' issue (#962) (#963)
- Two fixes in the calculations of pinch-zoom (#990)
- Fix for double paint of grid of x-axis (#1007)
- Fix number of days in a year (#1012)
- Fix labelsKMB and labelsKMG2 (#571) (#994) (#1022)
- Fix label position in onmouseover legend mode was never updated
- Fix several cases of mispositioning/missizing by enabling elements before using offsetWidth etc.
- Make it possible to use logscale (and sigma, wilsonInterval) per-axis (#986)

## Other user-visible changes
- Documentation is now shipped (mostly self-contained) in the release
- Tests that use Google JSAPI are now marked ⚠ and no other external content is loaded anywhere
- Calculate legend positioning relative to closest data point (#1013)
- Add missing documentation about annotations xval option (#992)
- source mapping URLs are now correct (#1027)
- Ship ES5 versions of extras (#952), use them in examples
- Fix documentation/website HTML/CSS/JS bugs (#979) (#1008)
- On the website, external links are now clearly labelled
- The documentation and website now have browsable subdirectories
  by manually generated directory index files
- Link to UNPKG as CDN as well (to keep neutral; use of CDNs in websites violates the EU-GDPR)
- Most issues with right-to-left languages should now be fixed (#1019)
- Document that Dygraph will misbehave if the main div has padding

## Internal refactors/fixes
- Use link href, not link src (#904)
- Add missing semicolon in externs (#964)
- Large build system improvements relying in large parts on Debian and GHA
- Full licence review as part of uploading to Debian (#1024) (#1025) (#1029);
  drop embedded code copies
- Fix some JSDoc warnings
- Update to contemporary versions of Python 3, jQuery, Babel, etc.
- Add copies of design documents that were previously only available on Google Docs
  or part of GitHub issues to offline documentation
- Nuke useless semicola after function declaration bodies
- Fix closure type annotation in hairlines.js
- Remove already commented-out obsolete, or redundant, code
