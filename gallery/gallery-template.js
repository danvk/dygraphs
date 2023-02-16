// Use this as a template for new Gallery entries.
/*global Gallery,Dygraph,data */
// Set this to true upon adding to index.html
//galleryActive=false
Gallery.register(
  'id',
  {
    name: 'name',
    title: 'title',
    setup: function(parent) {
      parent.innerHTML = "<div id='blah'>";
    },
    run: function() {
      new Dygraph(document.getElementById("blah"),
                "X,Y\n10,12345\n11,12345\n", {});
    }
  });
