#!/usr/bin/env nodejs
// © 2022 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const fs = require('fs');
const {
	SourceMapConsumer,
	SourceMapGenerator,
} = require('source-map');
const { relative } = require('source-map/lib/source-map/util');

const inScript = fs.readFileSync('env-patcher.tmp.js', 'UTF-8');
const inMap = fs.readFileSync('env-patcher.tmp.map', 'UTF-8');

const thefile = inScript.split('\n');
const ostr = 'process.env.NODE_ENV';
const nstr = process.argv[2];
const olen = ostr.length;
const nlen = nstr.length;
const dlen = nlen - olen;
const rpl = {};
var lno;
for (lno = 0; lno < thefile.length; ++lno) {
	const str = thefile[lno];
	const col = str.indexOf(ostr);
	if (col === -1)
		continue;
	if (str.indexOf(ostr, col + olen) !== -1) {
		console.log("E: more than one occurrence in line " + lno);
		console.log("N: for simplicity only one replacement is supported");
		console.log("N: hint: uglify after transforming only");
		process.exit(1);
	}
	rpl[lno + 1] = col;
	thefile[lno] = str.substring(0, col) + nstr + str.substring(col + olen);
}

const outScript = thefile.join('\n');
fs.writeFileSync('env-patcher.tmp.js', outScript, 'UTF-8');

const smc = new SourceMapConsumer(JSON.parse(inMap));
// like SourceMapGenerator.fromSourceMap()
const sr = smc.sourceRoot;
const smg = new SourceMapGenerator({
	"file": smc.file,
	"sourceRoot": sr,
});
smc.eachMapping(function (omap) {
	const l = omap.generatedLine;
	var c = omap.generatedColumn;
	const r = rpl[l];

	if (r !== undefined) {
		if (c >= r + olen)
			c += dlen;
		else if (c > r)
			return;
	}
	var nmap = {
		"generated": {
			"line": l,
			"column": c,
		},
	};
	if (omap.source != null) {
		if (sr == null)
			nmap.source = omap.source;
		else
			nmap.source = relative(sr, omap.source);
		nmap.original = {
			"line": omap.originalLine,
			"column": omap.originalColumn,
		};
		if (omap.name != null)
			nmap.name = omap.name;
	}
	smg.addMapping(nmap);
});
smc.sources.forEach(function (sourceFile) {
	const content = smc.sourceContentFor(sourceFile);
	if (content != null)
		smg.setSourceContent(sourceFile, content);
});

fs.writeFileSync('env-patcher.tmp.map', smg.toString(), 'UTF-8');
