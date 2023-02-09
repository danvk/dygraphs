// © 2023 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const assert = require('assert');
const through = require('through2');
const umd = require('umd');

module.exports = function (b) {
	const nmap = {};
	const rows = [];

	const basedir = process.cwd() + '/';
	const skip_lic = basedir + 'LICENCE.js';
	const npmbase = basedir + 'node_modules/';
	const testbase = basedir + 'tests5/';
	const rplbase = 'dygraphs/';
	const norpl = function norpl(s) {
		return (!s.startsWith(basedir) ||
		    s == skip_lic ||
		    s.startsWith(npmbase) ||
		    s.startsWith(testbase));
	    };
	const mainmodule = basedir + 'src/dygraph.js';

	const scan = function scan(s) {
		if (norpl(s))
			nmap[s] = true;
	    };
	const xfrm = function xfrm(s) {
		if (norpl(s))
			return (nmap[s]);
		return (rplbase + s.substr(basedir.length));
	    };
	b.pipeline.get('label').push(through.obj(function transform(row, enc, next) {
		scan(row.id);
		for (let dep in row.deps)
			if (row.deps.hasOwnProperty(dep))
				scan(row.deps[dep]);
		rows.push(row);
		next();
	    }, function end(next) {
		const keys = Object.keys(nmap).slice().sort();
		for (let i = 0; i < keys.length; ++i)
			nmap[keys[i]] = i + 1;
		for (let i = 0; i < rows.length; ++i) {
			let row = rows[i];
			row.id = xfrm(row.id);
			for (let dep in row.deps)
				if (row.deps.hasOwnProperty(dep))
					row.deps[dep] = xfrm(row.deps[dep]);
			if (row.dedupe)
				row.source = 'arguments[4][' +
				    JSON.stringify(xfrm(row.dedupe)) +
				    '][0].apply(exports,arguments)';
			this.push(row);
		}
		if (typeof(b._bpack.standaloneModule) === 'string')
			b._bpack.standaloneModule = xfrm(b._bpack.standaloneModule);
		next();
	    }));
	// use this instead of --standalone so we can require for the tests
	var first = true, hadsm = false;
	b.pipeline.get('pack').push(through.obj(function transform(row, enc, next) {
		if (first) {
			var pre = umd.prelude('Dygraph').trim() + 'var r=';
			assert(pre.match(/\n/g) === null, 'UMD prelude contains newlines');
			this.push(Buffer.from(pre, 'utf8'));
			first = false;
		} else if (row.toString().startsWith('\n//# sourceMappingURL')) {
			assert(!hadsm, 'multiple source maps in file‽');
			var post = ';var x=r(' +
			    JSON.stringify(xfrm(mainmodule)) +
			    ');x._req_=r;return x' +
			    umd.postlude('Dygraph').trim();
			assert(post.match(/\n/g) === null, 'UMD postlude contains newlines');
			this.push(Buffer.from(post, 'utf8'));
			hadsm = true;
		}
		next(null, row);
	    }));
    };
