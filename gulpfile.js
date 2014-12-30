var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var karma = require('karma').server;
var lazypipe = require('lazypipe');
var path = require('path');

var dev = false;
var src = {
    base: "src",
    lib: {
        base: "src/lib",
        files: [
            "console.js",
            "dashed-canvas.js"
        ]
    },
    main: {
        base: "src/dygraph",
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
        base: "src/dygraph/plugins",
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
        base: "src/dygraph",
        files: ["dygraph-options-reference.js"]
    },
    datahandlers: {
        base: "src/dygraph/datahandler",
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

var copyright = '/*! @license Copyright 2014 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */';

// Creates the dygraph-autoloader
gulp.task('create-loader', function() {
    // Create string ready for javascript array
    var files = mergePaths(src.lib, src.main, src.plugins, src.devOptions, src.datahandlers)
        .map(function(filename) {
            // Make the path relative to dist file and add quotes
            return "'" + filename.replace(src.base, '../../' + src.base) + "'";
        })
        .join(",");

    return gulp.src(src.base + '/dygraph/dygraph-autoloader.js')
        .pipe(plugins.replace(/\/\* REPLACEME \*\//, files))
        .pipe(gulp.dest('dist/scratch'));
});

gulp.task('create-dev', function() {
    var dest = 'dist/scratch';
    return gulp.src(mergePaths(src.lib, src.main, src.plugins, src.devOptions, src.datahandlers))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('dygraph-combined.dev.js'))
        .pipe(plugins.header(copyright))
        .pipe(gulp.dest(dest));
});

gulp.task('concat', function() {
    var dest = 'dist/scratch';
    return gulp.src(mergePaths(src.lib, src.main, src.plugins, src.datahandlers))
       .pipe(plugins.sourcemaps.init())
       .pipe(plugins.concat('dygraph-combined.js'))
       .pipe(plugins.header(copyright))
       .pipe(gulp.dest(dest))
       .pipe(plugins.uglify({
            define: "DEBUG=false",
            warnings: false,
            preserveComments: "none"
        }))
        .pipe(plugins.header(copyright))
       .pipe(plugins.rename('dygraph-combined.min.js'))
       .pipe(plugins.sourcemaps.write('.'))
       .pipe(gulp.dest(dest));

});

gulp.task("bower-dist", ['concat'], function() {
    gulp.src('src/dygraph/extras/**', {base: 'src/dygraph'})
        .pipe(gulp.dest('dist/bower'));

    return gulp.src('dist/scratch/dygraph-combined*')
        .pipe(gulp.dest('dist/bower'));
});

gulp.task('gwt-dist', ['concat'], function() {
    // Copy package structure to dist folder
    gulp.src('gwt/**', {'base': '.'})
        .pipe(gulp.dest('dist'));

    gulp.src('scratch/dygraph-combined.min.js')
        .pipe(gulp.dest('dist/gwt/org/danvk'));

    // Generate jar
    gulp.src('')
        .pipe(plugins.shell([
            'bash -c "jar -cf dygraph-gwt.jar -C dist/gwt org"'
        ]))
});

gulp.task('test', ['concat', 'create-dev'], function(done) {
    karma.start({
        configFile: process.cwd() + '/specs/karma.conf.js',
        singleRun: true
    }, done);
});

gulp.task('watch', function() {
    gulp.watch('src/dygraph/**', ['concat']);
});

gulp.task('watch-test', function() {
    gulp.watch(['src/dygraph/**', 'specs/unit/**'], ['test']);
});

gulp.task('dist', ['gwt-dist', 'bower-dist']);
gulp.task('travis', ['test']);
gulp.task('default', ['test', 'dist']);
