// This script can be used to check for errors/console warnings in _all_ the
// files in tests/*.html.
//
// Suggested usage:
//
//     npm install casperjs
//     for x in tests/*.html; casperjs scripts/casperscript.js $x

var casper = require('casper').create({
  verbose: true
});
var filename = casper.cli.args[0];

casper.echo(filename);
casper.on('remote.message', function(message) {
  this.echo('page console: ' + message);
});

casper.on('resource.error', function(e) {
  this.echo('resource.error: ' + e);
});
casper.on('page.error', function(e) {
  this.echo('error! ' + e);
});

casper.start(filename, function() { });

casper.run();
