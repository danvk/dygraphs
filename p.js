#!/usr/bin/env nodejs
// © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const fs = require('fs');
const {
	PrefixSource,
	SourceMapSource,
} = require('webpack-sources');
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');

const inScript = fs.readFileSync('o1.js', 'UTF-8');
const inMap = fs.readFileSync('o1.map', 'UTF-8');

const trimRE = /\n+\/\/# sourceMappingURL=.*\n*$/;

var incode = new SourceMapSource(inScript.replace(trimRE, '\n'), 'o1.js', inMap);

var prefixed = new PrefixSource('/*miau*/ ', incode);

var outcode = prefixed.sourceAndMap();

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
	const smg = SourceMapGenerator.fromSourceMap(smc);
	fs.writeFileSync('o2.map', smg.toString(), 'UTF-8');
}
