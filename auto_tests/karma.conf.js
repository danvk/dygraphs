module.exports = function (config) {
    config.set({
        basePath: '../',
        frameworks: [
          'mocha',
          'chai'
        ],
        files: [
            'dist/dygraph-combined-dev.js',
            'src/extras/smooth-plotter.js',
            'auto_tests/**/*.js',
        ],
        autoWatch: false,
        singleRun: true,
        reporters: ['mocha', 'coverage'],  // or 'dots', 'mocha', 'spec'
        preprocessors: {
            'dist/dygraph-combined-dev.js': ['coverage']
        },
        coverageReporter: {
            dir: 'dist/coverage',
            reporters: [
              { type: 'html', subdir: 'report-html' },
              { type: 'lcovonly', subdir: 'report-lcov' },
            ]
        },
        browsers: ['PhantomJS'],
        plugins: [
            'karma-mocha',
            'karma-chai-plugins',
            'karma-phantomjs-launcher',
            'karma-coverage',
            'karma-spec-reporter',
            'karma-mocha-reporter'
        ]
    });
};
