#!/usr/bin/env nodejs
// © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const fs = require('fs');
const { SourceMapGenerator } = require('source-map');

const srcFN = process.argv[2];
const dstFN = process.argv[3];

const inScript = fs.readFileSync(srcFN, 'UTF-8');
const thefile = inScript.split('\n');
var outlines = [];

const smg = new SourceMapGenerator({
	"file": dstFN,
	"sourceRoot": ""
});
smg.setSourceContent(srcFN, inScript);

outlines[0] = '/*';
var lno;
for (lno = 0; lno < thefile.length; ++lno) {
	const str = thefile[lno];
	const outln = lno + 1;
	if (str === '') {
		outlines[outln] = ' *';
		continue;
	}
	outlines[outln] = ' * ' + str;
	smg.addMapping({
		"source": srcFN,
		"original": {
			"line": /* 1-based */ (lno + 1),
			"column": /* 0-based */ 0
		},
		"generated": {
			"line": /* 1-based */ (outln + 1),
			"column": /* 0-based */ 3
		}
	});
}
outlines[thefile.length + 0] = ' */';
outlines[thefile.length + 1] = '"use strict";';

// the appending of “"use strict";“ is the same as running through
// babel currently is; for some reason, babel drops the source map
// from this output file so just use this i̲n̲s̲t̲e̲a̲d̲ ̲o̲f̲ babel… atm…

const outScript = outlines.join('\n');
fs.writeFileSync(dstFN, outScript, 'UTF-8');
fs.writeFileSync(dstFN + '.map', smg.toString(), 'UTF-8');
