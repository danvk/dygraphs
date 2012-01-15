var Gallery = {};

Gallery.entries = {};
Gallery.entryOrder = [];
Gallery.runningDemo = null;

/*
 * Shortcut for creating HTML associated with a parent.
 */
Gallery.create = function(type, parent, className) {
  var elem = document.createElement(type);
  parent.appendChild(elem);
  if (className) {
    elem.className = className;
  }
  return elem;
};

Gallery.start = function() {
  google.load('visualization', '1', {'packages':['annotatedtimeline']});
  Gallery.toc = document.getElementById("toc");
  Gallery.workarea = document.getElementById("workarea");
  Gallery.workareaChild = Gallery.create("div", Gallery.workarea);
  Gallery.workarea.style.visibility = "hidden";
  for (var idx in Gallery.entryOrder) {
    var id = Gallery.entryOrder[idx];
    var demo = Gallery.entries[id];

    var div = Gallery.create("div", Gallery.toc, "entry");
    div.id = id + "-toc";
    var innerDiv = Gallery.create("div", div, "");

    // Storing extra data in the demo object.
    demo.div = div;
    demo.innerDiv = innerDiv;

    innerDiv.textContent = demo.name;
    div.onclick = function(demo, id) { return function() {
      if (Gallery.runningDemo != null) {
        Gallery.runningDemo.innerDiv.className = "";
        if (Gallery.runningDemo.clean != null) {
          Gallery.runningDemo.clean(Gallery.workareaChild);
        }
      }
      Gallery.workarea.style.visibility = "visible";
      document.getElementById("title").textContent = demo.title ? demo.title : "";
      demo.innerDiv.className = "selected";
      Gallery.workareaChild.id = id;
      location.hash = id;
      Gallery.workareaChild.innerHTML='';
      if (demo.setup) {
        demo.setup(Gallery.workareaChild);
      }
      demo.run(Gallery.workareaChild);
      Gallery.runningDemo = demo;
    }; }(demo, id);
  }

  Gallery.hashChange();

  window.onhashchange = Gallery.setHash;("hashchange", Gallery.hashChange, false);
};

Gallery.register = function(id, demo) {
  if (Gallery.entries[id]) {
    throw id + " already registered";
  }
  Gallery.entries[id] = demo;
  Gallery.entryOrder.push(id);
};

Gallery.hashChange = function(event) {
  var id = location.hash.substring(1) + "-toc";
  var elem = document.getElementById(id);
  elem.onclick();
};