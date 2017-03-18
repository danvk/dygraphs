/**
 * @fileoverview Tests involving issuing XHRs for data.
 *
 * Note that these tests must be run with an HTTP server.
 * XHRs can't be issued from file:/// URLs.
 * This can be done with
 *
 *     npm install http-server
 *     http-server
 *     open http://localhost:8080/auto_tests/runner.html
 *
 */

import Dygraph from '../../src/dygraph';
import Util from './Util';

import 'core-js/es6/promise';

function dygraphPromise(div, data, opts) {
  return new Promise((resolve, reject) => {
    const g = new Dygraph(div, data, opts);
    g.ready(() => resolve(g));
  });
}

describe("xhr", () => {

it('should issue XHRs for CSV data', () => {
  return dygraphPromise('graph', 'data/sample.csv').then(g => {
    assert.isNotNull(g);
    assert.equal(g.numRows(), 4);
    assert.equal(g.numColumns(), 3);
  });
});

it('should warn on out-of-order CSV data', () => {
  const calls = {};
  const restore = Util.captureConsole(calls);
  return dygraphPromise('graph', 'data/out-of-order.csv').then(g => {
    restore();
    assert.isNotNull(g);
    assert.equal(g.numRows(), 4);
    assert.equal(g.numColumns(), 3);
    assert.equal(calls.warn.length, 1);
    assert(/out of order/.exec(calls.warn[0]));
  }, e => {
    restore();
    return Promise.reject(e);
  });
});

it('should warn on out-of-order CSV data with dates', () => {
  const calls = {};
  const restore = Util.captureConsole(calls);
  return dygraphPromise('graph', 'data/out-of-order-dates.csv').then(g => {
    restore();
    assert.isNotNull(g);
    assert.equal(g.numRows(), 8);
    assert.equal(g.numColumns(), 5);
    assert.equal(calls.warn.length, 1);
    assert(/out of order/.exec(calls.warn[0]));
  }, e => {
    restore();
    return Promise.reject(e);
  });
});

});
