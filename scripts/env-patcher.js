#!/usr/bin/env nodejs
// © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const fs = require('fs');
const {
	ReplaceSource,
	SourceMapSource,
} = require('webpack-sources');
const {
	SourceMapConsumer,
	SourceMapGenerator,
} = require('source-map');

const inScript = fs.readFileSync('env-patcher.tmp.js', 'UTF-8');
const inMap = fs.readFileSync('env-patcher.tmp.map', 'UTF-8');

const trimRE = /\n+\/\/# sourceMappingURL=.*\n*$/;

// note don’t replace with newline, otherwise the result will have extra
var incode = new SourceMapSource(inScript.replace(trimRE, ''),
    'env-patcher.tmp.js', inMap);

var replaceSource = incode.source();
var replaceFrom = 'process.env.NODE_ENV';
var replaceTo = process.argv[2];
var indices = (function getAllIndices(haystack, needle) {
	var i = -1;
	var indices = [];

	while ((i = haystack.indexOf(needle, i + 1)) !== -1)
		indices.push(i);
	return (indices);
})(replaceSource, replaceFrom);

var replaced = new ReplaceSource(incode);
indices.forEach((beg) => {
	var end = beg + replaceFrom.length - 1;
	replaced.replace(beg, end, replaceTo);
});

var outcode = replaced.sourceAndMap();

var outScript = outcode.source;
if (!outScript.endsWith('\n'))
	outScript += '\n';
outScript += '//# sourceMappingURL=env-patcher.tmp.map\n';
fs.writeFileSync('env-patcher.tmp.js', outScript, 'UTF-8');

if (outcode.map === null) {
	console.log('no output source map?');
	process.exit(1);
}
const smc = new SourceMapConsumer({
	...outcode.map,
	"file": incode.map().file,
});
const smg = SourceMapGenerator.fromSourceMap(smc);
fs.writeFileSync('env-patcher.tmp.map', smg.toString(), 'UTF-8');
