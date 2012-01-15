// Use this as a template for new Gallery entries.
Gallery.register(
  'id',
  {
    name: 'name',
    title: 'title',
    setup: function(parent) {
      parent.innerHTML = "<div id='blah'>";
    },
    run: function() {
      g = new Dygraph(document.getElementById("blah"),
                "X,Y\n10,12345\n11,12345\n", {});
    }
  });
