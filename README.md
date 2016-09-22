[![Build Status](https://travis-ci.org/danvk/dygraphs.svg?branch=markdown-readme)](https://travis-ci.org/danvk/dygraphs) [![Coverage Status](https://img.shields.io/coveralls/danvk/dygraphs.svg)](https://coveralls.io/r/danvk/dygraphs)
# dygraphs JavaScript charting library

The dygraphs JavaScript library produces interactive, zoomable charts of time series:

<img src="https://cloud.githubusercontent.com/assets/98301/5311286/eb760eea-7c10-11e4-9a59-1d144e51a15b.png" width="618" height="322">

Learn more about it at [dygraphs.com](http://www.dygraphs.com).

Get help with dygraphs on
[Stack Overflow](http://stackoverflow.com/questions/tagged/dygraphs) (preferred) and 
[Google Groups](http://groups.google.com/group/dygraphs-users)

## Features
* Plots time series without using an external server or Flash
* Supports [error bands](http://dygraphs.com/tests/legend-values.html) around data series
* Interactive [pan and zoom](http://dygraphs.com/tests/link-interaction.html)
* Displays values [on mouseover](http://dygraphs.com/tests/legend-values.html)
* Adjustable [averaging period](http://dygraphs.com/tests/temperature-sf-ny.html)
* Extensive set of [options](http://www.dygraphs.com/options.html) for customization.
* Compatible with the [Google Visualization API](http://dygraphs.com/data.html#datatable)

## Minimal Example
```html
<html>
<head>
<script type="text/javascript" src="dygraph-combined.js"></script>
</head>
<body>
<div id="graphdiv"></div>
<script type="text/javascript">
  g = new Dygraph(
        document.getElementById("graphdiv"),  // containing div
        "Date,Temperature\n" +                // the data series
        "2008-05-07,75\n" +
        "2008-05-08,70\n" +
        "2008-05-09,80\n",
        { }                                   // the options
      );
</script>
</body>
</html>
```

Learn more by reading [the tutorial](http://www.dygraphs.com/tutorial.html) and
seeing demonstrations of what dygraphs can do in the
[gallery](http://www.dygraphs.com/gallery).

## Development

To get going, clone the repo and run:

    npm install
    npm run build

Then open `tests/demo.html` in your browser.

Read more about the dygraphs development process in the [developer guide](/DEVELOP.md).

## License(s)
dygraphs is available under the MIT license, included in LICENSE.txt.
