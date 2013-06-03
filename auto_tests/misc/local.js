var DygraphsLocalTester = function() {
  this.tc = null; // Selected test case
  this.name = null; 
  this.resultsDiv = null;
  this.results = [];
  this.summary = { failed: 0, passed: 0 };

  var self = this;
  jstestdriver.attachListener({
    start : function(tc) {
      self.start_(tc);
    },
    finish : function(tc, name, result, e) {
      self.finish_(tc, name, result, e);
    }
  });
};

/**
 * Call this to replace Dygraphs.warn so it throws an error.
 *
 * In some cases we will still allow warnings to be warnings, however.
 */
DygraphsLocalTester.prototype.overrideWarn = function() {
  // save Dygraph.warn so we can catch warnings.
  var originalDygraphWarn = Dygraph.warn;
  Dygraph.warn = function(msg) {
    // This warning is still
    if (msg == "Using default labels. Set labels explicitly via 'labels' in the options parameter") {
      originalDygraphWarn(msg);
      return;
    }
    throw "Warnings not permitted: " + msg;
  }
  Dygraph.prototype.warn = Dygraph.warn;
};

DygraphsLocalTester.prototype.processVariables = function() {
  var splitVariables = function() { // http://www.idealog.us/2006/06/javascript_to_p.html
    var query = window.location.search.substring(1); 
    var args = {};
    var vars = query.split("&"); 
    for (var i = 0; i < vars.length; i++) { 
      if (vars[i].length > 0) {
        var pair = vars[i].split("="); 
        args[pair[0]] = pair[1];
      }
    }
    return args;
  }

  var args = splitVariables();
  var test = args.test;
  var command = args.command;

  // args.testCaseName uses the string name of the test.
  if (args.testCaseName) {
    var testCases = getAllTestCases();
    name = args.testCaseName;
    for (var idx in testCases) {
      var entry = testCases[idx];
      if (entry.name == args.testCaseName) {
        var prototype = entry.testCase;
        this.tc = new entry.testCase();
        break;
      }
    }
  } else if (args.testCase) { // The class name of the test.
    name = args.testCase;
    eval("tc__= new " + args.testCase + "()");
    this.tc = tc_;
  }

  // If the test class is defined.
  if (this.tc != null) {
    if (args.command == "runAllTests") {
      console.log("Running all tests for " + args.testCase);
      this.tc.runAllTests();
    } else if (args.command == "runTest") {
      console.log("Running test " + args.testCase + "." + args.test);
      this.tc.runTest(args.test);
    }
  } else {
    if (args.command == "runAllTests") {
      console.log("Running all tests for all test cases");
      var testCases = getAllTestCases();
      for (var idx in testCases) {
        var entry = testCases[idx];
        var prototype = entry.testCase;
        this.tc = new entry.testCase();
        this.tc.runAllTests();
      }
    }
  }
  this.resultsDiv = this.createResultsDiv();
  this.postResults();
  this.resultsDiv.appendChild(document.createElement("hr"));
  document.getElementById('summary').innerHTML = "(" + this.summary.failed + " failed, " + this.summary.passed + " passed)";
}

DygraphsLocalTester.prototype.createResultsDiv = function() {
  div = document.createElement("div");
  div.id='results';
  div.innerHTML = "Test results: <span id='summary'></span> <a href='#' id='passed'>passed</a> <a href='#' id='failed'>failed</a> <a href='#' id='all'>all</a><br/>";

  var body = document.getElementsByTagName("body")[0];
  body.insertBefore(div, body.firstChild);

  var setByClassName = function(name, displayStyle) {
    var elements = div.getElementsByClassName(name);
    for (var i = 0; i < elements.length; i++) {
      elements[i].style.display = displayStyle;
    }
  }

  var passedAnchor = document.getElementById('passed');
  var failedAnchor = document.getElementById('failed');
  var allAnchor = document.getElementById('all');
  passedAnchor.onclick = function() {
    setByClassName('fail', 'none');
    setByClassName('pass', 'block');

    passedAnchor.setAttribute("class", 'activeAnchor');
    failedAnchor.setAttribute("class", '');
  };
  failedAnchor.onclick = function() {
    setByClassName('fail', 'block');
    setByClassName('pass', 'none');
    passedAnchor.setAttribute("class", '');
    failedAnchor.setAttribute("class", 'activeAnchor');
  };
  allAnchor.onclick = function() {
    setByClassName('fail', 'block');
    setByClassName('pass', 'block');
    passedAnchor.setAttribute("class", '');
    failedAnchor.setAttribute("class", '');
  };
  return div;
}

DygraphsLocalTester.prototype.postResults = function() {
  var table = document.createElement("table");
  this.resultsDiv.appendChild(table);
  for (var idx = 0; idx < this.results.length; idx++) {
    var result = this.results[idx];
    var tr = document.createElement("tr");
    tr.setAttribute("class", result.result ? 'pass' : 'fail');

    var tdResult = document.createElement("td");
    tdResult.setAttribute("class", "outcome");
    tdResult.innerText = result.result ? 'pass' : 'fail';
    tr.appendChild(tdResult);

    var tdName = document.createElement("td");
    var div = document.createElement("div");
    div.innerText = result.name;
    div.onclick = function(name) {
      return function() {
        var s = name.split(".");
        var testCase = s[0];
        var testName = s[1];
        url = window.location.pathname +
            "?testCaseName=" + testCase +
            "&test=" + testName +
            "&command=runTest";
        window.location.href = url;
      };
    }(result.name);
    div.setAttribute("class", "anchor");
    tdName.appendChild(div);
    tr.appendChild(tdName);

    var tdDuration = document.createElement("td");
    tdDuration.innerText = result.duration;
    tr.appendChild(tdDuration);

    if (result.e) {
      var tdDetails = document.createElement("td");
      div = document.createElement("div");
      div.innerText = "more...";
      div.setAttribute("class", "anchor");
      div.onclick = function(e) {
        return function() {
          alert(e + "\n" + e.stack);
        };
      }(result.e);
      tdDetails.appendChild(div);
      tr.appendChild(tdDetails);
    }

    table.appendChild(tr);
  }
}

DygraphsLocalTester.prototype.run = function() {
  var selector = document.getElementById("selector");

  if (selector != null) { // running a test
    var createAttached = function(name, parent) {
      var elem = document.createElement(name);
      parent.appendChild(elem);
      return elem;
    }
  
    var description = createAttached("div", selector);
    var list = createAttached("ul", selector);
    var parent = list.parentElement;
    var createLink = function(parent, text, url) {
      var li = createAttached("li", parent);
      var a = createAttached("a", li);
      a.innerHTML = text;
      a.href = url;
    }
    if (this.tc == null) {
      description.innerHTML = "Test cases:";
      var testCases = getAllTestCases();
      createLink(list, "(run all tests)", document.URL + "?command=runAllTests");
      for (var idx in testCases) {
        var entryName = testCases[idx].name;
        createLink(list, entryName, document.URL + "?testCaseName=" + entryName);
      }
    } else {
      description.innerHTML = "Tests for " + name;
      var names = this.tc.getTestNames();
      createLink(list, "Run All Tests", document.URL + "&command=runAllTests");
      for (var idx in names) {
        var name = names[idx];
        createLink(list, name, document.URL + "&test=" + name + "&command=runTest");
      }
    }
  }
}

DygraphsLocalTester.prototype.start_ = function(tc) {
  this.startms_ = new Date().getTime();
}

DygraphsLocalTester.prototype.finish_ = function(tc, name, result, e) {
  var endms_ = new Date().getTime();
  this.results.push({
    name : tc.name + "." + name,
    result : result,
    duration : endms_ - this.startms_,
    e : e
  });
  this.summary.passed += result ? 1 : 0;
  this.summary.failed += result ? 0 : 1;
}
