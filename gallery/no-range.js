/*global Gallery,Dygraph,data */
//galleryActive=false
Gallery.register(
  'no-range',
  {
    name: 'No Range',
    setup: function(parent) {
      parent.innerHTML =
          "<p>Line should be visible in the middle of the chart:</p>" +
          "<div id='blah'></div>" +

          "<p>Line should be visible ~90% up the chart:</p>" +
          "<div id='blah2'></div>";
    },
    run: function() {
      new Dygraph(document.getElementById("blah"),
                  "X,Y\n10,12345\n11,12345\n",
                  { width: 640, height: 480 });

      new Dygraph(document.getElementById("blah2"),
          "date,10M\n" +
          "2002-12-29,10000000.000000\n" +
          "2003-01-05,10000000.000000\n" +
          "2003-01-12,10000000.000000\n" +
          "2003-01-19,10000000.000000\n" +
          "2003-01-26,10000000.000000\n" +
          "2003-02-02,10000000.000000\n" +
          "2003-02-09,10000000.000000\n" +
          "2003-02-16,10000000.000000\n",
          { width: 640, height: 480, includeZero: true, labelsKMB: true });
    }
  });
