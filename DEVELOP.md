## dygraphs developer notes

So you've made a change to dygraphs and would like to contribute it back to the open source project. Wonderful!

This is a step-by-step guide explaining how to do it.

### How-to

To install dependencies, run

    npm install

To build dygraphs, run

    npm run build

To run the tests, run:

    npm run build-tests
    npm run test

To iterate on the code, run:

    npm run watch

and open `tests/demo.html` (or one of the other demos) in your browser.

To iterate on a unit test, run the `watch` command above and open

    auto_tests/runner.html

in your browser. You can use the Mocha UI to run just a single test or suite.
Or you can change `it` to `it.only` to do run just one test in code.

To run a single test from the command line, you can use:

  npm run test -- --grep highlight-series-background

(Note the extra `--`.)

### dygraphs style

When making a change, please try to follow the style of the existing dygraphs code. This will make the review process go much more smoothly.

A few salient points:

1. We try to adhere to Google's [JS style guide][gstyle] and would appreciate it if you try to as well. This means:
  *   No tabs! Indent using two spaces.
  *   Use camelCase for variable and function names.
  *   Limit lines to 80 characters.
1.  If you've added a new feature, add a test for it (in the tests/ directory) or a gallery entry.
1.  If you've added an option, document it in `dygraph-options-reference.js`. You'll get lots of warnings if you don't.
1.  If you've fixed a bug or added a feature, add a unit test (in `auto_tests`) for it.

Adding a unit test ensures that we won't inadvertently break your feature in the future. To do this, either add to an existing test in `auto_tests/tests` or create a new one.

### Sending a Pull Request

To make a change, you'll need to send a Pull Request. See GitHub's documentation [here][pr].

[gstyle]: http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
[pr]: http://help.github.com/send-pull-requests/
