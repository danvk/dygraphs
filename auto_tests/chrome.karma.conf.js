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
            'auto_tests/data/*.js',
            'auto_tests/tests/*.js',
        ],
        autoWatch: true,
        singleRun: false,
        reporters: ['mocha'],  // or 'dots', 'mocha', 'spec'
        browsers: ['Chrome'],  // or 'Firefox', 'Safari', etc.
        plugins: [
            'karma-mocha',
            'karma-chai-plugins',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-spec-reporter',
            'karma-mocha-reporter'
        ]
    });
};
