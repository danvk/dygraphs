# v2.2.1 (2023-02-16)

## Future incompatibilities
- `window.smoothPlotter` will not be set by `extras/smooth-plotter.js` any more RSN

## New features
- Permit initialising with `[]` as “no data yet” indicator (#597)
- The modularisation of the test setup also allows stable access to exported functions (e.g. `Dygraph._require('dygraphs/src/dygraph-utils.js').numberValueFormatter`) which makes writing one’s own value formatters easier (as usual, proceed with care, exports with an underscore are internal); see <https://dygraphs.com/tests/exported-symbols.html> for the exposed surface
- Provide Dygraph.onDOMready(cb) as lightweight jQuery(cb)/… alternative, to keep the demos/tests self-contained

## Bugfixes
- Fix synchroniser not calling user’s `drawCallback` when blocked (#953) plus do not redraw unnecessarily
- Documentation fixes and improvements including self-checks where possible
- Fix missing legend for `x == -1` (#1002)
- Allow ES6-importing the extras (#848) (#989) (#1009)
- Fix broken zoom also in the drawing test (same as #611/#953)
- Resetting `panEdgeFraction` now works
- Fix tests/unboxed-spark regression caused by PR #936
- Synchroniser doesn’t force x axis range if unzoomed (#956)

## Other user-visible changes
- Fix issue #611 in the drawing demo gallery (#953)
- `jq` is now also required to build
- Fix typos, wordings, apostrophes, etc.
- Export `pickDateTickGranularity` so overriding `dateTicker` is easier
- Error bars are now properly called high/low bands (#1004), but the options stay the same for compatibility
- Document annotations xval for Date better (#970)
- Document more strongly that series labels must be unique (#960)
- Remove references to nōn-existing `yAxisLabelWidth` option
- Fix jsFiddle links from gallery

## Internal refactors/fixes
- Shrink `tests.js` source map and make its build reproducible on Debian
- `tests/resizable.html` exposes the graph object, for quick F12 in-browser use
- Generate `versions.html` and release notes from new top-level [`CHANGES.md`](https://github.com/danvk/dygraphs/blob/master/CHANGES.md)
- Modularise dygraphs/tests setup so we can now also test the minified prod css/js (#1028)
- Generate stable orig tarballs for releases ourselves (we still use the NPM ones for binary tarballs)
- Less fragility with arrow function `this` rebinding check

# v2.2.0 (2023-01-25)

This is the first “full” release after v2.1.0 with the following news:

## Breaking changes
- Stop parsing the deprecated 8-digit ‘YYYYMMDD’ date format (#984) (#985) (#1023)
- GWT “support” is no longer pertinent as we cannot recompile the binary JAR; the latter is still available from the website for now

## New features
- Add option to colour the range selector’s veil (#856)
- Add `strokeStyle` option to crosshair plugin (#955)
- Support `DocumentFragment` as a result from a `legendFormatter` function (#958) (#959)
- Add data index to `legendFormatter` data (#965)
- Implement `#RRGGBB`/`#RRGGBBAA` hex colour parsing
- Make `animateBackgroundFade` into an option
- Add new `resizable` option using `ResizeObserver` on maindiv + CSS
- Add offset config for legend div in follow mode (#946)

## Bugfixes
- Fix duplicate annotation when having duplicate points (#826)
- Make sure that `canvasx` and `canvasy` properties are initialised from the start (#896)
- Fix issue #781 when the y range is zero (#909)
- Synchroniser now calls `highlightCallback` (#935)
- Fix `drawAxes` to allow one of two y axes to be drawn (#936)
- LEGEND: Don’t show y if value is undefined (#853) (#947)
- Fixed “Cannot read property 'length' of undefined” issue (#962) (#963)
- Two fixes in the calculations of pinch-zoom (#990)
- Fix for double paint of grid of x-axis (#1007)
- Fix number of days in a year (#1012)
- Fix `labelsKMB` and `labelsKMG2` (#571) (#994) (#1022)
- Fix label position in `onmouseover` legend mode was never updated
- Fix several cases of mispositioning/missizing by enabling elements before using `offsetWidth` etc.
- Make it possible to use `logscale` (and `sigma`, `wilsonInterval`) per-axis (#986)

## Other user-visible changes
- Documentation is now shipped (mostly self-contained) in the release
- Tests that use Google JSAPI are now marked ⚠ and no other external content is loaded anywhere
- Calculate legend positioning relative to closest data point (#1013)
- Add missing documentation about annotations `xval` option (#992)
- source mapping URLs are now correct (#1027)
- Ship ES5 versions of extras (#952), use them in examples
- Fix documentation/website HTML/CSS/JS bugs (#979) (#1008)
- On the website, external links are now clearly labelled
- The documentation and website now have browsable subdirectories by manually generated directory index files
- Link to UNPKG as CDN as well (to keep neutral; use of CDNs in websites violates the EU-GDPR)
- Most issues with right-to-left languages should now be fixed (#1019)
- Document that Dygraph will misbehave if the main div has padding

## Internal refactors/fixes
- Use link href, not link src (#904)
- Add missing semicolon in externs (#964)
- Large build system improvements relying in large parts on Debian and GHA
- Full licence review as part of uploading to Debian (#1024) (#1025) (#1029); drop embedded code copies
- Fix some JSDoc warnings
- Update to contemporary versions of Python 3, jQuery, Babel, etc.
- Add copies of design documents that were previously only available on Google Docs or part of GitHub issues to offline documentation
- Nuke useless semicola after function declaration bodies
- Fix closure type annotation in `hairlines.js`
- Remove already commented-out obsolete, or redundant, code

# v2.1.0 (2017-12-08)

## New features
- Double click event can be captured and cancelled by plugins (#840)
- `setAnnotations`’ second parameter is now an optional boolean (#851)
- Add `pixelRatio` option, which may allow improved performance on smaller screens by controlling the canvas’ pixel ratio (#877)
- x axis label and tick logic can now operate at millisecond-level granularity (#893)

## Bug fixes
- Repair a bug in “Custom interaction models” demo (#825)

## Internal refactors/fixes
- Fix various spelling mistakes (#844)
- Fix a couple of type signatures in `dygraph-externs.js` (#859)

# v2.0.0 (2017-01-11)

## Breaking changes
- JS files were renamed to `dygraph.js` and `dygraph.min.js`.
- There’s now a `dygraph.css` file that you must include.
- Dropped support for old IE and other non-standard browsers. dygraphs works in IE11. I’m not sure about IE9 and IE10.
- Double-click to unzoom zooms all the way out (and ignores `valueRange`).
- Dropped old-style per-axis/per-series options.

## New features
- Add a `legendFormatter` option (#683)
- `this` is the Dygraph object in all callbacks
- pass through (row, col) to `valueFormatter`
- Option to not sync range in `extras/synchronizer.js`
- Additional options for styling the range selector
- `getRowForX` method
- `setVisibility` can set the visibility of multiple series at once.
- crosshair plugin extra
- rebase/straw broom plugin (#590)
- `highlightSeriesBackgroundColor` option
- `yAxisExtremes()` method.
- Passing strings in native format now throws. (Previously it kinda sorta worked.)

## Bug fixes
- Selections are always cleared with animations
- synchronizer calls previously-set callbacks
- synchronizer only syncs when graphs are ready
- Reset on synchronized graphs failed (#524)
- fix to improve synchronizer performance (#658)
- binary search bug fix in synchronizer
- Fix range selection when chart is located inside fullscreen element (#576)
- `fillAlpha` can be set per-series when `fillGraph` is set.
- `xRangePad` was ignored on unzoom (#657)
- Allow selected points where canvas-y coordinate is 0 (#692)
- Using `valueRange` with `logscale` and `yRangePad` has unexpected results (#661)
- With `drawGapEdgePoints`, unwanted point often drawn at beginning of chart (#745)

## Other user-visible changes
- `legend: follow` positioning changes

## Internal refactors
- Code moved into a `src/` directory
- Tests use Mocha instead of jstd
- dygraphs is split into ES6 modules and uses some ES6 features (e.g. arrows and destructuring).
- dygraphs is built using Babel and browserify
- Code coverage is tracked continuously
- Bundle size is now tracked continuously

# v1.1.1 (2015-06-01)

- Set `this` to the dygraph in all callbacks.
- Minor bug fixes.

# v1.1.0 (2014-12-03)

## Highlights
- dygraphs is now “retina” compatible.
- Dramatically improved performance for filled charts (i.e. `fillGraph`)
- More sensible date ticks: “Jan 08” → “Jan 2008”, “29Jan” → “29 Jan”
- Using a non-existent option now throws (with `dygraph-combined-dev.js`)
- x-axis log scales
- The `labelsUTC` option forces UTC formatting for all labels.
- The new DataHandler system allows for more flexibility in data loading.
- dygraphs has shrunk, because we moved some stuff into “extras” (133 KiB → 122 KiB)

This will be the last major release to support browsers without a native <canvas> implementation. See [blog post](http://blog.dygraphs.com/2014/12/dygraphs-110.html) for more details.

# v1.0.1 (2013-08-29)

Minor bug fixes and updates to web site.

# v1.0.0 (2013-08-14)

Initial Release. See [blog post](http://blog.dygraphs.com/2013/08/announcing-dygraphs-100.html).
