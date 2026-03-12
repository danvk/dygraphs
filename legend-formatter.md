This is intended to be a catch-all for legend formatting needs. This
[comes](https://stackoverflow.com/a/25090552/2171120)
[up](https://stackoverflow.com/a/24175648/2171120)
[often](https://stackoverflow.com/a/18211338/2171120) in Stack Overflow
[questions](https://stackoverflow.com/a/23354308/2171120) which can’t be
easily answered with `valueFormatter`. Nowadays I wave my hands and say
"write your own legend, either as a plugin or using `highlightCallback`
and `unhighlightCallback`." This is a simpler option.

The `legendFormatter` is repeatedly called with a `data` object
describing the selection or lack of selection. It contains all the
information you need to generate a standard legend (e.g. formatted
values), but there’s nothing preventing you from doing something crazier
on your own.

For example, here’s what a simple `legendFormatter` might look like:

```js
function legendFormatter(data) {
  if (data.x == null) return '';  // no selection
  return data.xHTML + data.series.map(v => v.labelHTML + ': ' + v.yHTML).join(' ');
}
```

Here’s what the `data` object looks like when nothing is selected:

```json
{
  "dygraph": "(dygraph)",
  "series": [
    {
      "dashHTML": "<div style=\"display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(0,128,0);\"></div>",
      "label": "Y1",
      "labelHTML": "Y1",
      "visible": true,
      "color": "rgb(0,128,0)"
    },
    {
      "dashHTML": "<div style=\"display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(0,0,128);\"></div>",
      "label": "Y2",
      "labelHTML": "Y2",
      "visible": true,
      "color": "rgb(0,0,128)"
    }
  ]
}
```

The `dashHTML` properties help you render lines which match each series’
line on the chart. When `strokePattern` is set, they become dotted or
dashed lines as needed.

Each value has a corresponding `HTML` variant, which is properly
formatted and escaped according to all the relevant options which have
been set for the chart.

Here’s what it looks like when a row is selected:

```json
{
  "dygraph": "(dygraph)",
  "x": 93,
  "xHTML": 93,
  "series": [
    {
      "dashHTML": "<div style=\"display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(0,128,0);\"></div>",
      "label": "Y1",
      "labelHTML": "Y1",
      "visible": true,
      "color": "rgb(0,128,0)",
      "y": 93,
      "yHTML": "93"
    },
    {
      "dashHTML": "<div style=\"display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(0,0,128);\"></div>",
      "label": "Y2",
      "labelHTML": "Y2",
      "visible": true,
      "color": "rgb(0,0,128)",
      "y": 26.04,
      "yHTML": "26.04"
    }
  ]
}
```

Here’s what it looks like when a single series is selected (e.g. with
`highlightSeriesOpts`):

```json
{
  "dygraph": "(dygraph)",
  "x": 94,
  "xHTML": 94,
  "series": [
    {
      "dashHTML": "<div style=\"display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(0,128,0);\"></div>",
      "label": "Y1",
      "labelHTML": "Y1",
      "visible": true,
      "color": "rgb(0,128,0)",
      "y": 94,
      "yHTML": "94",
      "isHighlighted": true
    },
    {
      "dashHTML": "<div style=\"display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(0,0,128);\"></div>",
      "label": "Y2",
      "labelHTML": "Y2",
      "visible": true,
      "color": "rgb(0,0,128)",
      "y": 22.56,
      "yHTML": "22.56"
    }
  ]
}
```

(Note the `isHighlighted` property set on `Y1`.)
