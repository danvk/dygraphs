/** 
 * @fileoverview Tests for stand-alone functions in dygraph-utils.js
 *
 * @author danvdk@gmail.com (Dan Vanderkam)
 */

import * as utils from '../../src/dygraph-utils';

describe("utils-tests", function() {

it('testUpdate', function() {
  var a = {
    a: 1,
    b: [1, 2, 3],
    c: { x: 1, y: 2},
    d: { f: 10, g: 20}
  };
  assert.equal(1, a['a']);
  assert.deepEqual([1, 2, 3], a['b']);
  assert.deepEqual({x: 1, y: 2}, a['c']);
  assert.deepEqual({f: 10, g: 20}, a['d']);

  utils.update(a, { c: { x: 2 } });
  assert.deepEqual({x: 2}, a['c']);

  utils.update(a, { d: null });
  assert.equal(null, a['d']);

  utils.update(a, { a: 10, b: [1, 2] });
  assert.equal(10, a['a']);
  assert.deepEqual([1, 2], a['b']);
  assert.deepEqual({x: 2}, a['c']);
  assert.equal(null, a['d']);
});

it('testUpdateDeep', function() {
  var a = {
    a: 1,
    b: [1, 2, 3],
    c: { x: 1, y: 2},
    d: { f: 10, g: 20}
  };
  assert.equal(1, a['a']);
  assert.deepEqual([1, 2, 3], a['b']);
  assert.deepEqual({x: 1, y: 2}, a['c']);
  assert.deepEqual({f: 10, g: 20}, a['d']);

  utils.updateDeep(a, { c: { x: 2 } });
  assert.deepEqual({x: 2, y: 2}, a['c']);

  utils.updateDeep(a, { d: null });
  assert.equal(null, a['d']);

  utils.updateDeep(a, { a: 10, b: [1, 2] });
  assert.equal(10, a['a']);
  assert.deepEqual([1, 2], a['b']);
  assert.deepEqual({x: 2, y: 2}, a['c']);
  assert.equal(null, a['d']);
});

it('testUpdateDeepDecoupled', function() {
  var a = {
    a: 1,
    b: [1, 2, 3],
    c: { x: "original", y: 2},
  };

  var b = {};
  utils.updateDeep(b, a);

  b.a = 2;
  assert.equal(1, a.a);

  b.b[0] = 2;
  assert.equal(1, a.b[0]);

  b.c.x = "new value";
  assert.equal("original", a.c.x);
});


it('testIterator_nopredicate', function() {
  var array = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  var iter = utils.createIterator(array, 1, 4);
  assert.isTrue(iter.hasNext);
  assert.equal('b', iter.peek);
  assert.equal('b', iter.next());
  assert.isTrue(iter.hasNext);

  assert.equal('c', iter.peek);
  assert.equal('c', iter.next());

  assert.isTrue(iter.hasNext);
  assert.equal('d', iter.next());

  assert.isTrue(iter.hasNext);
  assert.equal('e', iter.next());

  assert.isFalse(iter.hasNext);
});

it('testIterator_predicate', function() {
  var array = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  var iter = utils.createIterator(array, 1, 4,
      function(array, idx) { return array[idx] !== 'd' });
  assert.isTrue(iter.hasNext);
  assert.equal('b', iter.peek);
  assert.equal('b', iter.next());
  assert.isTrue(iter.hasNext);

  assert.equal('c', iter.peek);
  assert.equal('c', iter.next());

  assert.isTrue(iter.hasNext);
  assert.equal('e', iter.next());

  assert.isFalse(iter.hasNext);
});

it('testIterator_empty', function() {
  var array = [];
  var iter = utils.createIterator([], 0, 0);
  assert.isFalse(iter.hasNext);
});

it('testIterator_outOfRange', function() {
  var array = ['a', 'b', 'c'];
  var iter = utils.createIterator(array, 1, 4,
      function(array, idx) { return array[idx] !== 'd' });
  assert.isTrue(iter.hasNext);
  assert.equal('b', iter.peek);
  assert.equal('b', iter.next());
  assert.isTrue(iter.hasNext);

  assert.equal('c', iter.peek);
  assert.equal('c', iter.next());

  assert.isFalse(iter.hasNext);
});

// Makes sure full array is tested, and that the predicate isn't called
// with invalid boundaries.
it('testIterator_whole_array', function() {
  var array = ['a', 'b', 'c'];
  var iter = utils.createIterator(array, 0, array.length,
      function(array, idx) {
        if (idx < 0 || idx >= array.length) {
          throw "err";
        } else {
          return true;
        }
      });
  assert.isTrue(iter.hasNext);
  assert.equal('a', iter.next());
  assert.isTrue(iter.hasNext);
  assert.equal('b', iter.next());
  assert.isTrue(iter.hasNext);
  assert.equal('c', iter.next());
  assert.isFalse(iter.hasNext);
  assert.isNull(iter.next());
});

it('testIterator_no_args', function() {
  var array = ['a', 'b', 'c'];
  var iter = utils.createIterator(array);
  assert.isTrue(iter.hasNext);
  assert.equal('a', iter.next());
  assert.isTrue(iter.hasNext);
  assert.equal('b', iter.next());
  assert.isTrue(iter.hasNext);
  assert.equal('c', iter.next());
  assert.isFalse(iter.hasNext);
  assert.isNull(iter.next());
});

it('testToRGB', function() {
  assert.deepEqual({r: 255, g: 200, b: 150}, utils.toRGB_('rgb(255,200,150)'));
  assert.deepEqual({r: 255, g: 200, b: 150}, utils.toRGB_('#FFC896'));
  assert.deepEqual({r: 255, g: 0, b: 0}, utils.toRGB_('red'));
  assert.deepEqual({r: 255, g: 200, b: 150, a: 0.6},
                   utils.toRGB_('rgba(255, 200, 150, 0.6)'));
});

it('testIsPixelChangingOptionList', function() {
  var isPx = utils.isPixelChangingOptionList;
  assert.isTrue(isPx([], { axes: { y: { digitsAfterDecimal: 3 }}}));
  assert.isFalse(isPx([], { axes: { y: { axisLineColor: 'blue' }}}));
});

/*
it('testDateSet', function() {
  var base = new Date(1383455100000);
  var d = new Date(base);

  // A one hour shift -- this is surprising behavior!
  d.setMilliseconds(10);
  assert.equal(3600010, d.getTime() - base.getTime());

  // setDateSameTZ compensates for this surprise.
  d = new Date(base);
  Dygraph.setDateSameTZ(d, {ms: 10});
  assert.equal(10, d.getTime() - base.getTime());
});
*/

});
