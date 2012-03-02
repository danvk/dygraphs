Gallery.register(
  'edge-padding',
  {
    name: 'Edge Padding',
    title: 'Graph edge padding and axis position',
    setup: function(parent) {
      parent.innerHTML = (
          "<div id='config'>" +
          "<b>Options:</b><br />" +
          "</div><br />" +
          "<div id='demodiv'></div>"
          );
    },
    run: function() {
      var parent = document.getElementById("demodiv");

      var graphs = [];
      var nrows = 50;

      var boolOpts = {
        avoidMinZero: '',
        includeZero: '',
        xAxisAtZero: '',
        yAxisAtZero: ''};

      var pads = {
        unset: null,
        '0.02': 0.02,
        '0.04': 0.04,
        '0.1': 0.1};

      var yranges = {
        unset: null,
        '[-1, 1]': [-1, 1],
        '[-2, 2]': [-2, 2],
        '[-3, 3]': [-3, 3],
        '[0, 1]': [0, 1],
        '[-1, 0]': [-1, 0]};

      var selOpts = {
        xRangePad: pads,
        yRangePad: pads,
        valueRange: yranges};
      var selMap = {};

      var makeBoolUpdater = function(opt) {
        return function() {
          var state = this.checked;
          for (var i = 0; i < graphs.length; ++i) {
            var g = graphs[i];
            var opts = {};
            opts[opt] = state;
            g.updateOptions(opts);
          }
        }
      };

      var makeSelectUpdater = function(opt) {
        return function() {
          var idx = this.options[this.selectedIndex].value;
          var val = selMap[opt][idx];
          for (var i = 0; i < graphs.length; ++i) {
            var g = graphs[i];
            var opts = {};
            opts[opt] = val;
            g.updateOptions(opts);
          }
        }
      };

      var optDiv = document.getElementById("config");
      for (var opt in boolOpts) {
        var input = document.createElement('input');
        input.type = "checkbox";
        input.id = 'check_' + opt;
        input.onchange = makeBoolUpdater(opt);
        optDiv.appendChild(input);
        var label = document.createElement('label');
        label.for = 'check_' + opt;
        label.appendChild(document.createTextNode(opt));
        optDiv.appendChild(label);
        optDiv.appendChild(document.createElement('br'));
      }


      for (var opt in selOpts) {
        var input = document.createElement('select');
        selMap[opt] = {};
        var items = selOpts[opt];
        var idx = 0;
        for (var item in items) {
          var oelem = document.createElement('option');
          selMap[opt][idx] = items[item];
          oelem.value = idx++;
          oelem.appendChild(document.createTextNode(item));
          input.appendChild(oelem);
        }
        input.id = 'sel_' + opt;
        input.onclick = makeSelectUpdater(opt);
        var label = document.createElement('label');
        label.for = 'sel_' + opt;
        label.appendChild(document.createTextNode(opt + ': '));
        optDiv.appendChild(label);
        optDiv.appendChild(input);
        optDiv.appendChild(document.createElement('br'));
      }

      for (var oy = -1; oy <= 1; ++oy) {
        for (var ox = -1; ox <= 1; ++ox) {
          var gdiv = document.createElement('div');
          gdiv.style.display = 'inline-block';
          gdiv.style.margin = '2px';
          parent.appendChild(gdiv);

          var data = [];
          for (var row = 0; row < nrows; ++row) {
            var x = row * 5 / (nrows - 1);
            data.push([ox * 2.5 + x - 2.5,
                    oy * 2 + Math.sin(x),
                    oy * 2 + Math.round(Math.cos(x))]);
          }

          var g = new Dygraph(gdiv, data, {
              labels: ['x', 'A', 'B'],
              labelDivWidth: 100,
              width: 280,
              height: 150
          });
          graphs.push(g);
        }
        parent.appendChild(document.createElement('br'));
      }
    }
  });
