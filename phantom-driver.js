// Invoke via: ./test.sh
//
// or phantomjs phantom-driver.js [-v] [testCase.test]
//
// For more on phantomjs, visit www.phantomjs.org.
var RunAllAutoTests = function(done_callback) {

var page = require('webpage').create();

// NOTE: Cannot include '#' or '?' in this URL.
var url = 'auto_tests/misc/local.html';

// -v for verbose

// NOTE: changing the line below to this:
// page.open(url, function(status)) {
// makes phantomjs hang.
page.open(url, function(status) {
  try {
    var verbose = false;

    if (status !== 'success') {
      console.warn('Page status: ' + status);
      console.log(page);
      phantom.exit();
    }

    var testCase, test;
    var args = phantom.args.slice(); // make a copy, so it can be spliced.
    if (args.length >= 1) { 
      if (args[0] === '-v') {
        verbose = true;
        args.splice(0, 1);
      }
    }
/*
    if (args.length == 1) {
      var parts = args[0].split('.');
      if (2 != parts.length) {
        console.warn('Usage: phantomjs phantom-driver.js [-v] [testCase.test]');
        phantom.exit(1);
      }
      testCase = parts[0];
      test = parts[1];
    }
*/
    if (verbose) {
      page.onConsoleMessage = function (msg) {
        console.log(msg);
      };
    }
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
        console.log("running");
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
          failures.push(testCase + '.' + test);
        } else {
          // console.log(testCase + '.' + test + ' passed');
          num_passing++;
        }
      }
    }

    console.log('Ran ' + (num_passing + num_failing) + ' tests in ' + elapsed + 's.');
    console.log(num_passing + ' test(s) passed');
    console.log(num_failing + ' test(s) failed');
    for (var i = 0; i < failures.length; i++) {
      // TODO(danvk): print an auto_test/misc/local URL that runs this test.
      console.log('  ' + failures[i] + ' failed.');
    }

    done_callback(num_failing, num_passing, 0);
  } catch(e) {
    console.log(e);
    done_callback(0, 0, 1);
  }
});

};

// Load all "tests/" pages.
var LoadAllManualTests = function(totally_done_callback) {

var fs = require('fs');
var tests = fs.list('tests');
var pages = [];

function make_barrier_closure(n, fn) {
  var calls = 0;
  return function() {
    calls++;
    if (calls == n) {
      fn();
    } else {
      // console.log('' + calls + ' done, ' + (n - calls) + ' remain');
    }
  };
}

var tasks = [];
for (var i = 0; i < tests.length; i++) {
  if (tests[i].substr(-5) != '.html') continue;
  tasks.push(tests[i]);
}
tasks = [ 'independent-series.html' ];

var loaded_page = make_barrier_closure(tasks.length, function() {
  // Wait 2 secs to allow JS errors to happen after page load.
  setTimeout(function() {
    var success = 0, failures = 0;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].success && !pages[i].hasErrors) {
        success++;
      } else {
        failures++;
      }
    }
    console.log('Successfully loaded ' + success + ' / ' +
                (success + failures) + ' test pages.');
    totally_done_callback(failures, success);
  }, 2000);
});


for (var i = 0; i < tasks.length; i++) {
  var url = 'file://' + fs.absolute('tests/' + tasks[i]);
  pages.push(function(path, url) {
    var page = require('webpage').create();
    page.success = false;
    page.hasErrors = false;
    page.onError = function (msg, trace) {
      console.log(path + ': ' + msg);
      page.hasErrors = true;
      trace.forEach(function(item) {
        console.log('  ', item.file, ':', item.line);
      });
    };
    page.onLoadFinished = function(status) {
      if (status == 'success') {
        page.success = true;
      }
      if (!page.done) loaded_page();
      page.done = true;
    };
    page.open(url);
    return page;
  }(tasks[i], url));
}

};


// First run all auto_tests.
// If they all pass, load the manual tests.
RunAllAutoTests(function(num_failing, num_passing, exceptions) {
  if (exceptions !== 0) {
    console.log('EXCEPTION');
    phantom.exit(2);
  } else if (num_failing !== 0) {
    console.log('FAIL');
    phantom.exit(1);
  } else {
    console.log('PASS');
    phantom.exit(0);
  }

  // This is not yet reliable enough to be useful:
  /*
  LoadAllManualTests(function(failing, passing) {
    if (failing !== 0) {
      console.log('FAIL');
    } else {
      console.log('PASS');
    }
    phantom.exit();
  });
  */
});

