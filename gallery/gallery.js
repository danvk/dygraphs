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
  Gallery.toc = document.getElementById("toc");
  Gallery.workarea = document.getElementById("workarea");
  Gallery.subtitle = Gallery.create("div", Gallery.workarea);
  Gallery.subtitle.id = "subtitle";
  Gallery.workareaChild = Gallery.create("div", Gallery.workarea);
  Gallery.demotitle = document.getElementById("demotitle");
  Gallery.textarea = new TextArea();
  Gallery.textarea.width = 600;
  Gallery.textarea.height = 400;

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
      Gallery.subtitle.innerHTML = "";
      var codeLink = Gallery.create("a", Gallery.subtitle);
      codeLink.textContent = "code";
      codeLink.href = "#";
      Gallery.demotitle.textContent = demo.title ? demo.title : "";
      demo.innerDiv.className = "selected";
      Gallery.workareaChild.id = id;
      location.hash = "g/" + id;
      Gallery.workareaChild.innerHTML='';
      if (demo.setup) {
        demo.setup(Gallery.workareaChild);
      }
      var html = Gallery.workareaChild.innerHTML;
      codeLink.onclick = function() {
        var javascript = demo.run.toString();
        Gallery.textarea.show("Code", "HTML\n\n" + html + "\n\njavascript\n\n" + javascript);
      };
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
  if (location.hash) {
    if (location.hash.indexOf("#g/") == 0) {
      var id = location.hash.substring(3) + "-toc";
      var elem = document.getElementById(id);
      elem.onclick();
      return;
    }
  }
  Gallery.workareaChild.innerHTML = "<h3>Select a demo from the gallery on the left</h3>"
};
