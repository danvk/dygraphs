// Invoke via: ./test.sh
//
// or phantomjs phantom-driver.js [testCase.test]
//
// For more on phantomjs, visit www.phantomjs.org.

var page = require('webpage').create();

// NOTE: Cannot include '#' or '?' in this URL.
var url = 'auto_tests/misc/local.html';

// NOTE: changing the line below to this:
// page.open(url, function(status)) {
// makes phantomjs hang.
page.open(url, function(status) {
  if (status !== 'success') {
    console.warn('Page status: ' + status);
    console.log(page);
    phantom.exit();
  }

  var testCase, test;
  if (phantom.args.length == 1) {
    var parts = phantom.args[0].split('.');
    if (2 != parts.length) {
      console.warn('Usage: phantomjs phantom-driver.js [testCase.test]');
      phantom.exit();
    }
    testCase = parts[0];
    test = parts[1];
  }

  var loggingOn = false;
  page.onConsoleMessage = function (msg) {
    if (msg == 'Running ' + test) {
      loggingOn = true;
    } else if (msg.substr(0, 'Running'.length) == 'Running') {
      loggingOn = false;
    }
    if (loggingOn) console.log(msg);
  };

  page.onError = function (msg, trace) {
    console.log(msg);
    trace.forEach(function(item) {
        console.log('  ', item.file, ':', item.line);
    })
  };

  var results;
  
  // Run all tests.
  var start = new Date().getTime();
  results = page.evaluate(function() {
    // Phantom doesn't like stacktrace.js using the "arguments" object
    // in stacktrace.js, which it interprets in strict mode.
    printStackTrace = undefined;

    var testCases = getAllTestCases();
    var results = {};
    for (var idx in testCases) {
      var entry = testCases[idx];

      var prototype = entry.testCase;
      var tc = new entry.testCase();
      var result = tc.runAllTests();
      results[entry.name] = result;
    }
    return results;
  });
  var end = new Date().getTime();
  var elapsed = (end - start) / 1000;

  var num_passing = 0, num_failing = 0;
  var failures = [];
  for (var testCase in results) {
    var caseResults = results[testCase];
    for (var test in caseResults) {
      if (caseResults[test] !== true) {
        num_failing++;
        failures.push(testCase + '.' + test + ' failed');
      } else {
        // console.log(testCase + '.' + test + ' passed');
        num_passing++;
      }
    }
  }

  console.log('Ran ' + (num_passing + num_failing) + ' tests in ' + elapsed + 's.');
  console.log(num_passing + ' test(s) passed');
  console.log(num_failing + ' test(s) failed:');
  for (var i = 0; i < failures.length; i++) {
    // TODO(danvk): print an auto_test/misc/local URL that runs this test.
    console.log('  ' + failures[i] + ' failed.');
  }

  if (num_failing == 0) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  phantom.exit();
});
