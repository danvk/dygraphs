module.exports = function (config) {
    config.set({
        basePath: '../',
        frameworks: [
          'mocha',
          'chai',
          'chai-as-promised',
          'sinon-chai',
          'chai-things',
          'dirty-chai'
        ],
        files: [
            'dist/dygraph-combined.dev.js',
            'src/extras/smooth-plotter.js',
            'auto_tests/**/*.js',
        ],
        autoWatch: false,
        singleRun: true,
        reporters: ['mocha'], // ['spec', 'coverage'],
        preprocessors: {
            'dist/dygraph-combined.dev.js': ['coverage']
        },
        coverageReporter: {
            type: 'html',
            dir: 'dist/coverage'
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
