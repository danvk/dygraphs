#!/usr/bin/env node
/**
 * This script applies a source map to LCOV data. If you have coverage data for
 * a concatenated file, plus a source map, this will output LCOV data for your
 * original source files.
 *
 * Usage:
 *
 *   transform-coverage.js path/to/soure.map path/to/coverage.lcov > out.lcov
 */

// TODO: make this a command line argument
var SOURCE = 'src/';  // only report files under this directory

var assert = require('assert'),
    fs = require('fs'),
    lcovParse = require('lcov-parse'),
    parseDataUri = require('parse-data-uri'),
    sourcemap = require('source-map');

var sourcemapFile = process.argv[2];
var lcovFile = process.argv[3];

var sourcemapData = fs.readFileSync(sourcemapFile).toString();
var sourcemap = new sourcemap.SourceMapConsumer(sourcemapData);

lcovParse(lcovFile, function(err, data) {
  assert(!err);
  // TODO: 0 --> the correct file
  var lines = data[0].lines.details;

  var fileToCov = {};  // filename -> { line num -> hits }

  lines.forEach(function(line) {
    var pos = sourcemap.originalPositionFor({line: line.line, column: 0});
    if (pos == null) {
      return;
    }

    var filename = pos.source;

    // Test coverage of node_modules is never interesting.
    if (!filename || filename.indexOf('node_modules') >= 0) {
      return;
    }

    // Strip paths down to the source root.
    var base = filename.indexOf(SOURCE);
    if (base == -1) return;
    filename = filename.slice(base);

    if (!fileToCov[filename]) fileToCov[filename] = [];
    fileToCov[filename][pos.line] = line.hit;
  });

  // Other LCOV fields to translate:
  // FN:2454
  // FNF:465
  // FNH:410
  // FNDA:1,(anonymous_1)
  // LF:4570
  // LH:4002
  // BRDA:13,1,0,1
  // BRF:2213
  // BRH:1684

  // Convert to LCOV format
  for (var filename in fileToCov) {
    var cov = fileToCov[filename]
    console.log('SF:' + filename);
    for (var i = 0; i < cov.length; i++) {
      if (cov[i] != null) {
        console.log('DA:' + i + ',' + cov[i]);
      }
    }
    console.log('end_of_record');
  }
});
