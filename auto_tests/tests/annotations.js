/**
 * @fileoverview Tests relating to annotations
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
var annotationsTestCase = TestCase("annotations");

annotationsTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

annotationsTestCase.prototype.tearDown = function() {
};

annotationsTestCase.prototype.testAnnotationsDrawn = function() {
  var opts = {
    width: 480,
    height: 320
  };
  var data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  g.setAnnotations([
    {
      series: 'Y',
      x: 1,
      shortText: 'A',
      text: 'Long A',
      cssClass: 'ann1'
    },
    {
      series: 'Y',
      x: 2,
      shortText: 'B',
      text: 'Long B',
      cssClass: 'ann2'
    }
  ]);

  assertEquals(2, g.annotations().length);
  var a1 = document.getElementsByClassName('ann1');
  assertEquals(1, a1.length);
  a1 = a1[0];
  assertEquals('A', a1.textContent);

  var a2 = document.getElementsByClassName('ann2');
  assertEquals(1, a2.length);
  a2 = a2[0];
  assertEquals('B', a2.textContent);
};

// Some errors that should be flagged:
// 1. Invalid series name (e.g. 'X' or 'non-existent')
// 2. Passing a string as 'x' instead of a number (e.g. x: '1')

annotationsTestCase.prototype.testAnnotationsDontDisappearOnResize = function() {
  var opts = {
  };
  var data = "X,Y\n" +
      "0,-1\n" +
      "1,0\n" +
      "2,1\n" +
      "3,0\n"
  ;

  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, data, opts);
  g.setAnnotations([
    {
      series: 'Y',
      x: 1,
      shortText: 'A',
      text: 'Long A',
      cssClass: 'ann1'
    }
  ]);

  // Check that it displays at all
  assertEquals(1, g.annotations().length);
  var a1 = document.getElementsByClassName('ann1');
  assertEquals(1, a1.length);
  a1 = a1[0];
  assertEquals('A', a1.textContent);

  // ... and that resizing doesn't kill it.
  g.resize(400, 300);
  assertEquals(1, g.annotations().length);
  var a1 = document.getElementsByClassName('ann1');
  assertEquals(1, a1.length);
  a1 = a1[0];
  assertEquals('A', a1.textContent);
};
