// © 2023 mirabilos <t.glaser@tarent.de> Ⓕ MIT

const through = require('through2');

module.exports = function (b) {
	const nmap = {};
	const rows = [];

	const basedir = process.cwd() + '/';
	const npmbase = basedir + 'node_modules/';
	const testbase = basedir + 'tests5/';
	const rplbase = 'dygraphs/';
	const norpl = function norpl(s) {
		return (!s.startsWith(basedir) ||
		    s.startsWith(npmbase) ||
		    s.startsWith(testbase));
	    };

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
			// use this instead of -x/-u so we can map pathnames
			if (!norpl(row.id))
				continue;
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
    };
