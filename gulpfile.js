var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var karma = require('karma').server;
var path = require('path');

var dev = false;
var src = {
  base: "src",
  polyfills: {
    base: "src/polyfills",
    files: [
      "console.js",
      "dashed-canvas.js"
    ]
  },
  main: {
    base: "src",
    files: [
      "dygraph-options.js",
      "dygraph-layout.js",
      "dygraph-canvas.js",
      "dygraph.js",
      "dygraph-utils.js",
      "dygraph-gviz.js",
      "dygraph-interaction-model.js",
      "dygraph-tickers.js",
      "dygraph-plugin-base.js"
    ]
  } ,
  plugins: {
    base: "src/plugins",
    files: [
      "annotations.js",
      "axes.js",
      "chart-labels.js",
      "grid.js",
      "legend.js",
      "range-selector.js",
      "../dygraph-plugin-install.js"
    ]
  },
  // Only used by dynamic loader
  devOptions: {
    base: "src",
    files: ["dygraph-options-reference.js"]
  },
  datahandlers: {
    base: "src/datahandler",
    files: [
      "datahandler.js",
      "default.js",
      "default-fractions.js",
      "bars.js",
      "bars-error.js",
      "bars-custom.js",
      "bars-fractions.js"
    ]
  }
};

// Convenience function to merge multiple arrays into one
var mergePaths = function() {
  var paths = [];
  var pathobj = null;
  if (arguments.length > 0) {
    for (var i = 0; i < arguments.length; i++) {
      pathObj = arguments[i];
      pathObj.files.map(function(filename) {
        paths.push(path.join(pathObj.base, filename));
      });
    }

    return paths;
  } else {
    return [];
  }
};

var copyright = '/*! @license Copyright 2015 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */';

/*
// Creates the dygraph-autoloader
gulp.task('create-loader', function() {
  // Create string ready for javascript array
  var files = mergePaths(src.lib, src.main, src.plugins, src.devOptions, src.datahandlers)
    .map(function(filename) {
      // Make the path relative to dist file and add quotes
      return "'" + filename.replace(src.base, '../../' + src.base) + "'";
    })
    .join(",");

  return gulp.src(src.base + '../dygraph/dygraph-autoloader.js')
    .pipe(plugins.replace(/\/\* REPLACEME \*\//, files))
    .pipe(gulp.dest('dist/scratch'));
});
*/

gulp.task('create-dev', function() {
  var dest = 'dist';
  return gulp.src(mergePaths(src.polyfills, src.main, src.plugins, src.devOptions, src.datahandlers), {base: '.'})
    .pipe(plugins.sourcemaps.init({debug:true}))
    .pipe(plugins.concat('dygraph-combined-dev.js'))
    .pipe(plugins.header(copyright))
    .pipe(plugins.sourcemaps.write('.'))  // '.' = external sourcemap
    .pipe(gulp.dest(dest));
});

gulp.task('concat', function() {
  var dest = 'dist';
  return gulp.src(mergePaths(src.polyfills, src.main, src.plugins, src.datahandlers), {base: '.'})
     .pipe(plugins.sourcemaps.init())
     .pipe(plugins.concat('scratch'))
     .pipe(plugins.header(copyright))
     .pipe(gulp.dest(dest))
     .pipe(plugins.uglify({
      compress: {
        global_defs: { DEBUG: false }
      },
      warnings: false,
      preserveComments: "none"
     }))
     .pipe(plugins.header(copyright))
     .pipe(plugins.rename('dygraph-combined.js'))
     .pipe(plugins.sourcemaps.write('.'))
     .pipe(gulp.dest(dest));

});

gulp.task('gwt-dist', ['concat'], function() {
  // Copy package structure to dist folder
  gulp.src('gwt/**', {'base': '.'})
    .pipe(gulp.dest('dist'));

  gulp.src('dygraph-combined.js')
    .pipe(gulp.dest('dist/gwt/org/danvk'));

  // Generate jar
  gulp.src('')
    .pipe(plugins.shell([
      'bash -c "jar -cf dist/dygraph-gwt.jar -C dist/gwt org"'
    ]))
});

gulp.task('test', ['concat', 'create-dev'], function(done) {
  karma.start({
    configFile: process.cwd() + '/auto_tests/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('coveralls', ['test'], plugins.shell.task([
  './scripts/transform-coverage.js ' +
      'dist/dygraph-combined-dev.js.map ' +
      'dist/coverage/report-lcov/lcov.info ' +
  '| ./node_modules/.bin/coveralls'
]));

gulp.task('watch', function() {
  gulp.watch('src/**', ['concat']);
});

gulp.task('watch-test', function() {
  gulp.watch(['src/**', 'auto_tests/tests/**'], ['test']);
});

gulp.task('dist', ['gwt-dist', 'concat', 'create-dev']);
gulp.task('travis', ['test', 'coveralls']);
gulp.task('default', ['test', 'dist']);
