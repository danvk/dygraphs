#!/usr/bin/env nodejs
// © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const fs = require('fs');
const {
	ReplaceSource,
	SourceMapSource,
} = require('webpack-sources');
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');

const inScript = fs.readFileSync('o1.js', 'UTF-8');
const inMap = fs.readFileSync('o1.map', 'UTF-8');

const trimRE = /\n+\/\/# sourceMappingURL=.*\n*$/;

var incode = new SourceMapSource(inScript.replace(trimRE, '\n'), 'o1.js', inMap);

var replaceSource = incode.source();
var replaceFrom = 'process.env.NODE_ENV';
var replaceTo = '"development"';
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
outScript += '//# sourceMappingURL=' + 'o2.map' + '\n';

fs.writeFileSync('o2.js', outScript, 'UTF-8');
if (outcode.map === null) {
	console.log('no output source map?');
} else {
//	fs.writeFileSync('o2.map', JSON.stringify(outcode.map), 'UTF-8');
	const smc = new SourceMapConsumer({
		...outcode.map,
		"file": incode.map().file,
	});
	//const smc = new SourceMapConsumer(JSON.parse(inMap));
	const smg = SourceMapGenerator.fromSourceMap(smc);
	fs.writeFileSync('o2.map', smg.toString(), 'UTF-8');
}
